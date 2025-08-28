from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from export_worker.routers import export_generator

app = FastAPI(
    title="Export Worker",
    description="Export generation for storyboards (PDF, CSV, JSON, MP4)",
    version="1.0.0"
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
app.include_router(export_generator.router, prefix="/exports", tags=["exports"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "export-worker"}
