# ChatKit Server - Setup Reference

Complete guide to setting up ChatKitServer with FastAPI.

---

## Installation

```bash
pip install chatkit fastapi uvicorn python-dotenv
```

---

## Basic Server Structure

```python
# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="ChatKit Server")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ChatKitServer Class

```python
from chatkit.server import (
    ChatKitServer,
    ThreadMetadata,
    UserMessageItem,
    SQLiteThreadStore,
)
from chatkit.server.events import TextDeltaEvent, ThreadStreamEvent
from typing import Any, AsyncIterator

class MyChatKitServer(ChatKitServer):
    """Custom ChatKit server implementation."""

    # Required: Thread storage
    store = SQLiteThreadStore("threads.db")

    async def respond(
        self,
        thread: ThreadMetadata,
        input: UserMessageItem | None,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """
        Main response handler. Called when user sends a message.

        Args:
            thread: Current thread metadata (id, title, etc.)
            input: User's message and attachments
            context: Request context (contains FastAPI request)

        Yields:
            ThreadStreamEvent: Events to stream to client
        """
        if input and input.content:
            yield TextDeltaEvent(f"You said: {input.content}")
```

---

## ThreadMetadata

Information about the current conversation:

```python
class ThreadMetadata:
    id: str              # Unique thread ID
    title: str | None    # Thread title
    created_at: datetime # Creation timestamp
    updated_at: datetime # Last update timestamp
    metadata: dict       # Custom metadata
```

---

## UserMessageItem

The user's input:

```python
class UserMessageItem:
    content: str | None           # Text content
    attachments: list[Attachment] # Files/images
```

```python
class Attachment:
    type: str        # 'image', 'file'
    mime_type: str   # 'image/png', 'application/pdf'
    filename: str    # Original filename
    content: str     # Base64 encoded data
```

---

## Endpoint Implementation

```python
from server import MyChatKitServer

server = MyChatKitServer()

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    """ChatKit protocol endpoint."""

    # Get raw request body
    payload = await request.body()

    # Process with context
    result = await server.process(
        payload,
        context={"request": request}
    )

    # Handle streaming vs JSON response
    if hasattr(result, '__aiter__'):
        return StreamingResponse(
            result,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    else:
        return Response(
            content=result.json,
            media_type="application/json"
        )
```

---

## Request Context

Pass request info to your handler:

```python
@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    payload = await request.body()

    # Build context with useful info
    context = {
        "request": request,
        "user_id": request.headers.get("X-User-ID"),
        "session_id": request.headers.get("X-Session-ID"),
        "ip_address": request.client.host,
    }

    result = await server.process(payload, context)
    # ...
```

Access in handler:

```python
async def respond(self, thread, input, context):
    request = context.get("request")
    user_id = context.get("user_id")

    # Use for personalization, logging, etc.
```

---

## Error Handling

```python
from chatkit.server.events import ErrorEvent

class MyChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        try:
            # Your logic here
            yield TextDeltaEvent("Response...")

        except ValueError as e:
            yield ErrorEvent(str(e))

        except Exception as e:
            # Log error
            import logging
            logging.exception("Error in respond")

            # Return user-friendly message
            yield TextDeltaEvent(
                "I'm sorry, something went wrong. Please try again."
            )
```

---

## Health Check

```python
@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "chatkit",
        "version": "1.0.0",
    }

@app.get("/health/detailed")
async def health_detailed():
    """Detailed health with dependencies."""
    import asyncio

    checks = {
        "api": True,
        "database": await check_database(),
        "redis": await check_redis(),
    }

    all_healthy = all(checks.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
    }
```

---

## Complete Example

```python
# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(
    title="ChatKit Server",
    version="1.0.0",
    description="AI Chat Backend",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import server after app setup
from server import MyChatKitServer

server = MyChatKitServer()

@app.get("/")
async def root():
    return {
        "service": "ChatKit Server",
        "version": "1.0.0",
        "endpoints": {
            "chatkit": "/chatkit",
            "health": "/health",
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    payload = await request.body()
    result = await server.process(
        payload,
        context={"request": request}
    )

    if hasattr(result, '__aiter__'):
        return StreamingResponse(
            result,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    return Response(content=result.json, media_type="application/json")

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "false").lower() == "true"

    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=debug,
    )
```

```python
# server.py
from chatkit.server import ChatKitServer, ThreadMetadata, SQLiteThreadStore
from chatkit.server.events import TextDeltaEvent
from typing import Any, AsyncIterator

class MyChatKitServer(ChatKitServer):
    store = SQLiteThreadStore("data/threads.db")

    async def respond(self, thread, input, context):
        if not input or not input.content:
            yield TextDeltaEvent("Hello! How can I help?")
            return

        # Echo for testing
        yield TextDeltaEvent(f"You said: {input.content}")
```
