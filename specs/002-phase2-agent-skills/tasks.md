# Tasks: Phase 2 Agent Skills Development

**Input**: Design documents from `/specs/002-phase2-agent-skills/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual testing via WhatsApp conversation (per quickstart.md)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US6)
- Paths: `.claude/skills/` for skills, `templates/` for code templates

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and base templates

- [ ] T001 Create `.claude/skills/agent-builder/` directory
- [ ] T002 [P] Create `.claude/skills/client-communication/` directory
- [ ] T003 [P] Create `.claude/skills/requirements-gathering/` directory
- [ ] T004 [P] Create `.claude/skills/code-generation/` directory
- [ ] T005 Create `templates/standard-agent/` directory structure
- [ ] T006 [P] Create `templates/realtime-agent/` directory structure
- [ ] T007 [P] Create `templates/multi-agent/` directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core skill infrastructure that MUST be complete before user story skills

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create `client-communication` skill in `.claude/skills/client-communication/SKILL.md` with greeting, language detection, phase tracking
- [ ] T009 Create `requirements-gathering` skill in `.claude/skills/requirements-gathering/SKILL.md` with 7 standard questions and AgentConfig JSON output
- [ ] T010 Create base code templates in `templates/standard-agent/requirements.txt.template`
- [ ] T011 [P] Create base `.env.example.template` in `templates/standard-agent/.env.example.template`
- [ ] T012 [P] Create base `Dockerfile.template` in `templates/standard-agent/Dockerfile.template`
- [ ] T013 [P] Create base `README.md.template` in `templates/standard-agent/README.md.template`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Standard Agent (Priority: P1) MVP

**Goal**: Client requests simple agent (FAQ bot, assistant) and receives working OpenAI Agents SDK code

**Independent Test**: Send WhatsApp message "I need an FAQ bot", receive main.py with Agent + tools

### Implementation for User Story 1

- [ ] T014 [US1] Create `main.py.template` in `templates/standard-agent/main.py.template` with Agent, Runner.run_sync
- [ ] T015 [P] [US1] Create `agents.py.template` in `templates/standard-agent/agents.py.template` with Agent configuration
- [ ] T016 [P] [US1] Create `tools.py.template` in `templates/standard-agent/tools.py.template` with @function_tool examples
- [ ] T017 [US1] Add WebSearchTool pattern to `agent-builder` skill knowledge in `.claude/skills/agent-builder/SKILL.md`
- [ ] T018 [P] [US1] Add FileSearchTool pattern to `agent-builder` skill knowledge
- [ ] T019 [P] [US1] Add CodeInterpreterTool pattern to `agent-builder` skill knowledge
- [ ] T020 [P] [US1] Add ImageGenerationTool pattern to `agent-builder` skill knowledge
- [ ] T021 [US1] Create `code-generation` skill in `.claude/skills/code-generation/SKILL.md` with standard agent generation workflow
- [ ] T022 [US1] Add file delivery logic to `code-generation` skill (WhatsApp document sending)

**Checkpoint**: User Story 1 complete - can build standard agents with hosted tools

---

## Phase 4: User Story 2 - Realtime Voice Agent (Priority: P1)

**Goal**: Client requests voice agent and receives RealtimeAgent + FastAPI WebSocket server

**Independent Test**: Request "voice assistant", receive server.py with WebSocket endpoint

### Implementation for User Story 2

- [ ] T023 [US2] Create `main.py.template` in `templates/realtime-agent/main.py.template` with RealtimeAgent, RealtimeRunner
- [ ] T024 [P] [US2] Create `server.py.template` in `templates/realtime-agent/server.py.template` with FastAPI WebSocket
- [ ] T025 [P] [US2] Create `agents.py.template` in `templates/realtime-agent/agents.py.template` with voice config
- [ ] T026 [US2] Add RealtimeAgent patterns to `agent-builder` skill (voice, modalities, turn_detection)
- [ ] T027 [P] [US2] Add WebSocket server pattern to `code-generation` skill
- [ ] T028 [P] [US2] Create `requirements.txt.template` in `templates/realtime-agent/` with openai-agents[voice]
- [ ] T029 [US2] Add realtime agent detection to `requirements-gathering` skill (voice/phone keywords)

**Checkpoint**: User Story 2 complete - can build realtime voice agents

---

## Phase 5: User Story 3 - Multi-Agent System (Priority: P2)

**Goal**: Client requests multiple specialists with handoffs

**Independent Test**: Request "support system with billing and technical", receive orchestrator + specialists

### Implementation for User Story 3

- [ ] T030 [US3] Create `orchestrator.py.template` in `templates/multi-agent/orchestrator.py.template` with triage agent
- [ ] T031 [P] [US3] Create `specialists.py.template` in `templates/multi-agent/specialists.py.template` with handoff_description
- [ ] T032 [P] [US3] Create `main.py.template` in `templates/multi-agent/main.py.template` with handoff setup
- [ ] T033 [US3] Add handoff patterns to `agent-builder` skill (Agent.handoffs, realtime_handoff)
- [ ] T034 [US3] Add multi-agent detection to `requirements-gathering` skill
- [ ] T035 [US3] Update `code-generation` skill with multi-agent file generation

**Checkpoint**: User Story 3 complete - can build multi-agent systems

---

## Phase 6: User Story 4 - Agent with Memory (Priority: P2)

**Goal**: Client requests persistent memory, receives SQLiteSession or RedisSession setup

**Independent Test**: Request "remember my preferences", receive session configuration code

### Implementation for User Story 4

- [ ] T036 [US4] Add SQLiteSession pattern to `agent-builder` skill knowledge
- [ ] T037 [P] [US4] Add RedisSession pattern to `agent-builder` skill knowledge
- [ ] T038 [US4] Create memory config section in templates (`config.py.template`)
- [ ] T039 [US4] Add memory type question to `requirements-gathering` skill (none/sqlite/redis)
- [ ] T040 [US4] Update `code-generation` skill to include session initialization code

**Checkpoint**: User Story 4 complete - can build memory-enabled agents

---

## Phase 7: User Story 5 - Agent with Custom Tools (Priority: P2)

**Goal**: Client requests custom actions (database, email), receives @function_tool implementations

**Independent Test**: Request "check my inventory", receive decorated function with guardrails

### Implementation for User Story 5

- [ ] T041 [US5] Add @function_tool patterns to `agent-builder` skill (async, type hints, Pydantic)
- [ ] T042 [P] [US5] Add tool_input_guardrail pattern to `agent-builder` skill
- [ ] T043 [P] [US5] Add tool_output_guardrail pattern to `agent-builder` skill
- [ ] T044 [US5] Create custom tool templates in `templates/standard-agent/tools.py.template`
- [ ] T045 [US5] Add custom tool questions to `requirements-gathering` skill (database/email/API)
- [ ] T046 [US5] Update `code-generation` skill to generate custom tool stubs

**Checkpoint**: User Story 5 complete - can build agents with custom tools and guardrails

---

## Phase 8: User Story 6 - Structured Output Agent (Priority: P3)

**Goal**: Client requests structured data extraction, receives Pydantic model with output_type

**Independent Test**: Request "extract calendar events", receive BaseModel schema

### Implementation for User Story 6

- [ ] T047 [US6] Add output_type pattern to `agent-builder` skill (Pydantic BaseModel)
- [ ] T048 [US6] Create structured output templates in `templates/standard-agent/models.py.template`
- [ ] T049 [US6] Add structured output question to `requirements-gathering` skill
- [ ] T050 [US6] Update `code-generation` skill to generate Pydantic models

**Checkpoint**: User Story 6 complete - can build structured output agents

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Finalize skills with comprehensive SDK knowledge

- [ ] T051 [P] Add dynamic instructions pattern to `agent-builder` skill (callable functions)
- [ ] T052 [P] Add human-in-the-loop pattern to `agent-builder` skill (needs_approval)
- [ ] T053 [P] Add MCP server patterns to `agent-builder` skill (MCPServerStdio, HostedMCPTool)
- [ ] T054 [P] Add Runner streaming pattern to `code-generation` skill
- [ ] T055 Add ComputerTool pattern to `agent-builder` skill
- [ ] T056 Add input/output guardrails patterns to `agent-builder` skill
- [ ] T057 Update `client-communication` skill with progress update messages
- [ ] T058 Add error handling and fallback messages to all skills
- [ ] T059 Run quickstart.md validation scenarios
- [ ] T060 Update `.claude/CLAUDE.md` with Phase 2 completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3-8 (User Stories)**: All depend on Phase 2 completion
  - Can proceed in priority order (P1 → P2 → P3)
  - Or parallel if multiple developers
- **Phase 9 (Polish)**: Depends on all user stories

### User Story Dependencies

| Story | Priority | Depends On | Independent |
|-------|----------|------------|-------------|
| US1 - Standard Agent | P1 | Phase 2 | Yes |
| US2 - Realtime Agent | P1 | Phase 2 | Yes |
| US3 - Multi-Agent | P2 | Phase 2 | Yes |
| US4 - Memory | P2 | Phase 2 | Yes |
| US5 - Custom Tools | P2 | Phase 2 | Yes |
| US6 - Structured Output | P3 | Phase 2 | Yes |

### Within Each User Story

1. Templates first (parallel where marked [P])
2. `agent-builder` skill patterns
3. `requirements-gathering` detection
4. `code-generation` updates
5. Story checkpoint validation

### Parallel Opportunities

```bash
# Phase 1 - All directories in parallel:
T002, T003, T004 (skill directories)
T005, T006, T007 (template directories)

# Phase 2 - Base templates in parallel:
T010, T011, T012, T013

# US1 - Templates in parallel:
T015, T016 (agents.py, tools.py)
T018, T019, T020 (tool patterns)

# US2 - Templates in parallel:
T024, T025, T028

# Polish - All patterns in parallel:
T051, T052, T053, T054
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T013)
3. Complete Phase 3: US1 Standard Agent (T014-T022)
4. **VALIDATE**: Test via WhatsApp - request FAQ bot
5. Complete Phase 4: US2 Realtime Agent (T023-T029)
6. **VALIDATE**: Test via WhatsApp - request voice assistant
7. **STOP**: MVP complete with both P1 stories

### Incremental Delivery

1. **MVP**: Setup + Foundation + US1 + US2 → Deploy
2. **Enhancement 1**: Add US3 (Multi-Agent) → Test → Deploy
3. **Enhancement 2**: Add US4 (Memory) + US5 (Custom Tools) → Test → Deploy
4. **Enhancement 3**: Add US6 (Structured Output) + Polish → Final Deploy

---

## Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 7 | 6 |
| Phase 2: Foundational | 6 | 3 |
| Phase 3: US1 Standard | 9 | 5 |
| Phase 4: US2 Realtime | 7 | 4 |
| Phase 5: US3 Multi-Agent | 6 | 2 |
| Phase 6: US4 Memory | 5 | 1 |
| Phase 7: US5 Custom Tools | 6 | 2 |
| Phase 8: US6 Structured | 4 | 0 |
| Phase 9: Polish | 10 | 5 |
| **Total** | **60** | **28** |

---

## Notes

- Each skill is a SKILL.md file with embedded OpenAI Agents SDK knowledge
- Templates use `.template` extension for variable substitution
- Test each story independently via WhatsApp before moving to next
- Commit after each task or logical group
- Use quickstart.md scenarios for validation
