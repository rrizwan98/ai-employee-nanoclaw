# Implementation Plan: Phase 5 - TDD Level Upgrade

**Branch**: `005-phase5-tdd-upgrade` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-phase5-tdd-upgrade/spec.md`

## Summary

Upgrade the TDD system from single-level template rendering tests to comprehensive 4-level testing that verifies imports, runtime initialization, and integration BEFORE code delivery. This eliminates runtime errors reaching clients by catching SDK compatibility issues, initialization errors, and integration failures during the test phase.

## Technical Context

**Language/Version**: Python 3.12 (sandbox), Python 3.10+ (local tests)
**Primary Dependencies**: pytest, pytest-asyncio, pytest-docker, httpx
**Storage**: N/A (tests are stateless)
**Testing**: pytest with markers (level1, level2, level3, level4)
**Target Platform**: Windows (local), Linux (Docker sandbox)
**Project Type**: Test infrastructure enhancement
**Performance Goals**: Full test suite under 3 minutes
**Constraints**: Level 1-2 without Docker, Level 3-4 require Docker
**Scale/Scope**: 6 templates, 4 test levels, 1 sandbox container

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity | PASS | Extends existing test structure, no new abstractions |
| Modularity | PASS | Each level is independent, can run separately |
| Testability | PASS | Tests are self-testing via pytest |
| No Over-engineering | PASS | Minimal additions, reuses existing templates |
| TDD Compliance | PASS | This IS the TDD infrastructure upgrade |

## Project Structure

### Documentation (this feature)

```text
specs/005-phase5-tdd-upgrade/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Implementation tasks (created by /sp.tasks)
```

### Source Code (repository root)

```text
nanoclaw/container/
├── tests/
│   ├── __init__.py              # NEW: Package init
│   ├── conftest.py              # ENHANCED: Fixtures for all levels
│   ├── test_templates.py        # ENHANCED: Level 1 with markers
│   ├── level2_import_tests.py   # NEW: Import verification
│   ├── level3_runtime_tests.py  # NEW: Runtime verification
│   ├── level4_integration_tests.py  # NEW: Integration tests
│   └── fixtures/
│       ├── __init__.py          # NEW: Fixtures package
│       ├── sample_agent_config.json   # NEW: Test configurations
│       └── sample_requirements.json   # NEW: Test requirements
├── sandbox/
│   ├── Dockerfile               # NEW: Test sandbox container
│   ├── verify_backend.py        # NEW: Backend verification script
│   ├── verify_frontend.sh       # NEW: Frontend verification script
│   ├── requirements.txt         # NEW: Sandbox dependencies
│   └── entrypoint.sh            # NEW: Sandbox entrypoint
└── templates/
    └── (existing - 6 templates)
```

**Structure Decision**: Tests reside in `nanoclaw/container/tests/` to be close to templates. Sandbox in `nanoclaw/container/sandbox/` provides isolated verification environment.

## Architecture

### 4-Level Test Pyramid

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST PYRAMID                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌───────────┐                            │
│                    │  Level 4  │  Integration (~60s)        │
│                    │  E2E Flow │  Backend + Frontend        │
│                    └─────┬─────┘                            │
│                          │                                  │
│               ┌──────────┴──────────┐                       │
│               │       Level 3       │  Runtime (~30s)       │
│               │  Agent Init, Server │  Sandbox Container    │
│               └──────────┬──────────┘                       │
│                          │                                  │
│          ┌───────────────┴───────────────┐                  │
│          │           Level 2             │  Imports (~15s)  │
│          │  Import all generated modules │  Local Python    │
│          └───────────────┬───────────────┘                  │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────┐          │
│  │                   Level 1                     │  (~5s)   │
│  │  Template rendering, syntax validation        │  Fastest │
│  └───────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Test Flow Per Level

```
Level 1 (Syntax):
  Template → Render → Validate Syntax → PASS/FAIL

Level 2 (Import):
  Template → Render → Write to temp → import module → PASS/FAIL
                                            ↓
                                    Check: ImportError?
                                    Check: ModuleNotFoundError?

Level 3 (Runtime):
  Template → Render → Copy to Sandbox → Install deps → Init Agent → Start Server → Health Check → PASS/FAIL
                                                              ↓                        ↓
                                                     Check: TypeError?         Check: 200 OK?

Level 4 (Integration):
  Backend + Frontend → Start Both → Send Message → Receive Response → PASS/FAIL
                                          ↓                 ↓
                                    Check: CORS OK?    Check: Streaming?
```

### Sandbox Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SANDBOX CONTAINER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Base: python:3.12-slim + node:20                          │
│                                                             │
│  Installed:                                                 │
│  ├── openai-agents>=0.7.0                                  │
│  ├── openai-chatkit>=1.5.0                                 │
│  ├── fastapi>=0.109.0                                      │
│  ├── uvicorn>=0.27.0                                       │
│  ├── pytest>=8.0.0                                         │
│  ├── httpx>=0.27.0                                         │
│  ├── next@14.2.0                                           │
│  └── react@18.2.0                                          │
│                                                             │
│  Volumes:                                                   │
│  ├── /workspace/generated  ← Generated code mounted here   │
│  └── /workspace/results    ← Test results written here     │
│                                                             │
│  Scripts:                                                   │
│  ├── verify_backend.py   → Returns JSON result             │
│  └── verify_frontend.sh  → Returns JSON result             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Test Fixtures

```python
# conftest.py fixtures

@pytest.fixture
def temp_project_dir():
    """Temporary directory for generated code"""

@pytest.fixture
def sample_agent_config():
    """Load sample AgentConfig from fixtures"""

@pytest.fixture
def template_renderer():
    """Renders templates with variables"""

@pytest.fixture
def generated_basic_chatbot(temp_project_dir, template_renderer):
    """Pre-generated basic-chatbot code"""

@pytest.fixture
def generated_customer_support(temp_project_dir, template_renderer):
    """Pre-generated customer-support code"""

@pytest.fixture
def sandbox_runner():
    """Docker sandbox executor with timeout"""

@pytest.fixture
def backend_server():
    """Running backend server for integration tests"""

@pytest.fixture
def frontend_builder():
    """Frontend npm build runner"""
```

## Test Implementation Details

### Level 1: Syntax Tests (Enhanced)

```python
# test_templates.py

@pytest.mark.level1
class TestTemplateSyntax:
    """Fast tests - no imports, just rendering"""

    def test_basic_chatbot_renders(self):
        """Template produces valid output"""

    def test_variables_replaced(self):
        """All {{variable}} placeholders replaced"""

    def test_no_template_syntax_in_output(self):
        """No leftover template syntax"""
```

### Level 2: Import Tests (New)

```python
# level2_import_tests.py

@pytest.mark.level2
class TestTemplateImports:
    """Medium tests - verify generated code imports"""

    def test_basic_chatbot_imports(self, generated_basic_chatbot):
        """All modules import without error"""
        import_module(generated_basic_chatbot / "main.py")
        import_module(generated_basic_chatbot / "config.py")
        import_module(generated_basic_chatbot / "server.py")

    def test_sdk_classes_importable(self):
        """OpenAI Agents SDK classes are accessible"""
        from agents import Agent, Runner
        from agents.tools import WebSearchTool, CodeInterpreterTool

    def test_tool_instantiation_signature(self):
        """Tool constructors have correct signatures"""
        # Verify CodeInterpreterTool requires tool_config
```

### Level 3: Runtime Tests (New)

```python
# level3_runtime_tests.py

@pytest.mark.level3
class TestRuntimeInitialization:
    """Slow tests - require sandbox container"""

    @pytest.mark.asyncio
    async def test_agent_initializes(self, sandbox_runner, generated_basic_chatbot):
        """Agent constructor executes without error"""
        result = await sandbox_runner.verify_backend(generated_basic_chatbot)
        assert result["agent_init"] == "success"

    @pytest.mark.asyncio
    async def test_server_starts(self, sandbox_runner, generated_basic_chatbot):
        """FastAPI server starts and responds to /health"""
        result = await sandbox_runner.verify_backend(generated_basic_chatbot)
        assert result["server_health"] == 200

    def test_frontend_builds(self, sandbox_runner, generated_nextjs_frontend):
        """npm run build completes without errors"""
        result = sandbox_runner.verify_frontend(generated_nextjs_frontend)
        assert result["build_success"] == True
        assert "use client" not in result.get("errors", [])
```

### Level 4: Integration Tests (New)

```python
# level4_integration_tests.py

@pytest.mark.level4
class TestFullIntegration:
    """Slowest tests - full stack verification"""

    @pytest.mark.asyncio
    async def test_chat_roundtrip(self, backend_server, test_client):
        """Send message and receive streaming response"""
        response = await test_client.post("/chat", json={"message": "Hello"})
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_cors_headers(self, backend_server, test_client):
        """CORS allows frontend origin"""
        response = await test_client.options("/chat")
        assert "Access-Control-Allow-Origin" in response.headers

    @pytest.mark.asyncio
    async def test_session_persistence(self, backend_server, test_client):
        """Multiple messages maintain context"""
        # Send two messages, verify context maintained
```

## Complexity Tracking

> No violations - extending existing patterns

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Dependencies

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| pytest | >=8.0.0 | Test framework |
| pytest-asyncio | >=0.23.0 | Async test support |
| pytest-docker | >=2.0.0 | Docker container management |
| pytest-timeout | >=2.2.0 | Test timeouts |
| httpx | >=0.27.0 | Async HTTP client for health checks |

### Internal Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Templates | Complete | 6 templates in nanoclaw/container/templates/ |
| Docker | Required | For Level 3-4 sandbox tests |
| Template renderer | Exists | IPC tools for template generation |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Docker not available | Medium | High | Level 1-2 work without Docker |
| Sandbox build slow | Low | Medium | Cache layers, pre-build in CI |
| Flaky integration tests | Medium | Medium | Retries, timeouts, isolation |
| Port conflicts | Low | Low | Dynamic port allocation |

## Execution Commands

```bash
# Run all tests
pytest nanoclaw/container/tests/

# Run by level
pytest -m level1                    # Fast: ~5 seconds
pytest -m level2                    # Medium: ~15 seconds
pytest -m "level1 or level2"        # CI: ~20 seconds
pytest -m level3 --use-sandbox      # Slow: ~60 seconds
pytest -m level4 --use-sandbox      # Slowest: ~120 seconds

# Run specific template
pytest -k "basic_chatbot"
pytest -k "customer_support"

# Run with coverage
pytest --cov=nanoclaw/container/templates

# Build sandbox container
docker build -t nanoclaw-test-sandbox nanoclaw/container/sandbox/
```

## Success Verification

After implementation, verify:

1. **Level 1 passes**: `pytest -m level1` completes in <10s
2. **Level 2 catches import errors**: Intentionally break SDK import, verify test fails
3. **Level 3 catches runtime errors**: Remove `tool_config`, verify test fails
4. **Level 4 catches integration errors**: Break CORS, verify test fails
5. **Sandbox works**: `docker run nanoclaw-test-sandbox` returns valid JSON

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement in order: Level 1 markers → Level 2 → Sandbox → Level 3 → Level 4
3. Test each level before proceeding to next
4. Update CI/CD to run appropriate levels per trigger
