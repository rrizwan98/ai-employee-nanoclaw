# Research: OpenAI Agents SDK Patterns

**Feature**: 002-phase2-agent-skills
**Date**: 2026-02-20
**Sources**: Context7, OpenAI Agents SDK Documentation, GitHub Examples

## Executive Summary

This research documents all OpenAI Agents SDK patterns needed for the Agent Builder skills. Each pattern includes code examples that will be embedded in SKILL.md files.

---

## 1. Agent Types

### 1.1 Standard Agent

**Decision**: Use `Agent` class for text-based agents
**Rationale**: Simplest pattern, works with HTTP endpoints

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    tools=[],  # Add tools as needed
)

# Sync execution
result = Runner.run_sync(agent, "Hello!")
print(result.final_output)

# Async execution
result = await Runner.run(agent, "Hello!")
```

### 1.2 Realtime Agent (Voice/WebSocket)

**Decision**: Use `RealtimeAgent` with `RealtimeRunner` for voice agents
**Rationale**: Native WebSocket support, voice streaming, turn detection

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

session = await runner.run()
async with session:
    async for event in session:
        if event.type == "audio":
            # Handle audio output
            pass
```

---

## 2. Hosted Tools

### 2.1 WebSearchTool

**Decision**: Import from `agents` package
**Rationale**: Built-in Bing web search

```python
from agents import Agent, WebSearchTool

agent = Agent(
    name="Research Assistant",
    instructions="Search the web to answer questions.",
    tools=[WebSearchTool()],
)
```

### 2.2 FileSearchTool (RAG)

**Decision**: Requires vector_store_ids from OpenAI
**Rationale**: Retrieval over uploaded documents

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

### 2.3 CodeInterpreterTool

**Decision**: Sandboxed code execution
**Rationale**: Safe Python/data analysis

```python
from agents import Agent, CodeInterpreterTool

agent = Agent(
    name="Data Analyst",
    tools=[CodeInterpreterTool()],
)
```

### 2.4 ImageGenerationTool

**Decision**: DALL-E image generation
**Rationale**: Visual content creation

```python
from agents import Agent, ImageGenerationTool

agent = Agent(
    name="Creative Assistant",
    tools=[ImageGenerationTool()],
)
```

### 2.5 ComputerTool

**Decision**: Browser/desktop automation
**Rationale**: Web scraping, automation tasks

```python
from agents import Agent, ComputerTool

agent = Agent(
    name="Automation Agent",
    tools=[ComputerTool()],
)
```

### 2.6 HostedMCPTool

**Decision**: Remote MCP server integration
**Rationale**: Connect to external tool servers

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

## 3. Custom Tools

### 3.1 Function Tool Decorator

**Decision**: Use `@function_tool` with type hints
**Rationale**: Automatic schema generation

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

### 3.2 Tool Guardrails

**Decision**: Use `tool_input_guardrail` and `tool_output_guardrail`
**Rationale**: Validate tool inputs/outputs for security

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

## 4. Handoffs (Multi-Agent)

### 4.1 Agent-to-Agent Handoffs

**Decision**: Use `handoffs` parameter with handoff_description
**Rationale**: Modular agent composition

```python
from agents import Agent, handoff

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

### 4.2 Realtime Handoffs

**Decision**: Use `realtime_handoff` for voice agents
**Rationale**: Seamless voice conversation transfer

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

## 5. Memory/Sessions

### 5.1 SQLiteSession

**Decision**: Use for simple, file-based persistence
**Rationale**: No external dependencies, good for development

```python
from agents import Agent, Runner, SQLiteSession

session = SQLiteSession("user_123", "conversations.db")

# Add to conversation
await session.add_items([
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
])

# Get history
items = await session.get_items()

# Use with Runner
result = await Runner.run(agent, "Continue our conversation", session=session)
```

### 5.2 RedisSession

**Decision**: Use for scalable, distributed memory
**Rationale**: Production-ready, supports multiple instances

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

## 6. Guardrails

### 6.1 Input Guardrails

**Decision**: Validate before LLM processing
**Rationale**: Block harmful/invalid inputs early

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

### 6.2 Output Guardrails

**Decision**: Validate LLM responses
**Rationale**: Ensure safe, compliant outputs

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

## 7. Structured Output

### 7.1 Pydantic Models

**Decision**: Use `output_type` with BaseModel
**Rationale**: Guaranteed schema compliance

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

## 8. Dynamic Instructions

### 8.1 Callable Instructions

**Decision**: Use function for context-aware prompts
**Rationale**: Personalization, dynamic behavior

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

## 9. FastAPI Integration

### 9.1 HTTP Endpoint

**Decision**: Standard REST endpoint with streaming
**Rationale**: Web API access

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from agents import Agent, Runner

app = FastAPI()
agent = Agent(name="API Agent", instructions="...")

@app.post("/chat")
async def chat(message: str):
    result = await Runner.run(agent, message)
    return {"response": result.final_output}

@app.post("/chat/stream")
async def chat_stream(message: str):
    async def generate():
        async for event in Runner.run_streamed(agent, message):
            if hasattr(event, 'content'):
                yield event.content
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 9.2 WebSocket Endpoint (Realtime)

**Decision**: WebSocket for voice/realtime agents
**Rationale**: Bidirectional audio streaming

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
            elif event.type == "transcript":
                await websocket.send_json({"transcript": event.text})
```

---

## 10. Human-in-the-Loop

### 10.1 Approval Workflows

**Decision**: Use `needs_approval` parameter
**Rationale**: Human oversight for sensitive operations

```python
from agents import Agent, Runner, function_tool

async def needs_approval(ctx, params, call_id) -> bool:
    # Require approval for amounts > $1000
    return params.get("amount", 0) > 1000

@function_tool(needs_approval=needs_approval)
async def transfer_money(amount: float, to_account: str) -> str:
    return f"Transferred ${amount} to {to_account}"

agent = Agent(name="Banking Agent", tools=[transfer_money])

result = await Runner.run(agent, "Transfer $5000 to account 123")
if result.interruptions:
    for interruption in result.interruptions:
        # Get human approval
        approved = await get_human_approval(interruption)
        if approved:
            result.state.approve(interruption)
        else:
            result.state.reject(interruption)
    result = await Runner.run(agent, result.state)
```

---

## 11. MCP Server Integration

### 11.1 Local MCP (Stdio)

**Decision**: Use `MCPServerStdio` for local tools
**Rationale**: Run MCP servers as subprocesses

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
    result = await Runner.run(agent, "List files in the data directory")
```

---

## 12. Runner Options

### 12.1 Run Configuration

**Decision**: Use `run_config` for execution settings
**Rationale**: Control execution behavior

```python
from agents import Agent, Runner, RunConfig

config = RunConfig(
    max_turns=10,
    tracing_disabled=False,
)

result = await Runner.run(
    agent,
    "Complex task",
    run_config=config,
)
```

### 12.2 Streaming

**Decision**: Use `Runner.run_streamed()` for real-time output
**Rationale**: Progressive response delivery

```python
async for event in Runner.run_streamed(agent, "Tell me a story"):
    if event.type == "content":
        print(event.content, end="", flush=True)
    elif event.type == "tool_call":
        print(f"\n[Calling {event.tool_name}]")
```

---

## Conclusions

All OpenAI Agents SDK patterns have been documented with code examples. These will be embedded in the SKILL.md files for:

1. **agent-builder**: Agent types, tools, handoffs configuration
2. **client-communication**: Conversation flow patterns
3. **requirements-gathering**: Structured output for AgentConfig
4. **code-generation**: All code templates with SDK patterns
