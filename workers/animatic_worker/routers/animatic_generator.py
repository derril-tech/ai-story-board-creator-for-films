from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
import uuid
import asyncio

from animatic_worker.models.animatic_models import (
    AnimaticGenerationRequest,
    AnimaticGenerationResponse,
    AnimaticMetadata,
    AnimaticStatus,
    AnimaticTimeline
)
from animatic_worker.services.animatic_generator_service import AnimaticGeneratorService

router = APIRouter()
animatic_service = AnimaticGeneratorService()

@router.post("/generate", response_model=AnimaticGenerationResponse)
async def generate_animatic(
    request: AnimaticGenerationRequest,
    background_tasks: BackgroundTasks
):
    """Generate an animatic for a scene"""
    try:
        animatic_id = str(uuid.uuid4())
        
        # Start background task
        background_tasks.add_task(
            animatic_service.generate_animatic_async,
            animatic_id,
            request
        )
        
        return AnimaticGenerationResponse(
            animatic_id=animatic_id,
            status=AnimaticStatus.PENDING,
            message="Animatic generation started",
            progress=0.0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{animatic_id}/status", response_model=AnimaticGenerationResponse)
async def get_animatic_status(animatic_id: str):
    """Get the status of an animatic generation"""
    try:
        status = await animatic_service.get_animatic_status(animatic_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail="Animatic not found")

@router.get("/{animatic_id}", response_model=AnimaticMetadata)
async def get_animatic_metadata(animatic_id: str):
    """Get animatic metadata and download URL"""
    try:
        metadata = await animatic_service.get_animatic_metadata(animatic_id)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=404, detail="Animatic not found")

@router.get("/scene/{scene_id}/timeline", response_model=AnimaticTimeline)
async def get_scene_timeline(scene_id: int):
    """Get the timeline data for a scene (frames, captions, audio)"""
    try:
        timeline = await animatic_service.get_scene_timeline(scene_id)
        return timeline
    except Exception as e:
        raise HTTPException(status_code=404, detail="Scene not found")

@router.delete("/{animatic_id}")
async def delete_animatic(animatic_id: str):
    """Delete an animatic"""
    try:
        await animatic_service.delete_animatic(animatic_id)
        return {"message": "Animatic deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Animatic not found")

@router.get("/formats")
async def get_supported_formats():
    """Get supported output formats"""
    return {
        "formats": ["mp4", "mov", "avi"],
        "default": "mp4",
        "recommended": "mp4"
    }

@router.get("/caption-styles")
async def get_caption_styles():
    """Get available caption styles"""
    return {
        "styles": [
            {"id": "none", "name": "No Captions", "description": "No captions displayed"},
            {"id": "simple", "name": "Simple", "description": "Basic scene/shot labels"},
            {"id": "detailed", "name": "Detailed", "description": "Scene/shot labels with timing"},
            {"id": "custom", "name": "Custom", "description": "User-defined captions"}
        ]
    }
