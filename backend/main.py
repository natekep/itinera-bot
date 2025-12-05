import os
import time
import requests
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from supabase import create_client, Client

# from openai import OpenAI  # Changed import
from dotenv import load_dotenv
from openai import OpenAI
import json
import re


load_dotenv()
app = FastAPI()

# CORS (Cross-Origin Resource Sharing) prohibits unauthorized websites, endpoints, or servers from accessing the API

# Services from this origin can access the api
origins = ["http://localhost:5173", "https://itinera-bot.web.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SUPABASE setup
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# OpenAI setup
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.get("/")
def read_root():
    return {"message": "FastAPI backend running!"}


# Itinerary Generation
class TripDetails(BaseModel):
    user_id: str
    destination: str
    start_date: str
    end_date: str
    num_guests: int


# STEP 1: Get user travel preferences from supabase (user onboarding)
def get_user_onboarding_profile(user_id: str):
    print(f"[STEP 1] Fetching user profile for user_id={user_id}")
    try:
        response = (
            supabase.from_("user_onboarding")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if response.data:
            print("[STEP 1] User profile found:", response.data)
            return response.data
        else:
            raise HTTPException(
                status_code=404, detail="User onboarding profile not found."
            )
    except Exception as e:
        print("Supabase Error:", e)
        raise HTTPException(status_code=500, detail="Error fetching user profile.")


# STEP 2: Get the ticketmaster events for ticketed events
def get_ticketmaster_events(destination: str, start_date: str, end_date: str):
    url = "https://app.ticketmaster.com/discovery/v2/events.json"
    params = {
        "apikey": os.getenv("TICKETMASTER_API_KEY"),
        "city": destination.strip(),
        "countryCode": "US",
        "radius": 25,  # miles
        "unit": "miles",
        "locale": "*",
        "startDateTime": f"{start_date}T00:00:00Z",
        "endDateTime": f"{end_date}T23:59:59Z",
        "size": 10,
        "sort": "date,asc",
    }
    print(
        f"[STEP 2] Fetching Ticketmaster events for {destination}, {start_date} to {end_date}"
    )
    print("Ticketmaster request URL params:", params)

    response = requests.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Ticketmaster API error: {response.text}",
        )

    data = response.json()
    raw_events = data.get("_embedded", {}).get("events", [])
    print(f"[STEP 2] Ticketmaster returned {len(raw_events)} events")

    # Normalize results
    events = []
    for e in raw_events:
        events.append(
            {
                "name": e.get("name"),
                "date": e.get("dates", {}).get("start", {}).get("localDate"),
                "time": e.get("dates", {}).get("start", {}).get("localTime"),
                "timezone": e.get("dates", {}).get("timezone"),
                "type": e.get("classifications", [{}])[0]
                .get("segment", {})
                .get("name"),
                "genre": e.get("classifications", [{}])[0].get("genre", {}).get("name"),
                "subGenre": e.get("classifications", [{}])[0]
                .get("subGenre", {})
                .get("name"),
                "url": e.get("url"),
                "image": e.get("images", [{}])[0].get("url"),
                "venue": e.get("_embedded", {}).get("venues", [{}])[0].get("name"),
                "address": e.get("_embedded", {})
                .get("venues", [{}])[0]
                .get("address", {})
                .get("line1"),
                "city": e.get("_embedded", {})
                .get("venues", [{}])[0]
                .get("city", {})
                .get("name"),
                "state": e.get("_embedded", {})
                .get("venues", [{}])[0]
                .get("state", {})
                .get("name"),
            }
        )

    return events


# STEP 3: Get the best places and food spots using Google Places API
INTEREST_KEYWORDS = {
    "food": ["restaurants", "best food", "local food", "cafes"],
    "nightlife": ["bars", "clubs", "nightlife", "live music"],
    "museums": ["museums", "art museum", "history museum"],
    "art": ["art galleries"],
    "outdoors": ["parks", "hiking", "nature", "trails"],
    "sports": ["sports complex", "stadiums"],
    "shopping": ["shopping mall", "boutiques", "markets"],
    "music": ["live music", "concert venues"],
    "history": ["historic landmarks", "monuments"],
    "seafood": ["seafood restaurants"],
    "italian": ["italian restaurants"],
    "sushi": ["sushi", "japanese restaurants"],
    "bbq": ["bbq restaurants"],
    "vegan": ["vegan food", "vegan restaurants"],
    "coffee": ["cafes", "coffee shops"],
    "brunch": ["brunch restaurants"],
}


def parse_interests(user_profile):
    raw = user_profile.get("interests", "")
    interests = [i.strip().lower() for i in raw.split(",") if i.strip()]
    print(f"FORMATTED_INTERESTS: {interests}")
    return interests


def normalize_google_place(place):
    return {
        "name": place.get("name"),
        "rating": place.get("rating"),
        "price_level": place.get("price_level"),
        "address": place.get("formatted_address"),
        "types": place.get("types", []),
        "user_ratings_total": place.get("user_ratings_total"),
        "opening_hours": place.get("opening_hours", {}),
        "place_id": place.get("place_id"),
    }


def search_places_by_interest(destination: str, interest: str):
    keywords = INTEREST_KEYWORDS.get(interest, [interest])

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    results = []

    print(f"KEYWORDS: {keywords}")

    for keyword in keywords:
        params = {
            "query": f"{keyword} in {destination}",
            "key": os.getenv("GOOGLE_PLACES_API_KEY"),
        }

        response = requests.get(url, params=params)
        print(response)
        if response.status_code != 200:
            continue

        data = response.json().get("results", [])
        results.extend([normalize_google_place(p) for p in data])

    # Dedupe by place_id
    unique = {p["place_id"]: p for p in results}.values()
    print(f"[STEP 3] Google Places found {len(unique)} unique places")
    return list(unique)


def get_google_food_general(destination: str):
    """Get top restaurants, cafes, and popular food places."""
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

    params = {
        "query": f"best restaurants in {destination}",
        "key": os.getenv("GOOGLE_PLACES_API_KEY"),
    }

    response = requests.get(url, params=params)
    print(response)
    if response.status_code != 200:
        return []

    results = response.json().get("results", [])
    print(results)
    return [normalize_google_place(p) for p in results][:20]


def get_google_places_personalized(destination: str, user_profile):
    print(f"[STEP 3] Fetching Google Places for destination={destination}")

    interests = parse_interests(user_profile)
    print("[STEP 3] User interests:", interests)
    all_results = []

    # 1. General food list (always included)
    food_general = get_google_food_general(destination)
    all_results.extend(food_general)

    # 2. Interest-based searches
    for interest in interests:
        if interest in INTEREST_KEYWORDS:
            places = search_places_by_interest(destination, interest)
            all_results.extend(places)

    # Dedupe
    unique = {p["place_id"]: p for p in all_results if p["place_id"]}.values()
    return list(unique)


def build_llm_payload(user_profile, trip, ticket_events, interest_places):
    return {
        "trip": trip,
        "user_profile": user_profile,
        "ticketed_events": ticket_events,
        "interest_places": interest_places,
    }


def build_itinerary_prompt(payload):
    destination = payload["trip"]["destination"]
    check_in = payload["trip"]["start_date"]
    check_out = payload["trip"]["end_date"]
    num_guests = payload["trip"]["num_guests"]
    user_prefs = payload["user_profile"]
    ticketmaster_events = payload["ticketed_events"]
    interest_places = payload["interest_places"]

    prompt = f"""
    You are an expert travel planner. Create a detailed, day-by-day itinerary for a trip to {destination}
    from {check_in} to {check_out} for {num_guests} guest(s).

    Traveler profile:
    - Preferred pace: {user_prefs.get("preferred_pace")}
    - Travel mode: {user_prefs.get("preferred_travel_mode")}
    - Interests: {user_prefs.get("interests")}
    - Dietary restrictions: {user_prefs.get("dietary_restrictions")}
    - Budget: {user_prefs.get("budget_range")}
    - Age range: {user_prefs.get("age_range")}
    - Gender: {user_prefs.get("gender")}
    - Home location: {user_prefs.get("home_location")}

    Ticketed events available (REAL events — you may ONLY choose official events from this list):
    {json.dumps(ticketmaster_events, indent=2)}

    Additional attractions and food options from Google Places:
    {json.dumps(interest_places, indent=2)}

    Rules for Scheduling:
    1. PRIORITY: Always prefer events from the Ticketmaster list. Include at least ONE during the trip.
    2. FOOD: Each day MUST include exactly **2 food stops** (breakfast/lunch/dinner). 
    - These should come from the Google Places list whenever possible.
    - If the list lacks enough restaurants, use well-known real restaurants or districts in {destination}.
    3. ACTIVITIES PER DAY:
    - If preferred pace is **"fast"** → include **3 activities per day**.
    - If preferred pace is **"moderate"** → include **2–3 activities per day**.
    - If preferred pace is **"relaxed"** → include **1–2 activities per day**.
    4. Activity Types:
    - Ticketmaster events take priority.
    - Google Places attractions next.
    - Filler activities (Model) only if needed (e.g., scenic walk, famous landmarks, relaxing at a park).
    5. Label each activity with a source:
    - "Ticketmaster" → chosen from ticketed events list.
    - "GooglePlaces" → chosen from the attractions/food list.
    - "Model" → filler (parks, neighborhoods, free time, etc.)
    6. Keep pacing realistic (group nearby activities together).
    7. OUTPUT STRICT JSON with this schema:
        {{
        "destination": "{destination}",
        "days": [
            {{
            "date": "YYYY-MM-DD",
            "activities": [
                {{
                "time": "Morning | Afternoon | Evening",
                "name": "...",
                "description": "...",
                "explanation": "Why this was chosen (use user preferences)",
                "source": "Ticketmaster | GooglePlaces | Model"
                }}
            ]
            }}
        ]
        }}
    """

    return prompt


def generate_itinerary_with_llm(payload):
    prompt = build_itinerary_prompt(payload)
    print("\n[STEP 5] Sending itinerary prompt to LLM...")
    print("Prompt preview (first 600 chars):")
    print(prompt[:200])

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert itinerary-building AI.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        itinerary_json = response.choices[0].message.content
        print("[STEP 5] LLM responded successfully")
        print("Raw model output preview:", itinerary_json[:300])

        return json.loads(itinerary_json)

    except Exception as e:
        print("LLM Error:", e)
        raise HTTPException(status_code=500, detail="Error generating itinerary")


@app.post("/generate-itinerary")
def generate_itinerary(req: TripDetails):
    print("\n========== GENERATE ITINERARY STARTED ==========")
    print("Incoming request:", req)

    # Step 1: Fetch user profile
    user_profile = get_user_onboarding_profile(req.user_id)

    # Step 2: Fetch ticketed events
    ticketmaster_events = get_ticketmaster_events(
        destination=req.destination, start_date=req.start_date, end_date=req.end_date
    )

    # Step 3: Personalized Google Places (food + attractions)
    interest_places = get_google_places_personalized(
        destination=req.destination, user_profile=user_profile
    )

    # Step 4: Build simple LLM payload (no sorting, no grouping)
    llm_payload = build_llm_payload(
        user_profile=user_profile,
        trip={
            "destination": req.destination,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "num_guests": req.num_guests,
        },
        ticket_events=ticketmaster_events,
        interest_places=interest_places,
    )

    # STEP 5: Generate itinerary using OpenAI
    itinerary = generate_itinerary_with_llm(llm_payload)

    print("========== ITINERARY SUCCESSFULLY GENERATED ==========\n")

    return {"status": "success", "itinerary": itinerary}


# ITINERAY REGENERATION
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json


class RegenerateRequest(BaseModel):
    original_itinerary: dict
    approvals: dict
    user_query: str


@app.post("/regenerate-itinerary")
def regenerate_itinerary(req: RegenerateRequest):
    try:
        # ---------- 1. Parse liked & disliked ----------
        liked = []
        disliked = []

        for key, value in req.approvals.items():
            day_idx, act_idx = map(int, key.split("-"))
            activity = req.original_itinerary["days"][day_idx]["activities"][act_idx]
            if value is True:
                liked.append(activity)
            elif value is False:
                disliked.append(activity)

        destination = req.original_itinerary["destination"]

        # ---------- 2. Extract semantic keywords using LLM ----------
        keywords = extract_keywords_from_query(req.user_query)
        print("Extracted keywords:", keywords)

        # ---------- 3. Query Google Places again ----------
        new_places = []
        for kw in keywords:
            new_places.extend(search_places_by_interest(destination, kw))

        # If no results, fall back to general restaurants/known places
        if not new_places:
            new_places = get_google_places_personalized(
                destination=destination,
                user_profile={},  # user_profile not necessary for regen fallback
            )

        # Deduplicate by place_id
        new_places = list(
            {p["place_id"]: p for p in new_places if p.get("place_id")}.values()
        )

        print(f"Google returned {len(new_places)} new real places for regeneration.")

        # ---------- 4. Build the regeneration prompt ----------
        prompt = f"""
        You are updating a travel itinerary based on user feedback.

        USER REQUEST:
        "{req.user_query}"

        DETECTED KEYWORDS:
        {json.dumps(keywords)}

        REAL GOOGLE PLACES YOU MAY USE:
        {json.dumps(new_places, indent=2)}

        LIKED ACTIVITIES (Try to keep or find real similar alternatives):
        {json.dumps(liked, indent=2)}

        DISLIKED ACTIVITIES (Remove or replace with different real options):
        {json.dumps(disliked, indent=2)}

        ORIGINAL ITINERARY:
        {json.dumps(req.original_itinerary, indent=2)}

        RULES:
        - You MUST use only restaurants or attractions from the REAL Google Places list provided.
        - You may reuse liked activities.
        - You may NOT invent fictional locations or businesses.
        - Replace disliked activities with better matches based on the keywords.
        - Keep pacing reasonable.
        - Respond ONLY in STRICT JSON with this schema:
        {{
            "destination": "{destination}",
            "days": [
                {{
                    "date": "YYYY-MM-DD",
                    "activities": [
                        {{
                            "time": "Morning | Afternoon | Evening",
                            "name": "...",
                            "description": "...",
                            "explanation": "..."
                        }}
                    ]
                }}
            ]
        }}
        """

        # ---------- 5. Call LLM ----------
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional itinerary builder AI.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        updated = json.loads(response.choices[0].message.content)

        return {"status": "success", "itinerary": updated}

    except Exception as e:
        print("Regeneration Error:", e)
        raise HTTPException(status_code=500, detail="Regeneration failed")


# CHAT MESSENGING
@app.post("/chat")
def chat_endpoint(payload: dict):
    messages = payload.get("messages", [])
    itinerary = payload.get("itinerary", {})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a travel assistant. Your replies must be VERY short (1 sentence max). \
                Never give explanations. Never provide full itineraries. \
                Only acknowledge the user's request in a helpful, simple sentence like \
                'Got it — I’ll add that to the itinerary.'",
                },
                *messages,
            ],
        )

        reply_text = response.choices[0].message.content
        return {"status": "success", "reply": reply_text}

    except Exception as e:
        print("Chat LLM Error:", e)
        raise HTTPException(status_code=500, detail="Chat generation error")


def extract_keywords_from_query(user_query: str):
    prompt = f"""
    Extract high-level travel or activity keywords from the user request below.

    USER REQUEST:
    "{user_query}"

    Only return a JSON list of short keywords.
    Do NOT explain anything.
    Examples:
    - "add more nightlife" -> ["nightlife"]
    - "find me sushi places" -> ["sushi"]
    - "i want more outdoors and hiking" -> ["outdoors", "hiking"]
    - "less walking, more museums" -> ["museums"]
    - "add basketball games" -> ["basketball", "sports"]

    Return STRICT JSON like:
    ["keyword1", "keyword2"]
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    try:
        keywords = json.loads(response.choices[0].message.content)
        return keywords
    except:
        return []


@app.post("/save-itinerary")
def save_itinerary(payload: dict):
    user_id = payload["user_id"]
    itinerary = payload["itinerary"]

    destination = itinerary["destination"]
    days = itinerary["days"]
    num_guests = payload["num_guests"]

    # 1. Create itinerary row
    result = (
        supabase.table("itineraries")
        .insert(
            {
                "user_id": user_id,
                "destination": destination,
                "start_date": days[0]["date"],
                "end_date": days[-1]["date"],
                "num_guests": num_guests,
                "title": f"Trip to {destination}",
            }
        )
        .execute()
    )

    itinerary_id = result.data[0]["id"]

    # 2. Insert each day
    day_rows = []
    for i, day in enumerate(days):
        response = (
            supabase.table("itinerary_days")
            .insert(
                {"itinerary_id": itinerary_id, "day_number": i + 1, "date": day["date"]}
            )
            .execute()
        )
        day_rows.append(response.data[0])
        
    GOOGLE_KEY = os.getenv("GOOGLE_API_KEY")
    
    # 3. Insert all activities
    for i, day in enumerate(days):
        day_id = day_rows[i]["id"]
        for activity in day["activities"]:
            location_name = activity.get("location_name") or activity["name"]
           
            # --- NEW: geocode the location name ---
            lat, lng, place_id = None, None, None
            formatted_address = None

            try:
                #print("GEOCODING:", location_name)
                geo = requests.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={"address": f"{location_name}, {destination}", "key": GOOGLE_KEY}
                ).json()
                #print("GEOCODE RESPONSE:", geo)
                if geo.get("results"):
                    result = geo["results"][0]
                    loc = result["geometry"]["location"]
                    lat = loc.get("lat")
                    lng = loc.get("lng")
                    place_id = result.get("place_id")
                    formatted_address = result.get("formatted_address")
            except Exception as e:
                print("Geocode error: ", e)  
            
            supabase.table("activities").insert(
                {
                    "day_id": day_id,
                    "name": activity["name"],
                    "description": activity["description"],
                    "category": activity.get("source", "General"),
                    "location_name": location_name,
                    "location_address": formatted_address,
                    "latitude": lat,
                    "longitude": lng,
                    "place_id": place_id,
                    "notes": activity.get("explanation"),
                }
            ).execute()

    return {"status": "success", "itinerary_id": itinerary_id}


# Flights: find flights between points
@app.get("/flights/search")
def flights(origin: str, destination: str, departure_date: str, return_date: str):
    url = "https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=10000"
    headers = {
        "Accept-Encoding": "gzip",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        "Authorization": "Bearer " + os.getenv("DUFFEL_API_KEY"),
    }
    body = {
        "data": {
            "slices": [
                {
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date,
                },
                {
                    "origin": destination,
                    "destination": origin,
                    "departure_date": return_date,
                },
            ],
            "passengers": [
                {
                    "type": "adult",
                }
            ],
            "cabin_class": "economy",
        }
    }
    response = requests.post(url, headers=headers, json=body)
    return response.json()


# Airports: find nearby airports using given coordinates
@app.get("/places/airports")
def airports(lat: float, lng: float):
    url = f"https://api.duffel.com/places/suggestions?lat={lat}&lng={lng}&rad=100000"

    headers = {
        "Accept-Encoding": "gzip",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        "Authorization": "Bearer " + os.getenv("DUFFEL_API_KEY"),
    }

    res = requests.get(url, headers=headers)
    return res.json()


# Places API: find nearby hotels
@app.get("/places/hotels")
def hotels(lat: float, lng: float):
    url = "https://places.googleapis.com/v1/places:searchNearby"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": os.getenv("GOOGLE_API_KEY"),
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating",
    }

    body = {
        "locationRestriction": {
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 5000}
        },
        "includedTypes": ["lodging"],
        "maxResultCount": 15,
        "rankPreference": "POPULARITY",
    }

    res = requests.post(url, headers=headers, json=body)

    return res.json()


# Geocode API: convert address to lat/lng
# Get destination coordinates
@app.get("/geocode")
def geocode(address: str):
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={os.getenv('GOOGLE_API_KEY')}"
    res = requests.get(url)

    if res.status_code != 200:
        raise HTTPException(
            status_code=500, detail="Failed to reach Google Geo Coding API"
        )
    data = res.json()
    if not data.get("results"):
        raise HTTPException(status_code=404, detail="Address could not be geocoded")
    return data
