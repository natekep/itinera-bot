"""
backend/flight.py

Amadeus flight offers proxy. Handles OAuth token acquisition/caching and a
minimal search endpoint. Keep credentials in env vars.
"""

from fastapi import APIRouter, HTTPException, Query
import os
import time
import httpx

router = APIRouter(prefix="/api/flights", tags=["flights"])

AMADEUS_BASE = os.getenv("AMADEUS_BASE", "https://test.api.amadeus.com")
AMADEUS_CLIENT_ID = os.getenv("AMADEUS_CLIENT_ID")
AMADEUS_CLIENT_SECRET = os.getenv("AMADEUS_CLIENT_SECRET")

_token: dict | None = None  # {"access_token": str, "expires_at": float}


async def _get_token() -> str:
    global _token
    now = time.time()
    if _token and _token.get("expires_at", 0) - 30 > now:
        return _token["access_token"]
    if not AMADEUS_CLIENT_ID or not AMADEUS_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Amadeus credentials not configured")

    url = f"{AMADEUS_BASE}/v1/security/oauth2/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": AMADEUS_CLIENT_ID,
        "client_secret": AMADEUS_CLIENT_SECRET,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=data, headers=headers, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Amadeus token error: {resp.text}")
    tok = resp.json()
    access_token = tok.get("access_token")
    expires_in = tok.get("expires_in", 0)
    if not access_token:
        raise HTTPException(status_code=502, detail="Amadeus token missing access_token")
    _token = {"access_token": access_token, "expires_at": now + float(expires_in)}
    return access_token


@router.get("/search")
async def flight_search(
    origin: str = Query(..., min_length=3, max_length=3, description="IATA origin code e.g. SFO"),
    destination: str = Query(..., min_length=3, max_length=3, description="IATA destination code e.g. LAX"),
    departureDate: str = Query(..., description="YYYY-MM-DD"),
    adults: int = Query(1, ge=1, le=9),
):
    token = await _get_token()
    url = f"{AMADEUS_BASE}/v2/shopping/flight-offers"
    params = {
        "originLocationCode": origin.upper(),
        "destinationLocationCode": destination.upper(),
        "departureDate": departureDate,
        "adults": str(adults),
        "currencyCode": "USD",
        "max": "10",
    }
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers=headers, timeout=20)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()

    # Optional: map to a lean shape for the UI
    offers = []
    for item in data.get("data", []):
        price = item.get("price", {}).get("total")
        itineraries = item.get("itineraries", [])
        summary_segments = []
        for itin in itineraries:
            segs = itin.get("segments", [])
            if segs:
                first = segs[0]
                last = segs[-1]
                summary_segments.append({
                    "from": first.get("departure", {}).get("iataCode"),
                    "to": last.get("arrival", {}).get("iataCode"),
                    "duration": itin.get("duration"),
                    "stops": max(0, len(segs) - 1),
                })
        offers.append({
            "id": item.get("id"),
            "price": price,
            "itineraries": summary_segments,
        })

    return {"offers": offers, "raw": data}
