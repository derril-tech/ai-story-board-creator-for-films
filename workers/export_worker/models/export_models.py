from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid

class ExportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    JSON = "json"
    MP4 = "mp4"

class PDFLayout(str, Enum):
    STORYBOARD = "storyboard"
    SHOT_LIST = "shot_list"
    COMBINED = "combined"

class ExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ExportGenerationRequest(BaseModel):
    project_id: int = Field(..., description="Project ID to export")
    format: ExportFormat = Field(..., description="Export format")
    include_frames: bool = Field(True, description="Include frame images")
    include_metadata: bool = Field(True, description="Include shot/dialogue metadata")
    layout: Optional[PDFLayout] = Field(PDFLayout.STORYBOARD, description="PDF layout (for PDF exports)")
    quality: str = Field("high", description="Export quality")
    custom_options: Optional[Dict[str, Any]] = Field(None, description="Format-specific options")

class ExportGenerationResponse(BaseModel):
    export_id: str = Field(..., description="Unique export ID")
    status: ExportStatus = Field(..., description="Current status")
    message: Optional[str] = Field(None, description="Status message")
    progress: float = Field(0.0, description="Progress percentage (0-100)")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion time")

class ExportMetadata(BaseModel):
    export_id: str
    project_id: int
    format: str
    file_size: int
    created_at: str
    download_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PDFPageData(BaseModel):
    page_number: int
    scene_id: int
    scene_title: str
    shots: List[Dict[str, Any]]
    frames: List[Dict[str, Any]]
    notes: Optional[str] = None

class ShotListRow(BaseModel):
    scene_number: int
    shot_number: int
    shot_type: str
    description: str
    duration: float
    dialogue: Optional[str] = None
    notes: Optional[str] = None

class ExportSummary(BaseModel):
    project_id: int
    project_title: str
    scene_count: int
    shot_count: int
    frame_count: int
    total_duration: float
    export_formats: List[str]
    created_at: str
