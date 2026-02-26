# Agent Builder AI Employee

## Project Context

This is the **Agent Builder AI Employee** - a WhatsApp-based AI assistant that helps clients build custom AI agents using OpenAI Agents SDK.

**Domain**: General Purpose (any type of agent)
**Delivery**: Code files delivered via WhatsApp
**Phase**: Phase 4 Agent Templates (Complete)

## Architecture (6-Layer)

```
Layer 6: Body          → NanoClaw (WhatsApp integration)
Layer 5: Orchestrator  → OpenAI Agents SDK v0.7.0+
Layer 4: Brain         → Claude Agent SDK (via NanoClaw)
Layer 3: Intelligence  → Agent Skills + Code Templates
Layer 2: Data          → PostgreSQL (Neon) + File Storage
Layer 1: Security      → Docker container isolation
```

## Key Technologies

- **NanoClaw**: WhatsApp connection, message routing
- **Baileys**: @whiskeysockets/baileys for WhatsApp Web API
- **Docker**: Container isolation for agent tasks
- **PostgreSQL**: Neon cloud database for persistence
- **Claude Agent SDK**: Deep reasoning in containers
- **OpenAI Agents SDK**: Agent, RealtimeAgent, Runner, Tools
- **FastAPI**: HTTP and WebSocket server endpoints
- **Pydantic**: Structured output validation

## Directory Structure

```
employee-nanoclaw/
├── nanoclaw/                    # NanoClaw WhatsApp integration
├── .claude/skills/              # Agent Skills (4 skills)
│   ├── agent-builder/           # SDK patterns & architecture
│   ├── client-communication/    # WhatsApp conversation handling
│   ├── requirements-gathering/  # Client requirement collection
│   └── code-generation/         # Code generation + local storage
├── templates/                   # Agent Code Templates
│   ├── standard-agent/          # Text-based agent templates
│   ├── realtime-agent/          # Voice agent templates
│   └── multi-agent/             # Multi-agent system templates
├── client-agents/               # Generated agents storage
│   └── {client_jid}/            # Per-client folder
│       └── {project-slug}/      # Per-project folder
│           ├── current/         # Latest version
│           ├── versions/v1/     # Version history
│           └── metadata.json    # Requirements history
├── data/                        # Conversations and deployments
├── migrations/                  # Database migrations
└── specs/                       # Feature specifications
```

## Agent Skills

| Skill | Purpose | Triggers |
|-------|---------|----------|
| client-communication | Handle WhatsApp conversations, bilingual support | hello, hi, assalam, help |
| requirements-gathering | Collect requirements, produce AgentConfig JSON | build, create, need agent, banao |
| agent-builder | Design architecture using SDK patterns | After requirements complete |
| code-generation | Generate code, package files, deliver | After design confirmed |

## Agent Types Supported

| Type | Description | Template Directory |
|------|-------------|-------------------|
| Standard | Text chatbot, FAQ bot, assistant | `templates/standard-agent/` |
| Realtime | Voice assistant, phone bot | `templates/realtime-agent/` |
| Multi-Agent | Specialist teams with handoffs | `templates/multi-agent/` |

## OpenAI Agents SDK Features

### Hosted Tools
- WebSearchTool (web search)
- FileSearchTool (RAG/document search)
- CodeInterpreterTool (Python execution)
- ImageGenerationTool (DALL-E)
- ComputerTool (browser automation)
- HostedMCPTool (remote MCP servers)

### Custom Tools
- @function_tool decorator
- Async function support
- Tool input/output guardrails

### Memory/Sessions
- SQLiteSession (local, single-instance)
- RedisSession (scalable, production)

### Additional Features
- Agent handoffs (multi-agent routing)
- Realtime voice (WebSocket, turn detection)
- Structured output (Pydantic models)
- Dynamic instructions (callable)
- Human-in-the-loop (approval workflows)
- MCP server integration

## Environment Variables

```
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
DATABASE_URL=postgres://...

# Optional
ASSISTANT_NAME=AgentBuilder
CONTAINER_IMAGE=nanoclaw-agent:latest
REDIS_URL=redis://localhost:6379

# Phase 3: External MCP
GITHUB_TOKEN=ghp_...  # For GitHub repo/PR features
```

## External MCP Servers (Phase 3)

| Server | Purpose | Usage |
|--------|---------|-------|
| Context7 | Latest SDK documentation | Query before code generation |
| GitHub | Repository & PR management | Optional delivery method |

### Context7 Usage
- Query OpenAI Agents SDK docs for latest patterns
- Debug errors with up-to-date solutions
- Verify API signatures before code generation

### GitHub Delivery Options
1. **New Repository** - Create new repo, push code
2. **Existing Repository** - Push to client's repo
3. **PR for Updates** - Create PR instead of direct push

## Development Commands

```bash
# Start NanoClaw
cd nanoclaw && npm run dev

# Build Docker container
cd nanoclaw/container && docker build -t nanoclaw-agent:latest .

# Run migrations
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

## Current Status

- [x] Phase 1: Foundation Setup
  - [x] NanoClaw cloned and configured
  - [x] Docker container built
  - [x] Directory structure created
  - [x] Database migration ready
  - [x] Agent Code Storage (US6) - PR #3
    - [x] Database columns: local_path, current_version, slug, agent_type, code_files
    - [x] client-agents/ directory structure
    - [x] Container mount for /workspace/client-agents
    - [x] code-generation skill updated with local save
- [x] Phase 2: Agent Skills
  - [x] client-communication skill
  - [x] requirements-gathering skill
  - [x] agent-builder skill
  - [x] code-generation skill (with local storage)
  - [x] Standard agent templates
  - [x] Realtime agent templates
  - [x] Multi-agent templates
- [x] Phase 3: External MCP Integration (Implementation Complete)
  - [x] Context7 MCP - Latest documentation access
  - [x] GitHub MCP - Repository creation and PR delivery
  - [x] Requirements gathering update (delivery preference Q8)
  - [x] Code generation update (GitHub delivery + PR flow)
  - [x] Agent-builder update (Context7 verification)
  - [x] Token injection (GITHUB_PERSONAL_ACCESS_TOKEN)
- [x] Phase 4: Agent Templates (Agent Factory)
  - [x] 6 pre-built OpenAI Agents SDK templates
  - [x] Template matching (keyword-based)
  - [x] Template customization workflow
  - [x] IPC tools for template operations
  - [x] Template tests and documentation
- [ ] WhatsApp connected (requires QR scan)
- [ ] End-to-end testing via WhatsApp

## Agent Templates (Phase 4)

Pre-built templates for rapid agent generation (1-2 min vs 5-10 min):

| Template | Keywords | Complexity | Patterns |
|----------|----------|------------|----------|
| `basic-chatbot` | faq, chatbot, assistant, simple | Simple | Single agent, SQLiteSession |
| `customer-support` | support, customer, help, ticket | Medium | Multi-agent handoffs, triage |
| `data-processor` | data, process, etl, validate | Medium | Pipeline pattern, structured output |
| `multi-agent-system` | workflow, orchestrator, specialist | Complex | Agent-as-tool, shared context |
| `rag-assistant` | rag, knowledge, document, search | Medium | FileSearchTool, vector stores |
| `task-automation` | automate, task, schedule, batch | Medium | Evaluation loop, verification |

### Template Workflow

```
1. Client: "I need a customer support bot"
2. match_template() → customer-support (score: 2+)
3. Ask customization questions:
   - "What's your company name?"
   - "Support email?"
4. generate_from_template() with variables
5. Deliver via WhatsApp ZIP or GitHub
```

### Template IPC Tools

- `list_templates` - List all available templates
- `match_template` - Match request to best template
- `load_template` - Load template files and metadata
- `generate_from_template` - Generate customized code

### Template Files

```
nanoclaw/container/templates/
├── basic-chatbot/
│   ├── metadata.json
│   ├── main.py.template
│   ├── config.py.template
│   └── ...
├── customer-support/
│   ├── metadata.json
│   ├── main.py.template
│   ├── agents/
│   │   ├── triage.py.template
│   │   ├── billing.py.template
│   │   └── ...
│   └── tools/
└── ...
```

## Workflow

```
Client Message → NanoClaw → Claude (skills) → Local Storage → WhatsApp Delivery

1. Client sends "I need an FAQ bot" via WhatsApp
2. client-communication detects intent, routes to requirements-gathering
3. requirements-gathering asks 5-7 questions, produces AgentConfig JSON
4. agent-builder designs architecture, selects templates
5. code-generation renders templates
6. Save to client-agents/{jid}/{slug}/current/
7. Create metadata.json with requirements history
8. Package ZIP and deliver via WhatsApp
```

### Update Workflow

```
Client: "Add web search to my FAQ bot"
                    ↓
1. Find project: client-agents/{jid}/faq-bot/
2. Read current code + metadata.json
3. Modify code (add WebSearchTool)
4. Save current → versions/v1/
5. Write updated to current/
6. Update metadata.json (version: 2)
7. Send updated ZIP to WhatsApp
```

## Testing (quickstart.md)

Test scenarios per quickstart.md:
1. FAQ Bot: "I need an FAQ bot with web search"
2. Voice Assistant: "Build me a voice assistant for appointments"
3. Support Team: "Create a support system with billing and technical"

See `specs/002-phase2-agent-skills/quickstart.md` for detailed test instructions.
