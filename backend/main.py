import os
import time
import requests
import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS: allows frontend React app to call FastAPI backend
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 Load Google API Key (set in your environment)
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

@app.get("/")
def read_root():
    return {"message": "Itinera FastAPI backend running!"}


# ✅ 1. Geocode API — convert address → lat/lng
@app.get("/geocode")
def geocode(address: str):
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
    res = requests.get(url)
    return res.json()


# ✅ 2. Routes API — get optimized directions between points
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


# ✅ 3. Places API — find nearby attractions
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


# ✅ 4. Distance Matrix API — total travel time/distance
@app.get("/distance")
def distance(origins: str, destinations: str):
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origins}&destinations={destinations}&key={GOOGLE_API_KEY}"
    res = requests.get(url)
    return res.json()


# ✅ 5. Time Zone API — get local time from coordinates
@app.get("/timezone")
def timezone(lat: float, lng: float):
    timestamp = int(time.time())
    url = f"https://maps.googleapis.com/maps/api/timezone/json?location={lat},{lng}&timestamp={timestamp}&key={GOOGLE_API_KEY}"
    res = requests.get(url)
    return res.json()


# ✅ Optional multi-stop route (advanced)
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
