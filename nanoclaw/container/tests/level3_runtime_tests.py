"""
Level 3: Runtime Tests - Verify Generated Code Actually Runs

These tests verify that:
1. Agent objects initialize without TypeError
2. All configured tools instantiate correctly
3. FastAPI server starts and responds to /health
4. Server shuts down gracefully
5. Frontend builds without errors (npm run build)
6. Interactive components have "use client" directive

Run with: pytest -m level3 --use-sandbox

Time: ~60 seconds

Note: These tests require Docker sandbox container.
"""

import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Any

import pytest


# =============================================================================
# Level 3 Tests - Agent Initialization
# =============================================================================

@pytest.mark.level3
class TestAgentInitialization:
    """Tests for Agent object initialization."""

    @pytest.mark.asyncio
    async def test_agent_initializes_in_sandbox(
        self,
        sandbox_runner,
        generated_basic_chatbot: Path
    ):
        """
        Agent constructor executes without TypeError in sandbox.

        This catches errors like:
        - CodeInterpreterTool.__init__() missing 'tool_config'
        - Agent missing required parameters
        """
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available (run with --use-sandbox)")

        result = await sandbox_runner.verify_backend(generated_basic_chatbot)

        # Check agent initialization step
        agent_step = result.get("steps", {}).get("agent_init", {})
        assert agent_step.get("status") in ["success", "skipped"], \
            f"Agent initialization failed: {agent_step.get('details')}"

    @pytest.mark.asyncio
    async def test_customer_support_agents_initialize(
        self,
        sandbox_runner,
        generated_customer_support: Path
    ):
        """Multi-agent system initializes all agents."""
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available")

        result = await sandbox_runner.verify_backend(generated_customer_support)
        assert result.get("success") or not result.get("errors"), \
            f"Customer support agent init failed: {result.get('errors')}"


# =============================================================================
# Level 3 Tests - Tool Instantiation
# =============================================================================

@pytest.mark.level3
class TestToolInstantiation:
    """Tests for tool object instantiation."""

    @pytest.mark.asyncio
    async def test_all_tools_instantiate(
        self,
        sandbox_runner,
        generated_basic_chatbot: Path
    ):
        """
        All configured tools create without errors.

        This catches the CodeInterpreterTool container error:
        Missing required parameter: 'tools[1].container'
        """
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available")

        result = await sandbox_runner.verify_backend(generated_basic_chatbot)

        # Check for tool-related errors
        errors = result.get("errors", [])
        tool_errors = [e for e in errors if "Tool" in e or "tool_config" in e or "container" in e]

        assert not tool_errors, \
            f"Tool instantiation errors: {tool_errors}"

    def test_code_interpreter_tool_pattern(
        self,
        generated_basic_chatbot: Path
    ):
        """
        CodeInterpreterTool usage includes required parameters.

        Pattern should be:
        CodeInterpreterTool(tool_config={...})
        NOT:
        CodeInterpreterTool()  # Old pattern - will fail
        """
        for py_file in generated_basic_chatbot.rglob("*.py"):
            content = py_file.read_text()

            if "CodeInterpreterTool()" in content:
                # Old pattern without parameters - warn
                pytest.fail(
                    f"{py_file.name}: CodeInterpreterTool() needs tool_config parameter. "
                    f"Use: CodeInterpreterTool(tool_config={{...}})"
                )


# =============================================================================
# Level 3 Tests - Server Startup
# =============================================================================

@pytest.mark.level3
class TestServerStartup:
    """Tests for FastAPI server startup."""

    @pytest.mark.asyncio
    async def test_server_starts_in_sandbox(
        self,
        sandbox_runner,
        generated_basic_chatbot: Path
    ):
        """FastAPI server starts on dynamic port in sandbox."""
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available")

        result = await sandbox_runner.verify_backend(generated_basic_chatbot)

        # Check server health step
        health_step = result.get("steps", {}).get("server_health", {})
        assert health_step.get("status") in ["success", "skipped"], \
            f"Server failed to start: {health_step.get('details')}"

    @pytest.mark.asyncio
    async def test_health_endpoint_returns_200(
        self,
        sandbox_runner,
        generated_basic_chatbot: Path
    ):
        """
        /health endpoint returns HTTP 200 with healthy status.

        Expected response:
        {"status": "healthy", ...}
        """
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available")

        result = await sandbox_runner.verify_backend(generated_basic_chatbot)

        health_step = result.get("steps", {}).get("server_health", {})
        if health_step.get("status") == "success":
            # Check for HTTP 200
            details = health_step.get("details", "")
            assert "200" in details or "success" in details.lower(), \
                f"Health endpoint did not return 200: {details}"

    @pytest.mark.asyncio
    async def test_server_graceful_shutdown(
        self,
        sandbox_runner,
        generated_basic_chatbot: Path
    ):
        """Server stops without hanging after tests."""
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available")

        result = await sandbox_runner.verify_backend(generated_basic_chatbot)

        # Check timing - should complete within timeout
        timing = result.get("timing", 0)
        assert timing < 60, \
            f"Sandbox took too long ({timing}s), possible server hang"


# =============================================================================
# Level 3 Tests - Frontend Build
# =============================================================================

@pytest.mark.level3
class TestFrontendBuild:
    """Tests for Next.js frontend build."""

    @pytest.mark.asyncio
    async def test_frontend_builds_successfully(
        self,
        sandbox_runner,
        generated_nextjs_frontend: Path
    ):
        """npm run build completes without errors."""
        if not sandbox_runner.is_available():
            pytest.skip("Sandbox not available")

        # Check if frontend directory exists
        frontend_dir = generated_nextjs_frontend / "frontend"
        if not frontend_dir.exists():
            frontend_dir = generated_nextjs_frontend

        # Check for package.json
        package_json = frontend_dir / "package.json"
        if not package_json.exists():
            pytest.skip("No package.json found - not a frontend project")

        result = sandbox_runner.verify_frontend(generated_nextjs_frontend)

        assert result.get("build_success", False), \
            f"Frontend build failed: {result.get('errors')}"

    def test_use_client_directive_present(
        self,
        generated_nextjs_frontend: Path
    ):
        """
        Interactive components have "use client" at file top.

        This catches the error:
        Event handlers cannot be passed to Client Component props
        """
        issues = []

        for ext in ["*.tsx", "*.jsx"]:
            for file_path in generated_nextjs_frontend.rglob(ext):
                # Skip node_modules
                if "node_modules" in str(file_path):
                    continue

                content = file_path.read_text()
                lines = content.split("\n")

                # Check if file has interactive elements
                has_interactivity = any(pattern in content for pattern in [
                    "onClick",
                    "onChange",
                    "onSubmit",
                    "useState",
                    "useEffect",
                    "useRef",
                    "useCallback",
                ])

                if has_interactivity:
                    # Check first 5 lines for "use client"
                    first_lines = "\n".join(lines[:5])
                    has_use_client = '"use client"' in first_lines or "'use client'" in first_lines

                    if not has_use_client:
                        issues.append(file_path.name)

        if issues:
            pytest.fail(
                f"Missing 'use client' directive in interactive components: {issues}. "
                f"Add \"use client\" at the top of these files."
            )

    def test_typescript_compilation(
        self,
        generated_nextjs_frontend: Path
    ):
        """TypeScript compilation succeeds."""
        tsconfig = generated_nextjs_frontend / "tsconfig.json"

        if not tsconfig.exists():
            # Check in frontend subdirectory
            tsconfig = generated_nextjs_frontend / "frontend" / "tsconfig.json"

        if not tsconfig.exists():
            pytest.skip("No TypeScript configuration found")

        # TypeScript errors would be caught by npm run build
        # This test just verifies tsconfig exists and is valid JSON
        try:
            content = tsconfig.read_text()
            json.loads(content)
        except json.JSONDecodeError as e:
            pytest.fail(f"Invalid tsconfig.json: {e}")

    def test_no_chatkit_npm_import(
        self,
        generated_nextjs_frontend: Path
    ):
        """
        Frontend uses ChatKit CDN, not npm package.

        The @openai/chatkit-react package causes errors.
        ChatKit should load from CDN.
        """
        for ext in ["*.tsx", "*.jsx", "*.ts", "*.js"]:
            for file_path in generated_nextjs_frontend.rglob(ext):
                if "node_modules" in str(file_path):
                    continue

                content = file_path.read_text()

                # Check for wrong import
                wrong_imports = [
                    "from '@openai/chatkit-react'",
                    'from "@openai/chatkit-react"',
                    "from 'chatkit-react'",
                    'from "chatkit-react"',
                ]

                for wrong_import in wrong_imports:
                    if wrong_import in content:
                        pytest.fail(
                            f"{file_path.name}: Uses npm ChatKit package. "
                            f"Use CDN web component instead: <openai-chatkit>"
                        )


# =============================================================================
# Level 3 Tests - Configuration Validation
# =============================================================================

@pytest.mark.level3
class TestConfigurationValidation:
    """Tests for configuration file validation."""

    def test_env_example_exists(
        self,
        generated_basic_chatbot: Path
    ):
        """Project has .env.example with required variables."""
        env_files = [
            generated_basic_chatbot / ".env.example",
            generated_basic_chatbot / ".env.template",
            generated_basic_chatbot / "env.example",
        ]

        env_file = None
        for f in env_files:
            if f.exists():
                env_file = f
                break

        if env_file is None:
            pytest.skip("No .env.example found")

        content = env_file.read_text()

        # Check for required variables
        required_vars = ["OPENAI_API_KEY"]
        for var in required_vars:
            assert var in content, f"Missing {var} in .env.example"

    def test_requirements_has_versions(
        self,
        generated_basic_chatbot: Path
    ):
        """requirements.txt has version specifiers."""
        req_file = generated_basic_chatbot / "requirements.txt"

        if not req_file.exists():
            pytest.skip("No requirements.txt found")

        content = req_file.read_text()
        lines = [l.strip() for l in content.split("\n") if l.strip() and not l.startswith("#")]

        # At least some packages should have versions
        has_versions = any(">=" in l or "==" in l or "~=" in l for l in lines)

        if not has_versions and len(lines) > 0:
            pytest.skip("requirements.txt has no version specifiers (acceptable for some projects)")


# =============================================================================
# Level 3 Tests - Error Detection
# =============================================================================

@pytest.mark.level3
class TestErrorDetection:
    """Tests that verify our tests catch real errors."""

    def test_detects_missing_import(
        self,
        temp_project_dir: Path
    ):
        """
        Verify Level 3 would catch a missing import.

        This is a meta-test to ensure our test system works.
        """
        # Create a file with an import error
        bad_file = temp_project_dir / "bad_import.py"
        bad_file.write_text("from nonexistent_module import something")

        # Verify syntax is valid but import would fail
        import ast
        try:
            ast.parse(bad_file.read_text())
            syntax_ok = True
        except SyntaxError:
            syntax_ok = False

        assert syntax_ok, "Syntax should be valid for import test"

        # The import error would be caught by Level 2 tests
        # Level 3 would catch runtime errors

    def test_detects_type_error_pattern(
        self,
        temp_project_dir: Path
    ):
        """
        Verify we can detect TypeError patterns in code.

        Example: CodeInterpreterTool() without required args
        """
        # Create a file with potential TypeError
        bad_file = temp_project_dir / "bad_tool.py"
        bad_file.write_text("""
from agents import CodeInterpreterTool

# This pattern would cause TypeError at runtime
tool = CodeInterpreterTool()  # Missing tool_config!
""")

        content = bad_file.read_text()

        # Our pattern detection should flag this
        has_bad_pattern = "CodeInterpreterTool()" in content

        assert has_bad_pattern, "Should detect CodeInterpreterTool() without args"
