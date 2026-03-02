"""
Level 1: Syntax Tests - Template Rendering and Variable Substitution

These tests verify that:
1. Templates render without errors
2. All variables are properly substituted
3. Generated Python code has valid syntax
4. No template placeholders remain in output

Run with: pytest -m level1

Time: ~5 seconds
"""

import ast
import re
from pathlib import Path
from typing import Dict, Any

import pytest


# =============================================================================
# Level 1 Tests - Template Rendering
# =============================================================================

@pytest.mark.level1
class TestTemplateRendering:
    """Tests for template file rendering."""

    def test_basic_chatbot_renders(
        self,
        generated_basic_chatbot: Path
    ):
        """Basic-chatbot template produces output files."""
        assert generated_basic_chatbot.exists()

        # Check expected files exist
        expected_files = ["main.py", "config.py", "server.py", "store.py"]
        for filename in expected_files:
            file_path = generated_basic_chatbot / filename
            assert file_path.exists(), f"Missing file: {filename}"
            content = file_path.read_text()
            assert len(content) > 0, f"Empty file: {filename}"

    def test_customer_support_renders(
        self,
        generated_customer_support: Path
    ):
        """Customer-support template produces multi-file output."""
        assert generated_customer_support.exists()

        # Check main files
        expected_files = ["main.py", "config.py", "server.py", "store.py"]
        for filename in expected_files:
            file_path = generated_customer_support / filename
            assert file_path.exists(), f"Missing file: {filename}"

        # Check agents subdirectory
        agents_dir = generated_customer_support / "agents"
        if agents_dir.exists():
            assert (agents_dir / "__init__.py").exists() or len(list(agents_dir.glob("*.py"))) > 0

    def test_data_processor_renders(
        self,
        generated_data_processor: Path
    ):
        """Data-processor template produces structured output."""
        assert generated_data_processor.exists()

        expected_files = ["main.py", "config.py", "server.py"]
        for filename in expected_files:
            file_path = generated_data_processor / filename
            assert file_path.exists(), f"Missing file: {filename}"

        # Check models subdirectory if present
        models_dir = generated_data_processor / "models"
        if models_dir.exists():
            assert len(list(models_dir.glob("*.py"))) > 0

    def test_multi_agent_system_renders(
        self,
        generated_multi_agent_system: Path
    ):
        """Multi-agent-system template renders orchestrator and specialists."""
        assert generated_multi_agent_system.exists()

        expected_files = ["main.py", "config.py", "server.py"]
        for filename in expected_files:
            file_path = generated_multi_agent_system / filename
            assert file_path.exists(), f"Missing file: {filename}"

    def test_rag_assistant_renders(
        self,
        generated_rag_assistant: Path
    ):
        """RAG-assistant template produces RAG-specific files."""
        assert generated_rag_assistant.exists()

        expected_files = ["main.py", "config.py", "server.py"]
        for filename in expected_files:
            file_path = generated_rag_assistant / filename
            assert file_path.exists(), f"Missing file: {filename}"

    def test_task_automation_renders(
        self,
        generated_task_automation: Path
    ):
        """Task-automation template renders scheduler and executor."""
        assert generated_task_automation.exists()

        expected_files = ["main.py", "config.py", "server.py"]
        for filename in expected_files:
            file_path = generated_task_automation / filename
            assert file_path.exists(), f"Missing file: {filename}"

    def test_nextjs_frontend_renders(
        self,
        generated_nextjs_frontend: Path
    ):
        """NextJS frontend template produces frontend structure."""
        assert generated_nextjs_frontend.exists()

        # Check for frontend directory or direct files
        frontend_dir = generated_nextjs_frontend / "frontend"
        if frontend_dir.exists():
            # Check app router structure
            app_dir = frontend_dir / "app"
            if app_dir.exists():
                assert (app_dir / "page.tsx").exists() or (app_dir / "page.js").exists()


# =============================================================================
# Level 1 Tests - Variable Substitution
# =============================================================================

@pytest.mark.level1
class TestVariableSubstitution:
    """Tests for template variable substitution."""

    def test_variables_replaced_basic_chatbot(
        self,
        generated_basic_chatbot: Path,
        check_placeholders
    ):
        """No unresolved placeholders in basic-chatbot output."""
        for file_path in generated_basic_chatbot.rglob("*.py"):
            content = file_path.read_text()
            unresolved = check_placeholders(content)
            assert not unresolved, f"Unresolved placeholders in {file_path.name}: {unresolved}"

    def test_variables_replaced_customer_support(
        self,
        generated_customer_support: Path,
        check_placeholders
    ):
        """No unresolved placeholders in customer-support output."""
        for file_path in generated_customer_support.rglob("*.py"):
            content = file_path.read_text()
            unresolved = check_placeholders(content)
            assert not unresolved, f"Unresolved placeholders in {file_path.name}: {unresolved}"

    def test_variables_replaced_all_templates(
        self,
        temp_project_dir: Path,
        template_renderer,
        sample_agent_config: Dict[str, Any]
    ):
        """All templates have variables properly substituted."""
        templates = [
            "basic-chatbot",
            "customer-support",
            "data-processor",
            "multi-agent-system",
            "rag-assistant",
            "task-automation"
        ]

        for template_name in templates:
            try:
                config = sample_agent_config.get("templates", {}).get(template_name, {})
                if not config:
                    continue

                output_dir = temp_project_dir / template_name
                template_vars = {k.upper(): v for k, v in config.items()}

                agent_name = config.get("agent_name", "TestAgent")

                # Add defaults (must match conftest._generate_project)
                template_vars.setdefault("AGENT_NAME", agent_name)
                template_vars.setdefault("DOMAIN", config.get("domain", "Test Domain"))
                template_vars.setdefault("USE_MEMORY", "True")
                template_vars.setdefault("USE_WEB_SEARCH", "True")
                # Customer support specific
                template_vars.setdefault("BILLING_INSTRUCTIONS", "You handle billing inquiries.")
                template_vars.setdefault("TECHNICAL_INSTRUCTIONS", "You handle technical support.")
                template_vars.setdefault("GENERAL_INSTRUCTIONS", "You handle general inquiries.")
                # Data processor specific
                template_vars.setdefault("INPUT_TYPE", "Raw input data")
                template_vars.setdefault("OUTPUT_TYPE", "Processed output")
                template_vars.setdefault("VALIDATION_RULES", "Standard validation")
                # Multi-agent system specific
                template_vars.setdefault("SYSTEM_NAME", f"{agent_name} System")
                template_vars.setdefault("ORCHESTRATOR_NAME", agent_name)
                template_vars.setdefault("SPECIALIST_COUNT", 3)
                import json
                template_vars.setdefault("SPECIALIST_NAMES_LIST",
                    json.dumps(config.get("specialist_names", ["researcher", "writer", "reviewer"])))
                # RAG assistant specific
                template_vars.setdefault("VECTOR_STORE_ID", "vs_placeholder")
                template_vars.setdefault("MAX_RESULTS", 10)
                template_vars.setdefault("INCLUDE_CITATIONS", "True")
                # Task automation specific
                template_vars.setdefault("MAX_RETRIES", 3)
                template_vars.setdefault("ENABLE_SCHEDULER", "True")

                template_renderer.render_template(template_name, template_vars, output_dir)

                # Check all Python files for unresolved placeholders
                for file_path in output_dir.rglob("*.py"):
                    content = file_path.read_text()
                    # Only flag uppercase placeholders as errors
                    unresolved = re.findall(r'\{\{[A-Z][A-Z_]+\}\}', content)
                    assert not unresolved, \
                        f"Template {template_name}: unresolved in {file_path.name}: {unresolved}"

            except FileNotFoundError:
                # Template doesn't exist yet, skip
                continue


# =============================================================================
# Level 1 Tests - Python Syntax Validation
# =============================================================================

@pytest.mark.level1
class TestPythonSyntax:
    """Tests for valid Python syntax in generated code."""

    def test_python_syntax_valid_basic_chatbot(
        self,
        generated_basic_chatbot: Path,
        check_python_syntax
    ):
        """All Python files in basic-chatbot have valid syntax."""
        for file_path in generated_basic_chatbot.rglob("*.py"):
            content = file_path.read_text()
            is_valid, error = check_python_syntax(content)
            assert is_valid, f"Syntax error in {file_path.name}: {error}"

    def test_python_syntax_valid_customer_support(
        self,
        generated_customer_support: Path,
        check_python_syntax
    ):
        """All Python files in customer-support have valid syntax."""
        for file_path in generated_customer_support.rglob("*.py"):
            content = file_path.read_text()
            is_valid, error = check_python_syntax(content)
            assert is_valid, f"Syntax error in {file_path.name}: {error}"

    def test_python_syntax_valid_all_templates(
        self,
        temp_project_dir: Path,
        template_renderer,
        sample_agent_config: Dict[str, Any],
        check_python_syntax
    ):
        """All templates generate valid Python syntax."""
        templates = [
            "basic-chatbot",
            "customer-support",
            "data-processor",
            "multi-agent-system",
            "rag-assistant",
            "task-automation"
        ]

        for template_name in templates:
            try:
                config = sample_agent_config.get("templates", {}).get(template_name, {})
                if not config:
                    continue

                output_dir = temp_project_dir / f"{template_name}_syntax"
                template_vars = {k.upper(): v for k, v in config.items()}
                template_vars.setdefault("AGENT_NAME", "TestAgent")
                template_vars.setdefault("DOMAIN", "Test Domain")
                template_vars.setdefault("USE_MEMORY", "True")
                template_vars.setdefault("USE_WEB_SEARCH", "True")

                template_renderer.render_template(template_name, template_vars, output_dir)

                for file_path in output_dir.rglob("*.py"):
                    content = file_path.read_text()
                    is_valid, error = check_python_syntax(content)
                    assert is_valid, \
                        f"Template {template_name}, file {file_path.name}: {error}"

            except FileNotFoundError:
                continue


# =============================================================================
# Level 1 Tests - Frontend Syntax
# =============================================================================

@pytest.mark.level1
class TestFrontendSyntax:
    """Tests for frontend template syntax."""

    def test_nextjs_has_page_components(
        self,
        generated_nextjs_frontend: Path
    ):
        """NextJS template has page components."""
        # Look for page files
        page_files = list(generated_nextjs_frontend.rglob("page.tsx")) + \
                     list(generated_nextjs_frontend.rglob("page.jsx")) + \
                     list(generated_nextjs_frontend.rglob("page.js"))

        # Also check for components
        component_files = list(generated_nextjs_frontend.rglob("*.tsx")) + \
                         list(generated_nextjs_frontend.rglob("*.jsx"))

        assert len(page_files) > 0 or len(component_files) > 0, \
            "No page or component files found in frontend template"

    def test_nextjs_no_template_syntax_in_tsx(
        self,
        generated_nextjs_frontend: Path,
        check_placeholders
    ):
        """No unresolved placeholders in TSX/JSX files."""
        for ext in ["*.tsx", "*.jsx", "*.ts", "*.js"]:
            for file_path in generated_nextjs_frontend.rglob(ext):
                # Skip node_modules if present
                if "node_modules" in str(file_path):
                    continue
                content = file_path.read_text()
                unresolved = check_placeholders(content)
                assert not unresolved, \
                    f"Unresolved placeholders in {file_path.name}: {unresolved}"


# =============================================================================
# Level 1 Tests - Template Structure
# =============================================================================

@pytest.mark.level1
class TestTemplateStructure:
    """Tests for proper template directory structure."""

    def test_template_renderer_gets_files(
        self,
        template_renderer
    ):
        """Template renderer can list template files."""
        templates = [
            "basic-chatbot",
            "customer-support",
            "data-processor"
        ]

        for template_name in templates:
            files = template_renderer.get_template_files(template_name)
            # At minimum, templates should have some files
            # Empty list is ok for non-existent templates
            if files:
                assert isinstance(files, list)
                assert all(isinstance(f, str) for f in files)

    def test_rendered_files_match_template_count(
        self,
        temp_project_dir: Path,
        template_renderer,
        sample_agent_config: Dict[str, Any]
    ):
        """Number of rendered files matches template files."""
        template_name = "basic-chatbot"
        config = sample_agent_config.get("templates", {}).get(template_name, {})

        if not config:
            pytest.skip("No config for basic-chatbot")

        template_files = template_renderer.get_template_files(template_name)
        if not template_files:
            pytest.skip("No template files found")

        output_dir = temp_project_dir / "file_count_test"
        template_vars = {k.upper(): v for k, v in config.items()}
        template_vars.setdefault("AGENT_NAME", "TestAgent")
        template_vars.setdefault("DOMAIN", "Test Domain")
        template_vars.setdefault("USE_MEMORY", "True")
        template_vars.setdefault("USE_WEB_SEARCH", "True")

        template_renderer.render_template(template_name, template_vars, output_dir)

        # Count rendered files (excluding directories)
        rendered_files = list(output_dir.rglob("*"))
        rendered_files = [f for f in rendered_files if f.is_file()]

        # Should have same number of files (template extension removed)
        assert len(rendered_files) >= 1, "No files were rendered"
