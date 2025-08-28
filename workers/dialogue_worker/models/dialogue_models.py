from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DialogueTiming(BaseModel):
    dialogue_id: str
    character: str
    line: str
    start_time: float  # seconds from scene start
    end_time: float    # seconds from scene start
    duration: float    # duration in seconds
    confidence: Optional[float] = None  # confidence score for audio sync
    syllables: Optional[int] = None
    words_per_minute: Optional[float] = None

class TimingResult(BaseModel):
    scene_id: str
    timings: List[DialogueTiming]
    total_duration: float
    average_words_per_minute: float
    timing_method: str  # 'estimated', 'audio_sync', 'manual'
    created_at: datetime

class SyncRequest(BaseModel):
    scene_id: str
    audio_file_url: str
    confidence_threshold: float = 0.8
    language: str = "en-US"

class TTSRequest(BaseModel):
    scene_id: str
    voice_id: str = "default"
    speaking_rate: float = 1.0
    pitch: float = 0.0

class TTSResult(BaseModel):
    scene_id: str
    audio_url: str
    duration: float
    voice_used: str
    generated_at: datetime

class TimingAnalysis(BaseModel):
    scene_id: str
    total_dialogue_lines: int
    total_duration: float
    average_line_duration: float
    fastest_line_duration: float
    slowest_line_duration: float
    pacing_score: float  # 0-1, higher is better pacing
    suggestions: List[str]
    character_timing_breakdown: Dict[str, Dict[str, float]]
