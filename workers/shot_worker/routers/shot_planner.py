from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio

from ..services.shot_planner_service import ShotPlannerService
from ..models.shot_models import ShotPlan, Shot, CameraMetadata

router = APIRouter(prefix="/shots", tags=["shot-planner"])

class GenerateShotsRequest(BaseModel):
    scene_id: str
    template: str = "dialogue-heavy"  # 'dialogue-heavy', 'action', 'montage'
    options: Optional[Dict[str, Any]] = {}

class GenerateShotsResponse(BaseModel):
    scene_id: str
    shots: List[Shot]
    template_used: str
    metadata: Dict[str, Any]

@router.post("/generate", response_model=GenerateShotsResponse)
async def generate_shots(request: GenerateShotsRequest):
    """
    Generate shot list for a scene based on template and content analysis
    """
    try:
        planner_service = ShotPlannerService()
        
        # Generate shots based on template
        shot_plan = await planner_service.generate_shots(
            scene_id=request.scene_id,
            template=request.template,
            options=request.options
        )
        
        return GenerateShotsResponse(
            scene_id=request.scene_id,
            shots=shot_plan.shots,
            template_used=request.template,
            metadata=shot_plan.metadata
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def get_shot_templates():
    """
    Get available shot planning templates
    """
    templates = [
        {
            "id": "dialogue-heavy",
            "name": "Dialogue Heavy",
            "description": "Optimized for scenes with extensive dialogue",
            "characteristics": ["Close-ups", "Medium shots", "Over-the-shoulder", "Two-shots"]
        },
        {
            "id": "action",
            "name": "Action",
            "description": "Designed for dynamic action sequences",
            "characteristics": ["Wide shots", "Tracking shots", "High angles", "Low angles"]
        },
        {
            "id": "montage",
            "name": "Montage",
            "description": "Quick cuts and rapid transitions",
            "characteristics": ["Extreme close-ups", "Quick cuts", "Varied angles", "Short durations"]
        }
    ]
    
    return {"templates": templates}

@router.get("/{scene_id}/analysis")
async def analyze_scene_for_shots(scene_id: str):
    """
    Analyze scene content to suggest optimal shot planning approach
    """
    try:
        planner_service = ShotPlannerService()
        analysis = await planner_service.analyze_scene(scene_id)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
