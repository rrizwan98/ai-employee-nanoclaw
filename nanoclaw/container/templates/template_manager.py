"""
Template Manager for Agent Builder AI Employee
Handles loading, matching, and customizing agent templates.
"""
import os
import json
import re
from pathlib import Path
from typing import List, Dict, Optional, Any
from dataclasses import dataclass


TEMPLATES_DIR = Path(__file__).parent


@dataclass
class TemplateVariable:
    """Represents a template variable configuration."""
    name: str
    description: str
    required: bool = False
    default: Optional[str] = None


@dataclass
class TemplateMetadata:
    """Represents template metadata."""
    name: str
    displayName: str
    description: str
    version: str
    agents: List[str]
    patterns: List[str]
    sdkFeatures: List[str]
    useCases: List[str]
    keywords: List[str]
    complexity: str
    files: List[Dict[str, str]]
    variables: List[Dict[str, Any]]


class TemplateManager:
    """Manages agent templates for code generation."""

    def __init__(self, templates_dir: Optional[Path] = None):
        self.templates_dir = templates_dir or TEMPLATES_DIR
        self.templates: Dict[str, Dict] = {}
        self._load_templates()

    def _load_templates(self) -> None:
        """Load all template metadata from template directories."""
        self.templates = {}

        if not self.templates_dir.exists():
            return

        for template_dir in self.templates_dir.iterdir():
            if template_dir.is_dir() and not template_dir.name.startswith('_'):
                metadata_path = template_dir / "metadata.json"
                if metadata_path.exists():
                    try:
                        with open(metadata_path, 'r', encoding='utf-8') as f:
                            self.templates[template_dir.name] = json.load(f)
                    except json.JSONDecodeError as e:
                        print(f"Warning: Failed to parse {metadata_path}: {e}")

    def list_templates(self) -> List[Dict]:
        """Return list of all available templates with metadata."""
        return [
            {
                "name": name,
                "displayName": meta.get("displayName", name),
                "description": meta.get("description", ""),
                "complexity": meta.get("complexity", "unknown"),
                "agents": meta.get("agents", []),
                "useCases": meta.get("useCases", []),
                "keywords": meta.get("keywords", [])
            }
            for name, meta in self.templates.items()
        ]

    def match_template(self, request: str, min_score: int = 2) -> Optional[str]:
        """
        Match a client request to the best template using keyword matching.

        Args:
            request: The client's request text
            min_score: Minimum keyword matches required (default: 2)

        Returns:
            Template name if match found, None otherwise
        """
        request_lower = request.lower()
        best_match: Optional[str] = None
        best_score = 0

        for name, metadata in self.templates.items():
            keywords = metadata.get("keywords", [])
            # Count how many keywords appear in the request
            score = sum(1 for kw in keywords if kw.lower() in request_lower)

            if score > best_score:
                best_score = score
                best_match = name

        return best_match if best_score >= min_score else None

    def get_template_info(self, name: str) -> Optional[Dict]:
        """Get detailed information about a specific template."""
        return self.templates.get(name)

    def get_template_variables(self, name: str) -> List[Dict]:
        """Get the list of variables required for a template."""
        template = self.templates.get(name)
        if not template:
            return []
        return template.get("variables", [])

    def load_template(self, name: str) -> Dict[str, Any]:
        """
        Load a template's files and metadata.

        Args:
            name: Template name

        Returns:
            Dict with 'metadata' and 'files' keys

        Raises:
            ValueError: If template not found
        """
        template_dir = self.templates_dir / name
        if not template_dir.exists():
            raise ValueError(f"Template '{name}' not found")

        if name not in self.templates:
            raise ValueError(f"Template '{name}' metadata not loaded")

        metadata = self.templates[name]
        files: Dict[str, str] = {}

        for file_info in metadata.get("files", []):
            template_file = file_info.get("template", "")
            output_path = file_info.get("path", "")

            template_path = template_dir / template_file
            if template_path.exists():
                try:
                    with open(template_path, 'r', encoding='utf-8') as f:
                        files[output_path] = f.read()
                except Exception as e:
                    print(f"Warning: Failed to read {template_path}: {e}")

        return {"metadata": metadata, "files": files}

    def customize(self, template: Dict[str, Any], variables: Dict[str, str]) -> Dict[str, str]:
        """
        Apply variable substitutions to template files.

        Args:
            template: Template dict from load_template()
            variables: Dict of variable names to values

        Returns:
            Dict of file paths to customized content
        """
        customized: Dict[str, str] = {}

        for path, content in template.get("files", {}).items():
            customized_content = content

            # Replace {{VARIABLE}} patterns
            for var_name, var_value in variables.items():
                pattern = f"{{{{{var_name}}}}}"
                customized_content = customized_content.replace(pattern, str(var_value))

            customized[path] = customized_content

        return customized

    def generate_from_template(
        self,
        template_name: str,
        variables: Dict[str, str],
        output_dir: Optional[Path] = None
    ) -> Dict[str, str]:
        """
        Generate code from a template with customizations.

        Args:
            template_name: Name of the template to use
            variables: Variable values for customization
            output_dir: Optional directory to write files to

        Returns:
            Dict of file paths to generated content
        """
        # Load template
        template = self.load_template(template_name)

        # Apply default values for missing variables
        metadata = template["metadata"]
        for var_def in metadata.get("variables", []):
            var_name = var_def.get("name")
            if var_name and var_name not in variables:
                default = var_def.get("default")
                if default is not None:
                    variables[var_name] = default

        # Customize template
        generated = self.customize(template, variables)

        # Optionally write to disk
        if output_dir:
            output_dir = Path(output_dir)
            for file_path, content in generated.items():
                full_path = output_dir / file_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)

        return generated

    def validate_variables(self, template_name: str, variables: Dict[str, str]) -> List[str]:
        """
        Validate that all required variables are provided.

        Args:
            template_name: Name of the template
            variables: Provided variables

        Returns:
            List of missing required variable names
        """
        template = self.templates.get(template_name)
        if not template:
            return [f"Template '{template_name}' not found"]

        missing = []
        for var_def in template.get("variables", []):
            if var_def.get("required", False):
                var_name = var_def.get("name")
                if var_name and var_name not in variables:
                    missing.append(var_name)

        return missing


# Singleton instance
_manager: Optional[TemplateManager] = None


def get_template_manager() -> TemplateManager:
    """Get or create the singleton TemplateManager instance."""
    global _manager
    if _manager is None:
        _manager = TemplateManager()
    return _manager


# Convenience functions
def list_templates() -> List[Dict]:
    """List all available templates."""
    return get_template_manager().list_templates()


def match_template(request: str) -> Optional[str]:
    """Match a request to the best template."""
    return get_template_manager().match_template(request)


def load_template(name: str) -> Dict[str, Any]:
    """Load a template by name."""
    return get_template_manager().load_template(name)


def generate_from_template(
    template_name: str,
    variables: Dict[str, str],
    output_dir: Optional[Path] = None
) -> Dict[str, str]:
    """Generate code from a template."""
    return get_template_manager().generate_from_template(template_name, variables, output_dir)
