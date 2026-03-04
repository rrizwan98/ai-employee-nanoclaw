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

---

## ⛔⛔⛔ GOLDEN RULE: VALIDATE AFTER EVERY CODE WRITE ⛔⛔⛔

**THIS IS THE MOST IMPORTANT RULE - NO EXCEPTIONS!**

> **"Har code likhne ke baad `validate_project_code` call karo"**

| Code Change Type | Must Validate? |
|------------------|----------------|
| New backend project | ✅ YES |
| Adding endpoint | ✅ YES |
| Modifying store | ✅ YES |
| Bug fix | ✅ YES |
| ANY code change | ✅ YES |

### Validation Workflow (MUST FOLLOW)

```
Write/Modify Code
       ↓
Call validate_project_code IPC:
{
  "project_path": "/workspace/client-agents/{jid}/{project}/backend",
  "project_type": "backend",
  "run_level_3": true
}
       ↓
success: true? → Deliver
success: false? → Fix errors → Retry
```

**⛔ NEVER deliver code without validation passing!**

---

## References

| Reference | Description |
|-----------|-------------|
| [chatkit-server-setup.md](references/chatkit-server-setup.md) | Complete ChatKitServer setup and configuration |
| [chatkit-streaming-response.md](references/chatkit-streaming-response.md) | SSE streaming and response handling |
| [chatkit-agents-integration.md](references/chatkit-agents-integration.md) | OpenAI Agents SDK integration patterns |
| [chatkit-thread-store.md](references/chatkit-thread-store.md) | Thread persistence (SQLite, Redis, PostgreSQL) |
| [chatkit-custom-actions.md](references/chatkit-custom-actions.md) | Widget actions and custom handlers |
| [chatkit-authentication.md](references/chatkit-authentication.md) | User auth and session management |

**See `../agent-builder/references/` for OpenAI Agents SDK details.**

---

## Context7: Up-to-Date Documentation

**Use Context7 tools to verify SDK patterns before code generation!**

### Quick Reference IDs:

```
ChatKit Python:  /websites/openai_github_io_chatkit-python
FastAPI:         /tiangolo/fastapi
OpenAI Agents:   /openai/openai-agents-python
```

---

## ⛔⛔⛔ MANDATORY TDD - 4 LEVELS (NO EXCEPTIONS!) ⛔⛔⛔

**ALL generated backend code MUST pass 4-Level TDD testing before delivery!**

### TDD Commands for Backend:

```bash
# LEVEL 1: Syntax (MUST PASS - BLOCKS DELIVERY!)
pytest -m level1 -v

# LEVEL 2: Imports (MUST PASS - BLOCKS DELIVERY!)
pytest -m level2 -v

# LEVEL 3: Runtime (SHOULD PASS - WARN IF FAIL)
pytest -m level3 --use-sandbox -v

# LEVEL 4: Integration (RECOMMENDED - NOTIFY ISSUES)
pytest -m level4 --use-sandbox -v
```

### Quick Manual TDD Check:

```bash
# Level 1+2 combined (MUST PASS!)
python -c "import ast,glob,sys; [ast.parse(open(f).read()) for f in glob.glob('*.py')]"
python -c "from agents import Agent; from chatkit.store import Store; print('PASS')"

# Level 3: Server starts?
python main.py &
sleep 5 && curl localhost:8000/health

# Level 4: Health check?
curl localhost:8000/health
# Expected: {"status": "healthy"}
```

### Delivery Rules:

```
Level 1 FAIL → STOP! Fix syntax errors
Level 2 FAIL → STOP! Fix import errors
Level 3 FAIL → WARN client, fix if possible
Level 4 FAIL → NOTIFY client of known issues
```

---

## When to Use This Skill

Use this skill when:
- User needs a backend for a chat interface
- User wants to connect a website to an existing agent
- User requests an API server for their agent
- User says "create backend", "chat server", "agent API"

---

## Project Structure

```
{project-name}/
├── backend/
│   ├── main.py               # FastAPI + ChatKit server
│   ├── server.py             # ChatKitServer implementation
│   ├── agents.py             # Agent definitions
│   ├── tools.py              # Custom tools
│   ├── store.py              # Thread storage
│   ├── requirements.txt      # Dependencies
│   ├── .env.example          # Environment template
│   └── README.md             # Setup instructions
└── README.md
```

---

## Quick Start Code

### Minimal ChatKit Backend

```python
# main.py
"""
{PROJECT_NAME} - ChatKit Backend
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from server import MyChatKitServer

load_dotenv()

app = FastAPI(title="{PROJECT_NAME}")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize server
server = MyChatKitServer()

@app.get("/")
async def root():
    return {"service": "{PROJECT_NAME}", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    """ChatKit protocol endpoint."""
    payload = await request.body()
    result = await server.process(payload, {"request": request})

    if hasattr(result, '__aiter__'):
        # Streaming response
        return StreamingResponse(
            result,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    else:
        # JSON response
        return Response(
            content=result.json,
            media_type="application/json"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### ChatKitServer Implementation

```python
# server.py
"""
ChatKit Server with OpenAI Agents SDK Integration
"""

from collections.abc import AsyncIterator
from datetime import datetime

from chatkit.server import ChatKitServer
from chatkit.types import (
    ThreadMetadata,
    ThreadStreamEvent,
    UserMessageItem,
)
from chatkit.agents import AgentContext, simple_to_agent_input, stream_agent_response
from agents import Runner

# Import your agent
from agents_config import agent
from store import InMemoryStore


class MyChatKitServer(ChatKitServer[dict]):
    """ChatKit server integrated with OpenAI Agents SDK."""

    def __init__(self, store: InMemoryStore):
        super().__init__(store)

    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """Generate response using agent."""

        # Load thread history for context
        items_page = await self.store.load_thread_items(
            thread.id,
            after=None,
            limit=20,
            order="asc",
            context=context,
        )

        # Convert ChatKit thread items to agent input
        agent_input = await simple_to_agent_input(items_page.data)

        # Create agent context for streaming
        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        # Run agent and stream response
        result = Runner.run_streamed(agent, agent_input, context=agent_context)

        async for event in stream_agent_response(agent_context, result):
            yield event


# Initialize server with in-memory store
store = InMemoryStore()
server = MyChatKitServer(store=store)
```

### Agent Configuration

```python
# agents_config.py
"""
Agent Configuration
"""

import os
from agents import Agent, WebSearchTool, function_tool

@function_tool
def get_current_time() -> str:
    """Get the current time."""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

agent = Agent(
    name="{AGENT_NAME}",
    model="gpt-4.1",
    instructions="""
    {INSTRUCTIONS}
    """,
    tools=[
        WebSearchTool(search_context_size="medium"),
        get_current_time,
    ],
)
```

---

## Full ChatKitServer with All Features

```python
# server.py
"""
Complete ChatKit Server Implementation
"""

from collections.abc import AsyncIterator
from datetime import datetime

from chatkit.server import ChatKitServer
from chatkit.types import (
    ThreadMetadata,
    ThreadStreamEvent,
    UserMessageItem,
    AssistantMessageItem,
    AssistantMessageContent,
    ThreadItemDoneEvent,
)
from chatkit.agents import AgentContext, simple_to_agent_input, stream_agent_response
from agents import Agent, Runner

from store import InMemoryStore


class FullChatKitServer(ChatKitServer[dict]):
    """Production-ready ChatKit server."""

    def __init__(self, store: InMemoryStore, agent: Agent):
        super().__init__(store)
        self.agent = agent

    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """Main response handler."""

        # Load thread history for context
        items_page = await self.store.load_thread_items(
            thread.id,
            after=None,
            limit=20,
            order="asc",
            context=context,
        )

        # Convert ChatKit thread items to agent input
        agent_input = await simple_to_agent_input(items_page.data)

        # Create agent context for streaming
        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        # Run agent and stream response
        result = Runner.run_streamed(self.agent, agent_input, context=agent_context)

        async for event in stream_agent_response(agent_context, result):
            yield event
```

---

## Thread Store Options

### InMemoryStore (Development)

```python
# store.py
"""
In-memory thread store for development.
"""

from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict
from chatkit.store import Store, NotFoundError
from chatkit.types import ThreadMetadata, ThreadItem, Page, Attachment


class InMemoryStore(Store[dict]):
    """Simple in-memory thread storage for development."""

    def __init__(self):
        self._threads: Dict[str, ThreadMetadata] = {}
        self._items: Dict[str, List[ThreadItem]] = defaultdict(list)
        self._attachments: Dict[str, Attachment] = {}

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        """Load a thread by ID."""
        if thread_id not in self._threads:
            raise NotFoundError(f"Thread {thread_id} not found")
        return self._threads[thread_id]

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        """Save or update a thread."""
        self._threads[thread.id] = thread

    async def load_threads(
        self,
        limit: int,
        after: Optional[str],
        order: str,
        context: dict
    ) -> Page[ThreadMetadata]:
        """Load a paginated list of threads."""
        threads = list(self._threads.values())
        sorted_threads = sorted(
            threads,
            key=lambda t: t.created_at,
            reverse=(order == "desc")
        )

        start = 0
        if after:
            for idx, t in enumerate(sorted_threads):
                if t.id == after:
                    start = idx + 1
                    break

        data = sorted_threads[start:start + limit]
        has_more = start + limit < len(sorted_threads)
        next_after = data[-1].id if has_more and data else None

        return Page(data=data, has_more=has_more, after=next_after)

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        """Delete a thread and all its items."""
        self._threads.pop(thread_id, None)
        self._items.pop(thread_id, None)

    async def load_thread_items(
        self,
        thread_id: str,
        after: Optional[str],
        limit: int,
        order: str,
        context: dict
    ) -> Page[ThreadItem]:
        """Load thread items (messages)."""
        items = self._items.get(thread_id, [])
        sorted_items = sorted(
            items,
            key=lambda i: i.created_at,
            reverse=(order == "desc")
        )

        start = 0
        if after:
            for idx, item in enumerate(sorted_items):
                if item.id == after:
                    start = idx + 1
                    break

        data = sorted_items[start:start + limit]
        has_more = start + limit < len(sorted_items)
        next_after = data[-1].id if has_more and data else None

        return Page(data=data, has_more=has_more, after=next_after)

    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        """Add an item to a thread."""
        self._items[thread_id].append(item)

    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        """Delete a specific item from a thread."""
        if thread_id in self._items:
            self._items[thread_id] = [
                item for item in self._items[thread_id]
                if item.id != item_id
            ]

    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        """Load an attachment by ID."""
        if attachment_id not in self._attachments:
            raise NotFoundError(f"Attachment {attachment_id} not found")
        return self._attachments[attachment_id]

    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        """Save an attachment."""
        self._attachments[attachment.id] = attachment

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        """Delete an attachment by ID."""
        self._attachments.pop(attachment_id, None)

    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        """Load a specific item from a thread."""
        if thread_id not in self._items:
            raise NotFoundError(f"Thread {thread_id} not found")

        for item in self._items[thread_id]:
            if item.id == item_id:
                return item

        raise NotFoundError(f"Item {item_id} not found in thread {thread_id}")

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        """Save or update a specific item in a thread."""
        if thread_id not in self._items:
            self._items[thread_id] = []

        # Check if item already exists and update it
        for i, existing_item in enumerate(self._items[thread_id]):
            if existing_item.id == item.id:
                self._items[thread_id][i] = item
                return

        # If not found, add as new item
        self._items[thread_id].append(item)
```

---

## Requirements

```
# requirements.txt
openai-agents>=0.7.0
openai-chatkit>=1.5.0
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

### With Voice Support

```
openai-agents[voice]>=0.7.0
```

### With Redis

```
redis>=5.0.0
```

---

## Environment Variables

```bash
# .env.example

# OpenAI (Required)
OPENAI_API_KEY=sk-...

# Server
PORT=8000
HOST=0.0.0.0

# Thread Storage
THREAD_STORE=sqlite  # or 'redis'
REDIS_URL=redis://localhost:6379

# Optional
DEBUG=false
CORS_ORIGINS=http://localhost:3000,https://mysite.com
```

---

## Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Create data directory for SQLite
RUN mkdir -p data

EXPOSE 8000

CMD ["python", "main.py"]
```

---

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/chatkit` | POST | ChatKit protocol endpoint |

---

## Streaming Response Format

ChatKit uses Server-Sent Events (SSE):

```
event: text_delta
data: {"content": "Hello"}

event: text_delta
data: {"content": " there!"}

event: done
data: {}
```

---

## Progress Updates

```
🔄 FastAPI Backend Generation Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/7: Discovering existing agent...
Step 2/7: Creating requirements.txt...
Step 3/7: Creating .env.example...
Step 4/7: Generating main.py with ChatKit server...
Step 5/7: Creating server.py (ChatKitServer)...
Step 6/7: Creating README.md...
Step 7/7: Packaging files...

✅ FastAPI Backend Generation Complete!

📁 Files Generated:
  • backend/main.py (FastAPI app)
  • backend/server.py (ChatKitServer)
  • backend/agents_config.py (Agent)
  • backend/requirements.txt
  • backend/.env.example
  • backend/Dockerfile
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
