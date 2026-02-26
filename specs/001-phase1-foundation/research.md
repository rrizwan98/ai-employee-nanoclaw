# Research Findings: Phase 1 Foundation Setup

**Feature**: 001-phase1-foundation
**Date**: 2026-02-19
**Sources**: Context7 (NanoClaw, Baileys), Official Documentation

## 1. NanoClaw Setup & Configuration

### Decision: Clone and configure NanoClaw from gavrielc/nanoclaw

**Rationale**: NanoClaw is the designated "Body" layer providing:
- ~500 lines of core TypeScript (auditable in 8 minutes)
- Built-in WhatsApp integration via @whiskeysockets/baileys
- Container isolation (Docker on Linux/Windows, Apple Containers on macOS)
- Claude Agent SDK integration for the "Brain" layer

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| OpenClaw | 430,000+ lines, complex, security concerns (CVE-2026-25253) |
| Custom implementation | Reinventing the wheel, NanoClaw already solves our needs |
| Direct Claude Code | No persistent "Body" - session-based only |

### Key Configuration Constants (src/config.ts)

```typescript
ASSISTANT_NAME = process.env.ASSISTANT_NAME || 'Andy'
CONTAINER_IMAGE = process.env.CONTAINER_IMAGE || 'nanoclaw-agent:latest'
CONTAINER_TIMEOUT = parseInt(process.env.CONTAINER_TIMEOUT || '300000', 10)
STORE_DIR = path.resolve(PROJECT_ROOT, 'store')
GROUPS_DIR = path.resolve(PROJECT_ROOT, 'groups')
DATA_DIR = path.resolve(PROJECT_ROOT, 'data')
```

### Directory Structure (NanoClaw)

```
nanoclaw/
├── src/
│   ├── index.ts          # Main entry, WhatsApp connection
│   ├── config.ts         # Configuration constants
│   ├── whatsapp.ts       # Message handling
│   └── container/        # Container management
├── container/
│   ├── Dockerfile        # Agent container
│   ├── build.sh          # Build script
│   └── agent-runner/     # Claude Agent SDK runner
├── groups/               # Per-group CLAUDE.md memory
├── store/                # WhatsApp auth state
├── data/                 # Persistent data, schedules
├── package.json
└── tsconfig.json
```

---

## 2. WhatsApp Integration (Baileys)

### Decision: Use @whiskeysockets/baileys for WhatsApp connection

**Rationale**:
- Official library used by NanoClaw
- WebSocket-based, no browser required
- Multi-device support
- QR code and pairing code authentication
- High source reputation (Context7 score: 74.7)

**Connection Pattern**:

```typescript
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('store')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) connectToWhatsApp()
    }
  })

  sock.ev.on('messages.upsert', async (event) => {
    // Handle incoming messages
  })

  sock.ev.on('creds.update', saveCreds)
}
```

**Authentication Options**:
| Method | Use Case |
|--------|----------|
| QR Code | Default - scan with WhatsApp app |
| Pairing Code | Alternative - enter code in WhatsApp |

**Key Events**:
- `connection.update`: Connection state changes
- `messages.upsert`: New messages received
- `creds.update`: Save credentials for persistence

---

## 3. Docker Container Setup

### Decision: Use Docker for container isolation on Windows

**Rationale**:
- Windows doesn't support Apple Containers
- Docker provides OS-level isolation
- NanoClaw natively supports Docker
- Each agent task runs in isolated container

**Container Build Process**:

```bash
# Build the container image
cd nanoclaw/container
./build.sh  # or docker build -t nanoclaw-agent:latest .

# Verify image
docker images | grep nanoclaw-agent
```

**Container Configuration**:
- Image: `nanoclaw-agent:latest`
- Timeout: 300000ms (5 minutes default)
- Mounts: Workspace directories for file access
- Isolation: Separate filesystem per container

**docker-compose.yml Pattern**:

```yaml
version: '3.8'
services:
  nanoclaw:
    build: ./nanoclaw
    environment:
      - ASSISTANT_NAME=AgentBuilder
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./nanoclaw/store:/app/store
      - ./nanoclaw/groups:/app/groups
      - ./nanoclaw/data:/app/data
    restart: unless-stopped
```

---

## 4. PostgreSQL (Neon) Integration

### Decision: Use Neon PostgreSQL with SSL connection

**Rationale**:
- User provided Neon database URL
- Managed PostgreSQL service (no maintenance)
- SSL required by Neon (sslmode=require)
- Serverless scaling

**Connection Pattern**:

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
})

// Test connection
const client = await pool.connect()
const result = await client.query('SELECT NOW()')
client.release()
```

**Required Tables**:

| Table | Purpose |
|-------|---------|
| clients | WhatsApp users interacting with Agent Builder |
| projects | Agent building requests with requirements |
| conversations | Message history per client/project |

**Connection String Format**:
```
postgresql://user:password@host/database?sslmode=require&channel_binding=require
```

---

## 5. Environment Variables

### Decision: Use .env file with dotenv

**Required Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| ASSISTANT_NAME | Bot trigger name | AgentBuilder |
| ANTHROPIC_API_KEY | Claude API key | sk-ant-api03-... |
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| CONTAINER_IMAGE | Docker image name | nanoclaw-agent:latest |
| CONTAINER_TIMEOUT | Task timeout (ms) | 300000 |
| TZ | Timezone | Asia/Karachi |

**Security Notes**:
- Never commit .env to git
- Use .env.example for template
- Rotate API keys periodically

---

## 6. Windows-Specific Considerations

### Decision: Adapt NanoClaw for Windows development

**Findings**:
- NanoClaw primarily targets macOS (launchd service)
- Docker Desktop required for Windows
- Bash scripts need Git Bash or WSL
- Path separators may need handling

**Adaptations Needed**:
1. Use Docker instead of Apple Containers
2. Run via `npm run dev` instead of launchd
3. Use Git Bash for shell scripts
4. Configure Docker Desktop for Windows containers

---

## Summary of Decisions

| Area | Decision | Confidence |
|------|----------|------------|
| Body Layer | NanoClaw (gavrielc/nanoclaw) | High |
| WhatsApp | @whiskeysockets/baileys | High |
| Containers | Docker Engine | High |
| Database | PostgreSQL (Neon) | High |
| Configuration | .env + dotenv | High |
| Development | Windows + Docker Desktop | Medium |

## Unresolved Questions

None - all technical decisions resolved through research.

## References

- Context7: /gavrielc/nanoclaw (182 snippets)
- Context7: /whiskeysockets/baileys (206 snippets)
- Vertical Agent Factory Definitive.md
- Agent-Builder-AI-Employee-Plan.md
