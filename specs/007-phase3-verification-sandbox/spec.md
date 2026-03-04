# Feature Specification: Phase 3 Verification Sandbox

**Feature Branch**: `feat/phase3-verification-sandbox`
**Created**: 2026-03-04
**Status**: Draft
**Input**: Pre-delivery verification sandbox with auto-fix loop for generated code

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Code Verification Before Delivery (Priority: P1)

When AI Employee generates backend/frontend code for a client, the system automatically runs comprehensive verification tests in a sandbox environment before delivering. If tests fail, the system attempts auto-fix using Skills, Templates, and Context7.

**Why this priority**: Core functionality - prevents delivering broken code to clients. This is the main value proposition of Phase 3.

**Independent Test**: Generate a simple backend agent, trigger verification, observe all tests run and pass before delivery message sent.

**Acceptance Scenarios**:

1. **Given** code is generated, **When** verification runs, **Then** all 4 levels of tests execute in sequence
2. **Given** Level 1 or 2 tests fail, **When** auto-fix is triggered, **Then** system attempts to fix using Skills/Context7
3. **Given** all tests pass, **When** verification completes, **Then** code is packaged and delivered to client

---

### User Story 2 - Human Alert on Every Attempt (Priority: P1)

Human receives detailed alert on EVERY verification attempt (not just final failure). Alert includes: error type, location, analysis, fix being applied, and source of fix.

**Why this priority**: Transparency - human must know what's happening with client code at every step.

**Independent Test**: Generate code with intentional error, observe human alert with error details and fix explanation on each attempt.

**Acceptance Scenarios**:

1. **Given** verification fails, **When** fix is attempted, **Then** human receives alert with: error, location, analysis, fix, source
2. **Given** 3 attempts exhausted, **When** human review required, **Then** human receives escalation with full attempt history
3. **Given** fix succeeds, **When** verification passes, **Then** human receives success notification

---

### User Story 3 - Backend Complete Verification (Priority: P1)

Backend verification covers: dependencies install, imports work, agent initializes, tools instantiate, server starts, health endpoint responds, chatkit endpoint responds, ALL custom endpoints respond.

**Why this priority**: Complete backend verification ensures working server before delivery.

**Independent Test**: Generate backend with custom endpoints, verify each endpoint is tested and responds correctly.

**Acceptance Scenarios**:

1. **Given** backend code generated, **When** verification runs, **Then** pip install requirements.txt succeeds
2. **Given** dependencies installed, **When** import tests run, **Then** all SDK imports resolve
3. **Given** imports pass, **When** runtime tests run, **Then** agent initializes and server starts
4. **Given** server running, **When** endpoint tests run, **Then** /health, /chatkit, and ALL custom routes respond

---

### User Story 4 - Frontend Complete Verification (Priority: P1)

Frontend verification covers: dependencies install, TypeScript check, npm run build succeeds, "use client" directives correct.

**Why this priority**: Frontend must compile and build without errors for client deployment.

**Independent Test**: Generate frontend with Next.js, run npm run build, verify build succeeds.

**Acceptance Scenarios**:

1. **Given** frontend code generated, **When** verification runs, **Then** npm install succeeds
2. **Given** dependencies installed, **When** TypeScript check runs, **Then** npx tsc --noEmit passes
3. **Given** TypeScript passes, **When** build runs, **Then** npm run build completes without errors
4. **Given** client components exist, **When** "use client" check runs, **Then** all client components have directive

---

### User Story 5 - Auto-Fix Loop with Max 3 Attempts (Priority: P2)

When verification fails, system automatically attempts to fix using: 1) Skills SKILL.md patterns, 2) Templates, 3) Context7 latest documentation. Max 3 attempts before human escalation.

**Why this priority**: Automation reduces human intervention for common fixable errors.

**Independent Test**: Generate code with ImportError, observe auto-fix queries Context7, applies fix, re-runs verification.

**Acceptance Scenarios**:

1. **Given** ImportError detected, **When** auto-fix triggers, **Then** Context7 queried for correct import
2. **Given** TypeError detected, **When** auto-fix triggers, **Then** Skills checked for correct pattern
3. **Given** "use client" missing, **When** auto-fix triggers, **Then** directive added to file
4. **Given** 3 attempts fail, **When** escalation triggers, **Then** human receives full error history

---

### Edge Cases

- What happens when Context7 is unavailable during auto-fix? → Use cached patterns from Skills
- What happens when sandbox container fails to start? → Alert human, skip verification, warn client
- What happens when dependencies have version conflicts? → Log specific conflict, attempt resolution
- What happens when custom endpoint path is malformed? → Detect in AST parsing, alert before runtime
- What happens when frontend has circular dependencies? → Capture npm build error, report to human

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST run 4-level verification tests on ALL generated code before delivery
- **FR-002**: System MUST install dependencies (pip/npm) in isolated sandbox container
- **FR-003**: System MUST verify ALL Python imports resolve without errors
- **FR-004**: System MUST verify agent initializes without runtime errors
- **FR-005**: System MUST verify server starts and responds on health endpoint
- **FR-006**: System MUST verify ALL custom endpoints defined in agents.py respond
- **FR-007**: System MUST verify frontend builds successfully (npm run build)
- **FR-008**: System MUST verify "use client" directive on all client components
- **FR-009**: System MUST alert human on EVERY verification attempt with error details
- **FR-010**: System MUST attempt auto-fix using Skills, Templates, Context7 in order
- **FR-011**: System MUST limit auto-fix to maximum 3 attempts
- **FR-012**: System MUST escalate to human if all 3 attempts fail
- **FR-013**: System MUST block delivery if Level 1 or Level 2 tests fail after 3 attempts
- **FR-014**: System MUST report verification results in IPC response
- **FR-015**: System MUST preserve attempt history for debugging

### Key Entities

- **VerificationResult**: status, level, errors[], attempt_number, fix_applied, fix_source
- **AutoFixAttempt**: attempt_number, error_type, error_message, fix_applied, fix_source, success
- **HumanAlert**: attempt_number, error_summary, error_location, analysis, fix_explanation, fix_source
- **EndpointTest**: path, method, expected_status, actual_status, passed

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0% of code delivered with Level 1 (syntax) errors
- **SC-002**: 0% of code delivered with Level 2 (import) errors
- **SC-003**: 95%+ of code delivered with working server (Level 3 pass)
- **SC-004**: 80%+ of common errors auto-fixed without human intervention
- **SC-005**: Human receives alert within 5 seconds of each verification attempt
- **SC-006**: All custom endpoints tested (100% endpoint coverage)
- **SC-007**: Frontend npm run build succeeds before delivery
- **SC-008**: Max 3 auto-fix attempts respected (no infinite loops)

## Technical Architecture (Reference)

### Verification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  VERIFICATION SANDBOX                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Generate Code (existing flow)                      │
│          ↓                                                   │
│  Step 2: Copy to Sandbox Container                          │
│          ↓                                                   │
│  Step 3: Install Dependencies                               │
│          ├── pip install -r requirements.txt                │
│          └── npm install (frontend)                         │
│          ↓                                                   │
│  Step 4: Run Verification Tests                             │
│          ├── Level 1: Syntax (AST parse)                    │
│          ├── Level 2: Imports (exec module)                 │
│          ├── Level 3: Runtime (agent init, server start)    │
│          └── Level 4: Integration (endpoints, build)        │
│          ↓                                                   │
│  Step 5: Results                                            │
│          ├── ✅ All Pass → Deliver to Client                │
│          └── ❌ Any Fail → Auto-Fix Loop                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Auto-Fix Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-FIX LOOP                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Error Detected                                              │
│       ↓                                                      │
│  [ALERT HUMAN: Attempt X - Error details + analysis]        │
│       ↓                                                      │
│  Parse Error Type                                            │
│       ├── ImportError → Query Context7 for correct import   │
│       ├── TypeError → Check Skills for correct pattern      │
│       ├── "use client" → Add directive to file              │
│       └── Unknown → Log + Continue to next attempt          │
│       ↓                                                      │
│  [ALERT HUMAN: Fix applied - source + explanation]          │
│       ↓                                                      │
│  Apply Fix to Code                                          │
│       ↓                                                      │
│  Re-run Verification Tests                                  │
│       ↓                                                      │
│  Attempt < 3?                                               │
│       ├── Yes + Still Failing → Loop back to Error Detected │
│       ├── Yes + Passing → Deliver                           │
│       └── No → Human Review Required                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Human Alert Format

```
┌─────────────────────────────────────────────────────────────┐
│  🔔 VERIFICATION ALERT - Attempt 1/3                        │
├─────────────────────────────────────────────────────────────┤
│  ERROR: ImportError                                          │
│  LOCATION: agents_config.py:15                              │
│  MESSAGE: cannot import 'CodeInterpreter' from 'agents'     │
│                                                              │
│  ANALYSIS: Tool class name changed in SDK v0.7.0            │
│                                                              │
│  FIX APPLIED: Changed to CodeInterpreterTool(tool_config=   │
│               {"type": "code_interpreter"})                 │
│                                                              │
│  SOURCE: Context7 (openai-agents v0.7.0 docs)               │
└─────────────────────────────────────────────────────────────┘
```

### Backend Endpoint Extraction

```python
# Extract custom endpoints from main.py or agents.py
# Pattern: @app.get("/path") or @app.post("/path")

Endpoints to test:
- GET /health → 200 {"status": "healthy"}
- POST /chatkit → 200 (with valid request body)
- [ALL @app.get/@app.post/@app.put/@app.delete routes]
```

### Frontend "use client" Check

```typescript
// Files that need "use client" directive:
// - Any file using useState, useEffect, useRef
// - Any file with onClick, onChange, onSubmit handlers
// - Any file importing from 'react' hooks

// Check: First line must be 'use client'
```

## Dependencies

- Phase 1: TDD Level Upgrade (4-level testing system) ✅ Complete
- Phase 2: Context7 Integration (live knowledge) ✅ Complete
- Docker sandbox environment for isolated testing
- IPC tools for verification orchestration
