# ChatKit - Thread Management Reference

Complete guide to managing threads/conversations in ChatKit.

---

## Overview

Threads are individual conversation sessions in ChatKit. Each thread:
- Has a unique ID
- Contains message history
- Can be renamed, deleted, or restored
- Persists across sessions (if backend supports it)

---

## Thread Lifecycle

```
User Opens Chat
      ↓
No thread ID → Create new thread
Thread ID exists → Load existing thread
      ↓
User sends message → Messages added to thread
      ↓
Thread saved to backend → Persisted for next session
```

---

## Frontend Thread Management

### Initial Thread

Load a specific thread on mount:

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  initialThread: {
    id: 'thread_abc123',
    title: 'Previous Conversation',
  },
});
```

### Restore from LocalStorage

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

const THREAD_KEY = 'chatkit_current_thread';

export function PersistentChat() {
  // Load saved thread
  const savedThreadId = typeof window !== 'undefined'
    ? localStorage.getItem(THREAD_KEY)
    : null;

  const { control } = useChatKit({
    api: { url: '/chatkit' },
    initialThread: savedThreadId ? { id: savedThreadId } : undefined,
  });

  return <ChatKit control={control} />;
}
```

### Switch Threads

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Switch to existing thread
control.setThreadId('thread_xyz789');

// Create new thread
control.setThreadId(null);
```

### Listen to Thread Changes

```typescript
useEffect(() => {
  const element = chatKitRef.current;
  if (!element) return;

  const handleThreadChange = (e: CustomEvent<{ threadId: string | null }>) => {
    const threadId = e.detail.threadId;

    if (threadId) {
      // Thread selected or created
      localStorage.setItem(THREAD_KEY, threadId);
      console.log('Active thread:', threadId);
    } else {
      // No active thread
      localStorage.removeItem(THREAD_KEY);
    }
  };

  element.addEventListener('chatkit.thread.change', handleThreadChange as EventListener);
  return () => {
    element.removeEventListener('chatkit.thread.change', handleThreadChange as EventListener);
  };
}, []);
```

---

## History Panel Configuration

Enable the built-in history panel:

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  history: {
    enabled: true,      // Show history sidebar
    showDelete: true,   // Allow deleting threads
    showRename: true,   // Allow renaming threads
  },
});
```

### History Panel Features

| Feature | Description |
|---------|-------------|
| Thread List | Shows all past conversations |
| Search | Filter threads by content |
| Rename | Edit thread titles |
| Delete | Remove threads permanently |
| New Chat | Start fresh conversation |

---

## Backend Thread Management

### Thread Storage Options

| Storage | Use Case | Persistence |
|---------|----------|-------------|
| In-memory | Development | Session only |
| SQLite | Single server | Permanent |
| Redis | Multi-server | Permanent |
| PostgreSQL | Production | Permanent |

### SQLite Thread Store

```python
from chatkit.server import ChatKitServer, SQLiteThreadStore

class MyServer(ChatKitServer):
    store = SQLiteThreadStore("threads.db")
```

### Redis Thread Store

```python
from chatkit.server import ChatKitServer, RedisThreadStore

class MyServer(ChatKitServer):
    store = RedisThreadStore(
        url="redis://localhost:6379",
        prefix="chatkit:threads:"
    )
```

### Custom Thread Store

```python
from chatkit.server import ChatKitServer, ThreadStore, ThreadMetadata
from typing import Optional, List

class PostgresThreadStore(ThreadStore):
    def __init__(self, connection_string: str):
        self.conn = create_connection(connection_string)

    async def get_thread(self, thread_id: str) -> Optional[ThreadMetadata]:
        """Load thread by ID."""
        row = await self.conn.fetchone(
            "SELECT * FROM threads WHERE id = $1", thread_id
        )
        if row:
            return ThreadMetadata(
                id=row["id"],
                title=row["title"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
        return None

    async def save_thread(self, thread: ThreadMetadata) -> None:
        """Save or update thread."""
        await self.conn.execute(
            """
            INSERT INTO threads (id, title, created_at, updated_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                updated_at = EXCLUDED.updated_at
            """,
            thread.id, thread.title, thread.created_at, thread.updated_at
        )

    async def delete_thread(self, thread_id: str) -> None:
        """Delete thread and messages."""
        await self.conn.execute(
            "DELETE FROM messages WHERE thread_id = $1", thread_id
        )
        await self.conn.execute(
            "DELETE FROM threads WHERE id = $1", thread_id
        )

    async def list_threads(
        self,
        domain_key: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ThreadMetadata]:
        """List threads for history panel."""
        rows = await self.conn.fetch(
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
                id=row["id"],
                title=row["title"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
            for row in rows
        ]
```

---

## Thread with User Association

Associate threads with authenticated users:

### Frontend (Pass User ID)

```typescript
const { control } = useChatKit({
  api: {
    url: '/chatkit',
    headers: {
      'X-User-ID': currentUser.id,
      'Authorization': `Bearer ${accessToken}`,
    },
  },
});
```

### Backend (Filter by User)

```python
from fastapi import Request

class MyServer(ChatKitServer):
    async def list_threads(
        self,
        domain_key: str,
        context: Any,
    ) -> List[ThreadMetadata]:
        request: Request = context.get("request")
        user_id = request.headers.get("X-User-ID")

        return await self.store.list_threads_for_user(
            domain_key=domain_key,
            user_id=user_id,
        )
```

---

## Thread Title Generation

Auto-generate thread titles from first message:

```python
class MyServer(ChatKitServer):
    async def on_thread_created(
        self,
        thread: ThreadMetadata,
        first_message: str,
        context: Any,
    ) -> ThreadMetadata:
        """Generate title when thread is created."""

        # Use AI to generate title
        title = await self.generate_title(first_message)

        thread.title = title
        await self.store.save_thread(thread)

        return thread

    async def generate_title(self, message: str) -> str:
        """Generate short title from message."""
        # Simple: Use first 50 chars
        if len(message) <= 50:
            return message
        return message[:47] + "..."

        # Advanced: Use AI
        # response = await openai.chat.completions.create(
        #     model="gpt-4o-mini",
        #     messages=[
        #         {"role": "system", "content": "Generate a 3-5 word title for this conversation."},
        #         {"role": "user", "content": message}
        #     ],
        #     max_tokens=20
        # )
        # return response.choices[0].message.content
```

---

## Multi-Device Thread Sync

Sync threads across devices using polling:

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect } from 'react';

export function SyncedChat() {
  const { control } = useChatKit({
    api: { url: '/chatkit' },
  });

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await control.fetchUpdates();
    }, 30000);

    return () => clearInterval(interval);
  }, [control]);

  // Also sync on window focus
  useEffect(() => {
    const handleFocus = async () => {
      await control.fetchUpdates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [control]);

  return <ChatKit control={control} />;
}
```

---

## Thread Database Schema

### SQLite Schema

```sql
CREATE TABLE threads (
    id TEXT PRIMARY KEY,
    domain_key TEXT NOT NULL,
    user_id TEXT,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id)
);

CREATE INDEX idx_threads_domain ON threads(domain_key);
CREATE INDEX idx_threads_user ON threads(user_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
```

### PostgreSQL Schema

```sql
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_key VARCHAR(255) NOT NULL,
    user_id UUID,
    title VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_domain ON threads(domain_key);
CREATE INDEX idx_threads_user ON threads(user_id);
CREATE INDEX idx_threads_updated ON threads(updated_at DESC);
CREATE INDEX idx_messages_thread ON messages(thread_id);
```

---

## Complete Thread Management Example

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useRef, useState } from 'react';

const THREAD_KEY = 'chatkit_thread';

export function ManagedChat() {
  const chatKitRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved thread on mount
  useEffect(() => {
    const saved = localStorage.getItem(THREAD_KEY);
    if (saved) {
      setThreadId(saved);
    }
    setIsLoading(false);
  }, []);

  const { control } = useChatKit({
    api: { url: '/chatkit' },
    initialThread: threadId ? { id: threadId } : undefined,
    history: {
      enabled: true,
      showDelete: true,
      showRename: true,
    },
  });

  // Save thread changes
  useEffect(() => {
    const element = chatKitRef.current;
    if (!element) return;

    const handleThreadChange = (e: CustomEvent<{ threadId: string | null }>) => {
      const newThreadId = e.detail.threadId;
      setThreadId(newThreadId);

      if (newThreadId) {
        localStorage.setItem(THREAD_KEY, newThreadId);
      } else {
        localStorage.removeItem(THREAD_KEY);
      }
    };

    element.addEventListener('chatkit.thread.change', handleThreadChange as EventListener);
    return () => {
      element.removeEventListener('chatkit.thread.change', handleThreadChange as EventListener);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div ref={chatKitRef} className="h-full">
      <ChatKit control={control} className="h-full w-full" />
    </div>
  );
}
```
