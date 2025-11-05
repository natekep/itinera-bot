import os
import time
import requests
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional
# from openai import OpenAI  # Changed import
from dotenv import load_dotenv

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

GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Initialize OpenAI client
#client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    message: Message
    
class PlacesSearchRequest(BaseModel):
    origin: str
    destinations: List[str]
    categories: List[str]
    dietaryRestrictions: Optional[List[str]] = []
    budget: Optional[str] = "medium"



@app.get("/")
def read_root():
    return {"message": "FastAPI backend running!"}

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

# ---- google routes
# Geocode API: convert address to lat/lng
@app.get("/geocode")
def geocode(address: str):
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
    return requests.get(url).json()

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
    return requests.post(url, headers=headers, json=body).json()

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
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 10000}
        },
        "includedTypes": [type],
        "maxResultCount": 10
    }
    return requests.post(url, headers=headers, json=body).json()

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
def multi_route(origins: str, waypoints: str, destination: str, 
                travelMode: str = Query("DRIVE", enum=["DRIVE", "TRANSIT", "BICYCLE", "WALK"])):
   
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters"
    }
    
    waypoint_list = []
    if waypoints:
        waypoint_list = [{"address": w} for w in waypoints.split("|")]

    body = {
        "origin": {"address": origins},
        "destination": {"address": destination},
        "travelMode": travelMode
    }
    
    if waypoint_list:
        body["intermediates"] = waypoint_list
        
    if travelMode == "DRIVE" and waypoint_list:
        body["optimizeWaypointOrder"] = True
    
    if travelMode == "TRANSIT":
        body.pop("intermediates", None)
        body["departureTime"] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    try:
        res = requests.post(url, headers=headers, json=body)
        res.raise_for_status()  
        return res.json()
    except requests.exceptions.HTTPError as err:
        print(f"HTTP Error from Google API for mode {travelMode}: {err.response.text}")
        raise HTTPException(status_code=err.response.status_code, detail=err.response.json())
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    
# -----  places search endpoint const version
"""
@app.post("/api/places/search")
def search_places():
    """
    #Temp test route using fixed values
"""
    try:
        GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
            
        destinations = ["new York"]
        categories = ["restaurant", "tourist_attraction"]
        dietaryRestrictions = ["vegan"]
        budget = "medium"
            
        print(f"Searching for: {categories} in {destinations[0]}")
            
            # Step 1: Geocode destination
        geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={destinations[0]}&key={GOOGLE_API_KEY}"
        geo_res = requests.get(geo_url).json()

        if not geo_res.get("results"):
            raise HTTPException(status_code=404, detail="Geocoding failed")

        lat = geo_res["results"][0]["geometry"]["location"]["lat"]
        lng = geo_res["results"][0]["geometry"]["location"]["lng"]

            # Step 2: Search nearby using Google Places API
        url = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY
        }
        body = {
            "locationRestriction": {
                "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 3000}
            },
            "includedTypes": categories,
            "maxResultCount": 10
            }
        res = requests.post(url, headers=headers, json=body)
        data = res.json()
            
            # Step 3: Parse & format response
        places = []
        for p in data.get("places", []):
            places.append({
                "name": p.get("displayName", {}).get("text", "Unknown Place"),
                "address": p.get("formattedAddress", ""),
                "location": p.get("location", {}),
                "rating": p.get("rating", "N/A")
            })

        print(f"Found {len(places)} places near {destinations[0]}")
            
        return {
            "places": places,
            "count": len(places),
            "test_values": {
            "destinations": destinations,
            "categories": categories,
            "dietaryRestrictions": dietaryRestrictions,
            "budget": budget
            }
        }
            
    except Exception as e:
        print("Error fetching places:", e)
        raise HTTPException(status_code=500, detail=str(e))
   """
#----- onboarding version
@app.post("/api/places/search")
def search_places(req: Optional[PlacesSearchRequest] = None):
    """
    Works with both onboarding form data and default constants.
    """
    try:
        GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

            # Use real onboarding values if available, otherwise use defaults
        destinations = (req.destinations if req and req.destinations else ["New York"])
        categories = (req.categories if req and req.categories else ["restaurant", "tourist_attraction"])
        dietaryRestrictions = (req.dietaryRestrictions if req and req.dietaryRestrictions else ["vegan"])
        budget = (req.budget if req and req.budget else "medium")

        dest = destinations[0]
        print(f"Searching for: {categories} near {dest} (Budget: {budget})")

            # Step 1: Geocode
        geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={dest}&key={GOOGLE_API_KEY}"
        geo_res = requests.get(geo_url).json()
        if not geo_res.get("results"):
            raise HTTPException(status_code=404, detail="Geocoding failed for {dest}")

        lat = geo_res["results"][0]["geometry"]["location"]["lat"]
        lng = geo_res["results"][0]["geometry"]["location"]["lng"]

            # Step 2: Search nearby using Google Places API
        url = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating"
        }
        body = {
            "locationRestriction": {
                "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 10000}
            },
            "includedTypes": ["restaurant", "tourist_attraction", "museum", "park"],
            "maxResultCount": 15,
            "rankPreference": "POPULARITY"
        }
        nearby_res = requests.post(url, headers=headers, json=body)
        data = nearby_res.json()
        print("Google response sample:", data)

           # Step 3: Format the results
        places = [
            {
                "name": p.get("displayName", {}).get("text", "Unknown Place"),
                "address": p.get("formattedAddress", ""),
                "location": p.get("location", {}),
                "rating": p.get("rating", "N/A")
            }
            for p in data.get("places", [])
        ]
            # Step 4: fallback
        if not places:
            print("⚠️ No results in Nearby Search, falling back to Text Search API")
            query = f"restaurants or attractions near {dest}"
            text_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {"query": query, "key": GOOGLE_API_KEY}
            text_res = requests.get(text_url, params=params).json()

            for p in text_res.get("results", []):
                places.append({
                    "name": p.get("name", "Unknown"),
                    "address": p.get("formatted_address", ""),
                    "location": p.get("geometry", {}).get("location", {}),
                    "rating": p.get("rating", "N/A")
                })
        print(f"Returning {len(places)} places near {dest}")

        return {
            "places": places,
            "count": len(places),
            "filters_used": {
            "destinations": destinations,
            "categories": categories,
            "dietaryRestrictions": dietaryRestrictions,
            "budget": budget
            }
        }
       
    except Exception as e:
        print("Error fetching places:", e)
        raise HTTPException(status_code=500, detail=str(e))
        