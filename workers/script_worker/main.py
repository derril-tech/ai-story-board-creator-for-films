from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from .routers import script_parser
from .core.config import settings
from core.telemetry import TelemetryService

load_dotenv()

# Initialize telemetry
telemetry = TelemetryService("script-worker", os.getenv("ENVIRONMENT", "development"))

app = FastAPI(
    title="AI Storyboard Script Worker",
    description="Script parsing and analysis worker",
    version="1.0.0",
)

# Instrument FastAPI with telemetry
telemetry.instrument_fastapi(app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(script_parser.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "script-worker"}

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=telemetry.get_metrics(), media_type="text/plain")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Storyboard Script Worker"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
