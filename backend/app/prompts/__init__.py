"""
Prompts package for AI interactions.
"""

from app.prompts.detection import get_detection_prompt
from app.prompts.explanation import get_explanation_prompt

__all__ = [
    "get_detection_prompt",
    "get_explanation_prompt",
]