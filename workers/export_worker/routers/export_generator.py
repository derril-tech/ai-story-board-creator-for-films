from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
import uuid
import asyncio

from export_worker.models.export_models import (
    ExportGenerationRequest,
    ExportGenerationResponse,
    ExportMetadata,
    ExportStatus,
    ExportSummary
)
from export_worker.services.export_generator_service import ExportGeneratorService

router = APIRouter()
export_service = ExportGeneratorService()

@router.post("/generate", response_model=ExportGenerationResponse)
async def generate_export(
    request: ExportGenerationRequest,
    background_tasks: BackgroundTasks
):
    """Generate an export for a project"""
    try:
        export_id = str(uuid.uuid4())
        
        # Start background task
        background_tasks.add_task(
            export_service.generate_export_async,
            export_id,
            request
        )
        
        return ExportGenerationResponse(
            export_id=export_id,
            status=ExportStatus.PENDING,
            message="Export generation started",
            progress=0.0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{export_id}/status", response_model=ExportGenerationResponse)
async def get_export_status(export_id: str):
    """Get the status of an export generation"""
    try:
        status = await export_service.get_export_status(export_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail="Export not found")

@router.get("/{export_id}", response_model=ExportMetadata)
async def get_export_metadata(export_id: str):
    """Get export metadata and download URL"""
    try:
        metadata = await export_service.get_export_metadata(export_id)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=404, detail="Export not found")

@router.get("/project/{project_id}/summary", response_model=ExportSummary)
async def get_project_export_summary(project_id: int):
    """Get export summary for a project"""
    try:
        summary = await export_service.get_project_export_summary(project_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=404, detail="Project not found")

@router.delete("/{export_id}")
async def delete_export(export_id: str):
    """Delete an export"""
    try:
        await export_service.delete_export(export_id)
        return {"message": "Export deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Export not found")

@router.get("/formats")
async def get_supported_formats():
    """Get supported export formats"""
    return {
        "formats": [
            {
                "id": "pdf",
                "name": "PDF Storyboard",
                "description": "Printable storyboard with frames and notes",
                "layouts": ["storyboard", "shot_list", "combined"]
            },
            {
                "id": "csv",
                "name": "CSV Shot List",
                "description": "Spreadsheet format shot list",
                "layouts": []
            },
            {
                "id": "json",
                "name": "JSON Bundle",
                "description": "Complete project data in JSON format",
                "layouts": []
            },
            {
                "id": "mp4",
                "name": "MP4 Animatic",
                "description": "Video animatic with audio",
                "layouts": []
            }
        ]
    }

@router.get("/quality-presets")
async def get_quality_presets():
    """Get available quality presets"""
    return {
        "presets": [
            {"id": "low", "name": "Low Quality", "description": "Fast generation, smaller files"},
            {"id": "medium", "name": "Medium Quality", "description": "Balanced quality and speed"},
            {"id": "high", "name": "High Quality", "description": "Best quality, larger files"}
        ]
    }
