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
origins = [
    "http://localhost:5173",
    "https://itinera-bot.web.app"
]

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

# BUSINESS LOGIC - Itinerary Generation
from datetime import datetime

def get_lat_lon_from_city(city_name: str):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": city_name,
        "key": os.getenv("GOOGLE_API_KEY")
    }

    response = requests.get(url, params=params)
    data = response.json()

    if response.status_code != 200 or not data.get("results"):
        raise HTTPException(status_code=400, detail=f"Error geocoding city: {city_name}")

    location = data["results"][0]["geometry"]["location"]
    lat, lon = location["lat"], location["lng"]
    return lat, lon

def convert_to_iso(date_str: str) -> str:
    """Convert mm/dd/yyyy → yyyy-mm-dd"""
    try:
        return datetime.strptime(date_str, "%m/%d/%Y").strftime("%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}")
    
def get_predicthq_events(lat: float, lon: float, start_date, end_date: str):
    url = "https://api.predicthq.com/v1/events/"

    headers = {
        "Authorization": f"Bearer {os.getenv('PREDICTHQ_TOKEN')}",
        "Accept": "application/json"
    }

    params = {
        "category": "concerts,festivals,performing-arts,sports,community,conferences",
        "start.gte": start_date,
        "start.lte": end_date,
        "within": f"25mi@{lat},{lon}",
        "limit": 10,
        "sort": "start"
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"PredictHQ API error: {response.text}"
        )

    data = response.json()
    events = data.get("results", [])
    events_clean = [simplify_phq_event(e) for e in events]
    return events_clean

def simplify_phq_event(event):
    return {
        "title": event.get("title"),
        "category": event.get("category"),
        "start": event.get("start_local"),
        "end": event.get("end_local"),
        "address": event.get("geo", {}).get("address", {}).get("formatted_address"),
        "predicted_attendance": event.get("phq_attendance"),
        "spend_estimate": event.get("predicted_event_spend"),
        "venue": (
            event["entities"][0]["name"]
            if event.get("entities") else "Unknown"
        )
    }

def get_ticketmaster_events(city:str, start_date: str, end_date: str):
    url = "https://app.ticketmaster.com/discovery/v2/events.json"
    params = {
        "apikey": os.getenv("TICKETMASTER_API_KEY"),
        "city": city,
        "countryCode": "US",
        "radius": 25,  # miles
        "unit": "miles",
        "locale": "*",
        "startDateTime": f"{start_date}T00:00:00Z",
        "endDateTime": f"{end_date}T23:59:59Z",
        "size": 10,
        "sort": "date,asc"
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Ticketmaster API error: {response.text}"
        )

    data = response.json()
    events = data.get("_embedded", {}).get("events", [])
    return events

def simplify_ticketmaster_event(event):
    venue_info = event.get("_embedded", {}).get("venues", [{}])[0]

    return {
        "title": event.get("name"),
        "category": event.get("classifications", [{}])[0].get("segment", {}).get("name"),
        "start": event.get("dates", {}).get("start", {}).get("localDate"),
        "end": None,  # Ticketmaster doesn’t always provide an end time
        "venue": venue_info.get("name"),
        "address": venue_info.get("address", {}).get("line1"),
        "predicted_attendance": None,
        "spend_estimate": None
    }

def generate_itinerary_with_llm(destination, check_in, check_out, num_guests, user_prefs, events):
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

    Available local events (real data — **only use these for official events**):
    {events}

    Guidelines:
    1. You **must prioritize** including activities and events from the list above whenever possible. Please at least include one event from predictHQ and one event from ticketmaster.
    2. If you need to fill missing time slots (like meals or free time), only then suggest general attractions or restaurants that *truly exist* in {destination}. Use **widely known places only** (e.g., Golden Gate Park, Fisherman’s Wharf).
    3. Never invent new or fictional venues or organizations. If unsure, choose a well-known tourist site, neighborhood, or restaurant instead.
    4. Label the source of each activity as:
    - `"PredictHQ"` — came directly from the PredictHQ event list
    - `"Ticketmaster"` — came directly from the Ticketmaster list
    - `"Model"` — for filler or contextual suggestions (like meals, breaks, sightseeing)
    5. Keep a balanced but realistic schedule — most events should come from the provided list.
    6. Each day should include 3–6 activities (morning, afternoon, evening).
    7. Output **strict JSON** with the following schema:
        {{
        "destination": "...",
        "days": [
            {{
            "date": "YYYY-MM-DD",
            "activities": [
                {{
                "time": "Morning",
                "name": "...",
                "description": "...",
                "explanation": "...",
                "source": "PredictHQ | Ticketmaster | Model"
                }}
            ]
            }}
        ]
        }}
    """



    # Get llm response
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are a helpful itinerary planner."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
    )

    itinerary_text = response.choices[0].message.content
    return itinerary_text


# Input model - itinerary request
class ItineraryRequest(BaseModel):
    userId: str
    destination: str
    checkInDate: str
    checkOutDate:str
    numGuests: int


@app.post("/generate_itinerary")
async def generate_itinerary(request: ItineraryRequest):
    # Get user trip details
    user_id = request.userId
    destination = request.destination
    check_in = convert_to_iso(request.checkInDate)
    check_out = convert_to_iso(request.checkOutDate)
    guests = request.numGuests

    print(f"Received itinerary request for {destination} ({check_in} → {check_out})")
    print(f"User ID: {user_id}")
    print(f"Guests: {guests}")

    # Get user preferences for itinerary generation
    try:
        response = supabase.table("user_onboarding").select("*").eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User preferences not found")
        user_prefs = response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching preferences: {e}")

    print("Fetched preferences:", user_prefs)

    # Event Gathering
    try:
        lat, lon = get_lat_lon_from_city(destination)
        print(f"Coordinates: {lat}, {lon}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {e}")

    # Get phq events
    try:
        phq_events = get_predicthq_events(lat, lon, check_in, check_out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # ticketmaster events
    try:
        tm_events = get_ticketmaster_events(destination, check_in, check_out)
        tm_events_clean = [simplify_ticketmaster_event(e) for e in tm_events]
    except Exception as e:
        tm_events_clean = []
        print(f"Ticketmaster error: {e}")

    # merge both events
    combined_events = phq_events + tm_events_clean
    print(f"Fetched {len(combined_events)} total events")

    # generate itinerary
    try:
        ai_raw_output = generate_itinerary_with_llm(
            destination, check_in, check_out, guests, user_prefs, combined_events
        )

        # Clean and enforce valid JSON
        if isinstance(ai_raw_output, str):
            clean_output = re.sub(r"^```(json)?", "", ai_raw_output)
            clean_output = re.sub(r"```$", "", clean_output).strip()

            try:
                ai_itinerary = json.loads(clean_output)
            except json.JSONDecodeError as e:
                print("JSON parsing failed, raw output:", ai_raw_output)
                raise HTTPException(status_code=500, detail=f"Invalid JSON from LLM: {e}")
        else:
            # If the LLM already returned a dict
            ai_itinerary = ai_raw_output

    except Exception as e:
        print("LLM itinerary generation error:", e)
        ai_itinerary = {"error": str(e)}

    # Log for debugging
    print(f"Final parsed itinerary object:\n{ai_itinerary}")

    # Return clean JSON to frontend
    return {
        "city": destination,
        "coordinates": {"lat": lat, "lon": lon},
        "ai_itinerary": ai_itinerary
    }


        









