# Agent Builder AI Employee

WhatsApp-based AI Employee that helps clients build custom AI Agents using OpenAI Agents SDK.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    6-Layer Architecture                      │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: Body         │ NanoClaw (WhatsApp integration)     │
│ Layer 5: Orchestrator │ OpenAI Agents SDK (Phase 2)         │
│ Layer 4: Brain        │ Claude Agent SDK                    │
│ Layer 3: Intelligence │ Agent Skills + MCP Servers (Phase 2)│
│ Layer 2: Data         │ PostgreSQL (Neon) + File Storage    │
│ Layer 1: Security     │ Docker container isolation          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git
- WhatsApp account

### Setup

1. **Clone and install dependencies**
```bash
cd employee-nanoclaw/nanoclaw
npm install
npm run build
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
```

3. **Build Docker container**
```bash
cd nanoclaw/container
docker build -t nanoclaw-agent:latest .
```

4. **Run database migration**
```bash
cd employee-nanoclaw
npm run migrate
```

5. **Start NanoClaw**
```bash
cd nanoclaw
npm run dev
# Scan QR code with WhatsApp
```

## Project Structure

```
employee-nanoclaw/
├── nanoclaw/              # NanoClaw (Body layer)
│   ├── src/               # Source code
│   ├── container/         # Docker agent container
│   ├── store/             # WhatsApp auth state
│   ├── groups/            # Per-group memory
│   └── .env               # Configuration
├── .claude/
│   ├── skills/            # Agent Skills (Phase 2)
│   └── CLAUDE.md          # Project context
├── mcp-servers/           # MCP Tool Servers (Phase 2)
├── templates/             # Agent Templates (Phase 2)
├── client-agents/         # Generated agents
├── data/                  # Conversations & deployments
├── migrations/            # Database migrations
├── scripts/               # Utility scripts
└── specs/                 # Feature specifications
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ASSISTANT_NAME` | Bot trigger name | No (default: AgentBuilder) |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `CONTAINER_IMAGE` | Docker image name | No |
| `TZ` | Timezone | No |

## Database Schema

- **clients**: WhatsApp users
- **projects**: Agent building requests
- **conversations**: Message history

## Development

```bash
# Start development server
cd nanoclaw && npm run dev

# Rebuild Docker container
cd nanoclaw/container && docker build -t nanoclaw-agent:latest .

# Run migrations
npm run migrate

# View WhatsApp auth
npm run auth
```

## Agent Templates

Pre-built OpenAI Agents SDK templates for rapid agent generation (1-2 min vs 5-10 min for custom builds).

### Available Templates

| Template | Description | Complexity |
|----------|-------------|------------|
| `basic-chatbot` | Single agent chatbot with memory and tools | Simple |
| `customer-support` | Multi-agent support with triage and handoffs | Medium |
| `data-processor` | Data validation, transformation, and formatting | Medium |
| `multi-agent-system` | Orchestrator with specialist agents | Complex |
| `rag-assistant` | Document search with OpenAI File Search | Medium |
| `task-automation` | Automated task execution with evaluation loop | Medium |

### Template Usage

Templates are matched automatically based on client request keywords:

```
Client: "I need a customer support bot"
→ Matches: customer-support template

Client: "Build me a document search assistant"
→ Matches: rag-assistant template
```

### Template Files Location

Templates are in `nanoclaw/container/templates/`:

```
templates/
├── basic-chatbot/
│   ├── metadata.json
│   ├── main.py.template
│   ├── config.py.template
│   └── ...
├── customer-support/
│   ├── metadata.json
│   ├── main.py.template
│   ├── agents/
│   └── ...
└── ...
```

### Testing Templates

```bash
cd nanoclaw
npx ts-node scripts/test-templates.ts
```

## Phase Status

- [x] Phase 1: Foundation Setup
  - [x] NanoClaw clone & configuration
  - [x] Docker container
  - [x] PostgreSQL database
  - [x] Directory structure
  - [ ] WhatsApp integration (requires QR scan)
- [ ] Phase 2: Agent Skills Development
- [ ] Phase 3: MCP Servers
- [x] Phase 4: Templates
  - [x] 6 pre-built templates
  - [x] Template matching & generation
  - [x] IPC tools integration

## License

MIT
