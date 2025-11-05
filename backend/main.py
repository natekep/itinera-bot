import os
import time
import requests
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal
# from openai import OpenAI  # Changed import
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Literal, Optional
import json
from supabase import create_client, Client

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

# Load environment variables from a local .env file when running outside GAE
load_dotenv()

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize OpenAI client (legacy, currently unused)
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_id: Optional[str] = None
    people: Optional[str] = None

class ChatResponse(BaseModel):
    message: Message

GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure the Gemini SDK if an API key is available
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@app.get("/")
def read_root():
    return {"message": "FastAPI backend running!"}

class Activity(BaseModel):
    start_time: str
    end_time: str
    description: str

class ItineraryDay(BaseModel):
    day: int
    date: str
    title: str
    activities: List[Activity]

class StructuredItinerary(BaseModel):
    id: Optional[int] = None
    destination: str
    start_date: str
    end_date: str
    days: List[ItineraryDay]

class StructuredChatResponse(BaseModel):
    message: Message # The raw text from the LLM
    itinerary: Optional[StructuredItinerary] = None # The parsed JSON itinerary

def save_itinerary(user_id: str, people: str, itinerary: StructuredItinerary):
    if not supabase:
        print("Supabase client not initialized. Skipping save.")
        return

    try:
        # Insert into itineraries table
        itinerary_insert = {
            "destination": itinerary.destination,
            "start_date": itinerary.start_date,
            "end_date": itinerary.end_date,
            "user_id": user_id,
            "num_guests": people,
            "title": f"Trip to {itinerary.destination}"
        }
        print("Inserting itinerary:", itinerary_insert)
        itinerary_res = supabase.table("itineraries").insert(itinerary_insert).execute()
        print("Insert response:", itinerary_res)
        
        if not itinerary_res.data:
            print("Failed to insert itinerary, no data returned.")
            return None

        itinerary_id = itinerary_res.data[0]['id']
        
        # Insert into itinerary_days table
        days_to_insert = []
        for day in itinerary.days:
            notes = "\n".join([f"{act.start_time}-{act.end_time}: {act.description}" for act in day.activities])
            days_to_insert.append({
                "itinerary_id": itinerary_id,
                "day_number": day.day,
                "date": day.date,
                "notes": notes
            })
        
        if days_to_insert:
            print(f"Inserting {len(days_to_insert)} days for itinerary {itinerary_id}")
            days_res = supabase.table("itinerary_days").insert(days_to_insert).execute()
            print("Days insert response:", days_res)

        return itinerary_id

    except Exception as e:
        print(f"Error saving itinerary to Supabase: {e}")
        return None


@app.post("/v1/chat", response_model=StructuredChatResponse)
async def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty")

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # Correctly prepare messages for Gemini
    system_instruction = None
    contents = []
    for m in request.messages:
        if m.role == "system":
            system_instruction = m.content
            continue
        # Map role 'assistant' to 'model' for the Gemini API
        role = "model" if m.role == "assistant" else m.role
        contents.append({"role": role, "parts": [{"text": m.content}]})

    try:
        # Pass system instruction during model initialization
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=system_instruction
        )
        
        # Start non-streaming generation
        response = model.generate_content(
            contents, # Use the correctly formatted contents
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )

        full_response_text = (response.text or "").strip()
        itinerary_data = None
        
        full_response_text = (response.text or "").strip()
        itinerary_data = None
        
        if full_response_text:
            try:
                # 1. Parse the raw JSON from Gemini
                gemini_json = json.loads(full_response_text)
                
                # 2. Extract the itinerary object
                gemini_itinerary = gemini_json.get("trip_itinerary")

                # 3. Transform and validate if the itinerary object exists
                if gemini_itinerary:
                    transformed_days = []
                    # Ensure 'days' exists and is a list before iterating
                    if isinstance(gemini_itinerary.get("days"), list):
                        for day in gemini_itinerary["days"]:
                            transformed_days.append({
                                "day": day.get("day"),
                                "date": day.get("date"),
                                "title": day.get("theme"), # Map theme to title
                                "activities": day.get("activities", [])
                            })

                    # Proceed only if we have transformed days
                    if transformed_days:
                        transformed_itinerary = {
                            "destination": gemini_itinerary.get("destination"),
                            # Infer start and end dates from the days array
                            "start_date": transformed_days[0].get("date"),
                            "end_date": transformed_days[-1].get("date"),
                            "days": transformed_days
                        }
                        
                        # 4. Validate the transformed data with our Pydantic model
                        itinerary_data = StructuredItinerary.model_validate(transformed_itinerary)
                        
                        # 5. Save the validated itinerary if user_id is provided
                        if request.user_id and request.people and itinerary_data:
                            itinerary_id = save_itinerary(request.user_id, request.people, itinerary_data)
                            if itinerary_id:
                                # Add the ID to the itinerary data so it can be returned to the frontend
                                itinerary_data.id = itinerary_id
                    else:
                        itinerary_data = None # No valid days found
                else:
                    itinerary_data = None # No trip_itinerary key found
                
            except (json.JSONDecodeError, Exception) as e:
                print(f"Error processing or transforming JSON on backend: {e}")
                print(f"Received text on backend: {full_response_text}")
                itinerary_data = None
        
        return StructuredChatResponse(
            message=Message(role="assistant", content=full_response_text),
            itinerary=itinerary_data
        )

    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

@app.get("/v1/itineraries")
def get_itineraries(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        res = supabase.table("itineraries").select("*").eq("user_id", user_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_itinerary_details(itinerary_id: int, user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Fetch itinerary details
        itinerary_res = supabase.table("itineraries").select("*").eq("id", itinerary_id).eq("user_id", user_id).single().execute()
        if not itinerary_res.data:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        itinerary = itinerary_res.data

        # Fetch itinerary days and activities
        days_res = supabase.table("itinerary_days").select("*").eq("itinerary_id", itinerary_id).order("day_number", desc=False).execute()
        
        days_data = []
        for day in days_res.data:
            # This is a simplified version. In a real app, you'd parse the 'notes' field back into activities.
            # For now, we'll just pass the notes. A better approach would be a separate 'activities' table.
            activities = []
            if day.get("notes"):
                for line in day["notes"].split("\n"):
                    parts = line.split(": ", 1)
                    if len(parts) == 2:
                        time_range, description = parts
                        start_time, end_time = time_range.split('-')
                        activities.append({"start_time": start_time, "end_time": end_time, "description": description})

            days_data.append({
                "day": day["day_number"],
                "date": day["date"],
                "title": f"Day {day['day_number']}", # Title is not stored per day, so we generate it
                "activities": activities
            })

        return {
            "destination": itinerary["destination"],
            "start_date": itinerary["start_date"],
            "end_date": itinerary["end_date"],
            "days": days_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/itinerary/{itinerary_id}", response_model=StructuredItinerary)
def get_itinerary(itinerary_id: int, user_id: str):
    return get_itinerary_details(itinerary_id, user_id)

# @app.post("/v1/chat", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     if not request.messages:
#         raise HTTPException(status_code=400, detail="Messages array cannot be empty")
    
#     api_key = os.getenv("OPENAI_API_KEY")
#     if not api_key:
#         raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
#     print(f"Received {len(request.messages)} messages")  # Debug logging
    
#     try:
#         # Convert messages to OpenAI format
#         openai_messages = [
#             {"role": msg.role, "content": msg.content}
#             for msg in request.messages
#         ]
        
#         print(f"Calling OpenAI with messages: {openai_messages}")  # Debug logging
        
#         # Call OpenAI API
#         response = client.chat.completions.create(
#             model="gpt-5-nano",
#             messages=openai_messages
#         )
        
#         print(f"OpenAI response received")  # Debug logging
        
#         # Extract assistant's response
#         assistant_message = Message(
#             role="assistant",
#             content=response.choices[0].message.content
#         )
        
#         return ChatResponse(message=assistant_message)
    
#     except Exception as e:
#         print(f"Error in chat endpoint: {type(e).__name__}: {str(e)}")  # Debug logging
#         import traceback
#         traceback.print_exc()  # Print full stack trace
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY
    }
    body = {
        "origin": {"address": origin},
        "destination": {"address": destination},
        "travelMode": "DRIVE",
        "computeAlternativeRoutes": False,
        "routeModifiers": {"avoidTolls": False, "avoidHighways": False},
        "languageCode": "en-US",
        "units": "METRIC"
    }
    res = requests.post(url, headers=headers, json=body)
    return res.json()

# Places API: find nearby attractions
@app.get("/places")
def places(lat: float, lng: float, radius: int = 1500, type: str = "tourist_attraction"):
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY
    }
    body = {
        "locationRestriction": {
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": radius}
        },
        "includedTypes": [type],
        "maxResultCount": 10
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
def multi_route(origins: str, waypoints: str, destination: str):
    """
    Compute route with multiple stops.
    Example: /multi_route?origins=New+York&waypoints=Philadelphia|Baltimore&destination=Washington+DC
    """
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY
    }
    waypoint_list = [{"address": w} for w in waypoints.split("|")]
    body = {
        "origin": {"address": origins},
        "destination": {"address": destination},
        "intermediates": waypoint_list,
        "travelMode": "DRIVE",
        "optimizeWaypointOrder": True
    }
    res = requests.post(url, headers=headers, json=body)
    return res.json()

# Lightweight config health check (does not expose secrets)
@app.get("/health/config")
def health_config():
    return {
        "google_maps_key_present": bool(GOOGLE_API_KEY),
        "gemini_key_present": bool(GEMINI_API_KEY),
        "gemini_env_used": (
            "GEMINI_API_KEY" if os.getenv("GEMINI_API_KEY") else (
                "GOOGLE_API_KEY" if os.getenv("GOOGLE_API_KEY") else None
            )
        ),
    }