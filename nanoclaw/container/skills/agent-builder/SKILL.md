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

## ⛔ FORBIDDEN IMPORTS - YOUR TRAINING DATA IS WRONG!

```python
# ❌ WRONG - These are from your outdated training data!
from agents.tools import WebSearchTool      # ❌ WRONG! No agents.tools module!
from agents.tools import FileSearchTool     # ❌ WRONG! No agents.tools module!
from agents.tools import CodeInterpreterTool # ❌ WRONG! No agents.tools module!
from agents_sdk import Agent                 # ❌ WRONG! Package is "agents" not "agents_sdk"!
from openai_agents import Agent              # ❌ WRONG! Package is "agents"!
```

### ✅ CORRECT - All imports from "agents" package directly:

```python
from agents import Agent                    # ✅ CORRECT
from agents import Runner                   # ✅ CORRECT
from agents import WebSearchTool            # ✅ CORRECT
from agents import FileSearchTool           # ✅ CORRECT
from agents import CodeInterpreterTool      # ✅ CORRECT
from agents import ImageGenerationTool      # ✅ CORRECT
from agents import function_tool            # ✅ CORRECT
```

---

## Quick Reference: Hosted Tools

| Tool | Import | Use Case |
|------|--------|----------|
| WebSearchTool | `from agents import WebSearchTool` | Web search, current info |
| FileSearchTool | `from agents import FileSearchTool` | RAG, document Q&A |
| CodeInterpreterTool | `from agents import CodeInterpreterTool` | Python execution, data analysis |
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
        CodeInterpreterTool(),
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
| `tools.hosted: ["code_interpreter"]` | `CodeInterpreterTool()` |
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

---

## ⛔ TDD (Test Driven Development) - MANDATORY!

**YOU MUST FOLLOW TDD APPROACH FOR ALL AGENT DEVELOPMENT!**

TDD means: **Write Tests FIRST, Then Write Code**

### ⛔ FORBIDDEN - DO NOT DO THIS:

```
❌ Design architecture without test plan
❌ Skip test file creation
❌ Deliver architecture without test requirements
❌ Proceed to code-generation without test specifications
```

### ✅ REQUIRED - TDD WORKFLOW:

```
Step 1: DESIGN ARCHITECTURE
        ↓
Step 2: CREATE TEST SPECIFICATIONS for each component
        ↓
Step 3: INCLUDE TEST REQUIREMENTS in handoff to code-generation
        ↓
Step 4: VERIFY code-generation creates test files FIRST
        ↓
Step 5: ENSURE all tests pass before delivery
```

---

## TDD Integration in Agent Architecture

### When Designing Architecture, Include Test Plan:

For EVERY component in your architecture, specify:

1. **Agent Tests** - Test agent behavior and responses
2. **Tool Tests** - Test custom tools work correctly
3. **Integration Tests** - Test full agent workflow
4. **API Tests** - Test FastAPI endpoints

### Test Specification Format:

```json
{
  "architecture": {
    "agent_type": "standard",
    "tools": ["get_weather"],
    ...
  },
  "test_plan": {
    "unit_tests": [
      {
        "file": "test_tools.py",
        "tests": [
          "test_get_weather_returns_data",
          "test_get_weather_handles_invalid_city",
          "test_get_weather_timeout"
        ]
      }
    ],
    "integration_tests": [
      {
        "file": "test_agent.py",
        "tests": [
          "test_agent_responds_to_weather_query",
          "test_agent_handles_unknown_query"
        ]
      }
    ],
    "api_tests": [
      {
        "file": "test_api.py",
        "tests": [
          "test_health_endpoint",
          "test_chat_endpoint",
          "test_chatkit_integration"
        ]
      }
    ]
  }
}
```

---

## Handoff to code-generation with TDD

When handing off to code-generation, ALWAYS include:

### 1. Test Files to Create FIRST:

```
tests/
├── test_tools.py      # Custom tool tests
├── test_agent.py      # Agent behavior tests
├── test_api.py        # API endpoint tests
└── test_store.py      # Store implementation tests (if using ChatKit)
```

### 2. Test Requirements per Component:

| Component | Required Tests |
|-----------|----------------|
| Custom Tools | Input validation, output format, error handling |
| Agent | Response accuracy, tool usage, edge cases |
| API Endpoints | Health, chat, streaming, error responses |
| Store | CRUD operations, pagination, error handling |

### 3. TDD Handoff Example:

```json
{
  "architecture": {
    "agent_type": "standard",
    "tools": {
      "custom": ["get_inventory"]
    }
  },
  "tdd_requirements": {
    "phase": "red",
    "test_files_first": [
      {
        "file": "test_tools.py",
        "create_before": "tools.py",
        "tests": [
          "def test_get_inventory_exists(): ...",
          "def test_get_inventory_returns_dict(): ...",
          "def test_get_inventory_handles_empty(): ..."
        ]
      },
      {
        "file": "test_api.py",
        "create_before": "main.py",
        "tests": [
          "def test_health_returns_200(): ...",
          "def test_chat_endpoint_exists(): ..."
        ]
      }
    ],
    "run_tests_command": "pytest -v",
    "expected_initial_result": "FAIL (Red phase - tests before code)"
  }
}
```

---

## ⛔ DELIVERY BLOCKED UNTIL:

```
⛔ DO NOT proceed to code-generation if:
- Test plan is not included in architecture
- Test specifications are missing
- No test files listed in handoff

✅ ONLY handoff when:
- Architecture includes test_plan section
- Every component has test specifications
- TDD phase is clearly marked (red/green)
- Test files are listed to create FIRST
```

---

## Final Verification Before Handoff

Before handing off to code-generation, verify:

```
┌─────────────────────────────────────────────────────────────┐
│              AGENT-BUILDER TDD CHECKLIST                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [ ] Architecture design complete                           │
│  [ ] Test plan included in handoff                          │
│  [ ] Test files listed (test_*.py)                          │
│  [ ] Each component has test specifications                 │
│  [ ] TDD phase marked (start with "red")                    │
│  [ ] test_files_first array populated                       │
│  [ ] Expected test results documented                       │
│                                                              │
│  If ANY item unchecked → DO NOT proceed to code-generation  │
│  If ALL items checked → Handoff to code-generation          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
