import os
import time
import requests
import uvicorn
import json
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any
from openai import OpenAI  # Changed import
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# CORS (Cross-Origin Resource Sharing) prohibits unauthorized websites, endpoints, or servers from accessing the API

# Services from this origin can access the api
origins = [
    "http://localhost:5173",
    "https://itinera-bot.web.app",
    "https://itinera-52f68.web.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SYSTEM_PROMPT = """
You are an expert travel planning assistant. Your task is to create or edit detailed, realistic itineraries using REAL attractions, restaurants, and activities.

### MANDATORY REQUIREMENTS:

1. **Use Web Search Extensively**
   - ALWAYS use web search to find actual attractions, museums, restaurants, cafes, parks, and activities at the destination.
   - Search for "top things to do in [destination]", "best restaurants in [destination]", "popular attractions in [destination]".
   - Find REAL, SPECIFIC venue names (e.g., "Millennium Park", "The Art Institute of Chicago", "Lou Malnati's Pizzeria").
   - NEVER use generic placeholders like "Morning exploration" or "Afternoon activities".

2. **Context Integration**
   - If the user provides specific events, weather, or preferences in the context, incorporate them.
   - If no context is provided, use web search to fill ALL days with real activities.
   - User preferences (e.g., "cafes", "museums", "outdoor activities") should guide your web searches.

3. **Complete Coverage**
   - Generate activities for EVERY day requested (if 3 days requested, provide 3 full days).
   - Each day must have 3-5 distinct activities with specific times (morning, afternoon, evening).
   - Every activity must be a REAL place or event you found via web search.

4. **Iterative Edit Mode (when CURRENT_ITINERARY is provided)**
   - Treat the task as an edit to the existing itinerary, NOT a full regeneration.
   - Preserve all existing days and activities unless the user explicitly asks to change or remove them.
   - Add new requested items into the appropriate day while keeping prior items intact. If scheduling conflicts arise, minimally adjust times but do not delete previous items.
   - Keep day numbering stable. Maintain duration as max(existing duration, newly requested duration) unless the user asks to shorten it.
   - Never remove previously added items unless the user explicitly asks to remove or replace them.
   - Always output the full, updated itinerary JSON after applying edits.

### Output Format:

Produce ONLY valid JSON matching this schema:

{
  "destination": "string",
  "duration": "number",
  "transportation": "string",
  "itinerary": [
    {
      "day": "number",
      "activities": [
        {
          "time": "string",
          "attraction": "string",
          "weather": "string",
          "description": "string"
        }
      ]
    }
  ]
}

### Field Requirements:

- **destination**: City or region name
- **duration**: Total number of days (must match number of itinerary entries)
- **transportation**: Primary transport mode (e.g., "public transit", "rental car", "walking")
- **itinerary**: Array with one entry per day (1-indexed)
  - **day**: Day number (1, 2, 3, etc.)
  - **activities**: 3-5 activities per day, each with:
    - **time**: Start time (e.g., "09:00 AM", "02:00 PM", "07:00 PM")
    - **attraction**: REAL venue name found via web search (e.g., "Navy Pier", "Giordano's Pizza")
    - **weather**: Weather condition (use provided data or estimate based on season/location)
    - **description**: One sentence describing the experience

### Examples of GOOD vs BAD attractions:

✅ GOOD (Real, Specific):
- "The Art Institute of Chicago"
- "Millennium Park"
- "Lou Malnati's Pizzeria"
- "Willis Tower Skydeck"

❌ BAD (Generic, Vague):
- "Morning exploration"
- "Afternoon activities"
- "Local restaurant"
- "City sightseeing"

### Final Rules:

- Return ONLY the JSON object, no other text
- Use web search to populate ALL activities with real venues
- Ensure itinerary array length equals duration value
- Each day must have unique, diverse activities
"""


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    weather: Optional[Dict[str, Any]] = None
    events: Optional[List[Dict[str, Any]]] = None


class ChatResponse(BaseModel):
    message: Message


GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


@app.get("/")
def read_root():
    return {"message": "FastAPI backend running!"}


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    print(f"Received {len(request.messages)} messages")  # Debug logging

    try:
        # Add system prompt and user messages in OpenAI format
        openai_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]

        # Inject structured context before chat history so the model conditions on it
        context_blocks = []
        if request.weather:
            context_blocks.append({"weather": request.weather})
        if request.events:
            context_blocks.append({"events": request.events})

        if context_blocks:
            openai_messages.append(
                {
                    "role": "user",
                    "content": f"Current Events to Choose From + Weather Info:\n{json.dumps({'context': context_blocks}, ensure_ascii=False)}",
                }
            )

        # Try to extract a structured itinerary request from recent user messages
        duration_hint = None
        structured_request: Optional[Dict[str, Any]] = None
        for msg in reversed(request.messages):
            if msg.role != "user":
                continue
            try:
                obj = json.loads(msg.content)
                if isinstance(obj, dict) and obj.get("type") == "itinerary_request":
                    structured_request = obj
                    duration_hint = obj.get("duration")
                    break
            except Exception:
                continue

        if structured_request is not None:
            openai_messages.append(
                {
                    "role": "user",
                    "content": f"Structured itinerary request (for grounding):\n{json.dumps(structured_request, ensure_ascii=False)}",
                }
            )

        # Detect the most recent assistant itinerary to enable iterative edit mode
        previous_itinerary: Optional[Dict[str, Any]] = None
        for msg in reversed(request.messages):
            if msg.role != "assistant":
                continue
            try:
                obj = json.loads(msg.content)
                if (
                    isinstance(obj, dict)
                    and "itinerary" in obj
                    and isinstance(obj.get("itinerary"), list)
                    and "duration" in obj
                ):
                    previous_itinerary = obj
                    break
            except Exception:
                continue

        if previous_itinerary is not None:
            # Instruct the model to edit minimally and preserve existing content
            openai_messages.append(
                {
                    "role": "user",
                    "content": (
                        "EDITING MODE: You are updating an existing itinerary. "
                        "Preserve all existing days and activities unless the user explicitly asks to modify them. "
                        "Append new requested activities to the appropriate day. "
                        "If time conflicts occur, adjust times minimally but do not delete existing items. "
                        "Keep day numbering stable and maintain duration as max(existing, requested) unless told otherwise. "
                        "Return the full updated itinerary JSON."
                    ),
                }
            )
            openai_messages.append(
                {
                    "role": "user",
                    "content": f"CURRENT_ITINERARY (source of truth to preserve):\n{json.dumps(previous_itinerary, ensure_ascii=False)}",
                }
            )

        # If duration is known, add an explicit enforcement instruction
        if isinstance(duration_hint, (int, float)) and duration_hint:
            openai_messages.append(
                {
                    "role": "user",
                    "content": (
                        f"CRITICAL REQUIREMENT: The itinerary array MUST contain exactly {int(duration_hint)} entries. "
                        f"Create one entry for each day numbered 1 through {int(duration_hint)}. "
                        f"Each entry must have a 'day' field and an 'activities' array. "
                        f"If context is limited, use generic activities (e.g., 'Morning exploration', 'Afternoon sightseeing') "
                        f"rather than omitting days. All {int(duration_hint)} days are mandatory."
                    ),
                }
            )

        chat_messages = [
            {"role": msg.role, "content": msg.content} for msg in request.messages
        ]
        openai_messages.extend(chat_messages)

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-5-search-api",
            messages=openai_messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "itinerary",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "destination": {"type": "string"},
                            "duration": {"type": "number"},
                            "transportation": {"type": "string"},
                            "itinerary": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "day": {"type": "number"},
                                        "activities": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "time": {"type": "string"},
                                                    "attraction": {"type": "string"},
                                                    "weather": {"type": "string"},
                                                    "description": {"type": "string"},
                                                },
                                                "required": [
                                                    "time",
                                                    "attraction",
                                                    "weather",
                                                    "description",
                                                ],
                                                "additionalProperties": False,
                                            },
                                        },
                                    },
                                    "required": ["day", "activities"],
                                    "additionalProperties": False,
                                },
                            },
                        },
                        "required": [
                            "destination",
                            "duration",
                            "transportation",
                            "itinerary",
                        ],
                        "additionalProperties": False,
                    },
                },
            },
        )

        print("OpenAI response received")  # Debug logging

        # Extract assistant's response
        response_content = response.choices[0].message.content

        # Validate and fix itinerary day count if duration was specified
        if isinstance(duration_hint, (int, float)) and duration_hint:
            try:
                itinerary_data = json.loads(response_content)
                actual_days = len(itinerary_data.get("itinerary", []))
                expected_days = int(duration_hint)

                print(
                    f"Duration validation: expected {expected_days} days, got {actual_days} days"
                )

                if actual_days < expected_days:
                    print(
                        f"WARNING: Itinerary has only {actual_days} days, padding to {expected_days}"
                    )
                    # Pad with placeholder days
                    existing_days = {day["day"] for day in itinerary_data["itinerary"]}
                    for day_num in range(1, expected_days + 1):
                        if day_num not in existing_days:
                            itinerary_data["itinerary"].append(
                                {
                                    "day": day_num,
                                    "activities": [
                                        {
                                            "time": "09:00 AM",
                                            "attraction": "Morning exploration",
                                            "weather": "Variable conditions",
                                            "description": "Explore the destination at your own pace.",
                                        },
                                        {
                                            "time": "02:00 PM",
                                            "attraction": "Afternoon activities",
                                            "weather": "Variable conditions",
                                            "description": "Continue discovering local attractions and experiences.",
                                        },
                                    ],
                                }
                            )
                    # Sort by day number
                    itinerary_data["itinerary"].sort(key=lambda x: x["day"])
                    response_content = json.dumps(itinerary_data, ensure_ascii=False)
                    print(
                        f"Padded itinerary to {len(itinerary_data['itinerary'])} days"
                    )
            except Exception as e:
                print(f"Could not validate/fix itinerary day count: {e}")

        assistant_message = Message(role="assistant", content=response_content)

        return ChatResponse(message=assistant_message)

    except Exception as e:
        print(f"Error in chat endpoint: {type(e).__name__}: {str(e)}")  # Debug logging
        import traceback

        traceback.print_exc()  # Print full stack trace
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Geocode API: convert address to lat/lng
@app.get("/geocode")
def geocode(address: str):
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
    res = requests.get(url)
    return res.json()


# Routes API: get optimized directions between points
@app.get("/route")
def route(origin: str, destination: str):
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY}
    body = {
        "origin": {"address": origin},
        "destination": {"address": destination},
        "travelMode": "DRIVE",
        "computeAlternativeRoutes": False,
        "routeModifiers": {"avoidTolls": False, "avoidHighways": False},
        "languageCode": "en-US",
        "units": "METRIC",
    }
    res = requests.post(url, headers=headers, json=body)
    return res.json()


# Places API: find nearby attractions
@app.get("/places")
def places(
    lat: float, lng: float, radius: int = 1500, type: str = "tourist_attraction"
):
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY}
    body = {
        "locationRestriction": {
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": radius}
        },
        "includedTypes": [type],
        "maxResultCount": 10,
    }
    res = requests.post(url, headers=headers, json=body)
    return res.json()


# Distance Matrix API: total travel time/distance
@app.get("/distance")
def distance(origins: str, destinations: str):
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origins}&destinations={destinations}&key={GOOGLE_API_KEY}"
    res = requests.get(url)
    return res.json()


# Time Zone API: get local time from coordinates
@app.get("/timezone")
def timezone(lat: float, lng: float):
    timestamp = int(time.time())
    url = f"https://maps.googleapis.com/maps/api/timezone/json?location={lat},{lng}&timestamp={timestamp}&key={GOOGLE_API_KEY}"
    res = requests.get(url)
    return res.json()


# Optional multi-stop route
@app.get("/multi_route")
def multi_route(
    origins: str,
    waypoints: str,
    destination: str,
    travelMode: str = Query("DRIVE", enum=["DRIVE", "TRANSIT", "BICYCLE", "WALK"]),
):
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters",
    }

    waypoint_list = []
    if waypoints:
        waypoint_list = [{"address": w} for w in waypoints.split("|")]

    body = {
        "origin": {"address": origins},
        "destination": {"address": destination},
        "travelMode": travelMode,
    }

    if waypoint_list:
        body["intermediates"] = waypoint_list

    if travelMode == "DRIVE" and waypoint_list:
        body["optimizeWaypointOrder"] = True

    if travelMode == "TRANSIT":
        body.pop("intermediates", None)
        body["departureTime"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    try:
        res = requests.post(url, headers=headers, json=body)
        res.raise_for_status()
        return res.json()
    except requests.exceptions.HTTPError as err:
        print(f"HTTP Error from Google API for mode {travelMode}: {err.response.text}")
        raise HTTPException(
            status_code=err.response.status_code, detail=err.response.json()
        )
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500, detail="An internal server error occurred."
        )
