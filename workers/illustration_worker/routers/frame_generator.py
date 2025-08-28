from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import uuid
from datetime import datetime

from ..models.frame_models import (
    FrameGenerationRequest,
    FrameGenerationResponse,
    StylePreset,
    FrameStatus,
    BatchFrameRequest,
    BatchFrameResponse,
    FrameStyle
)
from ..services.frame_generator_service import FrameGeneratorService
from ..core.config import settings

router = APIRouter()
frame_service = FrameGeneratorService()

@router.post("/generate", response_model=FrameGenerationResponse)
async def generate_frame(request: FrameGenerationRequest):
    """Generate a single frame for a shot"""
    try:
        frame_id = str(uuid.uuid4())
        
        # Start frame generation in background
        frame_service.generate_frame_async(frame_id, request)
        
        return FrameGenerationResponse(
            frame_id=frame_id,
            image_url="",  # Will be populated when generation completes
            prompt_used="",  # Will be populated when generation completes
            metadata={
                "shot_id": request.shot_id,
                "style": request.style,
                "created_at": datetime.utcnow().isoformat(),
                "status": "generating"
            },
            status="generating"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame generation failed: {str(e)}")

@router.get("/{frame_id}/status", response_model=FrameStatus)
async def get_frame_status(frame_id: str):
    """Get the status of a frame generation"""
    try:
        status = frame_service.get_frame_status(frame_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Frame not found: {str(e)}")

@router.get("/styles", response_model=List[StylePreset])
async def get_style_presets():
    """Get available style presets"""
    return frame_service.get_style_presets()

@router.get("/queue/stats")
async def get_queue_stats():
    """Get queue statistics"""
    return await frame_service.queue_manager.get_queue_stats()

@router.post("/queue/dlq/{message_id}/republish")
async def republish_dlq_message(message_id: str):
    """Republish a message from DLQ"""
    await frame_service.queue_manager.republish_dlq_message(message_id, "frame.generation")
    return {"status": "republished", "message_id": message_id}

@router.post("/batch", response_model=BatchFrameResponse)
async def generate_batch_frames(request: BatchFrameRequest):
    """Generate multiple frames in batch"""
    try:
        batch_id = str(uuid.uuid4())
        
        # Start batch generation in background
        frame_service.generate_batch_frames_async(batch_id, request)
        
        return BatchFrameResponse(
            batch_id=batch_id,
            total_frames=len(request.shot_ids),
            status="generating",
            frame_ids=[]  # Will be populated as frames are created
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch generation failed: {str(e)}")

@router.get("/batch/{batch_id}/status")
async def get_batch_status(batch_id: str):
    """Get the status of a batch generation"""
    try:
        status = frame_service.get_batch_status(batch_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Batch not found: {str(e)}")

@router.delete("/{frame_id}")
async def delete_frame(frame_id: str):
    """Delete a generated frame"""
    try:
        frame_service.delete_frame(frame_id)
        return {"message": "Frame deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Frame not found: {str(e)}")

@router.post("/{frame_id}/regenerate", response_model=FrameGenerationResponse)
async def regenerate_frame(frame_id: str, request: FrameGenerationRequest):
    """Regenerate a frame with new parameters"""
    try:
        new_frame_id = str(uuid.uuid4())
        
        # Start regeneration in background
        frame_service.regenerate_frame_async(frame_id, new_frame_id, request)
        
        return FrameGenerationResponse(
            frame_id=new_frame_id,
            image_url="",
            prompt_used="",
            metadata={
                "original_frame_id": frame_id,
                "shot_id": request.shot_id,
                "style": request.style,
                "created_at": datetime.utcnow().isoformat(),
                "status": "generating"
            },
            status="generating"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame regeneration failed: {str(e)}")
