import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

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

@app.get("/")
def read_root():
    return {"message": "FastAPI backend running!"}


# -------- Onboarding models --------
class AccessibilityNeeds(BaseModel):
    wheelchair_access: Optional[bool] = None
    step_free: Optional[bool] = None
    quiet_spaces: Optional[bool] = None
    service_animal: Optional[bool] = None
    captions: Optional[bool] = None


class UserProfileBase(BaseModel):
    preferred_pace: Optional[str] = None
    travel_style: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    accessibility_needs: Optional[AccessibilityNeeds] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileOut(UserProfileBase):
    id: int


_PROFILES: List[UserProfileOut] = []
_NEXT_ID = 1


@app.post("/onboarding/profiles", response_model=UserProfileOut)
def create_profile(payload: UserProfileCreate):
    global _NEXT_ID
    profile = UserProfileOut(id=_NEXT_ID, **payload.model_dump())
    _PROFILES.append(profile)
    _NEXT_ID += 1
    return profile