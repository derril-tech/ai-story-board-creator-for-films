import asyncio
import logging
from typing import List, Optional
from fastapi import UploadFile
import uuid

from ..models.script_models import ParsedScript, Scene, Dialogue
from ..parsers.fdx_parser import FDXParser
from ..parsers.fountain_parser import FountainParser
from ..parsers.pdf_parser import PDFParser
from ..core.storage import StorageService
from core.telemetry import TelemetryService, telemetry_span

logger = logging.getLogger(__name__)

class ScriptParserService:
    def __init__(self):
        self.fdx_parser = FDXParser()
        self.fountain_parser = FountainParser()
        self.pdf_parser = PDFParser()
        self.storage_service = StorageService()
        self.telemetry = TelemetryService("script-worker")

    @telemetry_span("script.upload")
    async def upload_script(self, file: UploadFile) -> str:
        """
        Upload a script file to storage and return script ID
        """
        script_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1].lower()
        
        # Determine format from file extension
        format_mapping = {
            'fdx': 'fdx',
            'fountain': 'fountain',
            'pdf': 'pdf'
        }
        
        script_format = format_mapping.get(file_extension, 'pdf')
        
        # Upload to storage
        s3_key = f"scripts/{script_id}/{file.filename}"
        await self.storage_service.upload_file(file, s3_key)
        
        # Store script metadata in database
        # This would typically be done through a database service
        logger.info(f"Uploaded script {script_id} with format {script_format}")
        
        return script_id

    @telemetry_span("script.parse.fdx")
    async def parse_fdx(self, script_id: str) -> ParsedScript:
        """
        Parse FDX (Final Draft) format script
        """
        try:
            # Get script file from storage
            script_content = await self.storage_service.get_script_content(script_id)
            
            # Parse using FDX parser
            parsed_data = await self.fdx_parser.parse(script_content)
            
            return ParsedScript(
                title=parsed_data.get('title', 'Untitled'),
                author=parsed_data.get('author'),
                format='fdx',
                page_count=parsed_data.get('page_count'),
                scenes=parsed_data.get('scenes', []),
                dialogues=parsed_data.get('dialogues', []),
                metadata=parsed_data.get('metadata', {})
            )
            
        except Exception as e:
            logger.error(f"Error parsing FDX script {script_id}: {str(e)}")
            self.telemetry.capture_exception(e, {"script_id": script_id, "format": "fdx"})
            raise

    async def parse_fountain(self, script_id: str) -> ParsedScript:
        """
        Parse Fountain format script
        """
        try:
            # Get script file from storage
            script_content = await self.storage_service.get_script_content(script_id)
            
            # Parse using Fountain parser
            parsed_data = await self.fountain_parser.parse(script_content)
            
            return ParsedScript(
                title=parsed_data.get('title', 'Untitled'),
                author=parsed_data.get('author'),
                format='fountain',
                page_count=parsed_data.get('page_count'),
                scenes=parsed_data.get('scenes', []),
                dialogues=parsed_data.get('dialogues', []),
                metadata=parsed_data.get('metadata', {})
            )
            
        except Exception as e:
            logger.error(f"Error parsing Fountain script {script_id}: {str(e)}")
            raise

    async def parse_pdf(self, script_id: str) -> ParsedScript:
        """
        Parse PDF format script
        """
        try:
            # Get script file from storage
            script_content = await self.storage_service.get_script_content(script_id)
            
            # Parse using PDF parser
            parsed_data = await self.pdf_parser.parse(script_content)
            
            return ParsedScript(
                title=parsed_data.get('title', 'Untitled'),
                author=parsed_data.get('author'),
                format='pdf',
                page_count=parsed_data.get('page_count'),
                scenes=parsed_data.get('scenes', []),
                dialogues=parsed_data.get('dialogues', []),
                metadata=parsed_data.get('metadata', {})
            )
            
        except Exception as e:
            logger.error(f"Error parsing PDF script {script_id}: {str(e)}")
            raise

    async def get_parse_status(self, script_id: str) -> str:
        """
        Get the parsing status of a script
        """
        # This would typically query the database
        # For now, return a default status
        return "parsed"
