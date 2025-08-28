import asyncio
import os
import tempfile
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from animatic_worker.models.animatic_models import (
    AnimaticGenerationRequest,
    AnimaticGenerationResponse,
    AnimaticMetadata,
    AnimaticStatus,
    AnimaticTimeline,
    FrameTiming,
    CaptionData,
    AudioSegment
)
from animatic_worker.core.config import settings

class AnimaticGeneratorService:
    def __init__(self):
        self.active_generations: Dict[str, Dict[str, Any]] = {}
        self.animatic_metadata: Dict[str, AnimaticMetadata] = {}
        
    async def generate_animatic_async(
        self, 
        animatic_id: str, 
        request: AnimaticGenerationRequest
    ):
        """Generate animatic in background task"""
        try:
            # Update status to processing
            self.active_generations[animatic_id] = {
                "status": AnimaticStatus.PROCESSING,
                "progress": 0.0,
                "message": "Building timeline..."
            }
            
            # Step 1: Build timeline (20%)
            await asyncio.sleep(1)  # Simulate timeline building
            self.active_generations[animatic_id]["progress"] = 20.0
            self.active_generations[animatic_id]["message"] = "Processing frames..."
            
            # Step 2: Process frames (40%)
            await asyncio.sleep(2)  # Simulate frame processing
            self.active_generations[animatic_id]["progress"] = 40.0
            self.active_generations[animatic_id]["message"] = "Generating audio..."
            
            # Step 3: Generate audio (60%)
            await asyncio.sleep(2)  # Simulate audio generation
            self.active_generations[animatic_id]["progress"] = 60.0
            self.active_generations[animatic_id]["message"] = "Adding captions..."
            
            # Step 4: Add captions (80%)
            await asyncio.sleep(1)  # Simulate caption processing
            self.active_generations[animatic_id]["progress"] = 80.0
            self.active_generations[animatic_id]["message"] = "Rendering video..."
            
            # Step 5: Render final video (100%)
            await asyncio.sleep(2)  # Simulate video rendering
            self.active_generations[animatic_id]["progress"] = 100.0
            self.active_generations[animatic_id]["status"] = AnimaticStatus.COMPLETED
            self.active_generations[animatic_id]["message"] = "Animatic completed"
            
            # Create metadata
            metadata = AnimaticMetadata(
                animatic_id=animatic_id,
                scene_id=request.scene_id,
                duration=45.5,  # Mock duration
                frame_count=15,  # Mock frame count
                resolution=request.resolution,
                frame_rate=request.frame_rate,
                file_size=1024000,  # Mock file size (1MB)
                format=request.format.value,
                created_at=datetime.now().isoformat(),
                download_url=f"/downloads/{animatic_id}.{request.format.value}"
            )
            
            self.animatic_metadata[animatic_id] = metadata
            
        except Exception as e:
            self.active_generations[animatic_id] = {
                "status": AnimaticStatus.FAILED,
                "progress": 0.0,
                "message": f"Generation failed: {str(e)}"
            }
    
    async def get_animatic_status(self, animatic_id: str) -> AnimaticGenerationResponse:
        """Get current status of animatic generation"""
        if animatic_id not in self.active_generations:
            raise Exception("Animatic not found")
        
        status_data = self.active_generations[animatic_id]
        
        return AnimaticGenerationResponse(
            animatic_id=animatic_id,
            status=status_data["status"],
            message=status_data["message"],
            progress=status_data["progress"]
        )
    
    async def get_animatic_metadata(self, animatic_id: str) -> AnimaticMetadata:
        """Get animatic metadata"""
        if animatic_id not in self.animatic_metadata:
            raise Exception("Animatic not found")
        
        return self.animatic_metadata[animatic_id]
    
    async def get_scene_timeline(self, scene_id: int) -> AnimaticTimeline:
        """Get timeline data for a scene"""
        # Mock timeline data
        frames = [
            FrameTiming(
                frame_id=1,
                start_time=0.0,
                end_time=3.0,
                duration=3.0,
                shot_id=1,
                shot_number=1
            ),
            FrameTiming(
                frame_id=2,
                start_time=3.5,
                end_time=6.5,
                duration=3.0,
                shot_id=2,
                shot_number=2
            ),
            FrameTiming(
                frame_id=3,
                start_time=7.0,
                end_time=10.0,
                duration=3.0,
                shot_id=3,
                shot_number=3
            )
        ]
        
        captions = [
            CaptionData(
                text="SCENE 1 - INT. OFFICE - DAY",
                start_time=0.0,
                end_time=2.0,
                position="top",
                style="scene_header"
            ),
            CaptionData(
                text="Shot 1: Wide establishing",
                start_time=0.0,
                end_time=3.0,
                position="bottom",
                style="shot_label"
            ),
            CaptionData(
                text="Shot 2: Medium close-up",
                start_time=3.5,
                end_time=6.5,
                position="bottom",
                style="shot_label"
            )
        ]
        
        audio_segments = [
            AudioSegment(
                dialogue_id=1,
                start_time=1.0,
                end_time=2.5,
                text="Hello, how are you today?",
                audio_url="/audio/dialogue_1.mp3"
            ),
            AudioSegment(
                dialogue_id=2,
                start_time=4.0,
                end_time=6.0,
                text="I'm doing well, thank you.",
                audio_url="/audio/dialogue_2.mp3"
            )
        ]
        
        transitions = [
            {
                "type": "fade",
                "start_time": 3.0,
                "end_time": 3.5,
                "duration": 0.5
            },
            {
                "type": "cut",
                "start_time": 6.5,
                "end_time": 7.0,
                "duration": 0.0
            }
        ]
        
        return AnimaticTimeline(
            scene_id=scene_id,
            total_duration=10.0,
            frames=frames,
            captions=captions,
            audio_segments=audio_segments,
            transitions=transitions
        )
    
    async def delete_animatic(self, animatic_id: str):
        """Delete an animatic"""
        if animatic_id in self.active_generations:
            del self.active_generations[animatic_id]
        
        if animatic_id in self.animatic_metadata:
            del self.animatic_metadata[animatic_id]
    
    def _build_caption_text(self, scene_data: Dict, shot_data: Dict, style: str) -> str:
        """Build caption text based on style"""
        if style == "simple":
            return f"Shot {shot_data.get('shot_number', 'N/A')}"
        elif style == "detailed":
            return f"Shot {shot_data.get('shot_number', 'N/A')} - {shot_data.get('description', '')}"
        else:
            return ""
    
    def _calculate_frame_timing(self, dialogue_timings: List[Dict], frame_duration: float) -> List[FrameTiming]:
        """Calculate frame timing based on dialogue and frame duration"""
        frames = []
        current_time = 0.0
        
        for i, dialogue in enumerate(dialogue_timings):
            # Add frame for this dialogue segment
            frame = FrameTiming(
                frame_id=i + 1,
                start_time=current_time,
                end_time=current_time + frame_duration,
                duration=frame_duration,
                shot_id=dialogue.get('shot_id', i + 1),
                shot_number=i + 1
            )
            frames.append(frame)
            
            # Add transition time
            current_time += frame_duration + 0.5  # 0.5s transition
        
        return frames
