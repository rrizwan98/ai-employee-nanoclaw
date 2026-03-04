# OpenAI Agents SDK - Memory & Sessions Reference

Complete reference for conversation memory and session management in OpenAI Agents SDK v0.7.0+.

---

## Overview

Sessions enable agents to maintain conversation history across multiple interactions:

| Session Type | Storage | Use Case | Scalability |
|-------------|---------|----------|-------------|
| SQLiteSession | Local SQLite DB | Development, single-instance | Single server |
| RedisSession | Redis server | Production, distributed | Multi-server |
| Custom Session | Any backend | Special requirements | Depends |

---

## SQLiteSession

Lightweight, file-based session storage perfect for development and small deployments.

### In-Memory Database

```python
from agents import Agent, Runner, SQLiteSession

agent = Agent(
    name="Assistant",
    instructions="Reply concisely.",
)

# In-memory database (lost when process ends)
session = SQLiteSession("user_123")

result = await Runner.run(agent, "Hello!", session=session)
print(result.final_output)
```

### Persistent File Database

```python
from agents import SQLiteSession

# Persistent file-based database
session = SQLiteSession("user_123", "conversations.db")

# Session persists across restarts
result = await Runner.run(agent, "What did we talk about?", session=session)
```

### Multi-Turn Conversation

```python
import asyncio
from agents import Agent, Runner, SQLiteSession

async def main():
    agent = Agent(
        name="Assistant",
        instructions="Reply very concisely.",
    )

    # Create session with persistent storage
    session = SQLiteSession("conversation_123", "chat_history.db")

    # First turn
    print("User: What city is the Golden Gate Bridge in?")
    result = await Runner.run(
        agent,
        "What city is the Golden Gate Bridge in?",
        session=session
    )
    print(f"Assistant: {result.final_output}")

    # Second turn - agent remembers context
    print("User: What state is it in?")
    result = await Runner.run(
        agent,
        "What state is it in?",
        session=session
    )
    print(f"Assistant: {result.final_output}")

    # Third turn - continuing conversation
    print("User: What's the population of that state?")
    result = await Runner.run(
        agent,
        "What's the population of that state?",
        session=session
    )
    print(f"Assistant: {result.final_output}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Multiple Users

```python
from agents import Agent, Runner, SQLiteSession

agent = Agent(name="Support Bot", instructions="Help users with questions.")

# Different session IDs maintain separate conversations
user_a_session = SQLiteSession("user_alice", "support.db")
user_b_session = SQLiteSession("user_bob", "support.db")

# Alice's conversation
await Runner.run(agent, "How do I reset my password?", session=user_a_session)

# Bob's conversation (separate history)
await Runner.run(agent, "Where can I find my order?", session=user_b_session)
```

---

## RedisSession

Scalable, distributed session storage for production deployments.

### Basic Setup

```python
from agents import Agent, Runner
from agents.extensions.memory import RedisSession

agent = Agent(
    name="Assistant",
    instructions="Help users.",
)

# Connect to Redis
session = RedisSession.from_url(
    session_id="user_123",
    url="redis://localhost:6379/0"
)

result = await Runner.run(agent, "Hello!", session=session)
```

### With Authentication

```python
from agents.extensions.memory import RedisSession

# Redis with password
session = RedisSession.from_url(
    session_id="user_123",
    url="redis://:mypassword@redis.example.com:6379/0"
)

# Redis with SSL
session = RedisSession.from_url(
    session_id="user_123",
    url="rediss://redis.example.com:6380/0"  # Note: rediss:// for SSL
)
```

### Production Configuration

```python
import os
from agents.extensions.memory import RedisSession

# Configuration from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def get_user_session(user_id: str) -> RedisSession:
    """Create a Redis session for a user."""
    return RedisSession.from_url(
        session_id=f"session:{user_id}",
        url=REDIS_URL
    )

# Usage
session = get_user_session("alice_123")
result = await Runner.run(agent, message, session=session)
```

---

## Session with FastAPI

### SQLite Sessions

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents import Agent, Runner, SQLiteSession

app = FastAPI()

agent = Agent(
    name="Assistant",
    instructions="Help users with their questions.",
)

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Create session for user
    session = SQLiteSession(
        session_id=request.user_id,
        db_path="conversations.db"
    )

    # Run with session
    result = await Runner.run(
        agent,
        request.message,
        session=session
    )

    return ChatResponse(response=result.final_output)
```

### Redis Sessions

```python
import os
from fastapi import FastAPI
from pydantic import BaseModel
from agents import Agent, Runner
from agents.extensions.memory import RedisSession

app = FastAPI()
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

agent = Agent(
    name="Assistant",
    instructions="Help users.",
)

class ChatRequest(BaseModel):
    user_id: str
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    session = RedisSession.from_url(
        session_id=f"chat:{request.user_id}",
        url=REDIS_URL
    )

    result = await Runner.run(
        agent,
        request.message,
        session=session
    )

    return {"response": result.final_output}
```

---

## Session with WhatsApp (NanoClaw Pattern)

```python
from agents import Agent, Runner, SQLiteSession

agent = Agent(
    name="WhatsApp Bot",
    instructions="Help users via WhatsApp.",
)

async def handle_whatsapp_message(jid: str, message: str) -> str:
    """
    Handle incoming WhatsApp message.

    Args:
        jid: WhatsApp JID (e.g., "923001234567@s.whatsapp.net")
        message: User's message
    """
    # Create session per WhatsApp user
    session = SQLiteSession(
        session_id=jid,
        db_path="/workspace/conversations.db"
    )

    result = await Runner.run(
        agent,
        message,
        session=session
    )

    return result.final_output
```

---

## Session Best Practices

### 1. Session ID Conventions

```python
# Good session IDs
session_id = f"user:{user_id}"
session_id = f"chat:{conversation_id}"
session_id = f"whatsapp:{jid}"

# Bad session IDs (too generic)
session_id = "user"
session_id = "session"
```

### 2. Session Cleanup

```python
import os
from datetime import datetime, timedelta

def cleanup_old_sessions(db_path: str, max_age_days: int = 30):
    """Remove sessions older than max_age_days."""
    import sqlite3

    conn = sqlite3.connect(db_path)
    cutoff = datetime.now() - timedelta(days=max_age_days)

    conn.execute(
        "DELETE FROM sessions WHERE updated_at < ?",
        (cutoff.isoformat(),)
    )
    conn.commit()
    conn.close()
```

### 3. Session per Conversation vs per User

```python
# Per-user session (continuous history)
session = SQLiteSession(f"user:{user_id}", "conversations.db")

# Per-conversation session (isolated chats)
session = SQLiteSession(f"conv:{conversation_id}", "conversations.db")

# Hybrid: User + topic
session = SQLiteSession(f"user:{user_id}:topic:{topic}", "conversations.db")
```

### 4. Error Handling

```python
from agents import Runner, SQLiteSession

async def safe_chat(user_id: str, message: str) -> str:
    try:
        session = SQLiteSession(user_id, "chat.db")
        result = await Runner.run(agent, message, session=session)
        return result.final_output
    except Exception as e:
        # Log error, return fallback
        print(f"Session error for {user_id}: {e}")
        # Try without session as fallback
        result = await Runner.run(agent, message)
        return result.final_output
```

---

## Memory Comparison Table

| Feature | SQLiteSession | RedisSession |
|---------|--------------|--------------|
| Setup | None | Redis server |
| Persistence | File-based | Server-based |
| Multi-server | No | Yes |
| Speed | Fast (local) | Fast (network) |
| TTL Support | Manual | Built-in |
| Use Case | Dev/Single | Production |
