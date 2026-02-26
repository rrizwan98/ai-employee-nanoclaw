# Implementation Plan: Phase 1 Foundation Setup

**Branch**: `001-phase1-foundation` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-phase1-foundation/spec.md`

## Summary

Set up NanoClaw as the "Body" layer for the Agent Builder AI Employee. This includes cloning the NanoClaw repository, configuring Docker containers for isolation, integrating WhatsApp via baileys library, setting up PostgreSQL database on Neon, and creating the project directory structure. The foundation enables WhatsApp-based communication and persistent data storage for future Agent Skills development.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**:
- NanoClaw (gavrielc/nanoclaw)
- @whiskeysockets/baileys (WhatsApp client)
- pg (PostgreSQL client)
- Docker Engine

**Storage**: PostgreSQL (Neon cloud) + Local filesystem (groups/, store/, data/)
**Testing**: Manual integration testing (WhatsApp message flow, DB connection)
**Target Platform**: Windows 11 (development), Docker containers (runtime)
**Project Type**: Single project with container-based agent isolation
**Performance Goals**: WhatsApp message latency <3s, DB operations <500ms
**Constraints**: Must use Docker for container isolation, SSL required for Neon PostgreSQL
**Scale/Scope**: Single developer setup, 1 WhatsApp number, 1 database instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Simplicity | PASS | Minimal setup - NanoClaw core ~500 lines |
| Security | PASS | Container isolation + SSL database connection |
| Test-First | PARTIAL | Manual testing for integration, automated tests in Phase 2 |
| Documentation | PASS | Quickstart guide will be created |

**Gate Status**: PASS (proceed to Phase 0)

## Project Structure

### Documentation (this feature)

```text
specs/001-phase1-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output - research findings
├── data-model.md        # Phase 1 output - database schema
├── quickstart.md        # Phase 1 output - setup guide
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
employee-nanoclaw/
├── .claude/
│   ├── skills/                    # Agent Skills (Phase 2)
│   │   ├── agent-builder/
│   │   ├── client-communication/
│   │   ├── requirements-gathering/
│   │   └── code-generation/
│   └── CLAUDE.md                  # Global memory context
├── nanoclaw/                      # Cloned NanoClaw repository
│   ├── src/
│   │   ├── index.ts               # Main entry point
│   │   ├── config.ts              # Configuration constants
│   │   ├── whatsapp.ts            # WhatsApp integration
│   │   └── container/             # Container management
│   ├── container/
│   │   ├── Dockerfile             # Agent container image
│   │   └── build.sh               # Container build script
│   ├── groups/                    # Per-group memory
│   ├── store/                     # WhatsApp auth state
│   ├── data/                      # Persistent data
│   └── package.json
├── mcp-servers/                   # MCP Tool Servers (Phase 2)
├── templates/                     # Agent Templates (Phase 2)
├── client-agents/                 # Generated agents storage
│   └── {client_id}/
├── data/
│   ├── conversations/             # Conversation history
│   └── deployments/               # Deployment records
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
├── docker-compose.yml             # Docker orchestration
└── README.md                      # Project documentation
```

**Structure Decision**: Hybrid structure with NanoClaw as submodule/subdirectory and project-specific directories at root level. This maintains NanoClaw's integrity while adding Agent Builder specific components.

## Component Architecture

### Layer Mapping (6-Layer Architecture)

```
┌─────────────────────────────────────────────────────────┐
│ Layer 6: Body (NanoClaw)                                │
│ - WhatsApp integration via @whiskeysockets/baileys      │
│ - Message routing and presence management               │
│ - Cron scheduling for proactive tasks                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Brain (Claude Agent SDK) - via NanoClaw        │
│ - Runs inside Docker containers                         │
│ - Programmatic Tool Calling for data processing         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Data                                           │
│ - PostgreSQL (Neon): clients, projects, conversations   │
│ - Filesystem: groups/, store/, data/                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Security                                       │
│ - Docker container isolation                            │
│ - SSL/TLS for database connection                       │
│ - Environment variables for secrets                     │
└─────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 0: Research (Complete)
- [x] NanoClaw documentation review
- [x] Baileys WhatsApp library research
- [x] Docker container setup patterns
- [x] PostgreSQL Neon connection requirements

See: [research.md](./research.md)

### Phase 1: Core Setup

#### 1.1 NanoClaw Clone & Dependencies
- Clone gavrielc/nanoclaw repository
- Install Node.js dependencies (npm install)
- Verify TypeScript compilation (npm run build)

#### 1.2 Environment Configuration
- Create .env file with required variables
- Configure ASSISTANT_NAME, API keys
- Set up PostgreSQL connection string

#### 1.3 Docker Container Setup
- Build NanoClaw agent container image
- Configure container isolation
- Test container startup and shutdown

#### 1.4 WhatsApp Integration
- Initialize baileys with auth state
- Generate QR code for phone linking
- Test message send/receive

#### 1.5 PostgreSQL Database
- Connect to Neon database
- Create schema (clients, projects, conversations)
- Verify CRUD operations

#### 1.6 Directory Structure
- Create .claude/skills directories
- Initialize CLAUDE.md
- Set up data storage directories

## Environment Variables

```bash
# .env.example
ASSISTANT_NAME=AgentBuilder
CONTAINER_IMAGE=nanoclaw-agent:latest
CONTAINER_TIMEOUT=300000

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# WhatsApp
WHATSAPP_PHONE=03492128287
```

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhatsApp account ban | High | Use business account, follow ToS |
| Docker not available | Medium | Document alternative setup (direct Node.js) |
| Neon database downtime | Medium | Implement connection retry logic |
| NanoClaw breaking changes | Low | Pin to specific commit/tag |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Setup time | <15 min | Time from clone to first message |
| WhatsApp connection | 24h uptime | Continuous connection without re-auth |
| Message latency | <3 seconds | Time from send to receive |
| DB operations | <500ms | CRUD operation timing |

## Next Steps

After plan approval:
1. Run `/sp.tasks` to generate actionable task list
2. Execute tasks in dependency order
3. Verify each success criterion
4. Create PHR for implementation phase
