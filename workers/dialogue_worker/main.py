from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from .routers import dialogue_timer
from .core.config import settings

load_dotenv()

app = FastAPI(
    title="AI Storyboard Dialogue Worker",
    description="Dialogue timing and synchronization worker",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dialogue_timer.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "dialogue-worker"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Storyboard Dialogue Worker"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8002)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
