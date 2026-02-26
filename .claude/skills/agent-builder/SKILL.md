---
name: agent-builder
description: Design and architect AI agents using OpenAI Agents SDK. Use when translating client requirements into agent architecture. Triggers after requirements-gathering completes with AgentConfig JSON.
---

# Agent Builder Skill

Translate AgentConfig JSON into complete OpenAI Agents SDK architecture. Select appropriate patterns, tools, and configurations based on client requirements.

## SDK Version

**openai-agents >= 0.7.0** (Latest stable)

---

## Context7: Up-to-Date Documentation

**ALWAYS use Context7 tools when you need latest SDK documentation!**

### Available Tools:

| Tool | Purpose |
|------|---------|
| `context7_resolve_library` | Find library ID (e.g., "openai agents sdk" → `/openai/openai-agents-python`) |
| `context7_query_docs` | Query documentation with specific questions |

### When to Use Context7:

1. **Before code generation** - Verify latest API patterns
2. **When unsure about SDK features** - Check if feature exists
3. **For error debugging** - Find correct usage examples
4. **For new features** - Get up-to-date documentation

### Common Library IDs:

| Library | Context7 ID |
|---------|-------------|
| OpenAI Agents SDK | `/openai/openai-agents-python` |
| ChatKit React | `/openai/chatkit-js` |
| Next.js | `/vercel/next.js` |
| FastAPI | `/tiangolo/fastapi` |

### Example Usage:

```
Step 1: Resolve library
  context7_resolve_library("openai agents sdk", "How to create agent with tools")

Step 2: Query documentation
  context7_query_docs("/openai/openai-agents-python", "WebSearchTool usage example")
```

---

## CRITICAL: Frontend Detection

**BEFORE designing backend architecture, ALWAYS check if client also needs frontend!**

### Step 0: Check for Frontend Requirements

Look for these indicators in AgentConfig or conversation:
- `needs_frontend: true` in AgentConfig
- Keywords: "website", "UI", "landing page", "chat widget", "test the agent"
- Client wants to "try" or "use" the agent immediately

### Frontend + Backend Decision Matrix

| Request Type | Backend | Frontend | Template |
|--------------|---------|----------|----------|
| "Build me an FAQ bot" | ✅ Standard Agent | ❌ None | `basic-chatbot` |
| "Build me an FAQ bot with website" | ✅ Standard Agent | ✅ Next.js + ChatKit | `basic-chatbot` + `nextjs-chatkit-ui` |
| "I want to test my agent" | Already built | ✅ Next.js + ChatKit | `nextjs-chatkit-ui` only |
| "Create a chat widget" | ❌ None (use existing) | ✅ ChatKit React | `chatkit-react` only |

### Frontend Architecture Options

| Option | Use Case | Files Generated |
|--------|----------|-----------------|
| **Full Website (nextjs-chatkit-ui)** | Complete landing page with chat | 30+ Next.js files |
| **Chat Widget Only (chatkit-react)** | Embed in existing site | 5-10 React files |
| **Backend API Only (chatkit-fastapi-backend)** | ChatKit backend for any frontend | 3-5 FastAPI files |

### Frontend Integration Rules

**CRITICAL - ALWAYS FOLLOW:**

1. **ALWAYS** recommend `@openai/chatkit-react` for chat features
2. **NEVER** suggest custom axios/fetch chat implementations
3. **ALWAYS** connect frontend to `/chatkit` endpoint
4. **ALWAYS** use ChatProvider + ChatWidget pattern

### Handoff for Frontend

If frontend is needed, after backend design:

```
1. Complete backend architecture (standard flow)
2. Note: "Frontend Required: nextjs-chatkit-ui template"
3. Pass both to code-generation:
   - Backend: AgentConfig + architecture
   - Frontend: template name + variables (PROJECT_NAME, BACKEND_URL, etc.)
```

---

## Agent Types

### Standard Agent (Text-based)

Use for: chatbots, FAQ bots, assistants, data processing

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    tools=[],
)

# Sync execution
result = Runner.run_sync(agent, "Hello!")
print(result.final_output)

# Async execution
result = await Runner.run(agent, "Hello!")
```

### Realtime Agent (Voice/WebSocket)

Use for: voice assistants, phone bots, real-time conversation

```python
from agents.realtime import RealtimeAgent, RealtimeRunner

agent = RealtimeAgent(
    name="Voice Assistant",
    instructions="You are a helpful voice assistant.",
    tools=[get_weather],
)

runner = RealtimeRunner(
    starting_agent=agent,
    config={
        "model_settings": {
            "model_name": "gpt-realtime",
            "voice": "alloy",  # alloy, echo, fable, onyx, nova, shimmer, ash
            "modalities": ["audio", "text"],
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "turn_detection": {"type": "semantic_vad", "interrupt_response": True},
        }
    },
)
```

---

## Hosted Tools (OpenAI)

### WebSearchTool

Use for: finding information online, current events, research

```python
from agents import Agent, WebSearchTool

agent = Agent(
    name="Research Assistant",
    instructions="Search the web to answer questions.",
    tools=[WebSearchTool()],
)
```

### FileSearchTool (RAG)

Use for: document Q&A, knowledge base, internal docs

```python
from agents import Agent, FileSearchTool

agent = Agent(
    name="Document Assistant",
    tools=[
        FileSearchTool(
            vector_store_ids=["vs_xxxxx"],
            max_num_results=5,
        ),
    ],
)
```

**Note**: Client must create vector_store_id via OpenAI API first.

### CodeInterpreterTool

Use for: calculations, data analysis, Python execution

```python
from agents import Agent, CodeInterpreterTool

agent = Agent(
    name="Data Analyst",
    tools=[CodeInterpreterTool()],
)
```

### ImageGenerationTool

Use for: creating images, visual content, DALL-E

```python
from agents import Agent, ImageGenerationTool

agent = Agent(
    name="Creative Assistant",
    tools=[ImageGenerationTool()],
)
```

### ComputerTool

Use for: browser automation, web scraping, desktop tasks

```python
from agents import Agent, ComputerTool

agent = Agent(
    name="Automation Agent",
    tools=[ComputerTool()],
)
```

### HostedMCPTool

Use for: connecting to external MCP servers

```python
from agents import Agent, HostedMCPTool

agent = Agent(
    name="MCP Agent",
    tools=[
        HostedMCPTool(
            tool_config={
                "type": "mcp",
                "server_url": "https://mcp.example.com",
            }
        ),
    ],
)
```

---

## Custom Tools

### @function_tool Decorator

Use for: custom business logic, API calls, database operations

```python
from agents import Agent, function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get current weather for a city."""
    return f"Weather in {city}: Sunny, 72°F"

@function_tool
async def book_appointment(date: str, time: str, service: str) -> str:
    """Book an appointment."""
    return f"Booked {service} on {date} at {time}"

agent = Agent(
    name="Assistant",
    tools=[get_weather, book_appointment],
)
```

### Tool Guardrails

Use for: validating tool inputs/outputs, security

```python
from agents import (
    function_tool,
    tool_input_guardrail,
    tool_output_guardrail,
    ToolGuardrailFunctionOutput,
)

@tool_input_guardrail
def block_secrets(data):
    if "sk-" in str(data.context.tool_arguments):
        return ToolGuardrailFunctionOutput.reject_content(
            "Remove secrets before calling."
        )
    return ToolGuardrailFunctionOutput.allow()

@tool_output_guardrail
def redact_sensitive(data):
    if "password" in str(data.output):
        return ToolGuardrailFunctionOutput.reject_content(
            "Output contains sensitive data."
        )
    return ToolGuardrailFunctionOutput.allow()

@function_tool(
    tool_input_guardrails=[block_secrets],
    tool_output_guardrails=[redact_sensitive],
)
def process_data(text: str) -> str:
    """Process text data."""
    return f"Processed: {text}"
```

---

## Handoffs (Multi-Agent)

### Agent-to-Agent Handoffs

Use for: routing, specialist teams, complex workflows

```python
from agents import Agent

billing_agent = Agent(
    name="Billing Support",
    instructions="Handle billing inquiries.",
    handoff_description="Transfer to billing for payment issues.",
)

technical_agent = Agent(
    name="Technical Support",
    instructions="Handle technical issues.",
    handoff_description="Transfer for technical problems.",
)

triage_agent = Agent(
    name="Triage",
    instructions="Route to appropriate specialist.",
    handoffs=[billing_agent, technical_agent],
)
```

### Realtime Handoffs

Use for: voice agent routing

```python
from agents.realtime import RealtimeAgent, realtime_handoff

billing = RealtimeAgent(name="Billing", instructions="...")
technical = RealtimeAgent(name="Technical", instructions="...")

main_agent = RealtimeAgent(
    name="Main",
    instructions="Route to specialists.",
    handoffs=[
        realtime_handoff(billing, tool_description="Transfer to billing"),
        realtime_handoff(technical, tool_description="Transfer to technical"),
    ],
)
```

---

## Memory/Sessions

### SQLiteSession

Use for: simple persistence, development, single-instance

```python
from agents import Agent, Runner, SQLiteSession

session = SQLiteSession("user_123", "conversations.db")

# Add to conversation
await session.add_items([
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
])

# Use with Runner
result = await Runner.run(agent, "Continue", session=session)
```

### RedisSession

Use for: scalable persistence, production, multi-instance

```python
from agents import Agent, Runner
from agents.memory import RedisSession

session = RedisSession(
    session_id="user_123",
    redis_url="redis://localhost:6379",
)

result = await Runner.run(agent, "Hello", session=session)
```

---

## Guardrails

### Input Guardrails

Use for: validating user input before processing

```python
from agents import Agent, InputGuardrail, GuardrailFunctionOutput

@InputGuardrail
def validate_input(context):
    if len(context.input) > 10000:
        return GuardrailFunctionOutput.reject_content(
            "Input too long. Max 10000 characters."
        )
    return GuardrailFunctionOutput.allow()

agent = Agent(
    name="Assistant",
    input_guardrails=[validate_input],
)
```

### Output Guardrails

Use for: filtering agent responses

```python
from agents import Agent, OutputGuardrail, GuardrailFunctionOutput

@OutputGuardrail
def filter_output(context):
    if "confidential" in context.output.lower():
        return GuardrailFunctionOutput.reject_content(
            "Response contained confidential information."
        )
    return GuardrailFunctionOutput.allow()

agent = Agent(
    name="Assistant",
    output_guardrails=[filter_output],
)
```

---

## Structured Output

### Pydantic Models

Use for: data extraction, structured responses

```python
from pydantic import BaseModel
from agents import Agent, Runner

class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

agent = Agent(
    name="Calendar Extractor",
    instructions="Extract calendar events from text.",
    output_type=CalendarEvent,
)

result = await Runner.run(agent, "Meeting with John tomorrow at 3pm")
event: CalendarEvent = result.final_output
```

---

## Dynamic Instructions

### Callable Instructions

Use for: personalization, context-aware behavior

```python
from agents import Agent, RunContextWrapper

def dynamic_instructions(context: RunContextWrapper, agent: Agent) -> str:
    user_name = context.context.get("user_name", "User")
    return f"You are helping {user_name}. Be friendly and helpful."

agent = Agent(
    name="Personalized Assistant",
    instructions=dynamic_instructions,
)
```

---

## Human-in-the-Loop

### Approval Workflows

Use for: sensitive operations, financial transactions

```python
from agents import Agent, Runner, function_tool

async def needs_approval(ctx, params, call_id) -> bool:
    return params.get("amount", 0) > 1000

@function_tool(needs_approval=needs_approval)
async def transfer_money(amount: float, to_account: str) -> str:
    return f"Transferred ${amount} to {to_account}"

agent = Agent(name="Banking Agent", tools=[transfer_money])

result = await Runner.run(agent, "Transfer $5000")
if result.interruptions:
    for interruption in result.interruptions:
        approved = await get_human_approval(interruption)
        if approved:
            result.state.approve(interruption)
        else:
            result.state.reject(interruption)
    result = await Runner.run(agent, result.state)
```

---

## MCP Server Integration

### Local MCP (Stdio)

Use for: local tool servers, file systems, databases

```python
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

async with MCPServerStdio(
    name="Filesystem Server",
    params={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"],
    },
) as server:
    agent = Agent(
        name="File Assistant",
        mcp_servers=[server],
    )
    result = await Runner.run(agent, "List files")
```

---

## FastAPI Integration

### HTTP Endpoint

```python
from fastapi import FastAPI
from agents import Agent, Runner

app = FastAPI()
agent = Agent(name="API Agent", instructions="...")

@app.post("/chat")
async def chat(message: str):
    result = await Runner.run(agent, message)
    return {"response": result.final_output}
```

### WebSocket Endpoint (Realtime)

```python
from fastapi import FastAPI, WebSocket
from agents.realtime import RealtimeAgent, RealtimeRunner

app = FastAPI()
agent = RealtimeAgent(name="Voice Agent", instructions="...")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    runner = RealtimeRunner(starting_agent=agent)
    session = await runner.run()

    async with session:
        async for event in session:
            if event.type == "audio":
                await websocket.send_bytes(event.audio)
```

---

## Architecture Decision Flow

Given AgentConfig, select:

1. **Agent Type**:
   - `agent_type: "standard"` → Use `Agent`
   - `agent_type: "realtime"` → Use `RealtimeAgent`
   - `agent_type: "multi-agent"` → Use `Agent` with `handoffs`

2. **Tools**:
   - `tools.hosted` → Import corresponding Tool classes
   - `tools.custom` → Generate `@function_tool` stubs
   - `tools.mcp_servers` → Add `MCPServerStdio` or `HostedMCPTool`

3. **Memory**:
   - `memory.type: "sqlite"` → Add `SQLiteSession`
   - `memory.type: "redis"` → Add `RedisSession`
   - `memory.type: "none"` → No session management

4. **Output**:
   - `output.type: "text"` → Default behavior
   - `output.type: "structured"` → Add Pydantic model with `output_type`

5. **Deployment**:
   - `deployment.server: "fastapi"` → Generate FastAPI app
   - `deployment.type: "docker"` → Include Dockerfile

---

## Handoff to code-generation

After designing architecture, pass to `code-generation` skill with:

1. Selected agent type and configuration
2. Tool imports and configurations
3. Memory/session setup
4. Deployment files needed
5. Template variable values
