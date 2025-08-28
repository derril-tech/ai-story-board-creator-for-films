from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class FrameStyle(str, Enum):
    SKETCH = "sketch"
    STORYBOARD = "storyboard"
    CONCEPT = "concept"
    REALISTIC = "realistic"

class ShotSize(str, Enum):
    EXTREME_CLOSE_UP = "extreme_close_up"
    CLOSE_UP = "close_up"
    MEDIUM_CLOSE_UP = "medium_close_up"
    MEDIUM_SHOT = "medium_shot"
    MEDIUM_LONG_SHOT = "medium_long_shot"
    LONG_SHOT = "long_shot"
    EXTREME_LONG_SHOT = "extreme_long_shot"

class ShotAngle(str, Enum):
    EYE_LEVEL = "eye_level"
    LOW_ANGLE = "low_angle"
    HIGH_ANGLE = "high_angle"
    DUTCH_ANGLE = "dutch_angle"
    BIRDS_EYE = "birds_eye"
    WORMS_EYE = "worms_eye"

class CameraMovement(str, Enum):
    STATIC = "static"
    PAN = "pan"
    TILT = "tilt"
    DOLLY = "dolly"
    CRANE = "crane"
    HANDHELD = "handheld"
    STEADICAM = "steadicam"

class LensType(str, Enum):
    WIDE = "wide"
    NORMAL = "normal"
    TELEPHOTO = "telephoto"
    FISHEYE = "fisheye"
    MACRO = "macro"

class FrameGenerationRequest(BaseModel):
    shot_id: str = Field(..., description="ID of the shot to generate frame for")
    style: FrameStyle = Field(FrameStyle.STORYBOARD, description="Artistic style for the frame")
    shot_metadata: Dict[str, Any] = Field(..., description="Shot metadata including size, angle, movement, lens")
    characters: List[str] = Field(default=[], description="Characters in the shot")
    location: str = Field(..., description="Location/setting of the shot")
    action_description: str = Field(..., description="Description of the action in the shot")
    dialogue: Optional[str] = Field(None, description="Dialogue in the shot")
    custom_prompt: Optional[str] = Field(None, description="Custom prompt override")
    negative_prompt: Optional[str] = Field(None, description="Negative prompt to avoid certain elements")
    seed: Optional[int] = Field(None, description="Random seed for reproducible generation")

class FrameGenerationResponse(BaseModel):
    frame_id: str = Field(..., description="Generated frame ID")
    image_url: str = Field(..., description="Signed URL to the generated frame image")
    prompt_used: str = Field(..., description="Final prompt used for generation")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")
    status: str = Field(..., description="Generation status")

class StylePreset(BaseModel):
    name: FrameStyle = Field(..., description="Style name")
    description: str = Field(..., description="Style description")
    base_prompt: str = Field(..., description="Base prompt for this style")
    negative_prompt: str = Field(..., description="Default negative prompt")
    parameters: Dict[str, Any] = Field(..., description="Style-specific parameters")

class FrameStatus(BaseModel):
    frame_id: str = Field(..., description="Frame ID")
    status: str = Field(..., description="Current status")
    progress: Optional[float] = Field(None, description="Generation progress (0-1)")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion time")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class BatchFrameRequest(BaseModel):
    shot_ids: List[str] = Field(..., description="List of shot IDs to generate frames for")
    style: FrameStyle = Field(FrameStyle.STORYBOARD, description="Artistic style for all frames")
    batch_size: int = Field(5, description="Number of frames to generate in parallel")

class BatchFrameResponse(BaseModel):
    batch_id: str = Field(..., description="Batch generation ID")
    total_frames: int = Field(..., description="Total number of frames in batch")
    status: str = Field(..., description="Batch status")
    frame_ids: List[str] = Field(..., description="List of frame IDs in the batch")
