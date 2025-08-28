from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from .routers import shot_planner
from .core.config import settings

load_dotenv()

app = FastAPI(
    title="AI Storyboard Shot Worker",
    description="Shot planning and camera metadata generation worker",
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
app.include_router(shot_planner.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "shot-worker"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Storyboard Shot Worker"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
