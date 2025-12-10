import os
import time
import requests
import uvicorn
from datetime import datetime
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
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://itinera-bot.web.app",
    "http://localhost:5174",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# SUPABASE setup
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY")
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
    num_guests: str


class FetchItineraryRequest(BaseModel):
    user_id: str
    itinerary_id: int


class UserProfile(BaseModel):
    user_id: str
    age_range: str
    gender: str
    home_location: str
    travel_mode: str
    preferred_pace: str
    interests: str
    diet_preferences: str
    food_preferences: str
    accessibility: str
    budget: str


class ItineraryEvent(BaseModel):
    id: str
    source: str
    title: str
    address: str
    startDate: Optional[str]
    time: Optional[str]
    rating: Optional[float]
    priceLevel: Optional[str]
    url: Optional[str]
    time_is_fixed: bool


class FoodPlace(BaseModel):
    id: str
    source: str
    title: str
    address: str
    rating: Optional[float]
    priceLevel: Optional[str]
    url: Optional[str]


class ChatMessage(BaseModel):
    sender: str
    text: str


class ApprovalResult(BaseModel):
    day: str
    index: int
    title: str
    decision: Optional[str]


class RegenerateRequest(BaseModel):
    user_id: str
    destination: str
    start_date: Optional[str]
    end_date: Optional[str]
    chat_messages: list[ChatMessage]
    approvals: list[ApprovalResult]
    previous_itinerary: list[dict]


def pretty_print_event(event: ItineraryEvent):
    print("\n=== Itinerary Event ===")
    print(f"Title:       {event.title}")
    print(f"Source:      {event.source}")
    print(f"Address:     {event.address}")
    print(f"Start Date:  {event.startDate or 'N/A'}")
    print(f"Time:        {event.time or 'N/A'}")
    print(f"Rating:      {event.rating if event.rating is not None else 'N/A'}")
    print(f"Price Level: {event.priceLevel if event.priceLevel is not None else 'N/A'}")
    print(f"URL:         {event.url or 'N/A'}")
    print("=======================\n")


def pretty_print_food_place(place: FoodPlace):
    print("\n=== Food Place ===")
    print(f"Title:       {place.title}")
    print(f"Source:      {place.source}")
    print(f"Address:     {place.address}")
    print(f"Rating:      {place.rating if place.rating is not None else 'N/A'}")
    print(f"Price Level: {place.priceLevel if place.priceLevel is not None else 'N/A'}")
    print(f"URL:         {place.url or 'N/A'}")
    print("===================\n")


def pretty_print_itinerary(itinerary: dict):
    print("\n==================== ITINERARY ====================\n")

    days = itinerary.get("itinerary", [])
    if not days:
        print("No itinerary days found.")
        return

    for day in days:
        day_id = day.get("day_id", "?")
        date = day.get("date", "Unknown Date")

        print(f"--- Day {day_id}: {date} ---")

        items = day.get("items", [])
        if not items:
            print("  (No events for this day)\n")
            continue

        for item in items:
            print(
                f"  • {item.get('time', '??:??')} — {item.get('title', 'Untitled Event')}"
            )
            print(f"      Source:  {item.get('source', 'N/A')}")
            print(f"      Address: {item.get('address', 'N/A')}")
            print(f"      URL:     {item.get('url', 'N/A')}")
            print(
                f"      Why:     {item.get('explanation', 'No explanation provided.')}"
            )
            print()

        print()  # Blank line between days

    print("================== END ITINERARY ==================\n")


def pretty_print_food_recommendations(food_json: dict):
    print("\n==================== FOOD RECOMMENDATIONS ====================\n")

    items = food_json.get("food_recommendations", [])

    if not items:
        print("No food recommendations returned.\n")
        return

    for idx, item in enumerate(items, start=1):
        print(f"--- Option {idx} ---")
        print(f"Title:        {item.get('title', 'N/A')}")
        print(f"Type:         {item.get('type', 'N/A')}")
        print(f"Address:      {item.get('address', 'N/A')}")
        print(f"Rating:       {item.get('rating', 'N/A')}")
        print(f"Price Level:  {item.get('priceLevel', 'N/A')}")
        print(f"URL:          {item.get('url', 'N/A')}")
        print(f"Why:          {item.get('explanation', 'No explanation.')}")
        print()

    print("================== END FOOD RECOMMENDATIONS ==================\n")


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
            user = response.data
            print("[STEP 1] User profile found:", response.data)
            return UserProfile(
                user_id=user_id,
                age_range=user["age_range"],
                gender=user["gender"],
                home_location=user["home_location"],
                travel_mode=user["preferred_travel_mode"],
                preferred_pace=user["preferred_pace"],
                interests=user["interests"],
                diet_preferences=user["dietary_restrictions"],
                food_preferences=user["food_preferences"] or "",
                accessibility=user["accessibility"],
                budget=user["budget_range"],
            )
        else:
            raise HTTPException(
                status_code=404, detail="User onboarding profile not found."
            )
    except Exception as e:
        print("Supabase Error:", e)
        raise HTTPException(status_code=500, detail="Error fetching user profile.")


# Normalize google places api response into an ItineraryEvent schema
def normalize_google_events(data):
    raw_google_events = data.get("places", [])
    normalized_events = []
    for place in raw_google_events:
        normalized_events.append(
            ItineraryEvent(
                id=place.get("id", ""),
                source="Google",
                title=place.get("displayName", {}).get("text", ""),
                address=place.get("formattedAddress") or "",
                startDate=None,
                time=None,
                rating=place.get("rating"),
                priceLevel=place.get("priceLevel"),
                url=place.get("googleMapsUri"),
                time_is_fixed=False,
            )
        )

    return normalized_events


def get_google_places_events(user_interests, destination: str):
    # Call Google Places API to get places that match their interests + famous and highly rated places
    google_places_url = "https://places.googleapis.com/v1/places:searchText"

    google_events = {}

    headers = {
        "Content-Type": "application/json",
        "X-Goog-API-Key": os.getenv("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.rating,places.googleMapsUri",
    }

    for interest in user_interests:
        query = f"{interest} in {destination}"
        payload = {"textQuery": query, "maxResultCount": 5}

        response = requests.post(google_places_url, headers=headers, json=payload)
        if response.ok:
            data = response.json()
            google_events[interest] = normalize_google_events(data)
        else:
            print("Google Places API Error:", response.text)
            google_events[interest] = []
            continue

    return google_events


def get_famous_attractions(destination: str):
    google_places_url = "https://places.googleapis.com/v1/places:searchText"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-API-Key": os.getenv("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.rating,places.googleMapsUri",
    }

    queries = [
        f"top attractions in {destination}",
        f"famous landmarks in {destination}",
        f"must see places in {destination}",
    ]

    attractions = []

    for q in queries:
        payload = {"textQuery": q, "maxResultCount": 5}
        response = requests.post(google_places_url, headers=headers, json=payload)

        if response.ok:
            data = response.json()
            attractions.extend(normalize_google_events(data))

    # Remove duplicates by ID
    unique = {a.id: a for a in attractions}
    return list(unique.values())


# Call ticketmaster api to get ticketed events
def get_ticketmaster_events(destination: str, start_date: str, end_date: str):
    ticketmaster_url = f"https://app.ticketmaster.com/discovery/v2/events.json"
    ticketmaster_events = []
    params = {
        "apikey": os.getenv("TICKETMASTER_API_KEY"),
        "locale": "*",
        "startDateTime": start_date.replace(".000Z", "Z"),
        "endDateTime": end_date.replace(".000Z", "Z"),
        "size": 10,
        "city": destination.strip(),
        "radius": 50,
        "unit": "miles",
        "sort": "date,asc",
        "countryCode": "US",
    }

    response = requests.get(url=ticketmaster_url, params=params)

    if response.ok:
        data = response.json()
        ticketmaster_events = normalize_ticketmaster_events(data)
    else:
        print("Ticketmaster API Error:", response.text)

    return ticketmaster_events


def normalize_ticketmaster_events(data):
    raw_events = data.get("_embedded", {}).get("events", []) if data else []
    normalized_events = []

    for event in raw_events:
        venue = event.get("_embedded", {}).get("venues", [{}])[0]
        address_line = venue.get("address", {}).get("line1", "") or ""
        city = venue.get("city", {}).get("name")
        state = venue.get("state", {}).get("stateCode")
        country = venue.get("country", {}).get("countryCode")
        # Build address
        address_parts = [address_line]
        if city:
            address_parts.append(city)
        if state:
            address_parts.append(state)
        if country:
            address_parts.append(country)

        full_address = ", ".join([p for p in address_parts if p])

        start_info = event.get("dates", {}).get("start", {})
        start_date = start_info.get("localDate")
        time = start_info.get("localTime")

        normalized_events.append(
            ItineraryEvent(
                id=event.get("id", ""),
                source="Ticketmaster",
                title=event.get("name", ""),
                address=full_address,
                startDate=start_date,
                time=time,
                rating=None,
                priceLevel=None,
                url=event.get("url"),
                time_is_fixed=True,
            )
        )

    return normalized_events


# Normalize google places api response into an FoodPlace schema
def normalize_food_place(data):
    raw_google_response = data.get("places", [])
    normalized_food_places = []
    for food_place in raw_google_response:
        normalized_food_places.append(
            FoodPlace(
                id=food_place.get("id", ""),
                source="Google",
                title=food_place.get("displayName", {}).get("text", ""),
                address=food_place.get("formattedAddress") or "",
                rating=food_place.get("rating"),
                priceLevel=food_place.get("priceLevel"),
                url=food_place.get("googleMapsUri"),
            )
        )
    return normalized_food_places


# Call Google Places api for food options
def get_food_options(destination: str, food_preferences: str):
    google_places_url = "https://places.googleapis.com/v1/places:searchText"

    google_restaurants = {}

    headers = {
        "Content-Type": "application/json",
        "X-Goog-API-Key": os.getenv("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.rating,places.googleMapsUri",
    }

    food_categories = ["restaurants", "cafes", "bars", "dessert shops"]
    for pref in food_preferences.split(","):
        food_categories.append(pref)

    for food_spot in food_categories:
        query = f"best {food_spot} near {destination}"
        payload = {"textQuery": query, "maxResultCount": 5}

        response = requests.post(google_places_url, headers=headers, json=payload)
        if response.ok:
            data = response.json()
            google_restaurants[food_spot] = normalize_food_place(data)
        else:
            print("Google Places API Error:", response.text)
            google_restaurants[food_spot] = []
            continue
    return google_restaurants


def build_user_prompt(payload_json: str):
    return f"""
Here is the trip data, user profile, Ticketmaster events, Google Places events, and food-related experiences.

You MUST use only these events to build the itinerary.

---------------- INPUT JSON ----------------
{payload_json}
---------------- END INPUT JSON ----------------

Generate the itinerary strictly following all rules from the system prompt.
"""


# Define the system prompt ONCE
LLM_PROMPT = """
You are Itinera, an expert AI travel planner.

Your task is to create a structured, multi-day itinerary using ONLY the events provided in the input JSON.

--------------------------------------------------
PRIMARY RULES
--------------------------------------------------
1. You MUST NOT invent any places, restaurants, or events not in the provided input.
2. Restaurants, cafés, dessert shops, and general dining spots MUST NOT be included in the itinerary. These will be handled in a separate food tab.
3. HOWEVER, food-related EXPERIENCES such as food tours, wine tastings, brewery tours, mixology classes, bar hopping, tasting rooms, chocolate tours, cooking classes, and nightlife bars ARE allowed if they match the user’s interests.
4. Always output VALID JSON following the required schema.
5. The itinerary must cover every day from start_date to end_date.
6. Include exactly:
   - 2 events per day for "relaxed" pace
   - 3 events per day for "balanced" pace
   - 4 events per day for "fast" pace

--------------------------------------------------
ATTRACTION RULES
--------------------------------------------------
7. Across the entire trip, include a few iconic or famous attractions from the "famous_attractions" dataset in the input JSON.

--------------------------------------------------
USER-INTEREST RULES
--------------------------------------------------
8. PRIORITIZE events that match the user’s interests.
9. If a Ticketmaster event matches a user interest, you MUST attempt to include it.
10. Food-related EXPERIENCES may be selected if they match the user's interests. DO NOT include normal restaurants or cafés as events.

--------------------------------------------------
EVENT SELECTION LOGIC
--------------------------------------------------
11. DO NOT include restaurants or general food spots in this itinerary.
12. DO NOT repeat events under any circumstances.
13. DO NOT exceed the daily event quota.
14. Schedule events logically in chronological order (morning → afternoon → evening).
15. Use only events that appear in the input JSON.
16. DO NOT modify or rename any field names in the output.

--------------------------------------------------
REQUIRED OUTPUT FORMAT
--------------------------------------------------
You MUST output JSON following exactly this structure:

{
  "itinerary": [
    {
      "day_id": 1,
      "date": "YYYY-MM-DD",
      "items": [
        {
          "time": "the exact time provided in the input JSON if the event already includes a time otherwise, use a reasonable time according to the event (nightlife in the night, attractions during hours its open, etcetra),
          "time_is_fixed": true | false,
          "title": "...",
          "type": "event",
          "source": "Google" | "Ticketmaster",
          "address": "...",
          "url": "...",
          "explanation": "One sentence explaining why this item was selected (interest match, iconic attraction, pacing, or special experience)."
        }
      ]
    }
  ]
}

--------------------------------------------------
EXPLANATION RULES
--------------------------------------------------
17. Each event MUST include a one-sentence explanation referencing:
   - interest alignment,
   - iconic status,
   - experience type,
   - or pacing rationale.

18. Explanations must sound friendly, conversational, and travel-agent–like.  
    Use warm, natural language such as:
    - “This fits perfectly with your love for live music!”
    - “A must-see landmark that really captures the spirit of the city.”
    - “I added this relaxing experience to match your balanced pace.”
    - “Since you're into nightlife, I thought you'd enjoy this tasting experience.”

19. Explanations MUST remain one sentence, but can use a casual, upbeat tone.

--------------------------------------------------
BUDGET RULES
--------------------------------------------------
20. You MUST take the user's budget preference into account:
    - If the user has a lower budget (e.g., "Low", "Budget", "Economy"), prioritize free or low-cost attractions and avoid recommending events likely to be expensive unless absolutely necessary.
    - If the user has a moderate budget (e.g., "Medium", "Standard"), mix affordable experiences with one or two premium activities.
    - If the user has a higher budget (e.g., "High", "Luxury", "Premium"), feel free to include premium experiences such as high-end tours, exclusive activities, or events with admission fees.

21. Budget sensitivity must be reflected naturally in the explanation sentence.  
    Example:
    - “I chose this free landmark to help keep the trip budget-friendly while still offering a great experience.”  
    - “Since your budget allows for premium activities, this top-rated tour adds a special touch to the trip.”  

--------------------------------------------------
GUEST RULES
--------------------------------------------------
22. You MUST take the "num_guests" information into account when selecting events.  
    - If the trip includes multiple adults, ensure that group-friendly activities are chosen (e.g., tours, popular landmarks, shows).  
    - If the group includes children, avoid nightlife experiences unless clearly optional and choose family-friendly attractions when available.  
    - If the group includes infants, avoid events that require long periods of standing, loud environments, or age restrictions.  
    - If the group includes pets, avoid events that are obviously not pet-friendly unless no alternative exists.

23. Explanations MUST reflect guest considerations where relevant.  
    Example:  
    - “Since you’re traveling with children, I picked this interactive museum that’s great for families.”  
    - “This outdoor landmark works well for a group of adults and gives everyone space to explore comfortably.”  
    - “Because your group includes a pet, I chose an open-air attraction suitable for animals.”

--------------------------------------------------
EVENT TIMING RULES (STRICT)
--------------------------------------------------
24. If an event in the input JSON has "time_is_fixed": true,
you MUST copy the time EXACTLY as provided in the input JSON.

You are NOT allowed to:
- convert time formats,
- modify times,
- reschedule times,
- convert "19:00" into "7:00 PM",
- or adjust the time for pacing.

If time_is_fixed = true, the output time MUST 100% match the input time string.

25. You are NOT allowed to invent new times, reschedule events, or adjust times 
    for convenience. Ticketmaster event times MUST be used exactly as provided.

26. If an event has no time, you may assign a reasonable morning/afternoon/evening 
    time slot — but ONLY for events without a provided time.

27. NEVER rewrite or modify the time of a Ticketmaster event or a Google event that 
    includes a time value in the JSON.

--------------------------------------------------
OUTPUT RULES
--------------------------------------------------
28. Return ONLY the JSON output — no commentary, no markdown, no natural language.
"""


@app.post("/generate-itinerary")
def generate_itinerary(trip: TripDetails):
    user_profile = get_user_onboarding_profile(trip.user_id)
    user_interests = user_profile.interests.split(",")

    google_places_events = get_google_places_events(user_interests, trip.destination)
    famous_attractions = get_famous_attractions(trip.destination)

    tm_events = get_ticketmaster_events(
        trip.destination, trip.start_date, trip.end_date
    )
    for ev in tm_events:
        pretty_print_event(ev)

    for category, events in google_places_events.items():
        print(f"\n--- GOOGLE CATEGORY: {category} ---")
        for ev in events:
            pretty_print_event(ev)

    llm_payload = {
        "trip_details": trip.dict(),
        "user_profile": user_profile.dict(),
        "events": {
            "ticketmaster": [e.dict() for e in tm_events],
            "google_place_events": {
                k: [ev.dict() for ev in v] for k, v in google_places_events.items()
            },
            "famous_attractions": [a.dict() for a in famous_attractions],
        },
    }

    payload_json = json.dumps(llm_payload, indent=2)

    response = client.chat.completions.create(
        model="gpt-4.1",
        temperature=0.3,
        messages=[
            {"role": "system", "content": LLM_PROMPT},
            {"role": "user", "content": build_user_prompt(payload_json)},
        ],
    )

    raw_output = response.choices[0].message.content

    try:
        itinerary = json.loads(raw_output)
        pretty_print_itinerary(itinerary)
    except:
        raise HTTPException(status_code=500, detail="Invalid JSON returned by LLM")

    return itinerary


@app.post("/fetch-itinerary")
def fetch_itinerary(request: FetchItineraryRequest):
    """
    Fetch a complete itinerary with all days and activities for a given user and itinerary ID.
    Returns the itinerary in a structured format with days and items.
    """
    user_id = request.user_id
    itinerary_id = request.itinerary_id

    # Step 1: Verify the itinerary exists and belongs to the user
    try:
        itinerary_response = (
            supabase.from_("itineraries")
            .select("*")
            .eq("id", itinerary_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not itinerary_response.data:
            raise HTTPException(
                status_code=404,
                detail="Itinerary not found or does not belong to this user.",
            )
    except Exception as e:
        print(f"Error fetching itinerary: {e}")
        raise HTTPException(
            status_code=404,
            detail="Itinerary not found or does not belong to this user.",
        )

    # Step 2: Fetch all days for this itinerary
    days_response = (
        supabase.from_("itinerary_days")
        .select("*")
        .eq("itinerary_id", itinerary_id)
        .order("day_number")
        .execute()
    )
    days = days_response.data or []

    if not days:
        return {"itinerary": []}

    # Step 3: Fetch all activities for all days in one query
    day_ids = [day["id"] for day in days]
    activities_response = (
        supabase.from_("activities")
        .select("*")
        .in_("day_id", day_ids)
        .order("start_time")
        .execute()
    )
    activities = activities_response.data or []

    # Step 4: Group activities by day_id
    activities_by_day = {}
    for activity in activities:
        day_id = activity["day_id"]
        if day_id not in activities_by_day:
            activities_by_day[day_id] = []
        activities_by_day[day_id].append(activity)

    # Step 5: Build the response structure
    itinerary_result = []
    for day in days:
        day_activities = activities_by_day.get(day["id"], [])

        items = []
        for activity in day_activities:
            # Format the time from start_time if available
            time_str = None
            if activity.get("start_time"):
                try:
                    dt = datetime.fromisoformat(
                        activity["start_time"].replace("Z", "+00:00")
                    )
                    time_str = dt.strftime("%I:%M %p").lstrip("0")
                except ValueError:
                    time_str = None

            items.append(
                {
                    "time": time_str,
                    "title": activity.get("name")
                    or activity.get("location_name")
                    or "Untitled",
                    "type": "event",
                    "source": activity.get("category") or "Unknown",
                    "address": activity.get("location_address") or "",
                    "url": activity.get("booking_url") or "",
                    "explanation": activity.get("description") or "",
                }
            )

        itinerary_result.append(
            {
                "day_id": day.get("day_number") or day["id"],
                "date": day.get("date"),
                "items": items,
            }
        )

    return {"itinerary": itinerary_result}


LLM_PROMPT_FOOD = """
You are Itinera, an expert culinary guide and food travel planner.

Your task is to generate a curated list of food recommendations using ONLY the restaurants, cafés, bars, and dessert shops provided in the input JSON under 'food_experiences'.

--------------------------------------------------
PRIMARY RULES
--------------------------------------------------
1. You MUST NOT invent any food places not in the provided input.
2. Output a single list of curated food recommendations (NOT grouped by day).
3. Select 8–15 total recommendations, depending on the trip length.
4. Recommendations must match:
   - the user's dietary preferences,
   - the user’s budget level (low, medium, high),
   - and the guest summary (adults, children, infants, pets).
5. Bars should be recommended only if:
   - the user indicates nightlife interests, AND
   - the group is adults-only.
6. Dessert and café options should be included even for non-nightlife travelers.
7. Avoid overly expensive places for low-budget travelers.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------
You MUST output JSON following exactly this structure:

{
  "food_recommendations": [
    {
      "title": "...",
      "type": "restaurant" | "cafe" | "bar" | "dessert",
      "address": "...",
      "rating": 4.5,
      "priceLevel": "$$",
      "url": "...",
      "explanation": "One friendly, conversational sentence explaining why this place fits the user (diet, budget, vibe, or group)."
    }
  ]
}

--------------------------------------------------
TONE & EXPLANATIONS
--------------------------------------------------
8. Explanations MUST be warm, friendly, and conversational — like a human travel agent.
9. Every explanation MUST reference at least two:
   - dietary match,
   - budget fit,
   - group suitability (good for families, couples, pet-friendly, etc.),
   - user interests such as nightlife, desserts, coffee, wine, cocktails.

--------------------------------------------------
OUTPUT RULES
--------------------------------------------------
10. Do NOT group recommendations by day.
11. Do NOT schedule times.
12. Do NOT output anything except valid JSON.
"""


@app.post("/generate-food")
def generate_food(trip: TripDetails):
    user_profile = get_user_onboarding_profile(trip.user_id)
    restaurants = get_food_options(trip.destination, user_profile.food_preferences)

    for category, places in restaurants.items():
        print(f"\n=== CATEGORY: {category} ===\n")
        for place in places:
            pretty_print_food_place(place)

    payload = {
        "trip_details": trip.dict(),
        "user_profile": user_profile.dict(),
        "food_experiences": {
            k: [place.dict() for place in v] for k, v in restaurants.items()
        },
    }

    payload_json = json.dumps(payload, indent=2)

    response = client.chat.completions.create(
        model="gpt-4.1",
        temperature=0.4,
        messages=[
            {"role": "system", "content": LLM_PROMPT_FOOD},
            {"role": "user", "content": f"Here is the food data:\n{payload_json}"},
        ],
    )

    raw_output = response.choices[0].message.content

    try:
        food_json = json.loads(raw_output)
        pretty_print_food_recommendations(food_json)
        return food_json
    except:
        raise HTTPException(status_code=500, detail="Invalid JSON returned by LLM")


LLM_REGENERATE_PROMPT = """
You are Itinera, an expert AI travel planner.

Your job is to **refine** an existing itinerary using the user's feedback and preferences.

--------------------------------------------------
RULES FOR REGENERATION
--------------------------------------------------
1. Keep ALL items marked "yes".
2. Replace ALL items marked "no" with better alternatives.
3. Use chat messages to understand what the user wants more or less of.
4. Preserve the number of days and structure of the existing itinerary.
5. Output the itinerary in the SAME JSON structure as the original.
6. You MAY reuse events from:
   - previous itinerary
   - Ticketmaster
   - Google Places (events only, NOT restaurants)
   - Famous attractions dataset
7. You MUST NOT invent new places.
8. Explanations must remain one friendly sentence.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------
Return ONLY JSON:

{
  "itinerary": [
    {
      "day_id": 1,
      "date": "YYYY-MM-DD",
      "items": [
        {
          "time": "HH:MM AM/PM",
          "title": "...",
          "type": "event",
          "source": "Google" | "Ticketmaster",
          "address": "...",
          "url": "...",
          "explanation": "One sentence."
        }
      ]
    }
  ]
}

DO NOT return markdown or commentary.
"""


@app.post("/regenerate-itinerary")
def regenerate_itinerary(req: RegenerateRequest):
    # STEP 1 — Get the user's onboarding profile
    user_profile = get_user_onboarding_profile(req.user_id)
    user_interests = user_profile.interests.split(",")

    # STEP 2 — Load event datasets again
    google_places_events = get_google_places_events(user_interests, req.destination)
    famous_attractions = get_famous_attractions(req.destination)
    tm_events = get_ticketmaster_events(req.destination, req.start_date, req.end_date)

    # STEP 3 — Prepare regeneration payload for the LLM
    payload = {
        "trip_details": {
            "destination": req.destination,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "num_guests": "",
        },
        "user_profile": user_profile.dict(),
        "chat_messages": [msg.dict() for msg in req.chat_messages],
        "approvals": [a.dict() for a in req.approvals],
        "previous_itinerary": req.previous_itinerary,
        "events": {
            "ticketmaster": [e.dict() for e in tm_events],
            "google_place_events": {
                k: [ev.dict() for ev in v] for k, v in google_places_events.items()
            },
            "famous_attractions": [fa.dict() for fa in famous_attractions],
        },
    }

    payload_json = json.dumps(payload, indent=2)

    # STEP 4 — LLM call
    response = client.chat.completions.create(
        model="gpt-4.1",
        temperature=0.4,
        messages=[
            {"role": "system", "content": LLM_REGENERATE_PROMPT},
            {"role": "user", "content": f"Here is the itinerary data:\n{payload_json}"},
        ],
    )

    raw_output = response.choices[0].message.content

    # STEP 5 — Parse and return itinerary
    try:
        itinerary = json.loads(raw_output)
        pretty_print_itinerary(itinerary)
        return itinerary
    except:
        raise HTTPException(status_code=500, detail="Invalid JSON returned by LLM")


# Geocode API: convert address to lat/lng
# Get destination coordinates
@app.get("/geocode")
def geocode(address: str):
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")

    from urllib.parse import urlencode

    params = urlencode({"address": address, "key": os.getenv("GOOGLE_PLACES_API_KEY")})
    url = f"https://maps.googleapis.com/maps/api/geocode/json?{params}"
    res = requests.get(url)

    if res.status_code != 200:
        raise HTTPException(
            status_code=500, detail="Failed to reach Google Geo Coding API"
        )
    data = res.json()
    if not data.get("results"):
        raise HTTPException(status_code=404, detail="Address could not be geocoded")
    return data
