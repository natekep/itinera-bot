from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
from openai import OpenAI  # Changed import
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")
def read_root():
    return {"message": "Itinera API is running"}

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