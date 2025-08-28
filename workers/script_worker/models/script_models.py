from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Dialogue(BaseModel):
    character: str
    line: str
    time_start: Optional[int] = None
    time_end: Optional[int] = None
    estimated_duration: Optional[int] = None
    order_index: int

class Scene(BaseModel):
    slug: str  # e.g., "INT. OFFICE - DAY"
    location: str
    time_of_day: str  # 'DAY', 'NIGHT', 'DAWN', 'DUSK'
    summary: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    estimated_runtime: Optional[int] = None  # in seconds
    order_index: int
    dialogues: List[Dialogue] = []

class ParsedScript(BaseModel):
    title: str
    author: Optional[str] = None
    format: str  # 'fdx', 'fountain', 'pdf'
    page_count: Optional[int] = None
    scenes: List[Scene]
    dialogues: List[Dialogue]
    metadata: Dict[str, Any] = {}

class ScriptParseRequest(BaseModel):
    script_id: str
    format: str
    options: Optional[Dict[str, Any]] = {}

class ScriptParseResponse(BaseModel):
    script_id: str
    status: str  # 'parsing', 'parsed', 'error'
    result: Optional[ParsedScript] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
