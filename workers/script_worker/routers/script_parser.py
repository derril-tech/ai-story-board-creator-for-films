from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from ..services.script_parser_service import ScriptParserService
from ..models.script_models import ParsedScript, Scene, Dialogue

router = APIRouter(prefix="/scripts", tags=["script-parser"])

class ParseScriptRequest(BaseModel):
    script_id: str
    format: str  # 'fdx', 'fountain', 'pdf'

class ParseScriptResponse(BaseModel):
    script_id: str
    status: str
    scenes: List[Scene]
    dialogues: List[Dialogue]
    error_message: Optional[str] = None

@router.post("/parse", response_model=ParseScriptResponse)
async def parse_script(request: ParseScriptRequest):
    """
    Parse a script file and extract scenes and dialogues
    """
    try:
        parser_service = ScriptParserService()
        
        # Parse the script based on format
        if request.format == "fdx":
            result = await parser_service.parse_fdx(request.script_id)
        elif request.format == "fountain":
            result = await parser_service.parse_fountain(request.script_id)
        elif request.format == "pdf":
            result = await parser_service.parse_pdf(request.script_id)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
        
        return ParseScriptResponse(
            script_id=request.script_id,
            status="parsed",
            scenes=result.scenes,
            dialogues=result.dialogues
        )
        
    except Exception as e:
        return ParseScriptResponse(
            script_id=request.script_id,
            status="error",
            scenes=[],
            dialogues=[],
            error_message=str(e)
        )

@router.get("/{script_id}/status")
async def get_parse_status(script_id: str):
    """
    Get the parsing status of a script
    """
    try:
        parser_service = ScriptParserService()
        status = await parser_service.get_parse_status(script_id)
        return {"script_id": script_id, "status": status}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/upload")
async def upload_script(file: UploadFile = File(...)):
    """
    Upload a script file for parsing
    """
    try:
        parser_service = ScriptParserService()
        script_id = await parser_service.upload_script(file)
        return {"script_id": script_id, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
