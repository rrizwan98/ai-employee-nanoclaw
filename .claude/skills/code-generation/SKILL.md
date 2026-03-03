---
name: code-generation
description: Generate OpenAI Agents SDK code files from agent architecture. Use after agent-builder completes design. Triggers when architecture is confirmed and ready for code generation.
---

# Code Generation Skill

Generate complete, runnable OpenAI Agents SDK code from AgentConfig and architecture design. Package files for WhatsApp delivery.

---

## References

| Reference | Description |
|-----------|-------------|
| [code-templates.md](references/code-templates.md) | Complete code templates for all agent types |
| [import-mappings.md](references/import-mappings.md) | Config to Python import mappings |

**See `../agent-builder/references/` for SDK pattern details.**

---

## Context7: Up-to-Date Documentation

**Context7 verification runs AUTOMATICALLY before every code generation!**

### Phase 2: Automatic Verification (NEW!)

When you call `generate_from_template` or `generate_frontend_from_template`, the system automatically:

1. **Queries Context7** for all relevant SDK patterns
2. **Compares** Context7 responses with current templates/references
3. **Updates** templates and references if mismatches detected
4. **Uses Cache** (30-minute TTL) to avoid redundant queries

This ensures templates always use the latest SDK patterns without manual verification.

### Automatic Query Points

| Query Point | Library ID | Applies To |
|-------------|------------|------------|
| Agent Class | `/openai/openai-agents-python` | Backend |
| WebSearchTool | `/openai/openai-agents-python` | Backend |
| CodeInterpreterTool | `/openai/openai-agents-python` | Backend |
| FileSearchTool | `/openai/openai-agents-python` | Backend |
| ChatKit Store | `/openai/chatkit-python` | Backend |
| FastAPI ChatKit | `/openai/chatkit-python` | Backend |
| Next.js ChatKit | `/openai/chatkit-js` | Frontend |

### Response Metadata

Generated code includes Context7 verification status:

```
**Context7 Verification**: ✅ Verified
**Patterns Updated**: 2 (ref:agent-builder/references/sdk.md, tpl:basic-chatbot/main.py)
**Cache Hits**: 5/7
```

### Manual Tools (Optional)

You can still use manual tools for debugging:

| Tool | Purpose |
|------|---------|
| `context7_resolve_library` | Find library ID for any library |
| `context7_query_docs` | Get latest documentation and examples |

### Force Refresh

To bypass cache and force Context7 refresh:

```typescript
generate_from_template({
  template_name: "basic-chatbot",
  variables: {...},
  force_context7_refresh: true  // Bypass 30-min cache
})
```

### Quick Reference IDs:

```
OpenAI Agents SDK: /openai/openai-agents-python
ChatKit Python:    /openai/chatkit-python
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
7. **NEVER** use any version other than `@openai/chatkit-react`

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
- [ ] `package.json` contains `"@openai/chatkit-react": "^1.5.0"`

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

### Step 5: TDD Validation (MANDATORY - 4-Level Testing)

**CRITICAL**: Before delivery, ALL generated code MUST pass the 4-Level TDD tests.

---

## ⛔⛔⛔ MANDATORY TDD FOR ALL CODE - NO EXCEPTIONS! ⛔⛔⛔

**Whether you use templates OR write manual code, TDD is REQUIRED!**

### NEW: `validate_project_code` IPC Tool (USE THIS!)

**For ALL code (template OR manual), call this IPC tool before delivery:**

```json
{
  "operation": "validate_project_code",
  "params": {
    "project_path": "/workspace/client-agents/{jid}/{project}/backend",
    "project_type": "backend",
    "run_level_3": true,
    "run_level_4": false
  }
}
```

**Response:**
```json
{
  "success": true/false,
  "result": {
    "tdd_validation": {
      "success": true/false,
      "level1": { "passed": true/false, "errors": [] },
      "level2": { "passed": true/false, "errors": [] },
      "level3": { "passed": true/false, "errors": [] },
      "level4": { "passed": true/false, "errors": [] }
    },
    "delivery_decision": "✅ SAFE TO DELIVER" or "⛔ DO NOT DELIVER"
  }
}
```

**If `success: false` → DO NOT DELIVER! Fix the errors first.**

---

### When TDD Runs Automatically:
- `generate_from_template` IPC → Level 1-2 auto-run
- `generate_frontend_from_template` IPC → Level 1-2 auto-run

### When YOU Must Call `validate_project_code`:
- **Existing project updates** (like adding FlightSpecialist)
- **Manual code modifications**
- **Any code NOT from template**
- **Before packaging ZIP for delivery**

### MANDATORY TDD Commands (Run These BEFORE Delivery!):

```bash
# Navigate to generated code directory
cd /workspace/client-agents/{jid}/{project}/backend

# Level 1: Syntax Tests (MUST PASS)
python -c "
import ast
import sys
for f in ['*.py']:
    import glob
    for pyfile in glob.glob(f):
        try:
            with open(pyfile) as file:
                ast.parse(file.read())
            print(f'[PASS] {pyfile}')
        except SyntaxError as e:
            print(f'[FAIL] {pyfile}: {e}')
            sys.exit(1)
print('Level 1: ALL SYNTAX TESTS PASSED')
"

# Level 2: Import Tests (MUST PASS)
python -c "
import sys
try:
    from agents import Agent, Runner
    print('[PASS] OpenAI Agents SDK imports')
except ImportError as e:
    print(f'[FAIL] SDK imports: {e}')
    sys.exit(1)

# Import all project files
import importlib.util
import glob
for pyfile in glob.glob('*.py'):
    module_name = pyfile[:-3]
    try:
        spec = importlib.util.spec_from_file_location(module_name, pyfile)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        print(f'[PASS] {pyfile} imports successfully')
    except Exception as e:
        print(f'[FAIL] {pyfile}: {e}')
        sys.exit(1)
print('Level 2: ALL IMPORT TESTS PASSED')
"

# Level 3: Runtime Tests (SHOULD PASS)
python -c "
from agents_config import agent
print(f'[PASS] Agent: {agent.name}')
print(f'[PASS] Tools: {len(agent.tools)} tools configured')
if hasattr(agent, 'handoffs') and agent.handoffs:
    print(f'[PASS] Handoffs: {[h.name for h in agent.handoffs]}')
print('Level 3: RUNTIME TESTS PASSED')
"

# Level 4: Server Start Test (RECOMMENDED)
timeout 10 python main.py &
sleep 5
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### TDD Validation Workflow (MANDATORY FOR ALL CODE):

```
┌─────────────────────────────────────────────────────────────┐
│         MANDATORY TDD FOR ALL CODE GENERATION                │
│         (Template OR Manual - NO EXCEPTIONS!)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Code Generated (Template or Manual)                        │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LEVEL 1: SYNTAX TESTS                                │   │
│  │ - Run: ast.parse() on all .py files                  │   │
│  │ - Check: No SyntaxError                              │   │
│  │ - Check: No unresolved {{VARIABLES}}                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│                     ALL PASS?                               │
│                    ↓ NO    ↓ YES                            │
│              ┌─────────┐  ┌─────────┐                       │
│              │ FIX CODE│  │CONTINUE │                       │
│              │ RETRY   │  │TO LVL 2 │                       │
│              └─────────┘  └─────────┘                       │
│                               ↓                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LEVEL 2: IMPORT TESTS                                │   │
│  │ - Import all generated Python files                  │   │
│  │ - Verify: from agents import Agent, Runner           │   │
│  │ - Check: No ImportError                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│                     ALL PASS?                               │
│                    ↓ NO    ↓ YES                            │
│              ┌─────────┐  ┌─────────┐                       │
│              │ FIX CODE│  │CONTINUE │                       │
│              │ RETRY   │  │TO LVL 3 │                       │
│              └─────────┘  └─────────┘                       │
│                               ↓                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LEVEL 3: RUNTIME TESTS                               │   │
│  │ - Agent initializes without error                    │   │
│  │ - Tools count matches expected                       │   │
│  │ - Handoffs configured (if multi-agent)               │   │
│  │ - Server starts on test port                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│                     ALL PASS?                               │
│                    ↓ NO    ↓ YES                            │
│              ┌─────────┐  ┌─────────┐                       │
│              │ FIX CODE│  │CONTINUE │                       │
│              │ RETRY   │  │TO LVL 4 │                       │
│              └─────────┘  └─────────┘                       │
│                               ↓                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LEVEL 4: INTEGRATION TESTS                           │   │
│  │ - Health endpoint returns {"status":"healthy"}       │   │
│  │ - CORS allows frontend origin                        │   │
│  │ - ChatKit endpoint responds                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│                     ALL PASS?                               │
│                    ↓ NO    ↓ YES                            │
│              ┌─────────┐  ┌──────────────────────┐          │
│              │ FIX CODE│  │ ✅ ALL TESTS PASSED! │          │
│              │ RETRY   │  │ DELIVER CODE NOW     │          │
│              └─────────┘  └──────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### ⛔ DELIVERY BLOCKED IF:

```
❌ Level 1 fails → STOP! Fix syntax errors first
❌ Level 2 fails → STOP! Fix import errors first
❌ Level 3 fails → WARNING! Fix before delivery if possible
❌ Level 4 fails → WARNING! Notify client of known issues
```

### ✅ ONLY DELIVER WHEN:

```
✅ Level 1 passes (100% required)
✅ Level 2 passes (100% required)
✅ Level 3 passes (recommended)
✅ Level 4 passes (recommended)
```

---

#### Level 1: Syntax Tests (~5 seconds)
```bash
pytest -m level1 -v
```
Validates:
- Template rendering completed
- All variables substituted (no `{{VARIABLE}}` remaining)
- Valid Python syntax (ast.parse succeeds)
- No template placeholders in output

#### Level 2: Import Tests (~15 seconds)
```bash
pytest -m level2 -v
```
Validates:
- OpenAI Agents SDK imports work (`from agents import Agent, Runner`)
- Tool instantiation signatures are correct
- ChatKit imports use singular `chatkit.store` (NOT `chatkit.stores`)
- FastAPI and Pydantic imports resolve
- Typing imports present when type hints used

#### Level 3: Runtime Tests (~60 seconds, requires Docker)
```bash
pytest -m level3 --use-sandbox -v
```
Validates:
- Agent initialization succeeds (no missing parameters)
- CodeInterpreterTool has `tool_config` if required
- Server starts without errors
- Frontend builds successfully (npm run build)
- `"use client"` directive present in React components
- TypeScript compilation passes

#### Level 4: Integration Tests (~120 seconds, requires Docker)
```bash
pytest -m level4 --use-sandbox -v
```
Validates:
- Health endpoint returns `{"status": "healthy"}`
- CORS configuration allows frontend
- Chat message round-trip works
- Session persistence across messages
- Thread creation and listing
- Error responses have proper JSON format

#### Validation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              PRE-DELIVERY VALIDATION (MANDATORY)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Run Level 1 tests: pytest -m level1 -v                  │
│                          ↓                                   │
│  2. Check: ALL tests pass?                                  │
│         ↓ NO                    ↓ YES                       │
│  ┌──────────────┐        ┌──────────────┐                   │
│  │ FIX TEMPLATE │        │ CONTINUE     │                   │
│  │ FIX VARIABLES│        │ TO LEVEL 2   │                   │
│  │ GO TO STEP 1 │        └──────────────┘                   │
│  └──────────────┘               ↓                           │
│                          3. Run Level 2: pytest -m level2   │
│                               ↓                             │
│                          4. Check: ALL pass?                │
│                               ↓ NO        ↓ YES             │
│                          ┌──────────┐  ┌──────────┐         │
│                          │ FIX IMPORTS│ │ CONTINUE │         │
│                          │ USE CONTEXT7│ │ TO LEVEL 3│        │
│                          │ GO TO 3    │ └──────────┘         │
│                          └──────────┘       ↓               │
│                          5. Run Level 3: pytest -m level3   │
│                                 --use-sandbox               │
│                               ↓ FAIL      ↓ PASS            │
│                          ┌──────────┐  ┌──────────┐         │
│                          │ FIX CODE │  │ ✅ READY │         │
│                          │ CHECK SDK │  │ DELIVER! │         │
│                          │ GO TO 1   │  └──────────┘         │
│                          └──────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Common Validation Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Unresolved placeholders: {{AGENT_NAME}}` | Missing variable in template | Add to template_vars dict |
| `SyntaxError: unexpected EOF` | Template logic error | Check Jinja conditionals |
| `ImportError: chatkit.stores` | Wrong module path | Use `chatkit.store` (singular) |
| `TypeError: tool_config required` | SDK version mismatch | Add tool_config param |
| `Server did not start` | Import or config error | Check container logs |
| `Missing 'use client'` | React Server Component issue | Add directive to components |

#### Minimum Pass Criteria

Before delivery, code MUST pass:
- **Always**: Level 1 (Syntax) - 100% pass rate required
- **Always**: Level 2 (Imports) - 100% pass rate required
- **Backend only**: Level 3 (Runtime) - Agent initialization must pass
- **Optional**: Level 4 (Integration) - Recommended but not blocking

**If ANY Level 1 or Level 2 test fails, DO NOT DELIVER. Fix and retest.**

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
