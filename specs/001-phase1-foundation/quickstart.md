# Quickstart Guide: Phase 1 Foundation Setup

**Feature**: 001-phase1-foundation
**Date**: 2026-02-19
**Time to Complete**: ~15 minutes

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Docker Desktop installed and running
- [ ] Git installed (`git --version`)
- [ ] WhatsApp on phone (number: 03492128287)
- [ ] Anthropic API key
- [ ] PostgreSQL connection URL (Neon)

## Step 1: Clone NanoClaw (2 minutes)

```bash
# Navigate to project directory
cd employee-nanoclaw

# Clone NanoClaw repository
git clone https://github.com/gavrielc/nanoclaw.git

# Enter NanoClaw directory
cd nanoclaw

# Install dependencies
npm install

# Build TypeScript
npm run build
```

**Verify**: Check that `dist/` folder exists with compiled JavaScript.

## Step 2: Configure Environment (2 minutes)

Create `.env` file in the `nanoclaw/` directory:

```bash
# Copy example (if exists) or create new
cp .env.example .env || touch .env
```

Add these variables to `.env`:

```env
# Assistant Configuration
ASSISTANT_NAME=AgentBuilder

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Container Settings
CONTAINER_IMAGE=nanoclaw-agent:latest
CONTAINER_TIMEOUT=300000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_OcSJjk4FRn6u@ep-lucky-king-aiyr2roc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Timezone
TZ=Asia/Karachi
```

**Verify**: Run `cat .env` to confirm variables are set (don't share output!).

## Step 3: Build Docker Container (3 minutes)

```bash
# From nanoclaw directory
cd container

# Build the agent container image
# On Windows with Git Bash:
bash build.sh

# OR directly with Docker:
docker build -t nanoclaw-agent:latest .

# Verify image created
docker images | grep nanoclaw-agent
```

**Expected Output**:
```
nanoclaw-agent   latest   abc123def   1 minute ago   500MB
```

## Step 4: Setup Database Schema (2 minutes)

Connect to Neon and run the migration:

```bash
# Using psql (if installed)
psql "postgresql://neondb_owner:npg_OcSJjk4FRn6u@ep-lucky-king-aiyr2roc-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" -f ../specs/001-phase1-foundation/data-model.md

# OR use Neon Console:
# 1. Go to https://console.neon.tech
# 2. Select your database
# 3. Open SQL Editor
# 4. Paste migration script from data-model.md
# 5. Run
```

**Verify**: Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

Expected tables: `clients`, `projects`, `conversations`

## Step 5: Start NanoClaw (1 minute)

```bash
# From nanoclaw directory
cd ..  # back to nanoclaw root

# Start in development mode
npm run dev
```

**Expected Output**:
```
[NanoClaw] Starting...
[NanoClaw] Loading configuration...
[NanoClaw] WhatsApp connecting...
[QR Code displayed in terminal]
```

## Step 6: Connect WhatsApp (2 minutes)

1. Open WhatsApp on your phone (03492128287)
2. Go to **Settings > Linked Devices > Link a Device**
3. Scan the QR code displayed in terminal
4. Wait for "Connected to WhatsApp!" message

**Verify**: Send a test message to the linked number from another phone.

Terminal should show:
```
[NanoClaw] Message received: "Hello"
[NanoClaw] From: 92xxxxxxxxxx@s.whatsapp.net
```

## Step 7: Create Directory Structure (2 minutes)

```bash
# From employee-nanoclaw root (not nanoclaw subdirectory)
cd ..

# Create required directories
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

# Create CLAUDE.md
cat > .claude/CLAUDE.md << 'EOF'
# Agent Builder AI Employee

## Project Context
This is the Agent Builder AI Employee - a WhatsApp-based assistant that helps clients build custom AI agents using OpenAI Agents SDK.

## Architecture
- Body: NanoClaw (WhatsApp integration)
- Brain: Claude Agent SDK
- Orchestrator: OpenAI Agents SDK (Phase 2)

## Current Phase
Phase 1: Foundation Setup

## Skills Available
- agent-builder (Phase 2)
- client-communication (Phase 2)
- requirements-gathering (Phase 2)
- code-generation (Phase 2)
EOF
```

**Verify**: Run `ls -la .claude/` to see structure.

## Step 8: Verify Setup (1 minute)

Run these checks:

```bash
# Check NanoClaw is running
curl http://localhost:3000/health 2>/dev/null || echo "No health endpoint (normal)"

# Check Docker container
docker ps | grep nanoclaw

# Check database connection
# (from Node.js REPL or script)
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(e => console.error('DB Error:', e.message));
"
```

## Troubleshooting

### QR Code Not Showing
```bash
# Clear auth state and restart
rm -rf store/
npm run dev
```

### Docker Build Fails
```bash
# Check Docker is running
docker info

# Try building with verbose output
docker build -t nanoclaw-agent:latest --progress=plain .
```

### Database Connection Error
- Verify DATABASE_URL is correct
- Check SSL mode is `require`
- Confirm IP is not blocked by Neon

### WhatsApp Disconnects
- Normal after phone goes offline
- NanoClaw auto-reconnects
- Check logs: `tail -f logs/nanoclaw.log`

## Success Criteria Checklist

- [ ] NanoClaw cloned and built
- [ ] Docker image created
- [ ] Environment variables configured
- [ ] WhatsApp connected (QR scanned)
- [ ] Database tables created
- [ ] Directory structure ready
- [ ] Test message received

## Next Steps

After completing this setup:

1. Test sending messages via WhatsApp
2. Verify messages appear in NanoClaw logs
3. Test database CRUD operations
4. Proceed to Phase 2: Agent Skills Development

## Quick Commands Reference

```bash
# Start NanoClaw
cd nanoclaw && npm run dev

# Rebuild container
cd nanoclaw/container && bash build.sh

# View logs
tail -f nanoclaw/logs/nanoclaw.log

# Stop NanoClaw
Ctrl+C (in terminal running npm run dev)

# Check WhatsApp auth state
ls -la nanoclaw/store/
```
