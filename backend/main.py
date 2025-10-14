import os
import time
import requests
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
from openai import OpenAI  # Changed import
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# CORS (Cross-Origin Resource Sharing) prohibits unauthorized websites, endpoints, or servers from accessing the API

# Services from this origin can access the api
origins = [
    "http://localhost:5173"
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

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

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
        # Convert messages to OpenAI format
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        
        print(f"Calling OpenAI with messages: {openai_messages}")  # Debug logging
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=openai_messages
        )
        
        print(f"OpenAI response received")  # Debug logging
        
        # Extract assistant's response
        assistant_message = Message(
            role="assistant",
            content=response.choices[0].message.content
        )
        
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