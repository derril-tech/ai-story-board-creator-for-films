import asyncio
import logging
from typing import List, Optional, Dict, Any
import random

from ..models.shot_models import ShotPlan, Shot, CameraMetadata, SceneAnalysis, ShotSize, ShotAngle, CameraMovement, LensType

logger = logging.getLogger(__name__)

class ShotPlannerService:
    def __init__(self):
        self.templates = {
            "dialogue-heavy": self._dialogue_heavy_template,
            "action": self._action_template,
            "montage": self._montage_template
        }

    async def generate_shots(self, scene_id: str, template: str, options: Dict[str, Any] = {}) -> ShotPlan:
        """
        Generate shot list for a scene based on template
        """
        try:
            # Get scene data (this would typically come from database)
            scene_data = await self._get_scene_data(scene_id)
            
            # Use template to generate shots
            if template not in self.templates:
                raise ValueError(f"Unknown template: {template}")
            
            shots = await self.templates[template](scene_data, options)
            
            # Calculate total duration
            total_duration = sum(shot.estimated_duration or 0 for shot in shots)
            
            return ShotPlan(
                scene_id=scene_id,
                shots=shots,
                template_used=template,
                total_estimated_duration=total_duration,
                metadata={
                    "scene_summary": scene_data.get("summary", ""),
                    "character_count": len(scene_data.get("characters", [])),
                    "dialogue_count": len(scene_data.get("dialogues", []))
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating shots for scene {scene_id}: {str(e)}")
            raise

    async def analyze_scene(self, scene_id: str) -> SceneAnalysis:
        """
        Analyze scene content to suggest optimal shot planning approach
        """
        try:
            scene_data = await self._get_scene_data(scene_id)
            
            # Analyze content
            dialogues = scene_data.get("dialogues", [])
            actions = scene_data.get("actions", [])
            characters = scene_data.get("characters", [])
            
            total_content = len(dialogues) + len(actions)
            dialogue_percentage = len(dialogues) / total_content if total_content > 0 else 0
            action_percentage = len(actions) / total_content if total_content > 0 else 0
            
            # Determine content type
            if dialogue_percentage > 0.7:
                content_type = "dialogue-heavy"
                suggested_template = "dialogue-heavy"
            elif action_percentage > 0.7:
                content_type = "action"
                suggested_template = "action"
            else:
                content_type = "mixed"
                suggested_template = "dialogue-heavy"  # Default for mixed
            
            # Assess location complexity
            location = scene_data.get("location", "")
            location_complexity = self._assess_location_complexity(location)
            
            return SceneAnalysis(
                scene_id=scene_id,
                content_type=content_type,
                dialogue_percentage=dialogue_percentage,
                action_percentage=action_percentage,
                character_count=len(characters),
                location_complexity=location_complexity,
                suggested_template=suggested_template,
                reasoning=f"Scene contains {len(dialogues)} dialogue lines and {len(actions)} action beats"
            )
            
        except Exception as e:
            logger.error(f"Error analyzing scene {scene_id}: {str(e)}")
            raise

    async def _dialogue_heavy_template(self, scene_data: Dict[str, Any], options: Dict[str, Any]) -> List[Shot]:
        """
        Generate shots optimized for dialogue-heavy scenes
        """
        shots = []
        dialogues = scene_data.get("dialogues", [])
        characters = scene_data.get("characters", [])
        
        # Establish shot
        shots.append(Shot(
            order_index=1,
            description="Establishing shot of the location",
            camera_metadata=CameraMetadata(
                size=ShotSize.WIDE,
                angle=ShotAngle.EYE_LEVEL,
                movement=CameraMovement.STATIC,
                lens=LensType.WIDE,
                notes="Establish the setting and character positions"
            ),
            estimated_duration=3,
            characters=characters
        ))
        
        # Dialogue coverage shots
        for i, dialogue in enumerate(dialogues):
            speaker = dialogue.get("character", "")
            
            # Close-up of speaker
            shots.append(Shot(
                order_index=len(shots) + 1,
                description=f"Close-up of {speaker} speaking",
                camera_metadata=CameraMetadata(
                    size=ShotSize.CLOSE_UP,
                    angle=ShotAngle.EYE_LEVEL,
                    movement=CameraMovement.STATIC,
                    lens=LensType.NORMAL,
                    notes=f"Focus on {speaker}'s delivery"
                ),
                estimated_duration=self._estimate_dialogue_duration(dialogue.get("line", "")),
                characters=[speaker],
                dialogue_notes=dialogue.get("line", "")
            ))
            
            # Reaction shot (if multiple characters)
            if len(characters) > 1:
                other_characters = [c for c in characters if c != speaker]
                if other_characters:
                    shots.append(Shot(
                        order_index=len(shots) + 1,
                        description=f"Reaction shot of {', '.join(other_characters)}",
                        camera_metadata=CameraMetadata(
                            size=ShotSize.MEDIUM_CLOSE_UP,
                            angle=ShotAngle.EYE_LEVEL,
                            movement=CameraMovement.STATIC,
                            lens=LensType.NORMAL,
                            notes="Capture reactions to dialogue"
                        ),
                        estimated_duration=2,
                        characters=other_characters
                    ))
        
        return shots

    async def _action_template(self, scene_data: Dict[str, Any], options: Dict[str, Any]) -> List[Shot]:
        """
        Generate shots optimized for action scenes
        """
        shots = []
        actions = scene_data.get("actions", [])
        characters = scene_data.get("characters", [])
        
        # Wide establishing shot
        shots.append(Shot(
            order_index=1,
            description="Wide establishing shot of action location",
            camera_metadata=CameraMetadata(
                size=ShotSize.EXTREME_WIDE,
                angle=ShotAngle.EYE_LEVEL,
                movement=CameraMovement.STATIC,
                lens=LensType.WIDE,
                notes="Establish the action space"
            ),
            estimated_duration=2,
            characters=characters
        ))
        
        # Action coverage
        for i, action in enumerate(actions):
            # Wide action shot
            shots.append(Shot(
                order_index=len(shots) + 1,
                description=f"Action shot: {action.get('description', 'Action sequence')}",
                camera_metadata=CameraMetadata(
                    size=ShotSize.WIDE,
                    angle=ShotAngle.EYE_LEVEL,
                    movement=CameraMovement.TRACK,
                    lens=LensType.WIDE,
                    notes="Follow the action"
                ),
                estimated_duration=action.get("duration", 5),
                characters=characters,
                action_notes=action.get("description", "")
            ))
            
            # Close-up detail shot
            shots.append(Shot(
                order_index=len(shots) + 1,
                description=f"Detail shot of action",
                camera_metadata=CameraMetadata(
                    size=ShotSize.CLOSE_UP,
                    angle=ShotAngle.LOW_ANGLE,
                    movement=CameraMovement.HANDHELD,
                    lens=LensType.NORMAL,
                    notes="Emphasize action details"
                ),
                estimated_duration=2,
                characters=characters
            ))
        
        return shots

    async def _montage_template(self, scene_data: Dict[str, Any], options: Dict[str, Any]) -> List[Shot]:
        """
        Generate shots optimized for montage sequences
        """
        shots = []
        content = scene_data.get("dialogues", []) + scene_data.get("actions", [])
        characters = scene_data.get("characters", [])
        
        # Quick cuts with varied angles and sizes
        for i, item in enumerate(content):
            shot_sizes = [ShotSize.EXTREME_CLOSE_UP, ShotSize.CLOSE_UP, ShotSize.MEDIUM, ShotSize.WIDE]
            shot_angles = [ShotAngle.EYE_LEVEL, ShotAngle.LOW_ANGLE, ShotAngle.HIGH_ANGLE, ShotAngle.DUTCH_ANGLE]
            
            shots.append(Shot(
                order_index=i + 1,
                description=f"Montage shot {i + 1}",
                camera_metadata=CameraMetadata(
                    size=random.choice(shot_sizes),
                    angle=random.choice(shot_angles),
                    movement=CameraMovement.STATIC,
                    lens=LensType.NORMAL,
                    notes="Quick montage cut"
                ),
                estimated_duration=1,  # Short duration for montage
                characters=characters
            ))
        
        return shots

    async def _get_scene_data(self, scene_id: str) -> Dict[str, Any]:
        """
        Get scene data from database (mock implementation)
        """
        # This would typically query the database
        # For now, return mock data
        return {
            "id": scene_id,
            "summary": "A tense conversation between two characters",
            "location": "Office interior",
            "characters": ["John", "Sarah"],
            "dialogues": [
                {"character": "John", "line": "We need to talk about this."},
                {"character": "Sarah", "line": "I don't want to discuss it."},
                {"character": "John", "line": "It's important."}
            ],
            "actions": [
                {"description": "John paces around the room", "duration": 3},
                {"description": "Sarah looks away", "duration": 2}
            ]
        }

    def _assess_location_complexity(self, location: str) -> str:
        """
        Assess the complexity of a location
        """
        complex_keywords = ["crowded", "busy", "multiple", "various", "complex"]
        simple_keywords = ["empty", "simple", "single", "basic"]
        
        location_lower = location.lower()
        
        if any(keyword in location_lower for keyword in complex_keywords):
            return "complex"
        elif any(keyword in location_lower for keyword in simple_keywords):
            return "simple"
        else:
            return "moderate"

    def _estimate_dialogue_duration(self, line: str) -> int:
        """
        Estimate dialogue duration based on line length
        """
        # Rough estimate: 2-3 words per second
        word_count = len(line.split())
        return max(1, word_count // 2)
