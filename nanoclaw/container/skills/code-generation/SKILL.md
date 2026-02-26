---
name: code-generation
description: Generate OpenAI Agents SDK code files from agent architecture. Use after agent-builder completes design. Triggers when architecture is confirmed and ready for code generation.
---

# Code Generation Skill

Generate complete, runnable OpenAI Agents SDK code from AgentConfig and architecture design. Package files for WhatsApp delivery.

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

## FORBIDDEN - NEVER DO THIS (MANDATORY)

**These rules are ABSOLUTE and must NEVER be violated:**

### Frontend Code - FORBIDDEN Actions:

1. **NEVER** write `ChatWidget.tsx` manually - ALWAYS use template
2. **NEVER** use `useState`, `useEffect`, `useRef` for chat functionality
3. **NEVER** use `fetch()` or `axios` for chat API calls
4. **NEVER** import `lucide-react` icons (MessageCircle, Send, X) for chat
5. **NEVER** create custom message bubbles or chat UI components
6. **NEVER** write SSE/streaming code manually for chat
7. **NEVER** use any version other than `@openai/chatkit-react@^0.1.9`

### What MUST Be Used Instead:

```typescript
// CORRECT - Only this pattern is allowed for chat:
import { ChatKit, useChatKit } from '@openai/chatkit-react';

const { control } = useChatKit({
  api: { url: apiUrl, domainKey: domainKey },
  theme: { colorScheme: 'light', radius: 'round' },
  startScreen: { greeting: 'Hello!' },
});

return <ChatKit control={control} className="h-full w-full" />;
```

### Validation Check:

Before delivering ANY frontend code, verify:
- [ ] `ChatWidget.tsx` contains `import { ChatKit, useChatKit } from '@openai/chatkit-react'`
- [ ] `ChatWidget.tsx` does NOT contain `useState` for messages
- [ ] `ChatWidget.tsx` does NOT contain `fetch()` or `axios`
- [ ] `package.json` contains `"@openai/chatkit-react": "^0.1.9"`

**If validation fails, regenerate using `generate_frontend_from_template` tool.**

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

1. **ALWAYS** use `@openai/chatkit-react` for chat features
2. **NEVER** create custom axios/fetch chat implementations
3. **ALWAYS** use template structure: `components/ui/`, `components/chat/`, etc.
4. **ALWAYS** include `ChatProvider` and `ChatWidget` components
5. **ALWAYS** connect to backend `/chatkit` endpoint
6. **ALWAYS** use template IPC tools - manual code is FORBIDDEN

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

### Standard Agent main.py

```python
"""
{AGENT_NAME} - OpenAI Agents SDK Application
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from agents import Runner
from agents_config import agent

load_dotenv()
app = FastAPI(title="{AGENT_NAME}")

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(message: str):
    result = await Runner.run(agent, message)
    return {"response": result.final_output}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
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
