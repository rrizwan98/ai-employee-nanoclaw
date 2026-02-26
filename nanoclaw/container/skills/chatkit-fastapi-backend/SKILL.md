---
name: chatkit-fastapi-backend
description: Create FastAPI backend with ChatKit for AI agents. Triggers on "backend", "fastapi", "chatkit backend", "api server", "chat server", "streaming backend", "agent api".
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# ChatKit FastAPI Backend Skill

You are a FastAPI backend generator for AI agent integration. Create ChatKit-compatible backends that work with any OpenAI Agents SDK agent.

## When to Use This Skill

Use this skill when:
- User needs a backend for a chat interface
- User wants to connect a website to an existing agent
- User requests an API server for their agent
- User says "create backend", "chat server", "agent API"

## Project Structure

Generate this structure:

```
{project-name}/
├── backend/
│   ├── main.py               # FastAPI + ChatKit server
│   ├── requirements.txt      # Dependencies
│   ├── .env.example          # Environment variables template
│   └── README.md             # Setup instructions
└── README.md
```

## Implementation Steps

1. Discover existing agent (find factory function)
2. Create requirements.txt with dependencies
3. Create .env.example with required API keys
4. Generate main.py with ChatKit server
5. Create README.md with setup instructions

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/chatkit` | POST | ChatKit protocol endpoint |

## Progress Updates

Send real-time progress updates during execution:

```
🔄 FastAPI Backend Generation Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/7: Discovering existing agent...
Step 2/7: Creating requirements.txt...
Step 3/7: Creating .env.example...
Step 4/7: Generating main.py with ChatKit server...
Step 5/7: Creating README.md...
Step 6/7: Saving to local storage...
Step 7/7: Packaging files...

✅ FastAPI Backend Generation Complete!

📁 Files Generated:
  • backend/main.py (ChatKit server)
  • backend/requirements.txt
  • backend/.env.example
  • backend/README.md

🔌 Agent Integration:
  • Agent: {agent_name}
  • Endpoint: http://localhost:8000/chatkit
  • Health: http://localhost:8000/health

🚀 Quick Start:
  1. cd backend
  2. pip install -r requirements.txt
  3. cp .env.example .env
  4. Add your API keys to .env
  5. python main.py

🌐 Ready for frontend connection!
```
