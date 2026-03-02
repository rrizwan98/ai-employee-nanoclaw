# NanoClaw Container Tests

4-Level TDD Testing System for AI Employee template verification.

## Overview

This test suite verifies that generated agent code works correctly BEFORE delivery to clients. It catches errors at four levels:

| Level | Purpose | Time | Dependencies |
|-------|---------|------|--------------|
| Level 1 | Syntax validation | ~5s | None |
| Level 2 | Import verification | ~15s | Python SDK |
| Level 3 | Runtime testing | ~60s | Docker sandbox |
| Level 4 | Integration testing | ~120s | Full stack |

## Quick Start

```bash
# Install test dependencies
pip install -r requirements.txt

# Run fast tests (Level 1)
pytest -m level1

# Run import tests (Level 2)
pytest -m level2

# Run all fast tests
pytest -m "level1 or level2"

# Run sandbox tests (requires Docker)
pytest -m level3 --use-sandbox
pytest -m level4 --use-sandbox

# Run everything
pytest --use-sandbox
```

## Test Levels

### Level 1: Syntax Tests
- Template renders correctly
- Variables are substituted
- Python syntax is valid
- No unresolved placeholders

**Files:** `test_templates.py`

### Level 2: Import Tests
- Generated code imports without errors
- SDK classes are available
- Correct import patterns (e.g., `chatkit.store` not `chatkit.stores`)
- Tool signatures match SDK version

**Files:** `level2_import_tests.py`

### Level 3: Runtime Tests
- Agent initializes without TypeError
- Tools instantiate with correct parameters
- FastAPI server starts
- Health endpoint responds
- Frontend builds (`npm run build`)
- "use client" directive present

**Files:** `level3_runtime_tests.py`

### Level 4: Integration Tests
- Chat message round-trip
- CORS allows frontend
- Streaming responses
- Session persistence
- Thread management
- Error handling

**Files:** `level4_integration_tests.py`

## Sandbox Container

Level 3-4 tests run in an isolated Docker container:

```bash
# Build sandbox
docker build -t nanoclaw-test-sandbox nanoclaw/container/sandbox/

# Run backend verification
docker run --rm -v ./generated:/workspace/generated nanoclaw-test-sandbox backend

# Run frontend verification
docker run --rm -v ./generated:/workspace/generated nanoclaw-test-sandbox frontend
```

## Directory Structure

```
tests/
├── __init__.py
├── conftest.py              # Fixtures and configuration
├── pytest.ini               # Pytest settings
├── requirements.txt         # Test dependencies
├── README.md                # This file
├── test_templates.py        # Level 1 tests
├── level2_import_tests.py   # Level 2 tests
├── level3_runtime_tests.py  # Level 3 tests
├── level4_integration_tests.py  # Level 4 tests
└── fixtures/
    ├── sample_agent_config.json
    └── sample_requirements.json

sandbox/
├── Dockerfile
├── requirements.txt
├── package.json
├── verify_backend.py
├── verify_frontend.sh
└── entrypoint.sh
```

## Fixtures

Key fixtures available in all tests:

| Fixture | Description |
|---------|-------------|
| `temp_project_dir` | Temporary directory (cleaned after test) |
| `sample_agent_config` | Test configurations for all templates |
| `template_renderer` | Renders templates with variables |
| `generated_basic_chatbot` | Pre-generated basic-chatbot |
| `generated_customer_support` | Pre-generated customer-support |
| `sandbox_runner` | Docker sandbox executor |
| `check_placeholders` | Find unresolved `{{VAR}}` |
| `check_python_syntax` | Validate Python syntax |

## CI/CD Integration

Recommended workflow:

1. **On PR**: Run Level 1-2 (fast feedback)
   ```bash
   pytest -m "level1 or level2"
   ```

2. **On Merge**: Run Level 1-4 (full verification)
   ```bash
   pytest --use-sandbox
   ```

3. **Nightly**: Run with coverage
   ```bash
   pytest --use-sandbox --cov=templates
   ```

## Common Errors Caught

### Level 2: Import Errors
```
from chatkit.stores import Store  # WRONG - 'stores' plural
from chatkit.store import Store   # CORRECT - singular
```

### Level 3: Runtime Errors
```python
# WRONG - Missing tool_config
CodeInterpreterTool()

# CORRECT - Include tool_config
CodeInterpreterTool(tool_config={"type": "code_interpreter"})
```

### Level 3: Frontend Errors
```tsx
// WRONG - Missing "use client"
export default function Button() {
  return <button onClick={() => {}}>Click</button>
}

// CORRECT - Has "use client"
"use client"
export default function Button() {
  return <button onClick={() => {}}>Click</button>
}
```

## Writing New Tests

1. Choose appropriate level based on what you're testing
2. Add marker: `@pytest.mark.level1` (or level2, level3, level4)
3. Use fixtures for generated code
4. For sandbox tests, check availability:
   ```python
   if not sandbox_runner.is_available():
       pytest.skip("Sandbox not available")
   ```

## Troubleshooting

### Tests Hang
- Check if server is running on expected port
- Increase timeout in pytest.ini
- Kill orphan processes: `pkill -f uvicorn`

### Sandbox Not Found
- Build container: `docker build -t nanoclaw-test-sandbox sandbox/`
- Check Docker is running: `docker info`

### Import Errors
- Verify SDK is installed: `pip show openai-agents`
- Check Python version: `python --version` (need 3.10+)
