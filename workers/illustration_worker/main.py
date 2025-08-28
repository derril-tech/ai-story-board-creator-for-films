from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from illustration_worker.routers import frame_generator

app = FastAPI(
    title="Illustration Worker",
    description="AI-powered frame generation for storyboards",
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
app.include_router(frame_generator.router, prefix="/frames", tags=["frames"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "illustration-worker"}
