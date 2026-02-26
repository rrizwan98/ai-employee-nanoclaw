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

## Prerequisites

Before creating the backend:

1. **Identify the agent** - Look in `src/agents/{agent-name}/` for existing agents
2. **Find agent factory** - Look for `create_{agent}_agent()` function
3. **Note agent import path** - e.g., `from src.agents.{name}.agent import create_{name}_agent`

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

### Step 1: Discover Existing Agent

First, find the agent to integrate:

```bash
# Find agents in the project
ls -la src/agents/

# Check agent structure
cat src/agents/{agent-name}/agent.py
```

Look for:
- Agent creation function: `create_{name}_agent()`
- Agent import path
- Required environment variables (API keys)

### Step 2: Create requirements.txt

```txt
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
chatkit-python>=0.1.0
openai-agents>=0.0.3
```

Add any agent-specific dependencies found in the agent's requirements.

### Step 3: Create .env.example

```env
# API Keys (fill in your keys)
# Check which key your agent uses:
# - OpenAI agents: OPENAI_API_KEY
# - Gemini agents: GEMINI_API_KEY
# - Claude agents: ANTHROPIC_API_KEY

# Example for Gemini-based agent:
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### Step 4: Create main.py

```python
"""FastAPI backend with ChatKit integration for {Agent Name} Agent.

This server provides a chat interface using OpenAI ChatKit with streaming support.
"""

import os
import sys
import uuid
from pathlib import Path
from collections import defaultdict
from collections.abc import AsyncIterator

from agents import Runner
from chatkit.agents import AgentContext, simple_to_agent_input, stream_agent_response
from chatkit.server import ChatKitServer, StreamingResult
from chatkit.store import NotFoundError, Store
from chatkit.types import (
    Attachment, Page, ThreadItem, ThreadMetadata,
    ThreadStreamEvent, UserMessageItem
)
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

# Add parent directory to Python path to import agent
# Adjust this path based on your project structure
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import your agent factory function
# UPDATE THIS IMPORT for your specific agent:
from src.agents.{agent_name}.agent import create_{agent_name}_agent


class InMemoryStore(Store[dict]):
    """Simple in-memory store for chat data.

    For production, replace with a database-backed store
    (PostgreSQL, SQLite, Redis, etc.)
    """

    def __init__(self):
        """Initialize empty storage."""
        self.threads: dict[str, ThreadMetadata] = {}
        self.items: dict[str, list[ThreadItem]] = defaultdict(list)
        self.attachments: dict[str, Attachment] = {}

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        """Load thread metadata by ID."""
        if thread_id not in self.threads:
            raise NotFoundError(f"Thread {thread_id} not found")
        return self.threads[thread_id]

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        """Persist thread metadata."""
        self.threads[thread.id] = thread

    async def load_threads(
        self, limit: int, after: str | None, order: str, context: dict
    ) -> Page[ThreadMetadata]:
        """Load paginated list of threads."""
        threads = list(self.threads.values())
        return self._paginate(
            threads, after, limit, order,
            sort_key=lambda t: t.created_at,
            cursor_key=lambda t: t.id
        )

    async def load_thread_items(
        self, thread_id: str, after: str | None, limit: int, order: str, context: dict
    ) -> Page[ThreadItem]:
        """Load paginated thread items."""
        items = self.items.get(thread_id, [])
        return self._paginate(
            items, after, limit, order,
            sort_key=lambda i: i.created_at,
            cursor_key=lambda i: i.id
        )

    async def add_thread_item(
        self, thread_id: str, item: ThreadItem, context: dict
    ) -> None:
        """Add new item to thread."""
        self.items[thread_id].append(item)

    async def save_item(
        self, thread_id: str, item: ThreadItem, context: dict
    ) -> None:
        """Upsert thread item by ID."""
        items = self.items[thread_id]
        for idx, existing in enumerate(items):
            if existing.id == item.id:
                items[idx] = item
                return
        items.append(item)

    async def load_item(
        self, thread_id: str, item_id: str, context: dict
    ) -> ThreadItem:
        """Load specific thread item."""
        for item in self.items.get(thread_id, []):
            if item.id == item_id:
                return item
        raise NotFoundError(f"Item {item_id} not found in thread {thread_id}")

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        """Delete thread and all items."""
        self.threads.pop(thread_id, None)
        self.items.pop(thread_id, None)

    async def delete_thread_item(
        self, thread_id: str, item_id: str, context: dict
    ) -> None:
        """Delete specific thread item."""
        self.items[thread_id] = [
            item for item in self.items.get(thread_id, [])
            if item.id != item_id
        ]

    async def save_attachment(
        self, attachment: Attachment, context: dict
    ) -> None:
        """Persist attachment metadata."""
        self.attachments[attachment.id] = attachment

    async def load_attachment(
        self, attachment_id: str, context: dict
    ) -> Attachment:
        """Load attachment by ID."""
        if attachment_id not in self.attachments:
            raise NotFoundError(f"Attachment {attachment_id} not found")
        return self.attachments[attachment_id]

    async def delete_attachment(
        self, attachment_id: str, context: dict
    ) -> None:
        """Delete attachment."""
        self.attachments.pop(attachment_id, None)

    def _paginate(
        self, rows: list, after: str | None, limit: int, order: str,
        sort_key, cursor_key
    ):
        """Helper method for pagination."""
        sorted_rows = sorted(rows, key=sort_key, reverse=order == "desc")
        start = 0
        if after:
            for idx, row in enumerate(sorted_rows):
                if cursor_key(row) == after:
                    start = idx + 1
                    break
        data = sorted_rows[start : start + limit]
        has_more = start + limit < len(sorted_rows)
        next_after = cursor_key(data[-1]) if has_more and data else None
        return Page(data=data, has_more=has_more, after=next_after)


class AgentChatKitServer(ChatKitServer[dict]):
    """ChatKit server for AI agent integration.

    Handles chat protocol, thread management, and streaming responses.
    """

    def __init__(self, agent_factory):
        """Initialize the ChatKit server with agent factory.

        Args:
            agent_factory: Callable that returns an Agent instance
        """
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()

        # Create agent using the factory function
        self.agent = agent_factory()
        self.agent_name = self.agent.name

        # Initialize ChatKit server with InMemoryStore
        super().__init__(store=InMemoryStore())

    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """Generate assistant response using the agent.

        This method is called for each user message and streams the agent's
        response back as ChatKit events.

        Args:
            thread: Metadata about the current conversation thread
            input_user_message: The user's message (if any)
            context: Request context dictionary

        Yields:
            ThreadStreamEvent: Stream of events representing the agent's response
        """
        try:
            # Create agent context FIRST (before loading items)
            agent_context = AgentContext(
                thread=thread,
                store=self.store,
                request_context=context
            )

            # Load recent thread history (last 20 messages for context)
            # Use "desc" order and reverse to get chronological order
            # This matches the official ChatKit pattern
            items_page = await self.store.load_thread_items(
                thread.id,
                after=None,
                limit=20,
                order="desc",
                context=context,
            )

            # Reverse to get chronological order (oldest first)
            items = list(reversed(items_page.data))

            # Convert ChatKit thread items to agent input format
            input_items = await simple_to_agent_input(items)

            # Run agent with streaming
            result = Runner.run_streamed(
                self.agent, input_items, context=agent_context
            )

            # Generate unique ID for this response
            # IMPORTANT: This fixes the __fake_id__ issue with LiteLLM/Gemini
            # Non-OpenAI models don't return proper message IDs, so stream_agent_response()
            # uses "__fake_id__" as placeholder. Without unique IDs, all responses
            # overwrite each other on the frontend.
            response_id = f"msg_{uuid.uuid4().hex[:12]}"

            # Stream agent response as ChatKit events
            async for event in stream_agent_response(agent_context, result):
                # Replace __fake_id__ with unique ID for this response
                if hasattr(event, 'item') and hasattr(event.item, 'id'):
                    if event.item.id == "__fake_id__":
                        event.item.id = response_id
                yield event

        except Exception as e:
            # Log error and re-raise to let ChatKit handle it
            print(f"Error in respond method: {e}")
            raise


# Create FastAPI app
app = FastAPI(
    title="{Agent Name} ChatKit Server",
    description="Chat interface for {agent_name} agent with streaming support",
    version="1.0.0",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create ChatKit server instance
# UPDATE: Use your agent's factory function
chatkit_server = AgentChatKitServer(create_{agent_name}_agent)


@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    """ChatKit endpoint for processing chat requests.

    Handles all ChatKit protocol messages including:
    - Thread creation
    - Message sending
    - Streaming responses
    """
    result = await chatkit_server.process(await request.body(), context={})

    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return JSONResponse({
        "status": "ok",
        "service": f"{chatkit_server.agent_name} ChatKit Server",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "chatkit": "/chatkit"
        }
    })


@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        agent_ready = chatkit_server.agent is not None

        return JSONResponse({
            "status": "healthy" if agent_ready else "unhealthy",
            "agent": {
                "name": chatkit_server.agent.name if agent_ready else None,
                "tools_count": len(chatkit_server.agent.tools) if agent_ready else 0,
            }
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn

    # Check for required API keys
    # UPDATE: Add checks for your agent's required keys
    required_keys = []

    # Common API key checks (uncomment as needed)
    # if not os.environ.get("OPENAI_API_KEY"):
    #     required_keys.append("OPENAI_API_KEY")
    # if not os.environ.get("GEMINI_API_KEY"):
    #     required_keys.append("GEMINI_API_KEY")
    # if not os.environ.get("ANTHROPIC_API_KEY"):
    #     required_keys.append("ANTHROPIC_API_KEY")

    if required_keys:
        print(f"ERROR: Missing required environment variables: {required_keys}")
        print("Please set them in .env file or export them.")
        sys.exit(1)

    print(f"Starting {chatkit_server.agent_name} ChatKit Server...")
    print(f"Backend: http://localhost:8000")
    print(f"Health: http://localhost:8000/health")
    print(f"ChatKit: http://localhost:8000/chatkit")

    uvicorn.run(
        "main:app",
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", 8000)),
        reload=True,
        log_level="info"
    )
```

### Step 5: Create README.md

```markdown
# {Agent Name} Backend

FastAPI backend with ChatKit integration for {agent_name} agent.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Run server:
   ```bash
   python main.py
   # OR
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/chatkit` | POST | ChatKit protocol endpoint |

## Frontend Integration

Connect your frontend to `http://localhost:8000/chatkit`:

```tsx
const { control } = useChatKit({
  api: {
    url: 'http://localhost:8000/chatkit',
    domainKey: 'local-dev',
  },
});
```

## Production Notes

1. **Replace InMemoryStore**: Use PostgreSQL or Redis for persistence
2. **Configure CORS**: Restrict `allow_origins` to your domain
3. **Add authentication**: Implement API key or token auth
4. **Use environment variables**: Never hardcode secrets
```

## Agent Discovery Logic

Before generating the backend, discover the agent:

```python
# 1. Find agents directory
agents = glob.glob("src/agents/*/agent.py")

# 2. For each agent, extract:
#    - Agent name (folder name)
#    - Factory function name (usually create_{name}_agent)
#    - Required environment variables (look for os.environ.get())

# 3. Generate appropriate imports and configuration
```

## Customization Points

When generating for a specific agent, update these:

| Location | What to Change |
|----------|----------------|
| Line 24 | Import path for agent factory |
| Line 180 | Agent factory in `AgentChatKitServer()` |
| Line 233-238 | Required API key checks |
| Line 143-144 | FastAPI title and description |
| .env.example | Required environment variables |

## Integration with Frontend

After creating the backend:

1. Run the backend: `python main.py`
2. Use `chatkit-react` skill to add chat widget to frontend
3. Configure frontend to connect to `http://localhost:8000/chatkit`

## Output Checklist

After generation, verify:

- [ ] `backend/main.py` created with correct agent import
- [ ] `backend/requirements.txt` with all dependencies
- [ ] `backend/.env.example` with required variables
- [ ] `backend/README.md` with setup instructions
- [ ] Server starts without errors
- [ ] `/health` endpoint returns agent info
- [ ] `/chatkit` endpoint accepts POST requests

## Troubleshooting

### Import Error: Agent not found

- Check the import path in main.py line 24
- Verify agent exists in `src/agents/{name}/`
- Ensure `sys.path.append()` points to correct parent directory

### API Key Missing Error

- Copy `.env.example` to `.env`
- Add your API keys
- Verify key names match what the agent expects

### CORS Error in Browser

- Check `allow_origins` in CORSMiddleware
- For development, `["*"]` allows all
- For production, list specific domains

### Streaming Not Working

- Verify `StreamingResponse` with `text/event-stream`
- Check browser supports SSE
- Inspect network tab for chunked responses

### Messages Overwriting Each Other (LiteLLM/Gemini)

- This happens when using non-OpenAI models (Gemini, Claude via LiteLLM)
- These models don't return proper message IDs, causing `__fake_id__` placeholder
- The fix: Generate unique UUID-based ID per response and replace `__fake_id__`
- This is already implemented in the template above (see `response_id` in respond method)

## Notes

- InMemoryStore loses data on restart (use for development only)
- Thread history limited to 20 messages for context window
- Agent errors are logged but re-raised for proper handling
- Use `--reload` flag for development hot-reloading
