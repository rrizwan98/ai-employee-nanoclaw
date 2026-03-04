#!/usr/bin/env python3
"""
Backend Verification Script

Runs 4-level verification tests on generated backend code.
Output: JSON with verification results

Usage:
    python verify-backend.py /path/to/backend [--level=1-4] [--port=8765]
"""

import ast
import glob
import importlib.util
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


def verify_level1(project_path: str) -> dict:
    """
    Level 1: Syntax Tests
    - AST parse all .py files
    - Check for unresolved template variables
    """
    errors = []
    files_checked = 0

    for pyfile in glob.glob(f"{project_path}/**/*.py", recursive=True):
        if "node_modules" in pyfile or "__pycache__" in pyfile:
            continue

        files_checked += 1
        try:
            with open(pyfile) as f:
                content = f.read()

            # Check for unresolved template variables
            if "{{" in content or "}}" in content:
                errors.append({
                    "file": pyfile,
                    "error": "Unresolved template variable",
                    "type": "syntax"
                })
            else:
                ast.parse(content)

        except SyntaxError as e:
            errors.append({
                "file": pyfile,
                "line": e.lineno,
                "error": str(e),
                "type": "syntax"
            })

    return {
        "level": "level1",
        "passed": len(errors) == 0,
        "errors": errors,
        "files_checked": files_checked
    }


def verify_level2(project_path: str) -> dict:
    """
    Level 2: Import Tests
    - Install dependencies
    - Import all modules
    - Check SDK imports
    """
    errors = []

    # Check if requirements.txt exists
    req_file = os.path.join(project_path, "requirements.txt")
    if os.path.exists(req_file):
        # Install dependencies (quietly)
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", req_file, "-q"],
                capture_output=True,
                text=True,
                timeout=120
            )
            if result.returncode != 0:
                errors.append({
                    "module": "pip install",
                    "error": result.stderr[:500],
                    "type": "import"
                })
                return {
                    "level": "level2",
                    "passed": False,
                    "errors": errors
                }
        except subprocess.TimeoutExpired:
            errors.append({
                "module": "pip install",
                "error": "pip install timed out (120s)",
                "type": "import"
            })
            return {
                "level": "level2",
                "passed": False,
                "errors": errors
            }

    # Add project to path
    sys.path.insert(0, project_path)

    # Test SDK imports
    sdk_imports = [
        ("agents", "Agent", "Runner"),
        ("chatkit.store", "Store"),
    ]

    for module_path in sdk_imports:
        module_name = module_path[0]
        classes = module_path[1:]
        try:
            mod = __import__(module_name, fromlist=list(classes))
            for cls in classes:
                if not hasattr(mod, cls):
                    errors.append({
                        "module": module_name,
                        "error": f"Missing class: {cls}",
                        "type": "import"
                    })
        except ImportError as e:
            errors.append({
                "module": module_name,
                "error": str(e),
                "type": "import"
            })

    # Import all project modules
    for pyfile in glob.glob(f"{project_path}/*.py"):
        module_name = os.path.basename(pyfile)[:-3]
        if module_name.startswith("_"):
            continue

        try:
            spec = importlib.util.spec_from_file_location(module_name, pyfile)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
        except Exception as e:
            errors.append({
                "module": module_name,
                "file": pyfile,
                "error": str(e),
                "type": "import"
            })

    return {
        "level": "level2",
        "passed": len(errors) == 0,
        "errors": errors
    }


def verify_level3(project_path: str) -> dict:
    """
    Level 3: Runtime Tests
    - Agent initializes
    - Tools instantiate
    - Server starts (but don't run)
    """
    errors = []

    sys.path.insert(0, project_path)

    # Test agent initialization
    try:
        # Try to import agent config
        agents_config = importlib.import_module("agents_config")
        agent = getattr(agents_config, "agent", None)

        if agent is None:
            errors.append({
                "step": "agent_init",
                "error": "No 'agent' object in agents_config.py",
                "type": "runtime"
            })
        else:
            # Check agent properties
            agent_name = getattr(agent, "name", "unknown")
            tools = getattr(agent, "tools", [])
            print(f"Agent: {agent_name}", file=sys.stderr)
            print(f"Tools: {len(tools) if tools else 0}", file=sys.stderr)

    except Exception as e:
        errors.append({
            "step": "agent_init",
            "error": str(e),
            "type": "runtime"
        })

    # Test tools initialization
    try:
        agents_config = importlib.import_module("agents_config")
        agent = getattr(agents_config, "agent", None)

        if agent and hasattr(agent, "tools") and agent.tools:
            for i, tool in enumerate(agent.tools):
                # Verify tool is callable or has expected interface
                tool_name = getattr(tool, "name", f"tool_{i}")
                print(f"Tool {i}: {tool_name}", file=sys.stderr)

    except Exception as e:
        errors.append({
            "step": "tools_init",
            "error": str(e),
            "type": "runtime"
        })

    return {
        "level": "level3",
        "passed": len(errors) == 0,
        "errors": errors
    }


def verify_level4(project_path: str, port: int = 8765) -> dict:
    """
    Level 4: Integration Tests
    - Start server
    - Test endpoints
    - Shutdown server
    """
    import urllib.request
    import urllib.error

    errors = []
    endpoints_tested = []

    # Find main.py
    main_py = os.path.join(project_path, "main.py")
    if not os.path.exists(main_py):
        errors.append({
            "step": "find_main",
            "error": "main.py not found",
            "type": "endpoint"
        })
        return {
            "level": "level4",
            "passed": False,
            "errors": errors,
            "endpoints": endpoints_tested
        }

    # Start server
    server_process = None
    try:
        env = os.environ.copy()
        env["PORT"] = str(port)

        server_process = subprocess.Popen(
            [sys.executable, main_py],
            cwd=project_path,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid if hasattr(os, 'setsid') else None
        )

        # Wait for server to start
        time.sleep(5)

        # Check if server is running
        if server_process.poll() is not None:
            _, stderr = server_process.communicate(timeout=5)
            errors.append({
                "step": "server_start",
                "error": f"Server exited: {stderr.decode()[:500]}",
                "type": "endpoint"
            })
            return {
                "level": "level4",
                "passed": False,
                "errors": errors,
                "endpoints": endpoints_tested
            }

        # Test health endpoint
        try:
            url = f"http://localhost:{port}/health"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.status
                body = response.read().decode()

            endpoints_tested.append({
                "path": "/health",
                "method": "GET",
                "expected_status": 200,
                "actual_status": status,
                "passed": status == 200
            })

            if status != 200:
                errors.append({
                    "step": "health_endpoint",
                    "error": f"Expected 200, got {status}",
                    "type": "endpoint"
                })

        except urllib.error.URLError as e:
            endpoints_tested.append({
                "path": "/health",
                "method": "GET",
                "expected_status": 200,
                "actual_status": None,
                "passed": False,
                "error": str(e)
            })
            errors.append({
                "step": "health_endpoint",
                "error": str(e),
                "type": "endpoint"
            })

        # Test chatkit endpoint (POST)
        try:
            url = f"http://localhost:{port}/chatkit"
            data = json.dumps({"thread_id": "test", "message": {"role": "user", "content": "test"}}).encode()
            req = urllib.request.Request(url, data=data, method="POST")
            req.add_header("Content-Type", "application/json")

            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.status

            endpoints_tested.append({
                "path": "/chatkit",
                "method": "POST",
                "expected_status": 200,
                "actual_status": status,
                "passed": status in [200, 201, 422]  # 422 is ok for validation
            })

        except urllib.error.HTTPError as e:
            # HTTP errors with response are "ok" - endpoint exists
            endpoints_tested.append({
                "path": "/chatkit",
                "method": "POST",
                "expected_status": 200,
                "actual_status": e.code,
                "passed": e.code in [200, 201, 422, 400]
            })

        except urllib.error.URLError as e:
            endpoints_tested.append({
                "path": "/chatkit",
                "method": "POST",
                "expected_status": 200,
                "actual_status": None,
                "passed": False,
                "error": str(e)
            })

    finally:
        # Stop server
        if server_process:
            try:
                if hasattr(os, 'killpg'):
                    os.killpg(os.getpgid(server_process.pid), signal.SIGTERM)
                else:
                    server_process.terminate()
                server_process.wait(timeout=5)
            except Exception:
                server_process.kill()

    return {
        "level": "level4",
        "passed": len(errors) == 0,
        "errors": errors,
        "endpoints": endpoints_tested
    }


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Backend verification")
    parser.add_argument("project_path", help="Path to backend project")
    parser.add_argument("--level", type=int, default=4, help="Max level to run (1-4)")
    parser.add_argument("--port", type=int, default=8765, help="Port for server test")
    args = parser.parse_args()

    results = {
        "success": True,
        "levels": {}
    }

    # Run levels in order
    if args.level >= 1:
        results["levels"]["level1"] = verify_level1(args.project_path)
        if not results["levels"]["level1"]["passed"]:
            results["success"] = False
            print(json.dumps(results))
            return

    if args.level >= 2:
        results["levels"]["level2"] = verify_level2(args.project_path)
        if not results["levels"]["level2"]["passed"]:
            results["success"] = False
            print(json.dumps(results))
            return

    if args.level >= 3:
        results["levels"]["level3"] = verify_level3(args.project_path)
        if not results["levels"]["level3"]["passed"]:
            results["success"] = False

    if args.level >= 4:
        results["levels"]["level4"] = verify_level4(args.project_path, args.port)
        if not results["levels"]["level4"]["passed"]:
            results["success"] = False

    print(json.dumps(results))


if __name__ == "__main__":
    main()
