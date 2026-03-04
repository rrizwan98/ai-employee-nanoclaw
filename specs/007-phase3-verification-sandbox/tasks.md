# Tasks: Phase 3 Verification Sandbox

**Input**: Design documents from `/specs/007-phase3-verification-sandbox/`
**Prerequisites**: plan.md (complete), spec.md (complete)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Create verification module structure and sandbox environment

- [x] T001 Create verification module directory `nanoclaw/container/agent-runner/src/verification/`
- [x] T002 Create sandbox scripts directory `nanoclaw/container/agent-runner/sandbox/`
- [x] T003 [P] Create verification module index `nanoclaw/container/agent-runner/src/verification/index.ts`
- [x] T004 [P] Create sandbox requirements `nanoclaw/container/agent-runner/sandbox/requirements.txt`

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core interfaces and types that ALL user stories depend on

- [x] T005 Define verification types in `src/verification/types.ts`:
  - VerificationResult, VerificationError, AutoFixAttempt
  - HumanAlert, EndpointTest, FixResult
- [x] T006 Define verification config in `src/verification/config.ts`:
  - MAX_ATTEMPTS = 3, TIMEOUT_MS = 60000
  - Log levels, alert formats

**Checkpoint**: Types and config ready - user story implementation can begin

---

## Phase 3: User Story 1 - Code Verification Before Delivery (Priority: P1) ✅ COMPLETE

**Goal**: Run 4-level tests on generated code before delivery

**Independent Test**: Generate backend, observe all 4 levels run before delivery

### Tests for US1

- [x] T007 [P] [US1] Unit test for orchestrator in `src/verification/__tests__/orchestrator.test.ts`
- [x] T008 [P] [US1] Unit test for sandbox runner in `src/verification/__tests__/sandbox-runner.test.ts`

### Implementation for US1

- [x] T009 [US1] Create orchestrator `src/verification/orchestrator.ts`:
  - async verify(projectPath, projectType): Promise<VerificationResult>
  - Track attempts, call sandbox runner, handle results
  - Loop on failure up to MAX_ATTEMPTS

- [x] T010 [US1] Create sandbox runner `src/verification/sandbox-runner.ts`:
  - async runTests(projectPath, projectType): Promise<TestResult>
  - Execute verify-backend.py or verify-frontend.sh
  - Parse output, return structured results

- [x] T011 [US1] Create backend verification script `sandbox/verify-backend.py`:
  - Level 1: ast.parse() all .py files
  - Level 2: pip install + import all modules
  - Level 3: Initialize agent, start server
  - Level 4: curl health endpoint
  - Output JSON results

- [x] T012 [US1] Create frontend verification script `sandbox/verify-frontend.sh`:
  - Level 1: Check syntax (no unresolved variables)
  - Level 2: npm install + npx tsc --noEmit
  - Level 3: npm run build
  - Level 4: Check "use client" directives
  - Output JSON results

**Checkpoint**: Can verify code with all 4 levels, no auto-fix yet

---

## Phase 4: User Story 2 - Human Alert on Every Attempt (Priority: P1) ✅ COMPLETE

**Goal**: Alert human on EVERY verification attempt with error details

**Independent Test**: Trigger verification failure, observe human alert with details

### Tests for US2

- [x] T013 [P] [US2] Unit test for human alert in `src/verification/__tests__/human-alert.test.ts`

### Implementation for US2

- [x] T014 [US2] Create human alert module `src/verification/human-alert.ts`:
  - formatAlert(alert: HumanAlert): string
  - async notify(alert: HumanAlert): Promise<void>
  - async escalate(history: AttemptHistory): Promise<void>

- [x] T015 [US2] Implement WhatsApp message format:
  ```
  VERIFICATION ALERT - Attempt X/3
  ERROR: [type]
  LOCATION: [file:line]
  MESSAGE: [error message]
  ANALYSIS: [why this happened]
  FIX APPLIED: [what changed]
  SOURCE: [Skills | Templates | Context7]
  ```

- [x] T016 [US2] Integrate human alert with orchestrator:
  - Call notify() after EVERY verification attempt
  - Call escalate() after 3 failed attempts
  - Include fix details when available

- [x] T017 [US2] Connect to NanoClaw message router:
  - Send alerts via existing IPC message channel
  - Target admin/developer phone number

**Checkpoint**: Human receives alert on every attempt with full details

---

## Phase 5: User Story 3 - Backend Complete Verification (Priority: P1) ✅ COMPLETE

**Goal**: Verify ALL backend endpoints including custom routes

**Independent Test**: Generate backend with custom endpoints, all endpoints tested

### Tests for US3

- [x] T018 [P] [US3] Unit test for endpoint extractor in `src/verification/__tests__/endpoint-extractor.test.ts`

### Implementation for US3

- [x] T019 [US3] Create endpoint extractor `src/verification/endpoint-extractor.ts`:
  - extract(code: string): Endpoint[]
  - Parse @app.get/@app.post/@app.put/@app.delete patterns
  - Parse router.get/router.post patterns
  - Always include /health and /chatkit

- [x] T020 [US3] Update verify-backend.py Level 4:
  - Read endpoints from extractor output
  - Test EACH endpoint with appropriate method
  - GET endpoints: expect 200/404
  - POST endpoints: expect 200/422 with mock body
  - Report all endpoint results

- [x] T021 [US3] Add endpoint results to VerificationResult:
  - endpoints_tested: number
  - endpoints_passed: number
  - endpoint_failures: { path, method, expected, actual }[]

**Checkpoint**: All custom endpoints verified before delivery

---

## Phase 6: User Story 4 - Frontend Complete Verification (Priority: P1) ✅ COMPLETE

**Goal**: Verify frontend builds and has correct directives

**Independent Test**: Generate Next.js frontend, npm run build succeeds

### Tests for US4

- [x] T022 [P] [US4] Unit test for frontend checks in `src/verification/__tests__/frontend-checks.test.ts`

### Implementation for US4

- [x] T023 [US4] Update verify-frontend.sh for "use client" check:
  - Find all files with useState/useEffect/useRef
  - Find all files with onClick/onChange/onSubmit
  - Verify first line is 'use client'
  - Report missing directives with file paths

- [x] T024 [US4] Update verify-frontend.sh for build verification:
  - Run npm run build
  - Capture build errors
  - Parse Next.js error output
  - Report specific component failures

- [x] T025 [US4] Add frontend results to VerificationResult:
  - build_success: boolean
  - build_errors: string[]
  - use_client_missing: string[] (file paths)

**Checkpoint**: Frontend verified to build and have correct directives

---

## Phase 7: User Story 5 - Auto-Fix Loop (Priority: P2) ✅ COMPLETE

**Goal**: Automatically fix common errors using Skills, Templates, Context7

**Independent Test**: Generate code with ImportError, observe auto-fix and re-verify

### Tests for US5

- [x] T026 [P] [US5] Unit test for auto-fixer in `src/verification/__tests__/auto-fixer.test.ts`
- [x] T027 [P] [US5] Integration test for fix loop in `src/verification/__tests__/fix-loop.test.ts`

### Implementation for US5

- [x] T028 [US5] Create auto-fixer module `src/verification/auto-fixer.ts`:
  - async fix(errors, projectPath): Promise<FixResult>
  - parseErrorType(error): 'import' | 'type' | 'syntax' | 'directive' | 'unknown'
  - Return fix details and source

- [x] T029 [US5] Implement Skills pattern lookup:
  - Load patterns from `.claude/skills/*/references/*.md`
  - Match error against known patterns
  - Extract correct code from Skills
  - Common: CodeInterpreterTool, chatkit.store imports

- [x] T030 [US5] Implement Template pattern lookup:
  - Load templates from `templates/*/`
  - Find matching template for error context
  - Extract correct code from template
  - Apply template fix to generated code

- [x] T031 [US5] Implement Context7 query for fix:
  - Query Context7 for error-specific pattern
  - Use existing Context7 module from Phase 2
  - Parse Context7 response for correct code
  - Apply Context7 fix to generated code

- [x] T032 [US5] Implement "use client" auto-fix:
  - Detect missing directive
  - Add 'use client' as first line
  - Track which files were fixed

- [x] T033 [US5] Integrate auto-fixer with orchestrator:
  - On verification failure, call auto-fixer
  - Apply fix to project files
  - Re-run verification
  - Track attempt history

**Checkpoint**: Common errors auto-fixed, human only involved for complex issues

---

## Phase 8: IPC Integration ✅ COMPLETE

**Purpose**: Expose verification to agent via IPC tools

- [x] T034 Add `verify_project` IPC operation in `src/ipc-mcp-stdio.ts`:
  - Accept project_path, project_type, auto_fix, max_attempts
  - Call orchestrator.verify()
  - Return VerificationResult

- [x] T035 Modify `generate_from_template` IPC operation:
  - Add verify_before_delivery parameter
  - If true, call verify_project after generation
  - Block delivery if verification fails after 3 attempts

- [x] T036 Modify `generate_frontend_from_template` IPC operation:
  - Add verify_before_delivery parameter
  - If true, call verify_project after generation
  - Block delivery if build fails after 3 attempts

- [x] T037 Update IPC response format:
  - Include verification results
  - Include attempt history
  - Include delivery_ready boolean

---

## Phase 9: Polish & Cross-Cutting Concerns ✅ COMPLETE

**Purpose**: Documentation and final integration

- [x] T038 [P] Update CLAUDE.md with verification workflow
- [x] T039 [P] Update code-generation skill with verification step
- [ ] T040 [P] Add verification examples to quickstart.md (deferred to E2E testing)
- [ ] T041 End-to-end test: generate → verify → auto-fix → deliver (requires WhatsApp connection)
- [ ] T042 Performance optimization: cache sandbox, parallel tests (future optimization)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-6 (US1-4)**: All depend on Phase 2, can run in parallel
- **Phase 7 (US5)**: Depends on Phase 3-6 (needs verification flow first)
- **Phase 8 (IPC)**: Depends on Phase 3-7 (needs all components)
- **Phase 9 (Polish)**: Depends on Phase 8 (needs working system)

### User Story Dependencies

- **US1 (Verification)**: Foundation only - can start after Phase 2
- **US2 (Human Alert)**: Can start after Phase 2, integrates with US1
- **US3 (Backend)**: Can start after Phase 2, extends US1
- **US4 (Frontend)**: Can start after Phase 2, extends US1
- **US5 (Auto-Fix)**: Depends on US1-4 completion (needs verification flow)

### Parallel Opportunities

```bash
# After Phase 2 completion, launch US1-4 in parallel:
Task T009-T012 [US1]: Orchestrator + Sandbox
Task T014-T017 [US2]: Human Alert
Task T019-T021 [US3]: Endpoint Extraction
Task T023-T025 [US4]: Frontend Verification

# After US1-4, launch US5:
Task T028-T033 [US5]: Auto-Fixer
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1-2: Setup + Types
2. Complete Phase 3: Verification Flow (US1)
3. Complete Phase 4: Human Alerts (US2)
4. **STOP and VALIDATE**: Test verification + alerts
5. Deploy partial verification (no auto-fix)

### Full Feature

1. Complete MVP above
2. Add Phase 5-6: Backend + Frontend verification (US3 + US4)
3. Add Phase 7: Auto-Fix Loop (US5)
4. Add Phase 8: IPC Integration
5. Complete Phase 9: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each phase has checkpoint for validation
- Human alerts are critical - test thoroughly
- Auto-fix uses existing Skills/Context7 infrastructure
- Max 3 attempts enforced in orchestrator
