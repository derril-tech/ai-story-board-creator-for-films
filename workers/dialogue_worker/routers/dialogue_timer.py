from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio

from ..services.dialogue_timer_service import DialogueTimerService
from ..models.dialogue_models import DialogueTiming, TimingResult, SyncRequest

router = APIRouter(prefix="/dialogues", tags=["dialogue-timer"])

class EstimateTimingRequest(BaseModel):
    scene_id: str
    speaking_rate: float = 2.5  # words per second
    pause_duration: float = 0.5  # seconds between lines

class EstimateTimingResponse(BaseModel):
    scene_id: str
    timings: List[DialogueTiming]
    total_duration: float
    speaking_rate_used: float

class SyncWithAudioRequest(BaseModel):
    scene_id: str
    audio_file_url: str
    confidence_threshold: float = 0.8

@router.post("/estimate-timing", response_model=EstimateTimingResponse)
async def estimate_dialogue_timing(request: EstimateTimingRequest):
    """
    Estimate timing for dialogue lines based on syllable count and speaking rate
    """
    try:
        timer_service = DialogueTimerService()
        
        timings = await timer_service.estimate_timing(
            scene_id=request.scene_id,
            speaking_rate=request.speaking_rate,
            pause_duration=request.pause_duration
        )
        
        total_duration = sum(timing.duration for timing in timings)
        
        return EstimateTimingResponse(
            scene_id=request.scene_id,
            timings=timings,
            total_duration=total_duration,
            speaking_rate_used=request.speaking_rate
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-with-audio")
async def sync_with_audio(request: SyncWithAudioRequest):
    """
    Synchronize dialogue timing with audio file using speech recognition
    """
    try:
        timer_service = DialogueTimerService()
        
        result = await timer_service.sync_with_audio(
            scene_id=request.scene_id,
            audio_file_url=request.audio_file_url,
            confidence_threshold=request.confidence_threshold
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload audio file for dialogue synchronization
    """
    try:
        timer_service = DialogueTimerService()
        
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Upload and process audio
        result = await timer_service.upload_audio(file)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{scene_id}/timing-analysis")
async def analyze_timing(scene_id: str):
    """
    Analyze dialogue timing patterns and suggest optimizations
    """
    try:
        timer_service = DialogueTimerService()
        analysis = await timer_service.analyze_timing(scene_id)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/generate-tts")
async def generate_tts(scene_id: str, voice_id: str = "default"):
    """
    Generate TTS audio for dialogue lines
    """
    try:
        timer_service = DialogueTimerService()
        result = await timer_service.generate_tts(scene_id, voice_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
