# Implementation Plan: Phase 2 Agent Skills Development

**Branch**: `002-phase2-agent-skills` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-phase2-agent-skills/spec.md`

## Summary

Create 4 specialized skills for the Agent Builder AI Employee that enable building production-ready AI agents using OpenAI Agents SDK. Skills follow NanoClaw SKILL.md format and embed comprehensive OpenAI Agents SDK knowledge for generating standard agents, realtime voice agents, multi-agent systems, and all SDK features.

## Technical Context

**Language/Version**: Python 3.10+ (OpenAI Agents SDK requirement)
**Primary Dependencies**: openai-agents v0.7.0+, FastAPI, Pydantic, uvicorn
**Storage**: PostgreSQL (client data), SQLiteSession/RedisSession (agent memory)
**Testing**: Manual testing via WhatsApp conversation flow
**Target Platform**: NanoClaw skills (.claude/skills/) running in Docker containers
**Project Type**: Skills-based (SKILL.md files with embedded knowledge)
**Performance Goals**: Response within 30 seconds, code generation within 2 minutes
**Constraints**: WhatsApp message limits, file size restrictions for delivery
**Scale/Scope**: 4 skills, supporting all OpenAI Agents SDK features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity | PASS | Using existing SKILL.md format, no new abstractions |
| Modularity | PASS | 4 separate skills with clear responsibilities |
| Testability | PASS | Each skill can be tested independently via WhatsApp |
| No Over-engineering | PASS | Skills embed knowledge directly, no external databases for skills |

## Project Structure

### Documentation (this feature)

```text
specs/002-phase2-agent-skills/
├── plan.md              # This file
├── research.md          # Phase 0 output - SDK patterns research
├── data-model.md        # Phase 1 output - AgentConfig schema
├── quickstart.md        # Phase 1 output - Testing guide
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
.claude/skills/
├── agent-builder/
│   └── SKILL.md                 # Main agent building skill with SDK knowledge
├── client-communication/
│   └── SKILL.md                 # WhatsApp conversation handling
├── requirements-gathering/
│   └── SKILL.md                 # Requirements extraction skill
└── code-generation/
    └── SKILL.md                 # Python code generation templates

templates/                        # Code templates for generated agents
├── standard-agent/
│   ├── main.py.template
│   ├── agents.py.template
│   ├── tools.py.template
│   ├── requirements.txt.template
│   ├── Dockerfile.template
│   └── README.md.template
├── realtime-agent/
│   ├── main.py.template          # FastAPI + WebSocket server
│   ├── agents.py.template        # RealtimeAgent configuration
│   └── ...
└── multi-agent/
    ├── main.py.template
    ├── orchestrator.py.template
    ├── specialists.py.template
    └── ...
```

**Structure Decision**: Skills live in `.claude/skills/` following NanoClaw convention. Code templates in `templates/` provide reusable scaffolds for generated agents.

## Architecture

### Skill Interaction Flow

```
WhatsApp Message
       ↓
┌──────────────────────┐
│ client-communication │ ← Handles greeting, language detection
└──────────────────────┘
       ↓
┌──────────────────────┐
│ requirements-gathering│ ← Asks 5-7 questions, produces AgentConfig JSON
└──────────────────────┘
       ↓
┌──────────────────────┐
│    agent-builder     │ ← Selects template, configures SDK features
└──────────────────────┘
       ↓
┌──────────────────────┐
│   code-generation    │ ← Produces Python files, README, Dockerfile
└──────────────────────┘
       ↓
WhatsApp File Delivery
```

### OpenAI Agents SDK Feature Matrix

| Feature | Skill Responsible | Implementation |
|---------|-------------------|----------------|
| Agent/RealtimeAgent | agent-builder | Template selection based on requirements |
| WebSearchTool | agent-builder | Import and configure in tools list |
| FileSearchTool | agent-builder | Configure with vector_store_ids |
| CodeInterpreterTool | agent-builder | Add to tools with sandbox config |
| ImageGenerationTool | agent-builder | DALL-E integration |
| @function_tool | code-generation | Generate decorated functions |
| Handoffs | agent-builder | Multi-agent orchestration |
| Guardrails | code-generation | Input/output validation code |
| SQLiteSession | code-generation | Memory persistence setup |
| RedisSession | code-generation | Scalable memory config |
| FastAPI server | code-generation | HTTP/WebSocket endpoints |
| Streaming | code-generation | Runner.run_streamed() |

## Complexity Tracking

> No violations - using existing patterns

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Dependencies

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| openai-agents | >=0.7.0 | Core SDK for agent generation |
| fastapi | >=0.100.0 | HTTP/WebSocket server in generated agents |
| pydantic | >=2.0.0 | Structured output, validation |
| uvicorn | >=0.22.0 | ASGI server for FastAPI |

### Internal Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| NanoClaw Phase 1 | Complete | WhatsApp connection, Docker containers |
| PostgreSQL (Neon) | Complete | Client/project data storage |
| Docker | Complete | Container runtime for agents |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SDK version changes | Medium | High | Pin to v0.7.0+, update templates periodically |
| WhatsApp file limits | Low | Medium | Zip large projects, provide download links |
| Complex requirements | Medium | Medium | Limit to 5-7 questions, suggest simpler alternatives |

## Next Steps

1. Create `research.md` with SDK pattern details
2. Create `data-model.md` with AgentConfig schema
3. Create `quickstart.md` with testing instructions
4. Run `/sp.tasks` to generate implementation tasks
