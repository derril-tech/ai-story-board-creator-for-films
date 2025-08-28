from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid

class AnimaticFormat(str, Enum):
    MP4 = "mp4"
    MOV = "mov"
    AVI = "avi"

class CaptionStyle(str, Enum):
    NONE = "none"
    SIMPLE = "simple"
    DETAILED = "detailed"
    CUSTOM = "custom"

class AudioTrack(str, Enum):
    NONE = "none"
    DIALOGUE_ONLY = "dialogue_only"
    DIALOGUE_MUSIC = "dialogue_music"
    MUSIC_ONLY = "music_only"

class AnimaticGenerationRequest(BaseModel):
    scene_id: int = Field(..., description="Scene ID to generate animatic for")
    format: AnimaticFormat = Field(AnimaticFormat.MP4, description="Output format")
    include_captions: bool = Field(True, description="Include scene/shot captions")
    caption_style: CaptionStyle = Field(CaptionStyle.SIMPLE, description="Caption style")
    audio_track: AudioTrack = Field(AudioTrack.DIALOGUE_ONLY, description="Audio track type")
    custom_music_url: Optional[str] = Field(None, description="Custom music file URL")
    frame_duration: float = Field(3.0, description="Duration per frame in seconds")
    transition_duration: float = Field(0.5, description="Transition duration between frames")
    resolution: str = Field("1920x1080", description="Output resolution")
    frame_rate: int = Field(24, description="Output frame rate")

class AnimaticStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class AnimaticGenerationResponse(BaseModel):
    animatic_id: str = Field(..., description="Unique animatic ID")
    status: AnimaticStatus = Field(..., description="Current status")
    message: Optional[str] = Field(None, description="Status message")
    progress: float = Field(0.0, description="Progress percentage (0-100)")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion time")

class AnimaticMetadata(BaseModel):
    animatic_id: str
    scene_id: int
    duration: float
    frame_count: int
    resolution: str
    frame_rate: int
    file_size: int
    format: str
    created_at: str
    download_url: Optional[str] = None

class FrameTiming(BaseModel):
    frame_id: int
    start_time: float
    end_time: float
    duration: float
    shot_id: int
    shot_number: int

class CaptionData(BaseModel):
    text: str
    start_time: float
    end_time: float
    position: str = "bottom"  # top, bottom, overlay
    style: str = "default"

class AudioSegment(BaseModel):
    dialogue_id: int
    start_time: float
    end_time: float
    audio_url: Optional[str] = None
    text: str

class AnimaticTimeline(BaseModel):
    scene_id: int
    total_duration: float
    frames: List[FrameTiming]
    captions: List[CaptionData]
    audio_segments: List[AudioSegment]
    transitions: List[Dict[str, Any]]
