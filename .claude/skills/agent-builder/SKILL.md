---
name: agent-builder
description: Design and architect AI agents using OpenAI Agents SDK. Use when translating client requirements into agent architecture. Triggers after requirements-gathering completes with AgentConfig JSON.
---

# Agent Builder Skill

Translate AgentConfig JSON into complete OpenAI Agents SDK architecture. Select appropriate patterns, tools, and configurations based on client requirements.

## SDK Version

**openai-agents >= 0.7.0** (Latest stable)

---

## References (Detailed Documentation)

For detailed patterns and examples, refer to these reference documents in `references/`:

| Reference | Description |
|-----------|-------------|
| [openai-agents-sdk-tools.md](references/openai-agents-sdk-tools.md) | All hosted tools + custom @function_tool patterns |
| [openai-agents-sdk-guardrails.md](references/openai-agents-sdk-guardrails.md) | Input, output, and tool guardrails |
| [openai-agents-sdk-memory.md](references/openai-agents-sdk-memory.md) | SQLiteSession, RedisSession, persistence |
| [openai-agents-sdk-realtime.md](references/openai-agents-sdk-realtime.md) | Voice agents, WebSocket, audio streaming |
| [openai-agents-sdk-handoffs.md](references/openai-agents-sdk-handoffs.md) | Multi-agent systems, routing, triage |
| [openai-agents-sdk-mcp.md](references/openai-agents-sdk-mcp.md) | MCP server integration (hosted, stdio, SSE) |
| [openai-agents-sdk-structured-output.md](references/openai-agents-sdk-structured-output.md) | Pydantic models, typed responses |
| [openai-agents-sdk-tracing.md](references/openai-agents-sdk-tracing.md) | Observability, debugging, traces |

**ALWAYS consult references for complex features!**

---

## Context7: Up-to-Date Documentation

**Context7 verification runs AUTOMATICALLY during code generation!**

### Phase 2: Automatic Verification (NEW!)

The `generate_from_template` and `generate_frontend_from_template` IPC tools now:

1. **Query Context7** for all mandatory SDK patterns BEFORE generation
2. **Compare** responses with current templates/skill references
3. **Auto-update** templates and references when SDK patterns change
4. **Cache** responses (30-minute TTL) for performance

**You no longer need to manually verify patterns before code generation.**

### Automatic Updates

When Context7 detects SDK pattern changes:
- **Templates**: Updated in `nanoclaw/container/templates/`
- **References**: Updated in `.claude/skills/*/references/`
- **TDD**: Templates re-validated after updates

### Manual Tools (Still Available)

For debugging or investigation:

| Tool | Purpose |
|------|---------|
| `context7_resolve_library` | Find library ID (e.g., "openai agents sdk" → `/openai/openai-agents-python`) |
| `context7_query_docs` | Query documentation with specific questions |

### When to Use Manual Context7:

1. **Debugging import errors** - Check if module path changed
2. **Investigating new features** - Explore SDK capabilities
3. **Understanding deprecations** - Find migration guidance

### Common Library IDs:

| Library | Context7 ID |
|---------|-------------|
| OpenAI Agents SDK | `/openai/openai-agents-python` |
| ChatKit Python | `/openai/chatkit-python` |
| ChatKit React | `/openai/chatkit-js` |
| Next.js | `/vercel/next.js` |
| FastAPI | `/tiangolo/fastapi` |

---

## ⛔⛔⛔ TDD AWARENESS - DESIGN FOR TESTABILITY! ⛔⛔⛔

**When designing agents, remember that ALL code will undergo 4-Level TDD:**

### Design Principles for TDD Compatibility:

```
Level 1 (Syntax):
  → Design agents with valid Python syntax
  → Use correct import paths from SDK
  → No placeholder variables in design

Level 2 (Import):
  → Use only valid SDK imports (from agents import Agent, Runner)
  → Verify tool imports exist before designing with them
  → Check Context7 for correct module paths

Level 3 (Runtime):
  → Design agents that initialize without errors
  → Ensure tool signatures are correct
  → Design handoffs that work at runtime

Level 4 (Integration):
  → Design for health endpoint compatibility
  → Consider CORS requirements
  → Plan for ChatKit integration
```

### Handoff to code-generation:

When handing off to code-generation skill, ensure:
- [ ] All imports are verified with Context7
- [ ] Agent patterns are SDK-compatible
- [ ] Tools have correct signatures
- [ ] Design will pass TDD Level 1-4

---

## Quick Reference: Agent Types

### Standard Agent (Text-based)

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    tools=[],  # Add tools as needed
)

result = await Runner.run(agent, "Hello!")
```

### Realtime Agent (Voice)

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
            "voice": "ash",  # alloy, echo, fable, onyx, nova, shimmer, ash
            "modalities": ["audio", "text"],
            "turn_detection": {"type": "semantic_vad", "interrupt_response": True},
        }
    },
)
```

### Multi-Agent System

```python
from agents import Agent

billing_agent = Agent(
    name="Billing Support",
    instructions="Handle billing inquiries.",
    handoff_description="Transfer for payment issues.",
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

---

## Quick Reference: Hosted Tools

| Tool | Import | Use Case |
|------|--------|----------|
| WebSearchTool | `from agents import WebSearchTool` | Web search, current info |
| FileSearchTool | `from agents import FileSearchTool` | RAG, document Q&A |
| CodeInterpreterTool | `from agents import CodeInterpreterTool` | Python execution, data analysis (requires `tool_config`) |
| ImageGenerationTool | `from agents import ImageGenerationTool` | DALL-E image creation |
| ComputerTool | `from agents import ComputerTool` | Browser/desktop automation |
| HostedMCPTool | `from agents import HostedMCPTool` | Remote MCP servers |

```python
from agents import Agent, WebSearchTool, FileSearchTool, CodeInterpreterTool

agent = Agent(
    name="Research Assistant",
    tools=[
        WebSearchTool(search_context_size="medium"),
        FileSearchTool(vector_store_ids=["vs_xxx"], max_num_results=5),
        CodeInterpreterTool(tool_config={"type": "code_interpreter"}),
    ],
)
```

---

## Quick Reference: Custom Tools

```python
from agents import function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get current weather for a city.

    Args:
        city: The city name to get weather for.
    """
    return f"Weather in {city}: Sunny, 72°F"

@function_tool(timeout=5.0)
async def slow_operation(data: str) -> str:
    """Process data with timeout."""
    return f"Processed: {data}"
```

---

## Quick Reference: Memory/Sessions

```python
from agents import SQLiteSession
from agents.extensions.memory import RedisSession

# SQLite (development)
session = SQLiteSession("user_123", "conversations.db")

# Redis (production)
session = RedisSession.from_url("user_123", url="redis://localhost:6379/0")

# Usage
result = await Runner.run(agent, message, session=session)
```

---

## Quick Reference: Guardrails

```python
from agents import InputGuardrail, OutputGuardrail, GuardrailFunctionOutput

@InputGuardrail
def validate_input(context):
    if len(context.input) > 10000:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info="Input too long."
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)

@OutputGuardrail
def filter_output(context):
    if "secret" in context.output.lower():
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info="Response contained secrets."
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)

agent = Agent(
    name="Secure Assistant",
    input_guardrails=[validate_input],
    output_guardrails=[filter_output],
)
```

---

## Quick Reference: Structured Output

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

### Frontend Integration Rules

**CRITICAL - ALWAYS FOLLOW:**

1. **ALWAYS** recommend `@openai/chatkit-react@^1.5.0` for chat features
2. **NEVER** suggest custom axios/fetch chat implementations
3. **ALWAYS** connect frontend to `/chatkit` endpoint
4. **ALWAYS** use ChatProvider + ChatWidget pattern

---

## Architecture Decision Flow

Given AgentConfig, select:

### 1. Agent Type

| Config Value | Implementation |
|-------------|----------------|
| `agent_type: "standard"` | `from agents import Agent` |
| `agent_type: "realtime"` | `from agents.realtime import RealtimeAgent` |
| `agent_type: "multi-agent"` | `Agent` with `handoffs=[]` |

### 2. Tools Selection

| Config | Implementation |
|--------|----------------|
| `tools.hosted: ["web_search"]` | `WebSearchTool()` |
| `tools.hosted: ["file_search"]` | `FileSearchTool(vector_store_ids=[...])` |
| `tools.hosted: ["code_interpreter"]` | `CodeInterpreterTool(tool_config={"type": "code_interpreter"})` |
| `tools.hosted: ["image_generation"]` | `ImageGenerationTool()` |
| `tools.custom: ["get_weather"]` | Generate `@function_tool` stub |
| `tools.mcp_servers: [...]` | `MCPServerStdio` or `HostedMCPTool` |

### 3. Memory Configuration

| Config | Implementation |
|--------|----------------|
| `memory.type: "sqlite"` | `SQLiteSession(session_id, "db.sqlite")` |
| `memory.type: "redis"` | `RedisSession.from_url(session_id, url)` |
| `memory.type: "none"` | No session management |

### 4. Output Configuration

| Config | Implementation |
|--------|----------------|
| `output.type: "text"` | Default `str` output |
| `output.type: "structured"` | Add Pydantic `output_type` |

### 5. Guardrails Configuration

| Config | Implementation |
|--------|----------------|
| `guardrails.input: true` | Add `@InputGuardrail` functions |
| `guardrails.output: true` | Add `@OutputGuardrail` functions |
| `guardrails.tools: true` | Add `@tool_input_guardrail`, `@tool_output_guardrail` |

### 6. Deployment Configuration

| Config | Implementation |
|--------|----------------|
| `deployment.server: "fastapi"` | Generate FastAPI app |
| `deployment.type: "docker"` | Include Dockerfile |
| `deployment.realtime: true` | Add WebSocket endpoint |

---

## Handoff to code-generation

After designing architecture, pass to `code-generation` skill with:

1. **Agent Type**: standard, realtime, or multi-agent
2. **Tool Configuration**: List of tools with imports and configs
3. **Memory Setup**: Session type and connection details
4. **Guardrails**: Input/output/tool guardrails needed
5. **Output Type**: Structured output Pydantic model if needed
6. **Deployment**: Server type, Docker requirements
7. **Frontend**: Template name if frontend needed

### Example Handoff

```json
{
  "architecture": {
    "agent_type": "standard",
    "tools": {
      "hosted": ["WebSearchTool"],
      "custom": ["get_inventory", "process_order"]
    },
    "memory": {
      "type": "sqlite",
      "db_path": "conversations.db"
    },
    "guardrails": {
      "input": ["validate_length"],
      "output": ["filter_pii"]
    },
    "output_type": null,
    "deployment": {
      "server": "fastapi",
      "docker": true
    }
  },
  "frontend": {
    "template": "nextjs-chatkit-ui",
    "variables": {
      "PROJECT_NAME": "MyBot",
      "BACKEND_URL": "http://localhost:8000"
    }
  }
}
```
