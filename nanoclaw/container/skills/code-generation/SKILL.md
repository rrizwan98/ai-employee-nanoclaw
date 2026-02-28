---
name: code-generation
description: Generate OpenAI Agents SDK code files from agent architecture. Use after agent-builder completes design. Triggers when architecture is confirmed and ready for code generation.
---

# Code Generation Skill

Generate complete, runnable OpenAI Agents SDK code from AgentConfig and architecture design. Package files for WhatsApp delivery.

---

## ⛔⛔⛔ STOP! READ THIS FIRST! ⛔⛔⛔

### YOU ARE FORBIDDEN FROM WRITING CODE MANUALLY!

**MANDATORY: Use IPC Template Tools for ALL code generation!**

```
⛔ DO NOT write store.py manually - USE generate_from_template IPC tool!
⛔ DO NOT write server.py manually - USE generate_from_template IPC tool!
⛔ DO NOT write ChatWidget.tsx manually - USE generate_frontend_from_template IPC tool!
⛔ DO NOT write layout.tsx manually - USE generate_frontend_from_template IPC tool!
```

### Required IPC Workflow:

**Backend:**
```
1. match_template(request) → Get template name
2. load_template(name) → Get template files
3. generate_from_template(name, variables) → Generate code
4. Deliver AS-IS (NO MODIFICATIONS!)
```

**Frontend:**
```
1. is_frontend_request(request) → Check if frontend
2. match_frontend_template(request) → Get template name
3. generate_frontend_from_template(name, variables) → Generate code
4. Deliver AS-IS (NO MODIFICATIONS!)
```

### ⛔ FORBIDDEN IMPORTS - YOUR TRAINING DATA IS WRONG!

```python
# ❌ WRONG - These are from your outdated training data!
from chatkit.stores import Store  # WRONG! It's chatkit.store (singular)
from chatkit.types import AttachmentItem  # WRONG! It's Attachment
from chatkit.types import ContentItem  # WRONG! Doesn't exist
```

```tsx
// ❌ WRONG - These are from your outdated training data!
<Script onLoad={() => ...} />  // WRONG! No onLoad in Server Component
import { useChatKit } from '@openai/chatkit-react'  // WRONG! Use CDN
```

### ✅ Templates Have Correct Code - USE THEM!

Templates use:
- `from chatkit.store import Store` (singular)
- `from chatkit.types import Attachment` (not AttachmentItem)
- No `onLoad` on Script components
- CDN web component approach

**DO NOT OVERRIDE TEMPLATES WITH YOUR KNOWLEDGE!**

---

## CRITICAL: MANDATORY Template Usage

**YOU MUST COPY CODE TEMPLATES EXACTLY FROM THIS SKILL. DO NOT MODIFY METHOD SIGNATURES!**

### ChatKit Store - EXACT Signatures Required

```python
# MANDATORY: Store[dict] with context: dict in ALL methods
class InMemoryStore(Store[dict]):
    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
    async def load_threads(self, limit: int, after: Optional[str], order: str, context: dict) -> Page[ThreadMetadata]:
    async def load_thread_items(self, thread_id: str, after: Optional[str], limit: int, order: str, context: dict) -> Page[ThreadItem]:
    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
    async def delete_thread(self, thread_id: str, context: dict) -> None:
```

### ChatKitServer respond() - EXACT Signature Required

```python
# MANDATORY: This exact signature
async def respond(
    self,
    thread: ThreadMetadata,
    input_user_message: UserMessageItem | None,
    context: dict,
) -> AsyncIterator[ThreadStreamEvent]:
```

### FORBIDDEN Patterns - NEVER USE:

```python
# WRONG - Missing context parameter
async def load_thread(self, thread_id: str) -> ThreadMetadata:  # FORBIDDEN!
async def save_thread(self, thread: ThreadMetadata) -> None:  # FORBIDDEN!

# WRONG - Wrong parameter names
async def load_threads(self, limit: int, after_id: str) -> Page:  # FORBIDDEN!
async def load_thread_items(self, thread_id: str, before_id: str) -> Page:  # FORBIDDEN!

# WRONG - Wrong Page format
return Page(items=data, has_more=True)  # FORBIDDEN! Use: Page(data=..., has_more=..., after=...)

# WRONG - Store without generic type
class InMemoryStore(Store):  # FORBIDDEN! Use: Store[dict]
```

### Pre-Delivery Checklist

Before delivering ANY code, verify:
- [ ] `store.py` class is `InMemoryStore(Store[dict])`
- [ ] ALL store methods have `context: dict` as LAST parameter
- [ ] `load_threads(limit, after, order, context)` - exact param order
- [ ] `load_thread_items(thread_id, after, limit, order, context)` - exact param order
- [ ] `Page(data=..., has_more=..., after=...)` - exact field names
- [ ] `respond(thread, input_user_message, context)` - exact signature

---

## References

| Reference | Description |
|-----------|-------------|
| [code-templates.md](references/code-templates.md) | Complete code templates for all agent types |
| [import-mappings.md](references/import-mappings.md) | Config to Python import mappings |

**See `../agent-builder/references/` for SDK pattern details.**

---

## Context7: Up-to-Date Documentation

**Use Context7 tools to verify SDK patterns before code generation!**

### Available Tools:

| Tool | Purpose |
|------|---------|
| `context7_resolve_library` | Find library ID for any library |
| `context7_query_docs` | Get latest documentation and examples |

### When to Use:

1. **Before generating agent code** - Verify OpenAI Agents SDK patterns
2. **For ChatKit integration** - Check latest `@openai/chatkit-react` usage
3. **When unsure about imports** - Verify correct module paths
4. **For error fixing** - Find correct API signatures

### Quick Reference IDs:

```
OpenAI Agents SDK: /openai/openai-agents-python
ChatKit React:     /openai/chatkit-js
FastAPI:           /tiangolo/fastapi
Next.js:           /vercel/next.js
```

---

## IMPORTANT: Use CDN Approach for ChatKit (NOT npm package)

**DO NOT USE** `@openai/chatkit-react` npm package for self-hosted backends - it requires a valid `domainKey` from OpenAI Platform and won't work with localhost.

**USE** the CDN script approach which works with any self-hosted backend.

### FORBIDDEN - NEVER DO THIS:

1. **NEVER** use `@openai/chatkit-react` npm package
2. **NEVER** use `useChatKit` hook from npm package
3. **NEVER** add `@openai/chatkit-react` to package.json

### What MUST Be Used Instead (CDN Approach):

**Step 1: Add CDN Script to layout.tsx `<head>`:**

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Step 2: ChatWidget.tsx using Web Component:**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatKitElement extends HTMLElement {
  setOptions: (options: any) => void
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChatKitLoaded, setIsChatKitLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    const checkChatKit = () => {
      if (typeof window !== 'undefined' && window.customElements?.get('openai-chatkit')) {
        setIsChatKitLoaded(true)
      }
    }
    checkChatKit()
    const interval = setInterval(checkChatKit, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isChatKitLoaded && !isInitialized.current && containerRef.current) {
      const chatkit = document.createElement('openai-chatkit') as ChatKitElement
      chatkit.style.width = '100%'
      chatkit.style.height = '100%'
      containerRef.current.appendChild(chatkit)
      isInitialized.current = true

      setTimeout(() => {
        if (chatkit.setOptions) {
          chatkit.setOptions({
            api: {
              domainKey: 'local-dev',
              url: process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit',
            },
          })
        }
      }, 100)
    }
  }, [isChatKitLoaded])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.display = isOpen ? 'block' : 'none'
    }
  }, [isOpen])

  return (
    <>
      <div ref={containerRef} className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50" style={{ display: 'none' }} />
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full z-50">
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  )
}
```

### Validation Check:

Before delivering ANY frontend code, verify:
- [ ] `layout.tsx` contains CDN script in `<head>`
- [ ] `ChatWidget.tsx` uses `document.createElement('openai-chatkit')`
- [ ] `ChatWidget.tsx` uses `chatkit.setOptions()` for configuration
- [ ] `package.json` does NOT contain `@openai/chatkit-react`
- [ ] All interactive components have `'use client'` directive

---

## CRITICAL: Frontend vs Backend Detection

**BEFORE generating any code, ALWAYS check if this is a frontend request!**

### Step 0: Detect Request Type

Use `is_frontend_request` tool to check if client wants frontend/UI:

```
Frontend keywords: website, frontend, UI, landing page, chat widget, nextjs,
                   test agent, try agent, use agent, interface, web app
```

**If frontend request detected:**
1. **MANDATORY**: Use `match_frontend_template` to find best template
2. **MANDATORY**: Use `load_frontend_template` to get template details
3. **MANDATORY**: Use `generate_frontend_from_template` to generate code
4. **FORBIDDEN**: Writing custom frontend code manually is NOT ALLOWED!

**Frontend Template Priority:**
| Request Type | Template to Use |
|--------------|-----------------|
| Full website with chat | `nextjs-chatkit-ui` |
| Just chat widget | Use `chatkit-react` skill |
| Chat backend API | Use `chatkit-fastapi-backend` skill |

### Frontend Generation - MANDATORY Steps:

```
Step 1: Call is_frontend_request(request)
        → If true, proceed to Step 2
        → If false, use backend generation

Step 2: Call match_frontend_template(request)
        → Returns: template name (e.g., "nextjs-chatkit-ui")

Step 3: Call load_frontend_template(template_name)
        → Returns: metadata, files, variables

Step 4: Collect variable values from client or use defaults

Step 5: Call generate_frontend_from_template(template_name, variables)
        → Returns: generated files with ChatKit properly configured

Step 6: Deliver generated files (DO NOT MODIFY ChatWidget.tsx!)
```

### Frontend Generation Rules

**CRITICAL - ALWAYS FOLLOW:**

1. **ALWAYS** use CDN approach for ChatKit (NOT npm package)
2. **ALWAYS** add CDN script to layout.tsx `<head>`
3. **ALWAYS** use `document.createElement('openai-chatkit')` web component
4. **ALWAYS** use `chatkit.setOptions()` for configuration
5. **ALWAYS** add `'use client'` directive to ALL interactive components
6. **ALWAYS** connect to backend `/chatkit` endpoint
7. **NEVER** use `@openai/chatkit-react` npm package

### Frontend Progress Updates

Send real-time updates during frontend generation:

```
🔄 Frontend Generation Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/6: Detecting frontend template...
Step 2/6: Loading nextjs-chatkit-ui template...
Step 3/6: Customizing with project variables...
Step 4/6: Generating 30+ component files...
Step 5/6: Saving to client-agents/{jid}/...
Step 6/6: Packaging ZIP for delivery...

✅ Frontend Generated Successfully!
📁 32 files created
🚀 Ready for npm install && npm run dev
```

---

## Backend Generation Workflow

**Only proceed with backend generation if NOT a frontend request.**

### Step 1: Select Templates

Based on `agent_type`:

| Agent Type | Template Directory |
|------------|-------------------|
| standard | `templates/standard-agent/` |
| realtime | `templates/realtime-agent/` |
| multi-agent | `templates/multi-agent/` |

### Step 2: Prepare Template Variables

Extract from AgentConfig JSON:

```json
{
  "AGENT_NAME": "{{name}}",
  "DESCRIPTION": "{{description}}",
  "INSTRUCTIONS": "{{instructions}}",
  "AGENT_TYPE": "{{agent_type}}",
  "TOOLS": {
    "hosted": ["web_search", "code_interpreter"],
    "custom": ["get_inventory", "send_email"],
    "mcp_servers": []
  },
  "MEMORY": {
    "type": "sqlite",
    "config": {"db_path": "conversations.db"}
  },
  "DEPLOYMENT": {
    "type": "docker",
    "server": "fastapi",
    "port": 8000
  }
}
```

### Step 3: Generate Files

For **Standard Agent**:

```
Generated files:
├── main.py           # Entry point + FastAPI
├── agents.py         # Agent configuration
├── tools.py          # Custom tool definitions
├── config.py         # Memory/session config (if needed)
├── models.py         # Pydantic models (if structured output)
├── requirements.txt  # Dependencies
├── .env.example      # Environment template
├── Dockerfile        # Container config
└── README.md         # Documentation
```

For **Realtime Agent**:

```
Generated files:
├── main.py           # WebSocket entry point
├── server.py         # FastAPI WebSocket server
├── agents.py         # RealtimeAgent configuration
├── tools.py          # Custom tool definitions
├── requirements.txt  # Dependencies (with [voice])
├── .env.example      # Environment template
├── Dockerfile        # Container config
└── README.md         # Documentation
```

For **Multi-Agent**:

```
Generated files:
├── main.py           # Entry point
├── orchestrator.py   # Triage/router agent
├── specialists.py    # Specialist agents
├── tools.py          # Shared tools
├── requirements.txt  # Dependencies
├── .env.example      # Environment template
├── Dockerfile        # Container config
└── README.md         # Documentation
```

### Step 4: Template Rendering

Apply Jinja2-style template substitution:

```python
# Template: agents.py.template
from agents import Agent
{% if TOOLS.hosted %}
{% if "web_search" in TOOLS.hosted %}
from agents import WebSearchTool
{% endif %}
{% endif %}

# Rendered: agents.py
from agents import Agent
from agents import WebSearchTool
```

### Step 5: Validation

Before packaging, validate:

- [ ] All imports resolve correctly
- [ ] No placeholder variables remain (`{{...}}`)
- [ ] Required files exist (main.py, requirements.txt)
- [ ] Dockerfile builds successfully (if docker deployment)

### Step 6: Local Storage (BEFORE WhatsApp Delivery)

**CRITICAL**: Save code locally BEFORE sending to WhatsApp.

#### 6.1 Determine Storage Path

```python
# Extract from context
client_jid = "923032206662@s.whatsapp.net"  # From WhatsApp message
project_slug = slugify(agent_name)           # URL-safe: "faq-bot"

# Storage paths
base_path = "/workspace/client-agents"
project_path = f"{base_path}/{client_jid}/{project_slug}"
current_path = f"{project_path}/current"
```

#### 6.2 Check for Existing Project

```python
import os
import json

metadata_file = f"{project_path}/metadata.json"
is_update = os.path.exists(metadata_file)

if is_update:
    # Read existing metadata
    with open(metadata_file) as f:
        metadata = json.load(f)
    current_version = metadata["current_version"]
    new_version = current_version + 1
else:
    new_version = 1
```

#### 6.3 Save Version History (Updates Only)

```python
if is_update:
    # Copy current to versions/v{n}
    version_path = f"{project_path}/versions/v{current_version}"
    shutil.copytree(current_path, version_path)
```

#### 6.4 Write Generated Files

```python
import os

# Create directories
os.makedirs(current_path, exist_ok=True)
os.makedirs(f"{project_path}/versions", exist_ok=True)

# Write each generated file
for filename, content in generated_files.items():
    filepath = f"{current_path}/{filename}"
    with open(filepath, 'w') as f:
        f.write(content)
```

#### 6.5 Create/Update metadata.json

```python
from datetime import datetime

metadata = {
    "project_id": project_id,          # From database
    "name": agent_name,
    "slug": project_slug,
    "client_jid": client_jid,
    "agent_type": agent_type,
    "current_version": new_version,
    "created_at": metadata.get("created_at", datetime.utcnow().isoformat()),
    "updated_at": datetime.utcnow().isoformat(),
    "requirements_history": [
        *metadata.get("requirements_history", []),
        {
            "version": new_version,
            "date": datetime.utcnow().isoformat(),
            "requirements": agent_config
        }
    ]
}

with open(metadata_file, 'w') as f:
    json.dump(metadata, f, indent=2)
```

### Step 7: Package and Deliver

After local storage, create ZIP and send to WhatsApp.

---

## Code Patterns

### Standard Agent main.py (ChatKit-Compatible)

```python
"""
{AGENT_NAME} - ChatKit Backend
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from chatkit.server import StreamingResult

from server import server

load_dotenv()

app = FastAPI(title="{AGENT_NAME}")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"service": "{AGENT_NAME}", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    """ChatKit protocol endpoint."""
    payload = await request.body()
    result = await server.process(payload, context={})

    if isinstance(result, StreamingResult):
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Standard Agent server.py (ChatKitServer)

```python
"""
{AGENT_NAME} - ChatKit Server
"""

from collections.abc import AsyncIterator

from chatkit.server import ChatKitServer
from chatkit.types import (
    ThreadMetadata,
    ThreadStreamEvent,
    UserMessageItem,
)
from chatkit.agents import AgentContext, simple_to_agent_input, stream_agent_response
from agents import Runner

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

### Standard Agent store.py (InMemoryStore)

```python
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
        if thread_id not in self._threads:
            raise NotFoundError(f"Thread {thread_id} not found")
        return self._threads[thread_id]

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        self._threads[thread.id] = thread

    async def load_threads(
        self, limit: int, after: Optional[str], order: str, context: dict
    ) -> Page[ThreadMetadata]:
        threads = list(self._threads.values())
        sorted_threads = sorted(threads, key=lambda t: t.created_at, reverse=(order == "desc"))
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
        self._threads.pop(thread_id, None)
        self._items.pop(thread_id, None)

    async def load_thread_items(
        self, thread_id: str, after: Optional[str], limit: int, order: str, context: dict
    ) -> Page[ThreadItem]:
        items = self._items.get(thread_id, [])
        sorted_items = sorted(items, key=lambda i: i.created_at, reverse=(order == "desc"))
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
        self._items[thread_id].append(item)

    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        if thread_id in self._items:
            self._items[thread_id] = [i for i in self._items[thread_id] if i.id != item_id]

    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        if attachment_id not in self._attachments:
            raise NotFoundError(f"Attachment {attachment_id} not found")
        return self._attachments[attachment_id]

    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        self._attachments[attachment.id] = attachment

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        self._attachments.pop(attachment_id, None)

    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        if thread_id not in self._items:
            raise NotFoundError(f"Thread {thread_id} not found")
        for item in self._items[thread_id]:
            if item.id == item_id:
                return item
        raise NotFoundError(f"Item {item_id} not found")

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        if thread_id not in self._items:
            self._items[thread_id] = []
        for i, existing in enumerate(self._items[thread_id]):
            if existing.id == item.id:
                self._items[thread_id][i] = item
                return
        self._items[thread_id].append(item)
```

### Realtime Agent server.py

```python
"""
{AGENT_NAME} - Realtime Voice Server
"""

from fastapi import FastAPI, WebSocket
from agents.realtime import RealtimeAgent, RealtimeRunner
from agents_config import agent

app = FastAPI(title="{AGENT_NAME}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    runner = RealtimeRunner(
        starting_agent=agent,
        config={
            "model_settings": {
                "voice": "alloy",
                "modalities": ["audio", "text"],
            }
        },
    )

    session = await runner.run()
    async with session:
        # Handle incoming audio
        async def receive_audio():
            while True:
                data = await websocket.receive_bytes()
                await session.send_audio(data)

        # Send outgoing audio
        async for event in session:
            if event.type == "audio":
                await websocket.send_bytes(event.audio)
            elif event.type == "transcript":
                await websocket.send_json({
                    "type": "transcript",
                    "text": event.text
                })
```

### Multi-Agent orchestrator.py

```python
"""
{AGENT_NAME} - Multi-Agent Orchestrator
"""

from agents import Agent
from specialists import billing_agent, technical_agent, general_agent

triage_agent = Agent(
    name="Triage",
    instructions="""
    You are the first point of contact. Analyze the user's request
    and route to the appropriate specialist:

    - Billing issues → billing_agent
    - Technical problems → technical_agent
    - General inquiries → general_agent
    """,
    handoffs=[billing_agent, technical_agent, general_agent],
)
```

---

## Memory Configuration

### SQLite config.py

```python
from agents import SQLiteSession

def get_session(session_id: str) -> SQLiteSession:
    return SQLiteSession(
        session_id=session_id,
        db_path="conversations.db",
    )
```

### Redis config.py

```python
import os
from agents.memory import RedisSession

def get_session(session_id: str) -> RedisSession:
    return RedisSession(
        session_id=session_id,
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
    )
```

---

## Structured Output models.py

```python
from pydantic import BaseModel
from typing import List, Optional

class {OUTPUT_SCHEMA_NAME}(BaseModel):
    """Generated output schema for {AGENT_NAME}."""
{OUTPUT_FIELDS}
```

Example:

```python
class CalendarEvent(BaseModel):
    """Extracted calendar event."""
    name: str
    date: str
    time: Optional[str] = None
    participants: List[str] = []
    location: Optional[str] = None
```

---

## File Delivery

### Complete Workflow

```
1. Generate code files
2. Validate all files
3. Save to /workspace/client-agents/{jid}/{slug}/current/
4. Create version history (if update)
5. Update metadata.json
6. Create ZIP archive
7. Send to WhatsApp
```

### Package Format

Create ZIP archive from `current/` folder:

```
{agent_name_slug}.zip
├── main.py
├── agents.py
├── tools.py
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

### WhatsApp Delivery

Send via NanoClaw document message:

```javascript
// NanoClaw message format
{
  type: "document",
  mimetype: "application/zip",
  filename: "{agent_name_slug}.zip",
  caption: "Your agent is ready! Extract and run:\n\n1. pip install -r requirements.txt\n2. cp .env.example .env\n3. Edit .env with your API keys\n4. python main.py"
}
```

For updates:

```javascript
{
  type: "document",
  mimetype: "application/zip",
  filename: "{agent_name_slug}-v{version}.zip",
  caption: "Updated! Version {version} includes:\n- {change_summary}\n\nExtract and replace your existing files."
}
```

---

## Progress Updates

Send progress updates during generation:

```
1/7: Generating agent configuration...
2/7: Creating custom tools...
3/7: Setting up deployment files...
4/7: Writing documentation...
5/7: Saving to local storage...
6/7: Creating version history...
7/7: Packaging and sending...
```

For updates:

```
1/5: Reading existing project...
2/5: Applying changes...
3/5: Saving version {n}...
4/5: Updating current files...
5/5: Packaging and sending...
```

---

## Error Handling

### Template Not Found

```
Error: Template not found for agent type '{type}'.
Available types: standard, realtime, multi-agent

Would you like me to use the standard template instead?
```

### Invalid Configuration

```
Error: Invalid AgentConfig detected.
Missing required field: {field}

Please run through requirements-gathering again.
```

### Generation Failed

```
Error: Code generation failed.
Reason: {error}

Would you like me to:
1. Try again with simplified configuration
2. Show the partial output
3. Start over with requirements
```

---

## Handoff Flow

```
requirements-gathering → AgentConfig JSON
                            ↓
agent-builder → Architecture decisions
                            ↓
code-generation → Generated files
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
    Local Storage              Create ZIP Archive
    (client-agents/)                  ↓
              ↓               WhatsApp Delivery
    metadata.json             (client-communication)
    version history
```

## Update Flow

```
Client: "Add web search to my FAQ bot"
                    ↓
1. Find existing project: client-agents/{jid}/faq-bot/
2. Read current/ files
3. Read metadata.json for context
4. Modify code (add WebSearchTool)
5. Save current → versions/v1/
6. Write updated files to current/
7. Update metadata.json (version: 2)
8. Send updated ZIP to WhatsApp
```

---

## ⛔ CRITICAL: TDD + AUTO-VERIFICATION (MANDATORY)

**YOU MUST verify ALL generated code BEFORE delivering to client!**

### Complete Verification Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    CODE GENERATION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. GENERATE CODE (via IPC templates)                       │
│              ↓                                              │
│  2. GENERATE TEST FILES                                     │
│              ↓                                              │
│  3. INSTALL DEPENDENCIES                                    │
│     → pip install -r requirements.txt                       │
│              ↓                                              │
│  4. RUN TESTS                                               │
│     → pytest -v                                             │
│              ↓                                              │
│     ┌────────┴────────┐                                     │
│     ↓                 ↓                                     │
│  PASS?            FAIL?                                     │
│     ↓                 ↓                                     │
│  Continue      ┌──────┴──────┐                              │
│                ↓             ↓                              │
│           Read Error    Check Skills                        │
│                ↓             ↓                              │
│           Context7      Apply Fix                           │
│                ↓             ↓                              │
│           Get Fix       Re-run Tests                        │
│                └─────────────┘                              │
│                      ↓                                      │
│              Loop until PASS                                │
│                      ↓                                      │
│  5. START SERVER                                            │
│     → python main.py                                        │
│              ↓                                              │
│  6. TEST HEALTH ENDPOINT                                    │
│     → curl localhost:8000/health                            │
│              ↓                                              │
│     ┌────────┴────────┐                                     │
│     ↓                 ↓                                     │
│  WORKS?           ERROR?                                    │
│     ↓                 ↓                                     │
│  Continue      Fix → Re-test                                │
│     ↓                                                       │
│  7. DELIVER TO CLIENT                                       │
│     → Only after 100% verification!                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Backend Test Files (Auto-Generate)

For every backend, generate these test files:

**tests/conftest.py:**
```python
"""
Pytest configuration and fixtures.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from main import app


@pytest_asyncio.fixture
async def client():
    """Async test client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

**tests/test_health.py:**
```python
"""
Health endpoint tests.
"""

import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test health endpoint returns healthy status."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test root endpoint returns service info."""
    response = await client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()
```

**tests/test_store.py:**
```python
"""
Store implementation tests.
"""

import pytest
from store import InMemoryStore


@pytest.fixture
def store():
    """Create fresh store instance."""
    return InMemoryStore()


@pytest.mark.asyncio
async def test_save_and_load_thread(store):
    """Test thread save and load."""
    from chatkit.types import ThreadMetadata

    thread = ThreadMetadata(id="test-1", title="Test Thread")
    await store.save_thread(thread, context={})

    loaded = await store.load_thread("test-1", context={})
    assert loaded.id == "test-1"


@pytest.mark.asyncio
async def test_load_threads_pagination(store):
    """Test thread listing with pagination."""
    result = await store.load_threads(
        limit=10,
        after=None,
        order="desc",
        context={}
    )
    assert hasattr(result, 'data')
    assert hasattr(result, 'has_more')
```

### Frontend Test Files (Auto-Generate)

**__tests__/health.test.ts:**
```typescript
import { describe, it, expect } from 'vitest'

describe('Frontend Build', () => {
  it('should have valid environment', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
```

### Error Resolution with Skills + Context7

When tests fail, follow this exact order:

```
1. READ THE ERROR MESSAGE CAREFULLY
   → Identify: import error? type error? runtime error?

2. CHECK SKILLS FIRST (MANDATORY)
   → Re-read: chatkit-fastapi-backend/SKILL.md
   → Re-read: code-generation/SKILL.md
   → Skills have UPDATED correct patterns

3. USE CONTEXT7 FOR SDK DOCUMENTATION
   → Resolve library:
     context7_resolve_library("openai-chatkit")
   → Query docs:
     context7_query_docs(library_id, "error: {paste error}")
   → Get latest correct implementation

4. APPLY FIX
   → Use exact code from skills
   → Or use exact code from Context7
   → Never guess or use training data!

5. RE-RUN VERIFICATION
   → pytest -v
   → python main.py
   → curl localhost:8000/health
   → Loop until ALL pass
```

### Progress Updates (With Verification)

```
🔄 Code Generation Started
━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/10: Matching template...
Step 2/10: Loading template files...
Step 3/10: Generating code with variables...
Step 4/10: Generating test files...
Step 5/10: Saving to local storage...
Step 6/10: Installing dependencies...
Step 7/10: Running tests...
Step 8/10: Starting server...
Step 9/10: Verifying health endpoint...
Step 10/10: Packaging for delivery...

✅ All Tests Passed!
✅ Server Running!
✅ Health Check OK!

📦 Delivering to client...
```

### If Verification Fails

```
❌ Test Failed: test_store.py::test_load_threads_pagination

🔍 Analyzing error...
📚 Checking skills for correct pattern...
🌐 Querying Context7 for latest docs...

🔧 Fix Applied: Updated load_threads() signature

🔄 Re-running tests...
✅ All Tests Passed!

Continuing with delivery...
```

### ⛔ NEVER Skip Verification

```
❌ FORBIDDEN:
   Generate → Package → Deliver

✅ REQUIRED:
   Generate → Test → Verify → Fix if needed → Re-test → Deliver
```
