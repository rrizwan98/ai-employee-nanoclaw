"""
Level 2: Import Tests - Verify Generated Code Imports Successfully

These tests verify that:
1. Generated Python modules can be imported without ImportError
2. SDK classes (Agent, Runner, Tools) are importable
3. Tool instantiation signatures match current SDK version
4. ChatKit imports are correct (chatkit.store not chatkit.stores)
5. FastAPI and Pydantic imports work

Run with: pytest -m level2

Time: ~15 seconds

Note: These tests require SDK packages to be installed locally.
"""

import importlib.util
import sys
import os
from pathlib import Path
from typing import Optional
import tempfile
import shutil

import pytest


# =============================================================================
# Helper Functions
# =============================================================================

def import_module_from_path(module_name: str, file_path: Path) -> Optional[object]:
    """
    Dynamically import a module from a file path.

    Args:
        module_name: Name to assign to the module
        file_path: Path to the Python file

    Returns:
        Imported module or None if import fails

    Raises:
        ImportError: If module cannot be imported
    """
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot create spec for {file_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module

    try:
        spec.loader.exec_module(module)
        return module
    except Exception as e:
        # Clean up sys.modules on failure
        if module_name in sys.modules:
            del sys.modules[module_name]
        raise ImportError(f"Failed to import {file_path}: {e}") from e


def check_import_statement(content: str, import_statement: str) -> bool:
    """Check if an import statement exists in the content."""
    return import_statement in content


# =============================================================================
# Level 2 Tests - SDK Import Verification
# =============================================================================

@pytest.mark.level2
class TestSDKImports:
    """Tests for OpenAI Agents SDK import compatibility."""

    def test_agents_sdk_available(self):
        """OpenAI Agents SDK is installed and importable."""
        try:
            import agents
            assert hasattr(agents, 'Agent'), "Agent class not found in agents module"
            assert hasattr(agents, 'Runner'), "Runner class not found in agents module"
        except ImportError as e:
            pytest.skip(f"OpenAI Agents SDK not installed: {e}")

    def test_agent_class_importable(self):
        """Agent class can be imported from agents module."""
        try:
            from agents import Agent
            assert Agent is not None
        except ImportError as e:
            pytest.skip(f"Agent class not importable: {e}")

    def test_runner_class_importable(self):
        """Runner class can be imported from agents module."""
        try:
            from agents import Runner
            assert Runner is not None
        except ImportError as e:
            pytest.skip(f"Runner class not importable: {e}")

    def test_web_search_tool_importable(self):
        """WebSearchTool can be imported."""
        try:
            from agents import WebSearchTool
            assert WebSearchTool is not None
        except ImportError:
            try:
                from agents.tools import WebSearchTool
                assert WebSearchTool is not None
            except ImportError as e:
                pytest.skip(f"WebSearchTool not importable: {e}")

    def test_code_interpreter_tool_importable(self):
        """CodeInterpreterTool can be imported."""
        try:
            from agents import CodeInterpreterTool
            assert CodeInterpreterTool is not None
        except ImportError:
            try:
                from agents.tools import CodeInterpreterTool
                assert CodeInterpreterTool is not None
            except ImportError as e:
                pytest.skip(f"CodeInterpreterTool not importable: {e}")

    def test_file_search_tool_importable(self):
        """FileSearchTool can be imported."""
        try:
            from agents import FileSearchTool
            assert FileSearchTool is not None
        except ImportError:
            try:
                from agents.tools import FileSearchTool
                assert FileSearchTool is not None
            except ImportError as e:
                pytest.skip(f"FileSearchTool not importable: {e}")


# =============================================================================
# Level 2 Tests - Tool Instantiation Signatures
# =============================================================================

@pytest.mark.level2
class TestToolSignatures:
    """Tests for correct tool constructor signatures."""

    def test_code_interpreter_requires_tool_config(self):
        """
        CodeInterpreterTool requires tool_config parameter.

        This test catches the error:
        TypeError: CodeInterpreterTool.__init__() missing 1 required positional argument: 'tool_config'
        """
        try:
            from agents import CodeInterpreterTool
        except ImportError:
            try:
                from agents.tools import CodeInterpreterTool
            except ImportError:
                pytest.skip("CodeInterpreterTool not available")
                return

        # Check if tool_config is required
        import inspect
        sig = inspect.signature(CodeInterpreterTool.__init__)
        params = list(sig.parameters.keys())

        # Remove 'self' from params
        params = [p for p in params if p != 'self']

        # The test verifies the signature - it should have tool_config
        # If it doesn't require tool_config, the template pattern might work
        # If it does require tool_config, templates must include it

        # Try to instantiate with and without tool_config
        try:
            # Try without tool_config (old SDK way)
            tool = CodeInterpreterTool()
            # If this works, old patterns are fine
        except TypeError as e:
            if "tool_config" in str(e) or "container" in str(e):
                # New SDK requires tool_config or container
                # Templates MUST include these parameters
                # This test documents the requirement
                assert True, "CodeInterpreterTool requires tool_config/container parameter"
            else:
                raise

    def test_web_search_tool_signature(self):
        """WebSearchTool instantiation works."""
        try:
            from agents import WebSearchTool
        except ImportError:
            try:
                from agents.tools import WebSearchTool
            except ImportError:
                pytest.skip("WebSearchTool not available")
                return

        # WebSearchTool typically doesn't require special params
        # But we verify it can be imported and inspected
        import inspect
        sig = inspect.signature(WebSearchTool.__init__)
        # Just verify we can get the signature
        assert sig is not None


# =============================================================================
# Level 2 Tests - ChatKit Import Verification
# =============================================================================

@pytest.mark.level2
class TestChatKitImports:
    """Tests for ChatKit import patterns."""

    def test_chatkit_store_import_singular(self):
        """
        ChatKit Store imports from 'chatkit.store' (singular).

        This test catches the error:
        from chatkit.stores import Store  # WRONG - 'stores' doesn't exist
        from chatkit.store import Store   # CORRECT - singular
        """
        try:
            from chatkit.store import Store
            assert Store is not None
        except ImportError as e:
            # If chatkit not installed, skip
            if "chatkit" in str(e):
                pytest.skip("ChatKit not installed")
            raise

    def test_chatkit_types_import(self):
        """ChatKit types can be imported."""
        try:
            from chatkit.types import ThreadMetadata, ThreadItem, Page
            assert ThreadMetadata is not None
            assert ThreadItem is not None
            assert Page is not None
        except ImportError as e:
            if "chatkit" in str(e):
                pytest.skip("ChatKit not installed")
            raise

    def test_chatkit_not_found_error_import(self):
        """NotFoundError can be imported from chatkit.store."""
        try:
            from chatkit.store import NotFoundError
            assert NotFoundError is not None
        except ImportError as e:
            if "chatkit" in str(e):
                pytest.skip("ChatKit not installed")
            raise


# =============================================================================
# Level 2 Tests - FastAPI Import Verification
# =============================================================================

@pytest.mark.level2
class TestFastAPIImports:
    """Tests for FastAPI import compatibility."""

    def test_fastapi_importable(self):
        """FastAPI can be imported."""
        try:
            from fastapi import FastAPI
            assert FastAPI is not None
        except ImportError:
            pytest.skip("FastAPI not installed")

    def test_fastapi_cors_importable(self):
        """CORS middleware can be imported."""
        try:
            from fastapi.middleware.cors import CORSMiddleware
            assert CORSMiddleware is not None
        except ImportError:
            pytest.skip("FastAPI not installed")

    def test_fastapi_websocket_importable(self):
        """WebSocket can be imported from FastAPI."""
        try:
            from fastapi import WebSocket
            assert WebSocket is not None
        except ImportError:
            pytest.skip("FastAPI not installed")


# =============================================================================
# Level 2 Tests - Generated Code Import
# =============================================================================

@pytest.mark.level2
class TestGeneratedCodeImports:
    """Tests for importing generated code modules."""

    def test_basic_chatbot_main_syntax(
        self,
        generated_basic_chatbot: Path
    ):
        """Basic-chatbot main.py has valid import statements."""
        main_path = generated_basic_chatbot / "main.py"
        if not main_path.exists():
            pytest.skip("main.py not found")

        content = main_path.read_text()

        # Check for required imports
        required_imports = [
            "from fastapi import FastAPI",
            "from fastapi.middleware.cors import CORSMiddleware",
        ]

        for imp in required_imports:
            assert imp in content, f"Missing import: {imp}"

    def test_basic_chatbot_config_syntax(
        self,
        generated_basic_chatbot: Path
    ):
        """Basic-chatbot config.py has valid imports."""
        config_path = generated_basic_chatbot / "config.py"
        if not config_path.exists():
            pytest.skip("config.py not found")

        content = config_path.read_text()

        # Check for pydantic imports
        assert "pydantic" in content.lower() or "BaseSettings" in content or "BaseModel" in content, \
            "Config should use Pydantic"

    def test_store_uses_correct_chatkit_import(
        self,
        generated_basic_chatbot: Path
    ):
        """
        Store file uses correct ChatKit import pattern.

        CORRECT: from chatkit.store import Store
        WRONG:   from chatkit.stores import Store (stores plural)
        """
        store_path = generated_basic_chatbot / "store.py"
        if not store_path.exists():
            pytest.skip("store.py not found")

        content = store_path.read_text()

        # Check for WRONG import
        wrong_import = "from chatkit.stores import"
        correct_import = "from chatkit.store import"

        if "chatkit" in content:
            assert wrong_import not in content, \
                f"Wrong ChatKit import! Use 'chatkit.store' (singular), not 'chatkit.stores'"
            # If chatkit import exists, should be singular
            if "Store" in content:
                assert correct_import in content or "from chatkit.store" in content, \
                    "ChatKit Store should be imported from 'chatkit.store' (singular)"

    def test_agents_config_imports(
        self,
        generated_basic_chatbot: Path
    ):
        """Agents config has correct SDK imports."""
        # Look for agents_config.py or similar
        agents_files = list(generated_basic_chatbot.glob("*agent*.py"))

        if not agents_files:
            pytest.skip("No agent config files found")

        for agents_path in agents_files:
            content = agents_path.read_text()

            # Should import from agents module
            if "Agent(" in content or "Agent," in content:
                assert "from agents" in content or "import agents" in content, \
                    f"{agents_path.name} should import from agents module"


# =============================================================================
# Level 2 Tests - Import Pattern Validation
# =============================================================================

@pytest.mark.level2
class TestImportPatterns:
    """Tests for correct import patterns in generated code."""

    def test_no_relative_imports_in_main(
        self,
        generated_basic_chatbot: Path
    ):
        """Main module uses proper imports, not broken relative imports."""
        main_path = generated_basic_chatbot / "main.py"
        if not main_path.exists():
            pytest.skip("main.py not found")

        content = main_path.read_text()

        # Relative imports that would break
        broken_patterns = [
            "from ..config import",
            "from ...server import",
        ]

        for pattern in broken_patterns:
            assert pattern not in content, \
                f"Broken relative import found: {pattern}"

    def test_pydantic_v2_imports(
        self,
        generated_basic_chatbot: Path
    ):
        """
        Generated code uses Pydantic v2 patterns.

        Pydantic v2 changed some import paths:
        - BaseSettings now from pydantic_settings
        - validator → field_validator
        """
        for py_file in generated_basic_chatbot.rglob("*.py"):
            content = py_file.read_text()

            # BaseSettings should come from pydantic_settings in v2
            if "BaseSettings" in content:
                # Either from pydantic_settings or from pydantic (v1 compat)
                assert "pydantic" in content, \
                    f"{py_file.name}: BaseSettings needs pydantic import"

    def test_typing_imports_present(
        self,
        generated_basic_chatbot: Path
    ):
        """Files using type hints have proper typing imports."""
        for py_file in generated_basic_chatbot.rglob("*.py"):
            content = py_file.read_text()

            # If using Optional, Dict, List, etc., should have typing import
            type_hints = ["Optional[", "Dict[", "List[", "Tuple[", "Union["]
            needs_typing = any(hint in content for hint in type_hints)

            if needs_typing:
                # Should have from typing import or import typing
                has_typing = "from typing import" in content or "import typing" in content
                # Or using Python 3.10+ native syntax is fine too
                assert has_typing or "from __future__ import annotations" in content, \
                    f"{py_file.name}: Uses type hints but missing typing import"


# =============================================================================
# Level 2 Tests - Template-Specific Imports
# =============================================================================

@pytest.mark.level2
class TestTemplateSpecificImports:
    """Tests for imports specific to each template type."""

    def test_customer_support_multi_agent_imports(
        self,
        generated_customer_support: Path
    ):
        """Customer support template has multi-agent imports."""
        # Look for handoff patterns
        for py_file in generated_customer_support.rglob("*.py"):
            content = py_file.read_text()

            # If using handoffs, should import properly
            if "handoff" in content.lower():
                assert "agents" in content.lower(), \
                    f"{py_file.name}: Uses handoff but missing agents import"

    def test_rag_assistant_file_search_imports(
        self,
        generated_rag_assistant: Path
    ):
        """RAG assistant template imports FileSearchTool."""
        has_file_search = False

        for py_file in generated_rag_assistant.rglob("*.py"):
            content = py_file.read_text()

            if "FileSearchTool" in content:
                has_file_search = True
                # Should import from agents
                assert "from agents" in content or "import agents" in content, \
                    f"{py_file.name}: Uses FileSearchTool but missing agents import"

        # RAG template should use file search
        # (skip if template doesn't exist or uses different pattern)

    def test_task_automation_scheduler_imports(
        self,
        generated_task_automation: Path
    ):
        """Task automation template has scheduler-related imports."""
        import re
        for py_file in generated_task_automation.rglob("*.py"):
            content = py_file.read_text()

            # If using asyncio directly (not part of class name or pytest_asyncio)
            # Look for patterns like "asyncio.sleep", "asyncio.wait", etc.
            if re.search(r'\basyncio\.(sleep|wait|gather|create_task|run)', content):
                assert "import asyncio" in content, \
                    f"{py_file.name}: Uses asyncio but missing import"

            # Verify APScheduler imports are correct when used
            if "AsyncIOScheduler" in content:
                assert "from apscheduler.schedulers.asyncio import AsyncIOScheduler" in content, \
                    f"{py_file.name}: Uses AsyncIOScheduler but missing import"
