# Tasks: Phase 1 Foundation Setup

**Input**: Design documents from `/specs/001-phase1-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Branch**: `001-phase1-foundation`
**Date**: 2026-02-19

**Tests**: Manual integration testing (no automated tests in Phase 1)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **NanoClaw**: `nanoclaw/` subdirectory (cloned repo)
- **Project Root**: `employee-nanoclaw/`
- **Config**: `.env`, `docker-compose.yml` at project root
- **Skills**: `.claude/skills/` for future Phase 2

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment preparation

- [ ] T001 Verify prerequisites: Node.js 18+, Docker Desktop, Git installed
- [ ] T002 Create .env.example template at employee-nanoclaw/.env.example
- [ ] T003 [P] Create .gitignore with node_modules, .env, store/ patterns at employee-nanoclaw/.gitignore

**Checkpoint**: Environment ready for NanoClaw clone

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Clone NanoClaw - MUST complete before any integration work

**CRITICAL**: All user stories depend on NanoClaw being cloned and built

- [ ] T004 Clone NanoClaw repository: git clone https://github.com/gavrielc/nanoclaw.git
- [ ] T005 Install NanoClaw dependencies: cd nanoclaw && npm install
- [ ] T006 Build NanoClaw TypeScript: npm run build in nanoclaw/
- [ ] T007 Verify nanoclaw/dist/ folder exists with compiled JavaScript
- [ ] T008 Create .env file in nanoclaw/ with ASSISTANT_NAME=AgentBuilder

**Checkpoint**: NanoClaw cloned and built - user story implementation can begin

---

## Phase 3: User Story 1 - NanoClaw Clone and Setup (Priority: P1)

**Goal**: Complete NanoClaw setup with all configuration ready for WhatsApp integration

**Independent Test**: Run `npm run dev` in nanoclaw/ and verify process starts without errors

### Implementation for User Story 1

- [ ] T009 [US1] Configure ANTHROPIC_API_KEY in nanoclaw/.env
- [ ] T010 [US1] Set CONTAINER_IMAGE=nanoclaw-agent:latest in nanoclaw/.env
- [ ] T011 [US1] Set CONTAINER_TIMEOUT=300000 in nanoclaw/.env
- [ ] T012 [US1] Set TZ=Asia/Karachi in nanoclaw/.env
- [ ] T013 [US1] Create nanoclaw/store/ directory for WhatsApp auth state
- [ ] T014 [US1] Create nanoclaw/groups/ directory for per-group memory
- [ ] T015 [US1] Create nanoclaw/data/ directory for persistent storage
- [ ] T016 [US1] Create nanoclaw/logs/ directory for application logs
- [ ] T017 [US1] Verify npm run dev starts NanoClaw process successfully

**Checkpoint**: NanoClaw configured and running - ready for Docker setup

---

## Phase 4: User Story 2 - Docker Container Configuration (Priority: P1)

**Goal**: Build Docker container image for agent isolation

**Independent Test**: Run `docker images | grep nanoclaw-agent` and verify image exists

### Implementation for User Story 2

- [ ] T018 [US2] Verify Docker Desktop is running: docker info
- [ ] T019 [US2] Navigate to nanoclaw/container/ directory
- [ ] T020 [US2] Review Dockerfile in nanoclaw/container/Dockerfile
- [ ] T021 [US2] Build container image: docker build -t nanoclaw-agent:latest . in nanoclaw/container/
- [ ] T022 [US2] Verify image created: docker images | grep nanoclaw-agent
- [ ] T023 [US2] Test container runs: docker run --rm nanoclaw-agent:latest echo "Container OK"
- [ ] T024 [P] [US2] Create docker-compose.yml at employee-nanoclaw/docker-compose.yml

**Checkpoint**: Docker container ready - agent tasks can run in isolation

---

## Phase 5: User Story 3 - WhatsApp Integration (Priority: P1)

**Goal**: Connect NanoClaw to WhatsApp and verify message flow

**Independent Test**: Send message to linked WhatsApp number and verify it appears in NanoClaw logs

### Implementation for User Story 3

- [ ] T025 [US3] Start NanoClaw in dev mode: npm run dev in nanoclaw/
- [ ] T026 [US3] Wait for QR code to display in terminal
- [ ] T027 [US3] Open WhatsApp on phone (03492128287)
- [ ] T028 [US3] Go to Settings > Linked Devices > Link a Device
- [ ] T029 [US3] Scan QR code displayed in terminal
- [ ] T030 [US3] Verify "Connected to WhatsApp!" message in terminal
- [ ] T031 [US3] Verify nanoclaw/store/ contains auth state files
- [ ] T032 [US3] Send test message from another phone to 03492128287
- [ ] T033 [US3] Verify message received in NanoClaw terminal output
- [ ] T034 [US3] Stop and restart NanoClaw to verify session persistence
- [ ] T035 [US3] Confirm no QR code required on restart (auto-reconnect)

**Checkpoint**: WhatsApp connected - messages flow to NanoClaw

---

## Phase 6: User Story 4 - PostgreSQL Database Setup (Priority: P2)

**Goal**: Create database schema on Neon PostgreSQL

**Independent Test**: Query `SELECT * FROM clients LIMIT 1;` without error

### Implementation for User Story 4

- [ ] T036 [US4] Add DATABASE_URL to nanoclaw/.env with Neon connection string
- [ ] T037 [US4] Install pg package: npm install pg in nanoclaw/
- [ ] T038 [US4] Test database connection with Node.js script
- [ ] T039 [US4] Create migration file at employee-nanoclaw/migrations/001_initial_schema.sql
- [ ] T040 [US4] Copy SQL from specs/001-phase1-foundation/data-model.md to migration file
- [ ] T041 [US4] Run migration via Neon Console SQL Editor
- [ ] T042 [US4] Verify clients table exists: SELECT * FROM clients;
- [ ] T043 [US4] Verify projects table exists: SELECT * FROM projects;
- [ ] T044 [US4] Verify conversations table exists: SELECT * FROM conversations;
- [ ] T045 [US4] Insert test client record and verify retrieval
- [ ] T046 [US4] Delete test record to clean up

**Checkpoint**: Database schema ready - data persistence enabled

---

## Phase 7: User Story 5 - Directory Structure Setup (Priority: P2)

**Goal**: Create project directory structure for future Phase 2 development

**Independent Test**: Run `ls -la .claude/skills/` and verify 4 skill directories exist

### Implementation for User Story 5

- [ ] T047 [P] [US5] Create .claude/skills/agent-builder/ directory
- [ ] T048 [P] [US5] Create .claude/skills/client-communication/ directory
- [ ] T049 [P] [US5] Create .claude/skills/requirements-gathering/ directory
- [ ] T050 [P] [US5] Create .claude/skills/code-generation/ directory
- [ ] T051 [P] [US5] Create mcp-servers/ directory at project root
- [ ] T052 [P] [US5] Create templates/basic-chatbot/ directory
- [ ] T053 [P] [US5] Create templates/customer-support/ directory
- [ ] T054 [P] [US5] Create templates/multi-agent/ directory
- [ ] T055 [P] [US5] Create client-agents/ directory at project root
- [ ] T056 [P] [US5] Create data/conversations/ directory
- [ ] T057 [P] [US5] Create data/deployments/ directory
- [ ] T058 [US5] Create .claude/CLAUDE.md with project context
- [ ] T059 [US5] Create migrations/ directory at project root

**Checkpoint**: Directory structure complete - ready for Phase 2 development

---

## Phase 8: User Story 6 - Agent Code Storage System (Priority: P1)

**Goal**: Enable local storage of generated agent code with versioning support

**Independent Test**: Generate test agent, verify files saved to `client-agents/{jid}/{slug}/current/`

### Implementation for User Story 6

- [ ] T060 [US6] Run migration 002_agent_storage.sql on Neon PostgreSQL
- [ ] T061 [US6] Verify new columns added: SELECT local_path, current_version, slug FROM projects LIMIT 1;
- [ ] T062 [US6] Create client-agents/ directory at project root if not exists
- [ ] T063 [US6] Create test folder structure: client-agents/test-client/test-project/current/
- [ ] T064 [US6] Create test folder structure: client-agents/test-client/test-project/versions/v1/
- [ ] T065 [US6] Create sample metadata.json in test-project/ folder
- [ ] T066 [US6] Update container-runner.ts to mount client-agents/ in container
- [ ] T067 [US6] Verify container can write to /workspace/client-agents/ path
- [ ] T068 [US6] Update code-generation skill to save locally before WhatsApp delivery
- [ ] T069 [US6] Test version increment: create v2/ when updating existing project
- [ ] T070 [US6] Clean up test folders after verification

**Container Mount Addition** (nanoclaw/src/container-runner.ts):

```typescript
// Add after existing mounts (around line 105)
// Mount client-agents for storing generated code
mounts.push({
  hostPath: path.join(process.cwd(), '..', 'client-agents'),
  containerPath: '/workspace/client-agents',
  readonly: false,
});
```

**Checkpoint**: Agent code storage ready - generated code persists locally with version history

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation

- [ ] T071 Update employee-nanoclaw/README.md with setup instructions
- [ ] T072 Verify all .env variables documented in .env.example
- [ ] T073 Run full quickstart.md validation end-to-end
- [ ] T074 Verify WhatsApp stays connected for 1+ hour
- [ ] T075 Test message send/receive after Docker container restart
- [ ] T076 Document any issues found in specs/001-phase1-foundation/issues.md
- [ ] T077 Create git commit with all Phase 1 changes

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────────────────► No dependencies
    │
    ▼
Phase 2: Foundational (NanoClaw) ──► Depends on Phase 1
    │
    ├──► Phase 3: US1 (NanoClaw Config) ──► Depends on Phase 2
    │         │
    │         ▼
    ├──► Phase 4: US2 (Docker) ──► Depends on Phase 2, can parallel with US1
    │         │
    │         ▼
    └──► Phase 5: US3 (WhatsApp) ──► Depends on US1 (config must be ready)
              │
              ▼
         Phase 6: US4 (PostgreSQL) ──► Can start after Phase 2
              │
              ▼
         Phase 7: US5 (Directory) ──► Can start anytime after Phase 1
              │
              ▼
         Phase 8: US6 (Agent Storage) ──► Depends on US4 + US5
              │
              ▼
         Phase 9: Polish ──► Depends on all user stories
```

### User Story Dependencies

| Story | Depends On | Can Run Parallel With |
|-------|------------|----------------------|
| US1 (NanoClaw Config) | Phase 2 | US2, US4, US5 |
| US2 (Docker) | Phase 2 | US1, US4, US5 |
| US3 (WhatsApp) | US1 | US4, US5 |
| US4 (PostgreSQL) | Phase 2 | US1, US2, US5 |
| US5 (Directory) | Phase 1 | US1, US2, US3, US4 |
| US6 (Agent Storage) | US4, US5 | None (needs DB + dirs first) |

### Parallel Opportunities

**Within Phase 1 (Setup):**
```
T002 (.env.example) ─┬─ Parallel
T003 (.gitignore)  ──┘
```

**Within Phase 7 (US5 - Directory Structure):**
```
T047-T057 (all directory creation) ── All Parallel
```

---

## Parallel Example: Directory Structure (US5)

```bash
# All these can run in parallel:
mkdir -p .claude/skills/agent-builder
mkdir -p .claude/skills/client-communication
mkdir -p .claude/skills/requirements-gathering
mkdir -p .claude/skills/code-generation
mkdir -p mcp-servers
mkdir -p templates/basic-chatbot
mkdir -p templates/customer-support
mkdir -p templates/multi-agent
mkdir -p client-agents
mkdir -p data/conversations
mkdir -p data/deployments
mkdir -p migrations
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (NanoClaw clone)
3. Complete Phase 3: US1 (NanoClaw config)
4. Complete Phase 4: US2 (Docker)
5. Complete Phase 5: US3 (WhatsApp)
6. **STOP and VALIDATE**: WhatsApp messages flowing to NanoClaw
7. This is MVP - agent can receive messages!

### Full Phase 1 Delivery

1. Complete MVP (P1 stories)
2. Add US4: PostgreSQL database
3. Add US5: Directory structure
4. Add US6: Agent Code Storage
5. Complete Polish phase
6. Full Phase 1 complete - ready for Phase 2 Skills development

---

## Task Summary

| Phase | Story | Task Count | Parallel Tasks |
|-------|-------|------------|----------------|
| Phase 1 | Setup | 3 | 2 |
| Phase 2 | Foundational | 5 | 0 |
| Phase 3 | US1 - NanoClaw | 9 | 0 |
| Phase 4 | US2 - Docker | 7 | 1 |
| Phase 5 | US3 - WhatsApp | 11 | 0 |
| Phase 6 | US4 - PostgreSQL | 11 | 0 |
| Phase 7 | US5 - Directory | 13 | 11 |
| Phase 8 | US6 - Agent Storage | 11 | 0 |
| Phase 9 | Polish | 7 | 0 |
| **Total** | | **77** | **14** |

---

## Notes

- [P] tasks can run simultaneously
- [USx] label maps task to specific user story
- Manual testing - no automated test suite in Phase 1
- Commit after each phase completion
- WhatsApp QR scan requires physical phone access
- Database migration requires Neon Console access
