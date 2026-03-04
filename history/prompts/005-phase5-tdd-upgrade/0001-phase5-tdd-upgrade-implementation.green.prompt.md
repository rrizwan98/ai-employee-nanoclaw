---
id: 0001
title: Phase 5 TDD Level Upgrade Implementation
stage: green
date: 2026-03-02
surface: agent
model: claude-opus-4-5
feature: 005-phase5-tdd-upgrade
branch: feat/chatkit-templates-skills-update
user: human
command: implement phase 5 tdd upgrade
labels: ["tdd", "testing", "sandbox", "level-testing", "pytest"]
links:
  spec: specs/005-phase5-tdd-upgrade/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - nanoclaw/container/tests/__init__.py
  - nanoclaw/container/tests/conftest.py
  - nanoclaw/container/tests/pytest.ini
  - nanoclaw/container/tests/README.md
  - nanoclaw/container/tests/requirements.txt
  - nanoclaw/container/tests/test_templates.py
  - nanoclaw/container/tests/level2_import_tests.py
  - nanoclaw/container/tests/level3_runtime_tests.py
  - nanoclaw/container/tests/level4_integration_tests.py
  - nanoclaw/container/tests/fixtures/__init__.py
  - nanoclaw/container/tests/fixtures/sample_agent_config.json
  - nanoclaw/container/tests/fixtures/sample_requirements.json
  - nanoclaw/container/sandbox/Dockerfile
  - nanoclaw/container/sandbox/requirements.txt
  - nanoclaw/container/sandbox/package.json
  - nanoclaw/container/sandbox/verify_backend.py
  - nanoclaw/container/sandbox/verify_frontend.sh
  - nanoclaw/container/sandbox/entrypoint.sh
  - specs/005-phase5-tdd-upgrade/spec.md
  - specs/005-phase5-tdd-upgrade/plan.md
  - specs/005-phase5-tdd-upgrade/tasks.md
tests:
  - pytest -m level1 (template syntax tests)
  - pytest -m level2 (import verification tests)
  - pytest -m level3 --use-sandbox (runtime tests)
  - pytest -m level4 --use-sandbox (integration tests)
---

## Prompt

User identified that TDD approach was not catching runtime errors (CodeInterpreterTool tool_config error, "use client" missing error, container parameter error). User requested a complete analysis of gaps and implementation plan to fix the TDD system.

After analysis, user requested implementation of Phase 1 (TDD Level Upgrade) following Spec-Driven Development approach:
1. Create feature spec
2. Create implementation plan
3. Generate tasks
4. Implement all phases

## Response snapshot

Implemented comprehensive 4-Level TDD Testing System:

### Level 1: Syntax Tests (~5s)
- Template rendering verification
- Variable substitution checks
- Python syntax validation
- No unresolved placeholders

### Level 2: Import Tests (~15s)
- SDK class importability (Agent, Runner, Tools)
- ChatKit import patterns (chatkit.store NOT chatkit.stores)
- Tool instantiation signatures
- FastAPI/Pydantic imports

### Level 3: Runtime Tests (~60s, requires sandbox)
- Agent initialization without TypeError
- Tool instantiation with correct parameters
- Server startup and health check
- Frontend build (npm run build)
- "use client" directive verification

### Level 4: Integration Tests (~120s, requires sandbox)
- Chat message round-trip
- CORS configuration
- Streaming responses
- Session persistence
- Thread management

### Sandbox Environment
- Docker-based isolated testing
- Python 3.12 + Node.js 20
- All SDK dependencies pre-installed
- Verification scripts for backend/frontend

## Outcome

- Impact: HIGH - Catches SDK compatibility and runtime errors BEFORE code delivery to clients
- Tests: 4 test files with comprehensive coverage across all levels
- Files: 21 new files created (tests, fixtures, sandbox, specs)
- Next prompts: Run tests to verify, build sandbox container, integrate with CI/CD
- Reflection: TDD gap was at Level 2-4 (import/runtime/integration) - Level 1 (syntax) was insufficient

## Evaluation notes (flywheel)

- Failure modes observed: CodeInterpreterTool missing tool_config, "use client" missing in Next.js, chatkit.stores vs chatkit.store import
- Graders run and results (PASS/FAIL): Implementation complete, tests not yet executed
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run pytest -m level1 to verify basic test infrastructure works
