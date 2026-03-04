# Feature Specification: Phase 5 - TDD Level Upgrade (4-Level Testing System)

**Feature Branch**: `005-phase5-tdd-upgrade`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Upgrade TDD system from single-level template rendering tests to comprehensive 4-level testing (syntax, import, runtime, integration) with sandbox verification"

## Overview

Current TDD approach only validates template rendering (Level 1). This causes runtime errors to reach clients because:
- Import compatibility with latest SDK versions is not verified
- Runtime initialization errors are not caught
- Integration issues between backend/frontend are not detected

This phase implements a comprehensive 4-level TDD system that catches errors BEFORE code delivery.

### Problem Statement

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT TDD GAP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Template Files (.template) → Unit Tests → Generated Code   │
│        ↓                        ↓              ↓            │
│   Static Text            Rendering Check    Runtime Error!  │
│                                                             │
│  Tests check:                                               │
│  ✅ Template renders                                        │
│  ✅ Variables replace                                       │
│  ✅ File structure valid                                    │
│                                                             │
│  Tests DON'T check:                                         │
│  ❌ Generated code imports successfully                     │
│  ❌ SDK classes instantiate correctly                       │
│  ❌ Server starts and responds                              │
│  ❌ Frontend builds without errors                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Template Generates Importable Code (Priority: P1)

When a template generates code, the system must verify that all generated Python files can be imported without `ImportError` or `ModuleNotFoundError`. This catches SDK version mismatches immediately.

**Why this priority**: Import errors are the most common failure mode when SDK APIs change. Recent errors with `CodeInterpreterTool` and `tool_config` parameter were caused by this gap.

**Independent Test**: Can be fully tested by generating code from each template and attempting to import all modules.

**Acceptance Scenarios**:

1. **Given** a basic-chatbot template is rendered, **When** Level 2 tests run, **Then** `import main`, `import config`, `import server` all succeed without ImportError
2. **Given** an SDK method signature changes (e.g., `CodeInterpreterTool` now requires `tool_config`), **When** Level 2 tests run with outdated template, **Then** test fails with clear error message about the missing parameter
3. **Given** all imports pass, **When** Level 2 test completes, **Then** test report shows which SDK classes were successfully imported

---

### User Story 2 - Generated Agent Initializes Correctly (Priority: P1)

Generated code must not only import but actually initialize agents, tools, and servers without `TypeError` or configuration errors.

**Why this priority**: The `container` parameter error in `CodeInterpreterTool` only manifests at runtime initialization, not import time. This level catches such errors.

**Independent Test**: Can be tested by initializing Agent objects and Tool instances from generated code.

**Acceptance Scenarios**:

1. **Given** a template generates agent code, **When** Level 3 tests run, **Then** `Agent(...)` constructor executes without TypeError
2. **Given** a template includes `CodeInterpreterTool`, **When** Level 3 tests run, **Then** tool instantiates with correct `tool_config` and `container` parameters
3. **Given** a FastAPI server is generated, **When** Level 3 tests run, **Then** server starts and `/health` endpoint returns 200
4. **Given** server starts successfully, **When** Level 3 tests complete, **Then** server shuts down gracefully without hanging

---

### User Story 3 - Frontend Compiles Without Errors (Priority: P1)

Generated Next.js frontend code must compile successfully with no "use client" directive errors or TypeScript errors.

**Why this priority**: The "Event handlers cannot be passed to Client Component props" error demonstrates this gap. Next.js App Router requires explicit "use client" for interactive components.

**Independent Test**: Can be tested by running `npm run build` on generated frontend and checking for compilation errors.

**Acceptance Scenarios**:

1. **Given** a nextjs-chatkit-ui template is rendered, **When** Level 3 tests run, **Then** `npm run build` completes without errors
2. **Given** a component has onClick handlers, **When** Level 3 tests check, **Then** "use client" directive is present at file top
3. **Given** TypeScript is configured, **When** Level 3 tests run, **Then** no type errors are reported
4. **Given** ChatKit CDN is used, **When** Level 3 tests run, **Then** no import errors for missing npm packages

---

### User Story 4 - Backend and Frontend Communicate Successfully (Priority: P2)

The complete system (backend + frontend) must work together with proper CORS, WebSocket, and API communication.

**Why this priority**: Individual components may work but fail when integrated. This catches communication issues before delivery.

**Independent Test**: Can be tested by starting both servers and sending test requests through the frontend to backend.

**Acceptance Scenarios**:

1. **Given** backend server is running on port 8000, **When** Level 4 tests send chat message, **Then** response is received via streaming
2. **Given** frontend is configured with CORS, **When** Level 4 tests make cross-origin requests, **Then** no CORS errors occur
3. **Given** session persistence is enabled, **When** Level 4 tests send multiple messages, **Then** conversation context is maintained
4. **Given** full integration test passes, **When** test completes, **Then** all servers shut down cleanly

---

### User Story 5 - Sandbox Provides Isolated Test Environment (Priority: P2)

Tests must run in an isolated Docker sandbox to prevent pollution of local environment and ensure reproducible results.

**Why this priority**: Different developer machines have different SDK versions installed. Sandbox ensures consistent testing environment.

**Independent Test**: Can be tested by verifying sandbox container starts, runs tests, and returns results.

**Acceptance Scenarios**:

1. **Given** sandbox Dockerfile is built, **When** sandbox container runs, **Then** Python 3.12 and Node.js 20 are available
2. **Given** generated code is copied to sandbox, **When** `verify_backend.py` runs, **Then** all verification steps execute
3. **Given** verification fails, **When** sandbox exits, **Then** detailed error JSON is returned
4. **Given** verification succeeds, **When** sandbox exits, **Then** success JSON with timing info is returned

---

### Edge Cases

- What happens when SDK package is not installed in sandbox? (Test fails with clear "package not found" message)
- How does system handle timeout during server startup? (30-second timeout with clear error)
- What if template generates invalid Python syntax? (Level 1 tests catch this before Level 2)
- How does system handle Windows vs Unix line endings? (Sandbox normalizes to Unix)
- What if port 8000 is already in use? (Tests use dynamic port allocation)

---

## Requirements *(mandatory)*

### Functional Requirements

#### Level 1: Syntax Tests (Existing - Enhancement)

- **FR-001**: System MUST add pytest markers (`@pytest.mark.level1`) to existing template tests
- **FR-002**: System MUST verify template output is valid Python/TypeScript syntax
- **FR-003**: System MUST run Level 1 tests in under 10 seconds

#### Level 2: Import Tests (New)

- **FR-004**: System MUST generate code from each template type (basic-chatbot, customer-support, etc.)
- **FR-005**: System MUST attempt to import all generated Python modules
- **FR-006**: System MUST catch and report ImportError with SDK class name and expected signature
- **FR-007**: System MUST verify all OpenAI Agents SDK classes are importable (Agent, WebSearchTool, CodeInterpreterTool, etc.)
- **FR-008**: System MUST run Level 2 tests in under 30 seconds

#### Level 3: Runtime Tests (New)

- **FR-009**: System MUST initialize Agent objects from generated code
- **FR-010**: System MUST instantiate all configured tools with correct parameters
- **FR-011**: System MUST start FastAPI server and verify health endpoint
- **FR-012**: System MUST run `npm run build` for frontend templates
- **FR-013**: System MUST verify "use client" directive presence in interactive components
- **FR-014**: System MUST gracefully shutdown all started services after testing
- **FR-015**: System MUST run Level 3 tests in under 60 seconds

#### Level 4: Integration Tests (New)

- **FR-016**: System MUST test chat message round-trip (send message, receive streaming response)
- **FR-017**: System MUST verify CORS configuration works for frontend-backend communication
- **FR-018**: System MUST test session persistence across multiple messages
- **FR-019**: System MUST run Level 4 tests in under 120 seconds

#### Sandbox Environment (New)

- **FR-020**: System MUST provide Docker-based sandbox with Python 3.12 and Node.js 20
- **FR-021**: System MUST install all required dependencies (openai-agents, fastapi, next, react)
- **FR-022**: System MUST execute verification scripts and return JSON results
- **FR-023**: System MUST run as non-root user for security
- **FR-024**: System MUST clean up containers after test completion

#### Test Infrastructure (Enhancement)

- **FR-025**: System MUST support running tests by level (`pytest -m level1`, `pytest -m level2`, etc.)
- **FR-026**: System MUST provide fixtures for generated code, sandbox runner, and servers
- **FR-027**: System MUST support parallel test execution for Level 1-2 tests
- **FR-028**: System MUST provide clear test output with file:line references for failures

### Key Entities

- **TestLevel**: Enum (level1, level2, level3, level4) defining test granularity
- **SandboxResult**: Structured result from sandbox verification (success, errors, timing)
- **GeneratedProject**: Generated code from template with metadata
- **VerificationScript**: Script executed in sandbox (verify_backend.py, verify_frontend.sh)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Level 2 import tests catch 100% of ImportError/ModuleNotFoundError before delivery
- **SC-002**: Level 3 runtime tests catch 100% of TypeError and initialization errors before delivery
- **SC-003**: Level 3 frontend tests catch 100% of "use client" directive errors before delivery
- **SC-004**: All 4 test levels complete in under 3 minutes total
- **SC-005**: Level 1-2 tests can run without Docker (for quick CI checks)
- **SC-006**: Level 3-4 tests provide sandbox isolation for reproducibility
- **SC-007**: Test failures include actionable error messages with file:line references
- **SC-008**: Zero broken code reaches clients after full test suite passes

---

## Technical Constraints

- Tests must work on Windows (Git Bash) and Linux (Docker sandbox)
- Sandbox container must be buildable without external network (vendored dependencies)
- Tests must not require actual OpenAI API calls (mock where needed)
- Level 1-2 tests must run without Docker for fast CI feedback
- Level 3-4 tests require Docker for isolation

---

## Dependencies

- Existing templates in `nanoclaw/container/templates/`
- Existing template rendering logic
- Docker installed for sandbox tests
- Python 3.12+ for import tests
- Node.js 20+ for frontend tests

---

## Out of Scope

- Auto-fixing errors (Phase 2 of intelligence upgrade)
- Context7 integration for template updates (Phase 2)
- Feedback loop and error learning (Phase 4)
- Template health scoring (Phase 4)
- Automatic template updates (Phase 6)

---

## File Structure After Implementation

```
nanoclaw/container/
├── tests/
│   ├── conftest.py              # Enhanced fixtures
│   ├── test_templates.py        # Level 1 (enhanced with markers)
│   ├── level2_import_tests.py   # NEW: Import verification
│   ├── level3_runtime_tests.py  # NEW: Runtime verification
│   ├── level4_integration_tests.py  # NEW: Integration tests
│   └── fixtures/
│       ├── sample_agent_config.json
│       └── sample_requirements.json
├── sandbox/
│   ├── Dockerfile               # NEW: Isolated test environment
│   ├── verify_backend.py        # NEW: Backend verification script
│   ├── verify_frontend.sh       # NEW: Frontend verification script
│   └── requirements.txt         # NEW: Sandbox dependencies
└── templates/
    └── (existing templates)
```
