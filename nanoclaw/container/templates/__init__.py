"""
Agent Templates Package
Provides pre-built OpenAI Agents SDK templates for rapid agent generation.
"""
from .template_manager import (
    TemplateManager,
    get_template_manager,
    list_templates,
    match_template,
    load_template,
    generate_from_template,
)

__all__ = [
    "TemplateManager",
    "get_template_manager",
    "list_templates",
    "match_template",
    "load_template",
    "generate_from_template",
]
