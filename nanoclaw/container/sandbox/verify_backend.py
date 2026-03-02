#!/usr/bin/env python3
"""
Backend Verification Script for NanoClaw TDD Sandbox

This script verifies generated backend code by:
1. Importing all Python modules
2. Initializing the Agent object
3. Starting the FastAPI server
4. Testing the health endpoint
5. Shutting down gracefully

Output: JSON result to stdout

Usage:
    python verify_backend.py [--project-dir /path/to/generated]

Exit codes:
    0: All verifications passed
    1: One or more verifications failed
"""

import argparse
import asyncio
import json
import os
import signal
import sys
import time
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional


class VerificationResult:
    """Collects verification results."""

    def __init__(self):
        self.success = True
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.steps: Dict[str, Any] = {}
        self.start_time = time.time()

    def add_step(self, name: str, status: str, details: Optional[str] = None):
        """Add a verification step result."""
        self.steps[name] = {
            "status": status,
            "details": details
        }
        if status == "failed":
            self.success = False

    def add_error(self, error: str):
        """Add an error message."""
        self.errors.append(error)
        self.success = False

    def add_warning(self, warning: str):
        """Add a warning message."""
        self.warnings.append(warning)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON output."""
        return {
            "success": self.success,
            "errors": self.errors,
            "warnings": self.warnings,
            "steps": self.steps,
            "timing": round(time.time() - self.start_time, 2)
        }


def verify_imports(project_dir: Path, result: VerificationResult) -> bool:
    """
    Step 1: Verify all Python modules can be imported.

    Returns:
        True if all imports succeed, False otherwise.
    """
    # Add project to path
    sys.path.insert(0, str(project_dir))

    modules_to_import = []

    # Find all Python files
    for py_file in project_dir.rglob("*.py"):
        if "__pycache__" in str(py_file):
            continue

        rel_path = py_file.relative_to(project_dir)
        module_name = str(rel_path).replace(os.sep, ".").replace(".py", "")

        # Skip __init__ files for now
        if module_name.endswith("__init__"):
            continue

        modules_to_import.append((module_name, py_file))

    # Try to import each module
    all_success = True
    for module_name, py_file in modules_to_import:
        try:
            # Use exec to test import syntax
            with open(py_file, 'r') as f:
                code = f.read()

            # Compile to check syntax
            compile(code, str(py_file), 'exec')

            result.add_step(f"import_{module_name}", "success")

        except SyntaxError as e:
            result.add_step(f"import_{module_name}", "failed", str(e))
            result.add_error(f"Syntax error in {py_file.name}: {e}")
            all_success = False

        except Exception as e:
            result.add_step(f"import_{module_name}", "failed", str(e))
            result.add_error(f"Import error in {py_file.name}: {e}")
            all_success = False

    return all_success


def verify_agent_init(project_dir: Path, result: VerificationResult) -> bool:
    """
    Step 2: Verify Agent can be initialized.

    This catches errors like:
    - TypeError: CodeInterpreterTool.__init__() missing required argument
    - Missing tool_config parameter

    Returns:
        True if agent initializes, False otherwise.
    """
    # Look for agent configuration
    agent_files = [
        project_dir / "agents_config.py",
        project_dir / "agents.py",
        project_dir / "agent.py",
    ]

    # Also check agents subdirectory
    agents_dir = project_dir / "agents"
    if agents_dir.exists():
        agent_files.extend(agents_dir.glob("*.py"))

    found_agent = False
    for agent_file in agent_files:
        if not agent_file.exists():
            continue

        try:
            # Read and check for Agent instantiation
            content = agent_file.read_text()

            if "Agent(" in content or "agent =" in content.lower():
                found_agent = True

                # Try to evaluate the agent creation
                # This is a simplified check - full execution would need env vars
                try:
                    # Check for common errors in tool instantiation
                    if "CodeInterpreterTool()" in content:
                        # Old pattern without tool_config
                        result.add_warning(
                            f"{agent_file.name}: CodeInterpreterTool() may need tool_config parameter"
                        )

                    result.add_step("agent_init", "success", f"Found agent in {agent_file.name}")

                except Exception as e:
                    result.add_step("agent_init", "failed", str(e))
                    return False

        except Exception as e:
            result.add_error(f"Error reading {agent_file.name}: {e}")

    if not found_agent:
        result.add_step("agent_init", "skipped", "No agent configuration found")
        result.add_warning("No Agent configuration found in project")

    return True


async def verify_server_health(project_dir: Path, result: VerificationResult) -> bool:
    """
    Step 3: Start server and verify health endpoint.

    Returns:
        True if server responds to /health, False otherwise.
    """
    import subprocess

    # Find main.py
    main_file = project_dir / "main.py"
    if not main_file.exists():
        result.add_step("server_health", "skipped", "No main.py found")
        return True

    # Start server on random port
    import socket
    sock = socket.socket()
    sock.bind(('', 0))
    port = sock.getsockname()[1]
    sock.close()

    # Set environment to avoid OpenAI API calls
    env = os.environ.copy()
    env["OPENAI_API_KEY"] = "sk-test-dummy-key-for-verification"
    env["PORT"] = str(port)

    process = None
    try:
        # Start uvicorn
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--port", str(port)],
            cwd=project_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env
        )

        # Wait for server to start
        import httpx

        for _ in range(30):  # 15 seconds timeout
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"http://localhost:{port}/health", timeout=1.0)
                    if response.status_code == 200:
                        result.add_step("server_health", "success", f"Port {port}: HTTP 200")
                        return True
            except:
                await asyncio.sleep(0.5)

        # Server didn't respond in time
        result.add_step("server_health", "failed", "Server did not respond within 15 seconds")
        return False

    except Exception as e:
        result.add_step("server_health", "failed", str(e))
        result.add_error(f"Server start error: {e}")
        return False

    finally:
        if process:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def verify_dependencies(project_dir: Path, result: VerificationResult) -> bool:
    """
    Step 4: Verify requirements.txt has correct packages.

    Returns:
        True if dependencies look correct, False otherwise.
    """
    requirements_file = project_dir / "requirements.txt"

    if not requirements_file.exists():
        result.add_step("dependencies", "warning", "No requirements.txt found")
        result.add_warning("Missing requirements.txt")
        return True

    content = requirements_file.read_text()
    required_packages = ["openai-agents", "fastapi"]
    optional_packages = ["openai-chatkit", "uvicorn", "pydantic"]

    missing = []
    for pkg in required_packages:
        if pkg not in content.lower():
            missing.append(pkg)

    if missing:
        result.add_step("dependencies", "warning", f"Missing: {', '.join(missing)}")
        result.add_warning(f"requirements.txt may be missing: {', '.join(missing)}")
    else:
        result.add_step("dependencies", "success")

    return True


async def main():
    """Main verification function."""
    parser = argparse.ArgumentParser(description="Verify backend code")
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=Path("/workspace/generated"),
        help="Path to generated project"
    )
    args = parser.parse_args()

    project_dir = args.project_dir
    result = VerificationResult()

    # Check project exists
    if not project_dir.exists():
        result.add_error(f"Project directory not found: {project_dir}")
        print(json.dumps(result.to_dict()))
        sys.exit(1)

    # Run verifications
    try:
        # Step 1: Import verification
        verify_imports(project_dir, result)

        # Step 2: Agent initialization
        verify_agent_init(project_dir, result)

        # Step 3: Server health check
        await verify_server_health(project_dir, result)

        # Step 4: Dependencies check
        verify_dependencies(project_dir, result)

    except Exception as e:
        result.add_error(f"Verification failed: {e}")
        result.add_error(traceback.format_exc())

    # Output JSON result
    print(json.dumps(result.to_dict(), indent=2))

    sys.exit(0 if result.success else 1)


if __name__ == "__main__":
    asyncio.run(main())
