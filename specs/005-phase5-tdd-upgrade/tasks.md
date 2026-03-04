# Tasks: Phase 5 - TDD Level Upgrade (4-Level Testing System)

**Input**: Design documents from `/specs/005-phase5-tdd-upgrade/`
**Prerequisites**: plan.md, spec.md

**Tests**: This feature IS the test infrastructure - all tasks involve creating tests.

**Organization**: Tasks grouped by test level for incremental implementation.

## Format: `[ID] [P?] [Level] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Level]**: Which test level (L1, L2, L3, L4, SANDBOX, INFRA)
- Paths: `nanoclaw/container/tests/` for tests, `nanoclaw/container/sandbox/` for sandbox

---

## Phase 1: Setup (Test Infrastructure)

**Purpose**: Create test directory structure and base configuration

- [ ] T001 [INFRA] Create `nanoclaw/container/tests/` directory with `__init__.py`
- [ ] T002 [P] [INFRA] Create `nanoclaw/container/tests/fixtures/` directory with `__init__.py`
- [ ] T003 [P] [INFRA] Create `nanoclaw/container/sandbox/` directory
- [ ] T004 [INFRA] Create `nanoclaw/container/tests/fixtures/sample_agent_config.json` with test configurations for all 6 templates
- [ ] T005 [P] [INFRA] Create `nanoclaw/container/tests/fixtures/sample_requirements.json` with sample client requirements
- [ ] T006 [INFRA] Add pytest dependencies to project (`pytest>=8.0.0`, `pytest-asyncio>=0.23.0`, `pytest-timeout>=2.2.0`, `httpx>=0.27.0`)

**Checkpoint**: Test infrastructure directories and fixtures ready

---

## Phase 2: Foundational (conftest.py and Base Fixtures)

**Purpose**: Core fixtures and configuration that ALL test levels depend on

**CRITICAL**: No test level work can begin until this phase is complete

- [ ] T007 [INFRA] Create `nanoclaw/container/tests/conftest.py` with pytest configuration and marker registration
- [ ] T008 [INFRA] Add `temp_project_dir` fixture to conftest.py (creates/cleans temp directory for generated code)
- [ ] T009 [INFRA] Add `sample_agent_config` fixture to conftest.py (loads from fixtures/sample_agent_config.json)
- [ ] T010 [INFRA] Add `template_renderer` fixture to conftest.py (renders templates with variables)
- [ ] T011 [P] [INFRA] Add `generated_basic_chatbot` fixture (pre-generated basic-chatbot code)
- [ ] T012 [P] [INFRA] Add `generated_customer_support` fixture (pre-generated customer-support code)
- [ ] T013 [P] [INFRA] Add `generated_data_processor` fixture (pre-generated data-processor code)
- [ ] T014 [P] [INFRA] Add `generated_multi_agent_system` fixture (pre-generated multi-agent code)
- [ ] T015 [P] [INFRA] Add `generated_rag_assistant` fixture (pre-generated rag-assistant code)
- [ ] T016 [P] [INFRA] Add `generated_task_automation` fixture (pre-generated task-automation code)
- [ ] T017 [P] [INFRA] Add `generated_nextjs_frontend` fixture (pre-generated nextjs-chatkit-ui code)

**Checkpoint**: Foundation ready - all fixtures available for test levels

---

## Phase 3: User Story 1 - Level 1 Syntax Tests (Priority: P1) MVP

**Goal**: Enhance existing template tests with markers and comprehensive syntax validation

**Independent Test**: Run `pytest -m level1` - all templates render without syntax errors

### Implementation for Level 1

- [ ] T018 [L1] Create `nanoclaw/container/tests/test_templates.py` with `@pytest.mark.level1` decorator
- [ ] T019 [L1] Add `test_basic_chatbot_renders` - verify template produces valid Python output
- [ ] T020 [P] [L1] Add `test_customer_support_renders` - verify multi-file template renders
- [ ] T021 [P] [L1] Add `test_data_processor_renders` - verify structured output template renders
- [ ] T022 [P] [L1] Add `test_multi_agent_system_renders` - verify orchestrator/specialist templates render
- [ ] T023 [P] [L1] Add `test_rag_assistant_renders` - verify RAG template renders
- [ ] T024 [P] [L1] Add `test_task_automation_renders` - verify automation template renders
- [ ] T025 [L1] Add `test_variables_replaced` - no `{{variable}}` or `{variable}` placeholders remain
- [ ] T026 [L1] Add `test_python_syntax_valid` - ast.parse() succeeds on all .py files
- [ ] T027 [L1] Add `test_nextjs_frontend_renders` - verify frontend template renders

**Checkpoint**: Level 1 complete - `pytest -m level1` passes in <10 seconds

---

## Phase 4: User Story 2 - Level 2 Import Tests (Priority: P1)

**Goal**: Verify generated code can be imported without ImportError

**Independent Test**: Run `pytest -m level2` - all generated modules import successfully

### Implementation for Level 2

- [ ] T028 [L2] Create `nanoclaw/container/tests/level2_import_tests.py` with `@pytest.mark.level2` decorator
- [ ] T029 [L2] Add `test_basic_chatbot_imports` - import main.py, config.py, server.py, store.py
- [ ] T030 [P] [L2] Add `test_customer_support_imports` - import all agent modules and tools
- [ ] T031 [P] [L2] Add `test_data_processor_imports` - import models, agents, server
- [ ] T032 [P] [L2] Add `test_multi_agent_system_imports` - import orchestrator, specialists, context
- [ ] T033 [P] [L2] Add `test_rag_assistant_imports` - import agents, tools, vectorstore setup
- [ ] T034 [P] [L2] Add `test_task_automation_imports` - import planner, executor, verifier, scheduler
- [ ] T035 [L2] Add `test_sdk_classes_importable` - verify Agent, Runner, all tools import from openai-agents
- [ ] T036 [L2] Add `test_tool_instantiation_signature` - verify CodeInterpreterTool requires tool_config parameter
- [ ] T037 [L2] Add `test_chatkit_imports` - verify Store, ThreadMetadata, Page import correctly from chatkit.store
- [ ] T038 [L2] Add `test_fastapi_imports` - verify FastAPI, WebSocket imports work

**Checkpoint**: Level 2 complete - `pytest -m level2` catches all import errors

---

## Phase 5: User Story 3 - Sandbox Environment (Priority: P1)

**Goal**: Create Docker sandbox for isolated code verification

**Independent Test**: `docker run nanoclaw-test-sandbox` returns valid JSON result

### Implementation for Sandbox

- [ ] T039 [SANDBOX] Create `nanoclaw/container/sandbox/Dockerfile` with Python 3.12 + Node.js 20
- [ ] T040 [SANDBOX] Add `nanoclaw/container/sandbox/requirements.txt` with all SDK dependencies
- [ ] T041 [P] [SANDBOX] Create `nanoclaw/container/sandbox/package.json` with Next.js dependencies
- [ ] T042 [SANDBOX] Create `nanoclaw/container/sandbox/verify_backend.py` script:
  - Import all modules
  - Initialize Agent object
  - Start FastAPI server
  - Test /health endpoint
  - Return JSON result
- [ ] T043 [SANDBOX] Create `nanoclaw/container/sandbox/verify_frontend.sh` script:
  - npm install
  - npm run build
  - Check for "use client" errors
  - Return JSON result
- [ ] T044 [SANDBOX] Create `nanoclaw/container/sandbox/entrypoint.sh` - orchestrates verification
- [ ] T045 [SANDBOX] Add `sandbox_runner` fixture to conftest.py - Docker container executor with timeout
- [ ] T046 [SANDBOX] Test sandbox build: `docker build -t nanoclaw-test-sandbox nanoclaw/container/sandbox/`

**Checkpoint**: Sandbox complete - container builds and runs verification scripts

---

## Phase 6: User Story 4 - Level 3 Runtime Tests (Priority: P1)

**Goal**: Verify generated code actually runs (agent initializes, server starts)

**Independent Test**: Run `pytest -m level3 --use-sandbox` - agents initialize, servers respond

### Implementation for Level 3

- [ ] T047 [L3] Create `nanoclaw/container/tests/level3_runtime_tests.py` with `@pytest.mark.level3` decorator
- [ ] T048 [L3] Add `test_agent_initializes` - Agent() constructor executes without TypeError
- [ ] T049 [L3] Add `test_all_tools_instantiate` - all configured tools create without errors
- [ ] T050 [P] [L3] Add `test_server_starts` - FastAPI server starts on dynamic port
- [ ] T051 [P] [L3] Add `test_health_endpoint` - /health returns 200 with {"status": "healthy"}
- [ ] T052 [L3] Add `test_server_graceful_shutdown` - server stops without hanging
- [ ] T053 [L3] Add `test_frontend_builds` - npm run build completes without errors
- [ ] T054 [L3] Add `test_use_client_directive` - interactive components have "use client" at top
- [ ] T055 [L3] Add `test_typescript_no_errors` - TypeScript compilation succeeds
- [ ] T056 [L3] Add `test_chatkit_cdn_loading` - no @openai/chatkit-react import errors

**Checkpoint**: Level 3 complete - `pytest -m level3` catches all runtime errors

---

## Phase 7: User Story 5 - Level 4 Integration Tests (Priority: P2)

**Goal**: Verify backend and frontend work together

**Independent Test**: Run `pytest -m level4 --use-sandbox` - full communication works

### Implementation for Level 4

- [ ] T057 [L4] Create `nanoclaw/container/tests/level4_integration_tests.py` with `@pytest.mark.level4` decorator
- [ ] T058 [L4] Add `backend_server` fixture to conftest.py - starts backend, yields, shuts down
- [ ] T059 [L4] Add `test_client` fixture to conftest.py - httpx AsyncClient for testing
- [ ] T060 [L4] Add `test_chat_message_roundtrip` - send message, receive streaming response
- [ ] T061 [P] [L4] Add `test_cors_headers` - OPTIONS returns Access-Control-Allow-Origin
- [ ] T062 [P] [L4] Add `test_streaming_response` - response uses Server-Sent Events correctly
- [ ] T063 [L4] Add `test_session_persistence` - multiple messages maintain conversation context
- [ ] T064 [L4] Add `test_error_response_format` - errors return proper JSON with message
- [ ] T065 [L4] Add `test_thread_creation` - new threads are created and persisted
- [ ] T066 [L4] Add `test_thread_listing` - threads endpoint returns Page format

**Checkpoint**: Level 4 complete - `pytest -m level4` verifies full integration

---

## Phase 8: Polish & Documentation

**Purpose**: Final touches and documentation

- [ ] T067 [P] [INFRA] Add pytest.ini or pyproject.toml section with marker definitions
- [ ] T068 [P] [INFRA] Add README.md to `nanoclaw/container/tests/` with usage instructions
- [ ] T069 [INFRA] Add CI/CD workflow notes (Level 1-2 on PR, Level 3-4 on merge)
- [ ] T070 [INFRA] Add `--use-sandbox` pytest option to conftest.py
- [ ] T071 [INFRA] Verify all tests pass: `pytest nanoclaw/container/tests/`
- [ ] T072 [INFRA] Update `nanoclaw/container/CLAUDE.md` with TDD upgrade documentation
- [ ] T073 [INFRA] Update `.claude/CLAUDE.md` with Phase 5 completion status
- [ ] T074 [INFRA] Create PHR for Phase 5 implementation

**Checkpoint**: Phase 5 complete - 4-level TDD system operational

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
     ↓
Phase 2 (Foundational) ──────── BLOCKS ALL TEST LEVELS
     ↓
┌────┴────┬─────────────────────┐
↓         ↓                     ↓
Phase 3   Phase 4               Phase 5
(Level 1) (Level 2)             (Sandbox)
     ↓         ↓                     ↓
     └─────────┴─────────────────────┘
                    ↓
              Phase 6 (Level 3) ← Requires Sandbox
                    ↓
              Phase 7 (Level 4) ← Requires Sandbox
                    ↓
              Phase 8 (Polish)
```

### Within Each Phase

1. Create test file with markers
2. Add basic test (should fail initially - TDD!)
3. Implement fixture if needed
4. Run test - verify it passes
5. Add remaining tests
6. Phase checkpoint validation

### Parallel Opportunities

```bash
# Phase 1 - Setup directories in parallel:
T002, T003, T005 (all directories)

# Phase 2 - Template fixtures in parallel:
T011, T012, T013, T014, T015, T016, T017 (all generated_* fixtures)

# Phase 3 - Level 1 template tests in parallel:
T020, T021, T022, T023, T024 (all render tests)

# Phase 4 - Level 2 import tests in parallel:
T030, T031, T032, T033, T034 (all import tests)

# Phase 5 - Sandbox files in parallel:
T041 (package.json can be created alongside other files)

# Phase 6 - Level 3 server tests in parallel:
T050, T051 (server tests don't conflict)

# Phase 7 - Level 4 tests in parallel:
T061, T062 (independent integration tests)

# Phase 8 - Documentation in parallel:
T067, T068 (config and readme)
```

---

## Implementation Strategy

### MVP First (Level 1 + Level 2 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T017)
3. Complete Phase 3: Level 1 (T018-T027)
4. **VALIDATE**: Run `pytest -m level1` - should pass in <10s
5. Complete Phase 4: Level 2 (T028-T038)
6. **VALIDATE**: Run `pytest -m level2` - catches import errors
7. **STOP**: MVP complete - import testing working without Docker

### Incremental Delivery

1. **MVP**: Setup + Foundation + Level 1 + Level 2 → Deploy (no Docker needed)
2. **Enhancement 1**: Add Sandbox (Phase 5) → Build container
3. **Enhancement 2**: Add Level 3 (Phase 6) → Runtime testing working
4. **Enhancement 3**: Add Level 4 (Phase 7) + Polish → Full 4-level system

### Test-Driven Development for Tests

Yes, we use TDD to build the TDD system!

1. Write test that EXPECTS failure (e.g., break a template intentionally)
2. Run test - verify it fails correctly
3. Fix template - verify test passes
4. This ensures our tests actually catch errors

---

## Summary

| Phase | Tasks | Parallel Tasks | Time Estimate |
|-------|-------|----------------|---------------|
| Phase 1: Setup | 6 | 3 | ~15 min |
| Phase 2: Foundational | 11 | 7 | ~30 min |
| Phase 3: Level 1 | 10 | 6 | ~30 min |
| Phase 4: Level 2 | 11 | 6 | ~45 min |
| Phase 5: Sandbox | 8 | 1 | ~1 hour |
| Phase 6: Level 3 | 10 | 2 | ~45 min |
| Phase 7: Level 4 | 10 | 2 | ~45 min |
| Phase 8: Polish | 8 | 2 | ~30 min |
| **Total** | **74** | **29** | **~5.5 hours** |

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `pytest -m level1` passes in <10 seconds
- [ ] `pytest -m level2` passes in <30 seconds
- [ ] `pytest -m level3 --use-sandbox` passes in <60 seconds
- [ ] `pytest -m level4 --use-sandbox` passes in <120 seconds
- [ ] Sandbox container builds: `docker build -t nanoclaw-test-sandbox nanoclaw/container/sandbox/`
- [ ] Breaking a template import causes Level 2 to fail
- [ ] Breaking tool_config causes Level 3 to fail
- [ ] Removing "use client" causes Level 3 to fail
- [ ] Full suite: `pytest nanoclaw/container/tests/` completes successfully

---

## Notes

- Each test level is independently runnable via markers
- Level 1-2 work without Docker (fast CI feedback)
- Level 3-4 require sandbox container (thorough verification)
- Tests are self-validating - verify they catch errors by intentionally breaking code
- Commit after each task or logical group
- Use fixtures to avoid code duplication
