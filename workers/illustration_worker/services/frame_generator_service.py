import asyncio
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import logging

from ..models.frame_models import (
    FrameGenerationRequest,
    FrameGenerationResponse,
    StylePreset,
    FrameStatus,
    BatchFrameRequest,
    BatchFrameResponse,
    FrameStyle,
    ShotSize,
    ShotAngle,
    CameraMovement,
    LensType
)
from ..core.config import settings
from core.telemetry import TelemetryService, telemetry_span
from core.queue import QueueManager, AutoScaler, GPUCacheWarmer

logger = logging.getLogger(__name__)

class FrameGeneratorService:
    def __init__(self):
        self.frame_status = {}  # In-memory storage for frame status
        self.batch_status = {}  # In-memory storage for batch status
        self.style_presets = self._initialize_style_presets()
        self.telemetry = TelemetryService("illustration-worker")
        
        # Initialize queue management
        self.queue_manager = QueueManager(
            nats_url=settings.nats_url,
            service_name="illustration-worker"
        )
        self.auto_scaler = AutoScaler(self.queue_manager, min_workers=1, max_workers=5)
        self.gpu_cache_warmer = GPUCacheWarmer(settings.model_path)
        
        # Start background tasks
        asyncio.create_task(self._initialize_services())
    
    async def _initialize_services(self):
        """Initialize queue and GPU cache"""
        try:
            await self.queue_manager.connect()
            await self.gpu_cache_warmer.warm_cache()
            
            # Subscribe to frame generation queue
            await self.queue_manager.subscribe_to_queue(
                "frame.generation",
                self._process_frame_message,
                queue_group="illustration-workers"
            )
            
            # Start auto-scaling monitoring
            asyncio.create_task(self._monitor_scaling())
            
        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
            self.telemetry.capture_exception(e)
    
    async def _monitor_scaling(self):
        """Monitor and adjust scaling based on queue load"""
        while True:
            try:
                await self.auto_scaler.check_scaling_needs()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Scaling monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def _process_frame_message(self, message):
        """Process frame generation message from queue"""
        try:
            frame_id = message.data.get("frame_id")
            request_data = message.data.get("request")
            
            if not frame_id or not request_data:
                raise ValueError("Invalid message format")
            
            # Convert request data back to FrameGenerationRequest
            request = FrameGenerationRequest(**request_data)
            
            # Generate the frame
            await self.generate_frame_async(frame_id, request)
            
            return {"status": "success", "frame_id": frame_id}
            
        except Exception as e:
            logger.error(f"Error processing frame message: {e}")
            self.telemetry.capture_exception(e, {"message_id": message.id})
            raise
        
    def _initialize_style_presets(self) -> Dict[str, StylePreset]:
        """Initialize available style presets"""
        return {
            FrameStyle.SKETCH: StylePreset(
                name=FrameStyle.SKETCH,
                description="Quick pencil sketch style, perfect for initial concepts",
                base_prompt="pencil sketch, rough drawing, storyboard style, black and white, simple lines",
                negative_prompt="photorealistic, detailed, colored, finished artwork, digital art",
                parameters={
                    "guidance_scale": 7.5,
                    "num_inference_steps": 20,
                    "strength": 0.8
                }
            ),
            FrameStyle.STORYBOARD: StylePreset(
                name=FrameStyle.STORYBOARD,
                description="Classic storyboard style with clear composition and framing",
                base_prompt="storyboard frame, cinematic composition, clear lines, professional storyboard style, film frame",
                negative_prompt="photorealistic, detailed textures, complex lighting, finished artwork",
                parameters={
                    "guidance_scale": 8.0,
                    "num_inference_steps": 25,
                    "strength": 0.85
                }
            ),
            FrameStyle.CONCEPT: StylePreset(
                name=FrameStyle.CONCEPT,
                description="Concept art style with more detail and atmosphere",
                base_prompt="concept art, cinematic lighting, atmospheric, detailed composition, film concept",
                negative_prompt="photorealistic, photographic, overly detailed textures",
                parameters={
                    "guidance_scale": 8.5,
                    "num_inference_steps": 30,
                    "strength": 0.9
                }
            ),
            FrameStyle.REALISTIC: StylePreset(
                name=FrameStyle.REALISTIC,
                description="Photorealistic style for final presentations",
                base_prompt="photorealistic, cinematic photography, film still, professional cinematography",
                negative_prompt="cartoon, anime, illustration, drawing, painting",
                parameters={
                    "guidance_scale": 9.0,
                    "num_inference_steps": 40,
                    "strength": 0.95
                }
            )
        }
    
    def _build_prompt(self, request: FrameGenerationRequest) -> str:
        """Build the final prompt from shot metadata and style"""
        style_preset = self.style_presets[request.style]
        
        # Start with style base prompt
        prompt_parts = [style_preset.base_prompt]
        
        # Add shot composition elements
        shot_metadata = request.shot_metadata
        
        # Shot size
        if "shot_size" in shot_metadata:
            size_prompts = {
                ShotSize.EXTREME_CLOSE_UP: "extreme close up shot",
                ShotSize.CLOSE_UP: "close up shot",
                ShotSize.MEDIUM_CLOSE_UP: "medium close up shot",
                ShotSize.MEDIUM_SHOT: "medium shot",
                ShotSize.MEDIUM_LONG_SHOT: "medium long shot",
                ShotSize.LONG_SHOT: "long shot",
                ShotSize.EXTREME_LONG_SHOT: "extreme long shot"
            }
            prompt_parts.append(size_prompts.get(shot_metadata["shot_size"], "medium shot"))
        
        # Shot angle
        if "shot_angle" in shot_metadata:
            angle_prompts = {
                ShotAngle.EYE_LEVEL: "eye level angle",
                ShotAngle.LOW_ANGLE: "low angle shot",
                ShotAngle.HIGH_ANGLE: "high angle shot",
                ShotAngle.DUTCH_ANGLE: "dutch angle shot",
                ShotAngle.BIRDS_EYE: "birds eye view",
                ShotAngle.WORMS_EYE: "worms eye view"
            }
            prompt_parts.append(angle_prompts.get(shot_metadata["shot_angle"], "eye level angle"))
        
        # Camera movement
        if "camera_movement" in shot_metadata:
            movement_prompts = {
                CameraMovement.STATIC: "static camera",
                CameraMovement.PAN: "panning shot",
                CameraMovement.TILT: "tilting shot",
                CameraMovement.DOLLY: "dolly shot",
                CameraMovement.CRANE: "crane shot",
                CameraMovement.HANDHELD: "handheld camera",
                CameraMovement.STEADICAM: "steadicam shot"
            }
            prompt_parts.append(movement_prompts.get(shot_metadata["camera_movement"], "static camera"))
        
        # Lens type
        if "lens_type" in shot_metadata:
            lens_prompts = {
                LensType.WIDE: "wide angle lens",
                LensType.NORMAL: "normal lens",
                LensType.TELEPHOTO: "telephoto lens",
                LensType.FISHEYE: "fisheye lens",
                LensType.MACRO: "macro lens"
            }
            prompt_parts.append(lens_prompts.get(shot_metadata["lens_type"], "normal lens"))
        
        # Location and setting
        prompt_parts.append(f"location: {request.location}")
        
        # Characters
        if request.characters:
            characters_str = ", ".join(request.characters)
            prompt_parts.append(f"characters: {characters_str}")
        
        # Action description
        prompt_parts.append(f"action: {request.action_description}")
        
        # Dialogue (if present)
        if request.dialogue:
            prompt_parts.append(f"dialogue: {request.dialogue}")
        
        # Custom prompt override
        if request.custom_prompt:
            prompt_parts.append(request.custom_prompt)
        
        return ", ".join(prompt_parts)
    
    def _build_negative_prompt(self, request: FrameGenerationRequest) -> str:
        """Build the negative prompt"""
        style_preset = self.style_presets[request.style]
        base_negative = style_preset.negative_prompt
        
        if request.negative_prompt:
            return f"{base_negative}, {request.negative_prompt}"
        
        return base_negative
    
    @telemetry_span("frame.generate")
    async def generate_frame_async(self, frame_id: str, request: FrameGenerationRequest):
        """Generate a frame asynchronously"""
        try:
            # Update status to generating
            self.frame_status[frame_id] = FrameStatus(
                frame_id=frame_id,
                status="generating",
                progress=0.0,
                estimated_completion=None
            )
            
            # Build prompts
            prompt = self._build_prompt(request)
            negative_prompt = self._build_negative_prompt(request)
            
            # Get style parameters
            style_preset = self.style_presets[request.style]
            
            # Simulate AI generation (replace with actual AI model call)
            await self._simulate_generation(frame_id, prompt, negative_prompt, style_preset.parameters)
            
            # Update status to completed
            self.frame_status[frame_id] = FrameStatus(
                frame_id=frame_id,
                status="completed",
                progress=1.0,
                estimated_completion=datetime.utcnow().isoformat()
            )
            
            logger.info(f"Frame {frame_id} generated successfully")
            
        except Exception as e:
            logger.error(f"Frame generation failed for {frame_id}: {str(e)}")
            self.telemetry.capture_exception(e, {"frame_id": frame_id, "style": request.style})
            self.frame_status[frame_id] = FrameStatus(
                frame_id=frame_id,
                status="failed",
                progress=0.0,
                error_message=str(e)
            )
    
    async def _simulate_generation(self, frame_id: str, prompt: str, negative_prompt: str, parameters: Dict[str, Any]):
        """Simulate AI generation process (replace with actual implementation)"""
        # Simulate generation steps
        steps = parameters.get("num_inference_steps", 25)
        
        for i in range(steps):
            progress = (i + 1) / steps
            self.frame_status[frame_id].progress = progress
            
            # Simulate processing time
            await asyncio.sleep(0.1)
    
    def get_frame_status(self, frame_id: str) -> FrameStatus:
        """Get the status of a frame generation"""
        if frame_id not in self.frame_status:
            raise ValueError(f"Frame {frame_id} not found")
        return self.frame_status[frame_id]
    
    def get_style_presets(self) -> List[StylePreset]:
        """Get available style presets"""
        return list(self.style_presets.values())
    
    async def generate_batch_frames_async(self, batch_id: str, request: BatchFrameRequest):
        """Generate multiple frames in batch"""
        try:
            # Initialize batch status
            self.batch_status[batch_id] = {
                "batch_id": batch_id,
                "total_frames": len(request.shot_ids),
                "completed_frames": 0,
                "failed_frames": 0,
                "frame_ids": [],
                "status": "generating",
                "started_at": datetime.utcnow().isoformat()
            }
            
            # Create frame generation tasks
            tasks = []
            for shot_id in request.shot_ids:
                # Create a mock request for each shot (in real implementation, fetch shot data)
                frame_request = FrameGenerationRequest(
                    shot_id=shot_id,
                    style=request.style,
                    shot_metadata={"shot_size": "medium_shot", "shot_angle": "eye_level"},
                    characters=[],
                    location="Unknown location",
                    action_description="Action description"
                )
                
                frame_id = str(uuid.uuid4())
                self.batch_status[batch_id]["frame_ids"].append(frame_id)
                
                task = self.generate_frame_async(frame_id, frame_request)
                tasks.append(task)
            
            # Execute batch generation
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Update batch status
            self.batch_status[batch_id]["status"] = "completed"
            self.batch_status[batch_id]["completed_at"] = datetime.utcnow().isoformat()
            
        except Exception as e:
            logger.error(f"Batch generation failed for {batch_id}: {str(e)}")
            self.batch_status[batch_id]["status"] = "failed"
            self.batch_status[batch_id]["error_message"] = str(e)
    
    def get_batch_status(self, batch_id: str) -> Dict[str, Any]:
        """Get the status of a batch generation"""
        if batch_id not in self.batch_status:
            raise ValueError(f"Batch {batch_id} not found")
        return self.batch_status[batch_id]
    
    def delete_frame(self, frame_id: str):
        """Delete a generated frame"""
        if frame_id in self.frame_status:
            del self.frame_status[frame_id]
        else:
            raise ValueError(f"Frame {frame_id} not found")
    
    async def regenerate_frame_async(self, original_frame_id: str, new_frame_id: str, request: FrameGenerationRequest):
        """Regenerate a frame with new parameters"""
        # Delete original frame
        if original_frame_id in self.frame_status:
            del self.frame_status[original_frame_id]
        
        # Generate new frame
        await self.generate_frame_async(new_frame_id, request)
