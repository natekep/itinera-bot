"""
backend/hotel.py

Hotelbeds proxy endpoints (search and booking).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time
import hashlib
import httpx
import os

router = APIRouter(prefix="/api/hotels", tags=["hotels"])

# === Hotel API credentials / config ===
HB_API_KEY = "b8ab5e067b9425de9f1deb95210019ea"
HB_SECRET = "64fa3a0c57"
HB_BASE = "https://api.test.hotelbeds.com/hotel-api/1.0"

def make_signature():
    """Compute X-Signature and timestamp for Hotelbeds authentication."""
    if not HB_API_KEY or not HB_SECRET:
        # Credentials missing; raise a 503 so callers know configuration is required
        raise HTTPException(status_code=503, detail="Hotelbeds credentials not configured")
    ts = str(int(time.time()))
    msg = HB_API_KEY + HB_SECRET + ts
    sig = hashlib.sha256(msg.encode("utf-8")).hexdigest()
    return sig, ts

# === Pydantic models for requests / responses ===

class HotelSearchReq(BaseModel):
    destination: str
    checkin: str
    checkout: str
    adults: int
    children: Optional[int] = 0

class RateOffer(BaseModel):
    rateKey: str
    net: float
    sellingRate: Optional[float] = None

class HotelOffer(BaseModel):
    hotel_code: int
    name: str
    rates: List[RateOffer]

class HotelSearchRes(BaseModel):
    offers: List[HotelOffer]

class HotelBookingReq(BaseModel):
    hotel_code: int
    rateKey: str
    checkin: str
    checkout: str
    holder_name: str
    holder_email: str

class HotelBookingRes(BaseModel):
    booking_id: str
    status: str
    confirmation: dict

# === Endpoints ===

@router.post("/searchHotels", response_model=HotelSearchRes)
async def hotel_search(req: HotelSearchReq):
    sig, ts = make_signature()
    headers = {
        "Api-key": HB_API_KEY,
        "X-Signature": sig,
        "X-Signature-Date": ts,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    body = {
        "stay": {
            "checkIn": req.checkin,
            "checkOut": req.checkout
        },
        "occupancies": [
            {
                "rooms": 1,
                "adults": req.adults,
                "children": req.children
            }
        ],
        "destination": {
            "name": req.destination
        }
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{HB_BASE}/hotels", json=body, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Hotel search failed: {resp.text}")
    data = resp.json()

    offers: List[HotelOffer] = []
    for h in data.get("hotels", {}).get("hotels", []):
        rates = []
        for room in h.get("rooms", []):
            for rate in room.get("rates", []):
                rates.append(RateOffer(
                    rateKey=rate["rateKey"],
                    net=float(rate.get("net", 0)),
                    sellingRate=float(rate.get("sellingRate", 0)) if rate.get("sellingRate") else None
                ))
        offers.append(HotelOffer(
            hotel_code=h["code"],
            name=h["name"],
            rates=rates
        ))

    return HotelSearchRes(offers=offers)


@router.post("/bookHotel", response_model=HotelBookingRes)
async def hotel_book(req: HotelBookingReq):
    sig, ts = make_signature()
    headers = {
        "Api-key": HB_API_KEY,
        "X-Signature": sig,
        "X-Signature-Date": ts,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    body = {
        "holder": {
            "name": req.holder_name,
            "surname": "",  # or split names if needed
            "email": req.holder_email
        },
        "rooms": [
            {
                "rateKey": req.rateKey
            }
        ]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{HB_BASE}/bookings", json=body, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Booking failed: {resp.text}")
    booking = resp.json()

    # Extract booking info (fields depend on API)
    booking_id = booking.get("booking", {}).get("reference", "")
    status = booking.get("booking", {}).get("status", "")

    return HotelBookingRes(
        booking_id=booking_id,
        status=status,
        confirmation=booking
    )
