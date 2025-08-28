from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class ShotSize(str, Enum):
    EXTREME_CLOSE_UP = "EXTREME_CLOSE_UP"
    CLOSE_UP = "CLOSE_UP"
    MEDIUM_CLOSE_UP = "MEDIUM_CLOSE_UP"
    MEDIUM = "MEDIUM"
    MEDIUM_WIDE = "MEDIUM_WIDE"
    WIDE = "WIDE"
    EXTREME_WIDE = "EXTREME_WIDE"

class ShotAngle(str, Enum):
    EYE_LEVEL = "EYE_LEVEL"
    LOW_ANGLE = "LOW_ANGLE"
    HIGH_ANGLE = "HIGH_ANGLE"
    DUTCH_ANGLE = "DUTCH_ANGLE"
    BIRDS_EYE = "BIRDS_EYE"
    WORMS_EYE = "WORMS_EYE"

class CameraMovement(str, Enum):
    STATIC = "STATIC"
    PAN = "PAN"
    TILT = "TILT"
    DOLLY = "DOLLY"
    TRACK = "TRACK"
    CRANE = "CRANE"
    HANDHELD = "HANDHELD"
    ZOOM = "ZOOM"

class LensType(str, Enum):
    WIDE = "WIDE"
    NORMAL = "NORMAL"
    TELEPHOTO = "TELEPHOTO"
    FISHEYE = "FISHEYE"
    MACRO = "MACRO"

class CameraMetadata(BaseModel):
    size: ShotSize
    angle: ShotAngle
    movement: Optional[CameraMovement] = None
    lens: Optional[LensType] = None
    focal_length: Optional[float] = None
    aperture: Optional[float] = None
    notes: Optional[str] = None

class Shot(BaseModel):
    order_index: int
    description: str
    camera_metadata: CameraMetadata
    estimated_duration: Optional[int] = None  # in seconds
    characters: List[str] = []
    action_notes: Optional[str] = None
    dialogue_notes: Optional[str] = None
    blocking_notes: Optional[str] = None

class ShotPlan(BaseModel):
    scene_id: str
    shots: List[Shot]
    template_used: str
    total_estimated_duration: Optional[int] = None
    metadata: Dict[str, Any] = {}

class SceneAnalysis(BaseModel):
    scene_id: str
    content_type: str  # 'dialogue-heavy', 'action', 'mixed'
    dialogue_percentage: float
    action_percentage: float
    character_count: int
    location_complexity: str  # 'simple', 'moderate', 'complex'
    suggested_template: str
    reasoning: str
