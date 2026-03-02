"""
Pytest configuration and fixtures for 4-Level TDD Testing System.

Test Levels:
- level1: Syntax tests (template rendering, variable substitution)
- level2: Import tests (generated code imports without errors)
- level3: Runtime tests (agents initialize, servers start) - requires sandbox
- level4: Integration tests (backend + frontend communication) - requires sandbox

Usage:
    pytest -m level1                    # Fast: ~5 seconds
    pytest -m level2                    # Medium: ~15 seconds
    pytest -m level3 --use-sandbox      # Slow: ~60 seconds
    pytest -m level4 --use-sandbox      # Slowest: ~120 seconds
"""

import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Dict, Any, Generator, Optional

import pytest


# =============================================================================
# Pytest Configuration
# =============================================================================

def pytest_configure(config):
    """Register custom markers for test levels."""
    config.addinivalue_line("markers", "level1: Syntax tests (fast, no dependencies)")
    config.addinivalue_line("markers", "level2: Import tests (requires Python SDK)")
    config.addinivalue_line("markers", "level3: Runtime tests (requires sandbox container)")
    config.addinivalue_line("markers", "level4: Integration tests (requires full stack)")


def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--use-sandbox",
        action="store_true",
        default=False,
        help="Run tests that require Docker sandbox container"
    )


def pytest_collection_modifyitems(config, items):
    """Skip sandbox tests if --use-sandbox not provided."""
    if not config.getoption("--use-sandbox"):
        skip_sandbox = pytest.mark.skip(reason="Need --use-sandbox option to run")
        for item in items:
            if "level3" in item.keywords or "level4" in item.keywords:
                item.add_marker(skip_sandbox)


# =============================================================================
# Path Constants
# =============================================================================

# Get the directory containing this conftest.py
TESTS_DIR = Path(__file__).parent
CONTAINER_DIR = TESTS_DIR.parent
TEMPLATES_DIR = CONTAINER_DIR / "templates"
FIXTURES_DIR = TESTS_DIR / "fixtures"
SANDBOX_DIR = CONTAINER_DIR / "sandbox"


# =============================================================================
# Basic Fixtures
# =============================================================================

@pytest.fixture
def temp_project_dir() -> Generator[Path, None, None]:
    """
    Create a temporary directory for generated code.

    Yields:
        Path to temporary directory that is cleaned up after test.
    """
    temp_dir = tempfile.mkdtemp(prefix="nanoclaw_test_")
    yield Path(temp_dir)
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_agent_config() -> Dict[str, Any]:
    """
    Load sample agent configurations from fixtures.

    Returns:
        Dictionary with template configurations for all templates.
    """
    config_path = FIXTURES_DIR / "sample_agent_config.json"
    with open(config_path, "r") as f:
        return json.load(f)


@pytest.fixture
def sample_requirements() -> Dict[str, Any]:
    """
    Load sample requirements scenarios from fixtures.

    Returns:
        Dictionary with requirement scenarios for testing.
    """
    requirements_path = FIXTURES_DIR / "sample_requirements.json"
    with open(requirements_path, "r") as f:
        return json.load(f)


# =============================================================================
# Template Renderer
# =============================================================================

class TemplateRenderer:
    """
    Renders template files by substituting variables.

    Supports both {{VARIABLE}} and {VARIABLE} syntax.
    """

    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir

    def render_string(self, content: str, variables: Dict[str, Any]) -> str:
        """
        Render a template string with variables.

        Args:
            content: Template content with {{VARIABLE}} placeholders
            variables: Dictionary of variable names to values

        Returns:
            Rendered content with variables substituted.
        """
        result = content
        for key, value in variables.items():
            # Handle both {{VARIABLE}} and {VARIABLE} syntax
            result = result.replace(f"{{{{{key}}}}}", str(value))
            result = result.replace(f"{{{key}}}", str(value))
        return result

    def render_file(self, template_path: Path, variables: Dict[str, Any]) -> str:
        """
        Render a template file with variables.

        Args:
            template_path: Path to template file
            variables: Dictionary of variable names to values

        Returns:
            Rendered content.
        """
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        return self.render_string(content, variables)

    def render_template(
        self,
        template_name: str,
        variables: Dict[str, Any],
        output_dir: Path
    ) -> Path:
        """
        Render an entire template directory to output directory.

        Args:
            template_name: Name of template (e.g., "basic-chatbot")
            variables: Dictionary of variable names to values
            output_dir: Directory to write rendered files

        Returns:
            Path to output directory.
        """
        template_path = self.templates_dir / template_name
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_name}")

        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)

        # Recursively render all files
        for root, dirs, files in os.walk(template_path):
            # Calculate relative path
            rel_root = Path(root).relative_to(template_path)
            output_root = output_dir / rel_root
            output_root.mkdir(parents=True, exist_ok=True)

            for file in files:
                src_path = Path(root) / file

                # Remove .template extension if present
                if file.endswith(".template"):
                    dest_name = file[:-9]  # Remove .template
                else:
                    dest_name = file

                dest_path = output_root / dest_name

                # Render and write
                rendered = self.render_file(src_path, variables)
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(rendered)

        return output_dir

    def get_template_files(self, template_name: str) -> list:
        """
        Get list of all files in a template.

        Args:
            template_name: Name of template

        Returns:
            List of relative file paths.
        """
        template_path = self.templates_dir / template_name
        if not template_path.exists():
            return []

        files = []
        for root, dirs, filenames in os.walk(template_path):
            for filename in filenames:
                rel_path = Path(root).relative_to(template_path) / filename
                files.append(str(rel_path))

        return files


@pytest.fixture
def template_renderer() -> TemplateRenderer:
    """
    Get template renderer instance.

    Returns:
        TemplateRenderer configured with templates directory.
    """
    return TemplateRenderer(TEMPLATES_DIR)


# =============================================================================
# Generated Project Fixtures
# =============================================================================

def _to_pascal_case(name: str) -> str:
    """Convert string to PascalCase."""
    # Handle snake_case and kebab-case
    words = re.split(r'[-_\s]+', name)
    return ''.join(word.capitalize() for word in words)


def _generate_project(
    template_renderer: TemplateRenderer,
    temp_dir: Path,
    template_name: str,
    config: Dict[str, Any]
) -> Path:
    """Helper to generate a project from template."""
    output_dir = temp_dir / template_name
    variables = config.get("templates", {}).get(template_name, {})

    # Convert config keys to template variable format
    template_vars = {}
    for key, value in variables.items():
        # Convert agent_name to AGENT_NAME
        upper_key = key.upper()
        template_vars[upper_key] = value

    # Get agent name for derived variables
    agent_name = variables.get("agent_name", "TestAgent")

    # Add defaults for common variables
    defaults = {
        "AGENT_NAME": agent_name,
        "AGENT_NAME_PASCAL": variables.get("agent_name_pascal", _to_pascal_case(agent_name)),
        "DOMAIN": variables.get("domain", variables.get("company_description", "Test Domain")),
        "INSTRUCTIONS": variables.get("instructions", f"You are a helpful assistant for {variables.get('company_name', 'the company')}."),
        "USE_MEMORY": "True" if variables.get("session_type") != "none" else "False",
        "USE_WEB_SEARCH": "True" if "WebSearchTool" in variables.get("tools", []) else "False",
        # Customer support specific
        "BILLING_INSTRUCTIONS": variables.get("billing_instructions", "You handle billing inquiries."),
        "TECHNICAL_INSTRUCTIONS": variables.get("technical_instructions", "You handle technical support."),
        "GENERAL_INSTRUCTIONS": variables.get("general_instructions", "You handle general inquiries."),
        # Data processor specific
        "INPUT_TYPE": variables.get("input_type", "Raw input data"),
        "OUTPUT_TYPE": variables.get("output_type", "Processed output"),
        "VALIDATION_RULES": variables.get("validation_rules", "Standard validation"),
        # Multi-agent system specific
        "SYSTEM_NAME": variables.get("system_name", f"{agent_name} System"),
        "ORCHESTRATOR_NAME": variables.get("orchestrator_name", agent_name),
        "SPECIALIST_COUNT": variables.get("specialist_count", 3),
        "SPECIALIST_NAMES_LIST": json.dumps(variables.get("specialist_names", ["researcher", "writer", "reviewer"])),
        # RAG assistant specific
        "VECTOR_STORE_ID": variables.get("vector_store_id", "vs_placeholder"),
        "MAX_RESULTS": variables.get("max_results", 10),
        "INCLUDE_CITATIONS": "True" if variables.get("include_citations", True) else "False",
        # Task automation specific
        "MAX_RETRIES": variables.get("max_retries", 3),
        "ENABLE_SCHEDULER": "True" if variables.get("schedule_enabled", True) else "False",
        # Frontend (nextjs-chatkit-ui) specific
        "PROJECT_NAME": variables.get("project_name", "test-website"),
        "COMPANY_NAME": variables.get("company_name", "Test Company"),
        "COMPANY_TAGLINE": variables.get("company_tagline", "Testing made easy"),
        "COMPANY_DESCRIPTION": variables.get("company_description", "A test company"),
        "PRIMARY_COLOR": variables.get("primary_color", "#3B82F6"),
        "SECONDARY_COLOR": variables.get("secondary_color", "#1E40AF"),
        "CHATKIT_API_URL": variables.get("chatkit_api_url", "http://localhost:8000/chatkit"),
        "CONTACT_EMAIL": variables.get("contact_email", "contact@example.com"),
        "PHONE_NUMBER": variables.get("phone_number", "+1234567890"),
    }

    for key, value in defaults.items():
        if key not in template_vars:
            template_vars[key] = value

    return template_renderer.render_template(template_name, template_vars, output_dir)


@pytest.fixture
def generated_basic_chatbot(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated basic-chatbot project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "basic-chatbot",
        sample_agent_config
    )


@pytest.fixture
def generated_customer_support(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated customer-support project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "customer-support",
        sample_agent_config
    )


@pytest.fixture
def generated_data_processor(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated data-processor project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "data-processor",
        sample_agent_config
    )


@pytest.fixture
def generated_multi_agent_system(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated multi-agent-system project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "multi-agent-system",
        sample_agent_config
    )


@pytest.fixture
def generated_rag_assistant(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated rag-assistant project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "rag-assistant",
        sample_agent_config
    )


@pytest.fixture
def generated_task_automation(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated task-automation project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "task-automation",
        sample_agent_config
    )


@pytest.fixture
def generated_nextjs_frontend(
    temp_project_dir: Path,
    template_renderer: TemplateRenderer,
    sample_agent_config: Dict[str, Any]
) -> Path:
    """
    Pre-generated nextjs-chatkit-ui project.

    Returns:
        Path to generated project directory.
    """
    return _generate_project(
        template_renderer,
        temp_project_dir,
        "nextjs-chatkit-ui",
        sample_agent_config
    )


# =============================================================================
# Sandbox Runner (Level 3-4)
# =============================================================================

class SandboxRunner:
    """
    Docker sandbox executor for isolated code verification.

    Runs verification scripts in isolated container and returns results.
    """

    def __init__(self, sandbox_dir: Path, timeout: int = 60):
        self.sandbox_dir = sandbox_dir
        self.timeout = timeout
        self.container_image = "nanoclaw-test-sandbox:latest"

    def is_available(self) -> bool:
        """Check if Docker and sandbox image are available."""
        import subprocess
        try:
            result = subprocess.run(
                ["docker", "images", "-q", self.container_image],
                capture_output=True,
                text=True,
                timeout=10
            )
            return bool(result.stdout.strip())
        except (subprocess.SubprocessError, FileNotFoundError):
            return False

    async def verify_backend(self, project_path: Path) -> Dict[str, Any]:
        """
        Verify backend code in sandbox.

        Args:
            project_path: Path to generated backend code

        Returns:
            Dictionary with verification results:
            - success: bool
            - agent_init: "success" or error message
            - server_health: HTTP status code or error
            - errors: list of error messages
            - timing: execution time in seconds
        """
        import asyncio
        import subprocess
        import time

        start_time = time.time()

        try:
            result = subprocess.run(
                [
                    "docker", "run", "--rm",
                    "-v", f"{project_path}:/workspace/generated:ro",
                    self.container_image,
                    "backend"
                ],
                capture_output=True,
                text=True,
                timeout=self.timeout
            )

            # Parse JSON output
            output = result.stdout.strip()
            if output:
                return json.loads(output)
            else:
                return {
                    "success": False,
                    "errors": [result.stderr or "No output from sandbox"],
                    "timing": time.time() - start_time
                }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "errors": [f"Sandbox timeout after {self.timeout}s"],
                "timing": self.timeout
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "errors": [f"Invalid JSON output: {e}"],
                "timing": time.time() - start_time
            }
        except Exception as e:
            return {
                "success": False,
                "errors": [str(e)],
                "timing": time.time() - start_time
            }

    def verify_frontend(self, project_path: Path) -> Dict[str, Any]:
        """
        Verify frontend code in sandbox.

        Args:
            project_path: Path to generated frontend code

        Returns:
            Dictionary with verification results:
            - build_success: bool
            - errors: list of error messages
            - warnings: list of warnings
            - timing: execution time in seconds
        """
        import subprocess
        import time

        start_time = time.time()

        try:
            result = subprocess.run(
                [
                    "docker", "run", "--rm",
                    "-v", f"{project_path}:/workspace/generated:ro",
                    self.container_image,
                    "frontend"
                ],
                capture_output=True,
                text=True,
                timeout=self.timeout * 2  # Frontend builds take longer
            )

            output = result.stdout.strip()
            if output:
                return json.loads(output)
            else:
                return {
                    "build_success": False,
                    "errors": [result.stderr or "No output from sandbox"],
                    "timing": time.time() - start_time
                }

        except subprocess.TimeoutExpired:
            return {
                "build_success": False,
                "errors": [f"Frontend build timeout after {self.timeout * 2}s"],
                "timing": self.timeout * 2
            }
        except Exception as e:
            return {
                "build_success": False,
                "errors": [str(e)],
                "timing": time.time() - start_time
            }


@pytest.fixture
def sandbox_runner() -> SandboxRunner:
    """
    Get sandbox runner instance.

    Returns:
        SandboxRunner configured with sandbox directory.
    """
    return SandboxRunner(SANDBOX_DIR)


# =============================================================================
# Integration Test Fixtures (Level 4)
# =============================================================================

@pytest.fixture
async def backend_server(generated_basic_chatbot: Path):
    """
    Start backend server for integration testing.

    Yields:
        Dictionary with server info (url, process).
    """
    import asyncio
    import subprocess
    import time

    # Find free port
    import socket
    sock = socket.socket()
    sock.bind(('', 0))
    port = sock.getsockname()[1]
    sock.close()

    # Start server
    process = subprocess.Popen(
        ["python", "-m", "uvicorn", "main:app", "--port", str(port)],
        cwd=generated_basic_chatbot,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Wait for server to start
    url = f"http://localhost:{port}"
    for _ in range(30):
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{url}/health", timeout=1.0)
                if response.status_code == 200:
                    break
        except:
            pass
        await asyncio.sleep(0.5)

    yield {"url": url, "port": port, "process": process}

    # Cleanup
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()


@pytest.fixture
def test_client():
    """
    HTTP test client for integration tests.

    Returns:
        httpx.AsyncClient factory function.
    """
    import httpx

    async def create_client(base_url: str):
        return httpx.AsyncClient(base_url=base_url, timeout=30.0)

    return create_client


# =============================================================================
# Utility Functions
# =============================================================================

def has_unresolved_placeholders(content: str) -> list:
    """
    Check for unresolved template placeholders.

    Args:
        content: Rendered content

    Returns:
        List of unresolved placeholders found.
    """
    # Match {{VARIABLE}} patterns (double curly braces - template variables)
    # But NOT {VARIABLE} patterns as these could be f-string references
    double_brace_pattern = r'\{\{[A-Z_]+\}\}'
    return re.findall(double_brace_pattern, content)


def is_valid_python(content: str) -> tuple:
    """
    Check if content is valid Python syntax.

    Args:
        content: Python code to validate

    Returns:
        Tuple of (is_valid: bool, error_message: str or None)
    """
    import ast
    try:
        ast.parse(content)
        return True, None
    except SyntaxError as e:
        return False, str(e)


@pytest.fixture
def check_placeholders():
    """Fixture providing placeholder checking function."""
    return has_unresolved_placeholders


@pytest.fixture
def check_python_syntax():
    """Fixture providing Python syntax checking function."""
    return is_valid_python
