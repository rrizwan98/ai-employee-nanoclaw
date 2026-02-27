# ChatKit Server - Thread Store Reference

Complete guide to thread persistence in ChatKit.

---

## Overview

Thread stores persist:
- Thread metadata (id, title, timestamps)
- Message history
- User associations
- Custom metadata

---

## Built-in Stores

### SQLiteThreadStore

Best for: Development, single-server deployments

```python
from chatkit.server import SQLiteThreadStore

store = SQLiteThreadStore("data/threads.db")
```

### RedisThreadStore

Best for: Production, multi-server deployments

```python
from chatkit.server import RedisThreadStore

store = RedisThreadStore(
    url="redis://localhost:6379",
    prefix="chatkit:threads:",
)
```

---

## SQLite Store Details

### Initialization

```python
class MyChatKitServer(ChatKitServer):
    store = SQLiteThreadStore("data/threads.db")
```

### Auto-created Tables

```sql
CREATE TABLE threads (
    id TEXT PRIMARY KEY,
    title TEXT,
    domain_key TEXT,
    metadata TEXT,  -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,  -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id)
);
```

---

## Redis Store Details

### Configuration Options

```python
store = RedisThreadStore(
    url="redis://localhost:6379",
    prefix="chatkit:threads:",
    ttl=86400 * 30,  # 30 days expiry
)
```

### With Authentication

```python
store = RedisThreadStore(
    url="redis://:password@localhost:6379/0",
    prefix="chatkit:",
)
```

### With SSL

```python
store = RedisThreadStore(
    url="rediss://user:password@redis.example.com:6380/0",
    prefix="chatkit:",
)
```

---

## Custom Thread Store

Implement the `ThreadStore` interface:

```python
from chatkit.server import ThreadStore, ThreadMetadata
from typing import Optional, List
from datetime import datetime

class PostgresThreadStore(ThreadStore):
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None

    async def initialize(self):
        """Initialize database connection."""
        import asyncpg
        self.pool = await asyncpg.create_pool(self.connection_string)

        # Create tables if not exist
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS threads (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    domain_key VARCHAR(255) NOT NULL,
                    title VARCHAR(255),
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_threads_domain ON threads(domain_key);
                CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
            """)

    async def get_thread(self, thread_id: str) -> Optional[ThreadMetadata]:
        """Get thread by ID."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM threads WHERE id = $1", thread_id
            )
            if row:
                return ThreadMetadata(
                    id=str(row["id"]),
                    title=row["title"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    metadata=dict(row["metadata"]) if row["metadata"] else {},
                )
            return None

    async def save_thread(self, thread: ThreadMetadata) -> None:
        """Save or update thread."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO threads (id, domain_key, title, metadata, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    metadata = EXCLUDED.metadata,
                    updated_at = EXCLUDED.updated_at
                """,
                thread.id,
                thread.metadata.get("domain_key", "default"),
                thread.title,
                thread.metadata,
                thread.created_at,
                thread.updated_at,
            )

    async def delete_thread(self, thread_id: str) -> None:
        """Delete thread and all messages."""
        async with self.pool.acquire() as conn:
            await conn.execute("DELETE FROM threads WHERE id = $1", thread_id)

    async def list_threads(
        self,
        domain_key: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ThreadMetadata]:
        """List threads for history panel."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM threads
                WHERE domain_key = $1
                ORDER BY updated_at DESC
                LIMIT $2 OFFSET $3
                """,
                domain_key, limit, offset
            )
            return [
                ThreadMetadata(
                    id=str(row["id"]),
                    title=row["title"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
                for row in rows
            ]

    async def get_messages(self, thread_id: str) -> List[dict]:
        """Get all messages in thread."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT role, content, created_at FROM messages
                WHERE thread_id = $1
                ORDER BY created_at ASC
                """,
                thread_id
            )
            return [
                {"role": row["role"], "content": row["content"]}
                for row in rows
            ]

    async def add_message(
        self,
        thread_id: str,
        role: str,
        content: str,
    ) -> None:
        """Add message to thread."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO messages (thread_id, role, content)
                VALUES ($1, $2, $3)
                """,
                thread_id, role, content
            )

            # Update thread timestamp
            await conn.execute(
                "UPDATE threads SET updated_at = NOW() WHERE id = $1",
                thread_id
            )
```

---

## Using Custom Store

```python
class MyChatKitServer(ChatKitServer):
    store = PostgresThreadStore(os.getenv("DATABASE_URL"))

    async def on_startup(self):
        """Initialize store on startup."""
        await self.store.initialize()
```

---

## Message History

### Saving Messages

```python
async def respond(self, thread, input, context):
    message = input.content

    # Generate response
    response = await generate_response(message)

    # Stream response
    yield TextDeltaEvent(response)

    # Save both messages
    await self.store.add_message(thread.id, "user", message)
    await self.store.add_message(thread.id, "assistant", response)
```

### Loading History

```python
async def respond(self, thread, input, context):
    # Load conversation history
    messages = await self.store.get_messages(thread.id)

    # Include in agent context
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
    ]

    # Run agent with history
    result = Runner.run_streamed(
        agent,
        [*history, {"role": "user", "content": input.content}],
    )
```

---

## Thread with User Association

### Store with User ID

```python
class UserAwareStore(PostgresThreadStore):
    async def save_thread(self, thread: ThreadMetadata, user_id: str) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO threads (id, user_id, title, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    updated_at = EXCLUDED.updated_at
                """,
                thread.id, user_id, thread.title,
                thread.created_at, thread.updated_at,
            )

    async def list_threads_for_user(
        self,
        user_id: str,
        limit: int = 50,
    ) -> List[ThreadMetadata]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM threads
                WHERE user_id = $1
                ORDER BY updated_at DESC
                LIMIT $2
                """,
                user_id, limit
            )
            return [ThreadMetadata(**dict(row)) for row in rows]
```

### Using in Server

```python
class MyChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        request = context.get("request")
        user_id = request.headers.get("X-User-ID")

        if user_id:
            # Associate thread with user
            thread.metadata["user_id"] = user_id
            await self.store.save_thread(thread, user_id)
```

---

## Thread Cleanup

### Auto-delete Old Threads

```python
import asyncio
from datetime import datetime, timedelta

async def cleanup_old_threads(store: ThreadStore, days: int = 30):
    """Delete threads older than specified days."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    async with store.pool.acquire() as conn:
        deleted = await conn.execute(
            """
            DELETE FROM threads
            WHERE updated_at < $1
            """,
            cutoff
        )
        print(f"Deleted {deleted} old threads")

# Run periodically
async def start_cleanup_task(store: ThreadStore):
    while True:
        await cleanup_old_threads(store)
        await asyncio.sleep(86400)  # Daily
```

### Message Limit per Thread

```python
class LimitedMessageStore(ThreadStore):
    MAX_MESSAGES = 100

    async def add_message(self, thread_id: str, role: str, content: str):
        # Add message
        await super().add_message(thread_id, role, content)

        # Check count
        async with self.pool.acquire() as conn:
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM messages WHERE thread_id = $1",
                thread_id
            )

            if count > self.MAX_MESSAGES:
                # Delete oldest messages
                await conn.execute(
                    """
                    DELETE FROM messages
                    WHERE id IN (
                        SELECT id FROM messages
                        WHERE thread_id = $1
                        ORDER BY created_at ASC
                        LIMIT $2
                    )
                    """,
                    thread_id, count - self.MAX_MESSAGES
                )
```

---

## Thread Search

```python
class SearchableStore(ThreadStore):
    async def search_threads(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
    ) -> List[ThreadMetadata]:
        """Search threads by content."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT DISTINCT t.* FROM threads t
                JOIN messages m ON t.id = m.thread_id
                WHERE t.user_id = $1
                AND (t.title ILIKE $2 OR m.content ILIKE $2)
                ORDER BY t.updated_at DESC
                LIMIT $3
                """,
                user_id, f"%{query}%", limit
            )
            return [ThreadMetadata(**dict(row)) for row in rows]
```
