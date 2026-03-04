# OpenAI Agents SDK - Tracing & Observability Reference

Complete reference for tracing, debugging, and monitoring agents in OpenAI Agents SDK v0.7.0+.

---

## Overview

Tracing captures comprehensive records of agent execution:

| Component | Description |
|-----------|-------------|
| Traces | End-to-end operation records |
| Spans | Individual steps within traces |
| Events | Specific occurrences (tool calls, etc.) |
| Dashboard | Visual debugging interface |

---

## Basic Tracing

Tracing is enabled by default for all agent runs.

```python
import asyncio
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
)

async def main():
    # Tracing happens automatically
    result = await Runner.run(agent, "Hello!")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Custom Trace Configuration

### With RunConfig

```python
from agents import Agent, Runner, RunConfig

agent = Agent(
    name="Assistant",
    instructions="Help users.",
)

result = await Runner.run(
    agent,
    "Hello!",
    run_config=RunConfig(
        workflow_name="Customer Support",
        trace_id="trace_abc123",        # Custom trace ID
        group_id="conversation_456",    # Group related traces
        trace_metadata={"user_id": "user_789"},
    ),
)
```

### Using trace() Context Manager

```python
from agents import Agent, Runner, trace

async def main():
    agent = Agent(name="Joke Generator", instructions="Tell funny jokes.")

    # Group multiple runs into one trace
    with trace("Joke Workflow"):
        first_result = await Runner.run(agent, "Tell me a joke")
        second_result = await Runner.run(
            agent,
            f"Rate this joke: {first_result.final_output}"
        )

        print(f"Joke: {first_result.final_output}")
        print(f"Rating: {second_result.final_output}")
```

---

## Trace Properties

| Property | Description | Example |
|----------|-------------|---------|
| workflow_name | Logical app identifier | "Customer Service" |
| trace_id | Unique trace identifier | Auto-generated or custom |
| group_id | Link related traces | Conversation ID |
| disabled | Turn off tracing | False |
| metadata | Custom key-value data | {"user_id": "123"} |

```python
from agents import trace

with trace(
    workflow_name="Order Processing",
    trace_id="order_trace_001",
    group_id="order_12345",
    metadata={
        "customer_id": "cust_789",
        "order_value": 150.00,
        "region": "US-West",
    }
):
    result = await Runner.run(agent, "Process this order")
```

---

## Traces and Spans

### What Gets Traced

| Event Type | Description |
|------------|-------------|
| LLM Generation | Model calls with input/output |
| Tool Calls | Function tool executions |
| Handoffs | Agent-to-agent transfers |
| Guardrails | Input/output validation |
| Custom Events | Your own trace points |

### Spans Structure

```
Trace: "Customer Support"
├── Span: Agent "Triage" started
│   ├── Span: LLM generation
│   └── Span: Tool call "check_order"
├── Span: Handoff to "Billing Agent"
└── Span: Agent "Billing Agent" completed
    ├── Span: LLM generation
    └── Span: Tool call "process_refund"
```

---

## Disabling Tracing

```python
from agents import Agent, Runner, RunConfig

# Disable for specific run
result = await Runner.run(
    agent,
    "Hello!",
    run_config=RunConfig(tracing_disabled=True),
)

# Disable globally (environment)
# Set: OPENAI_AGENTS_DISABLE_TRACING=1
```

---

## Tracing with Sessions

```python
from agents import Agent, Runner, SQLiteSession, trace

agent = Agent(
    name="Assistant",
    instructions="Help users.",
)

session = SQLiteSession("user_123", "conversations.db")

# Trace entire conversation
with trace(workflow_name="Conversation", group_id="conv_123"):
    # First turn
    result1 = await Runner.run(
        agent,
        "What's the weather?",
        session=session
    )

    # Second turn (same trace group)
    result2 = await Runner.run(
        agent,
        "What about tomorrow?",
        session=session
    )
```

---

## Tracing Multi-Agent Systems

```python
from agents import Agent, Runner, trace

triage_agent = Agent(
    name="Triage",
    instructions="Route requests.",
    handoffs=[billing_agent, technical_agent],
)

# Trace shows full handoff chain
with trace(workflow_name="Support Request", group_id="ticket_456"):
    result = await Runner.run(
        triage_agent,
        "I have a billing question"
    )
    # Trace includes:
    # - Triage agent processing
    # - Handoff decision
    # - Billing agent processing
```

---

## Custom Tracing Export

### Export API Key

```python
from agents import set_tracing_export_api_key

# Set custom API key for trace export
set_tracing_export_api_key("your-tracing-api-key")
```

### Third-Party Integrations

```python
# Traces can be exported to:
# - OpenAI Traces Dashboard
# - Custom observability platforms
# - Log aggregation systems
```

---

## Tracing Best Practices

### 1. Use Meaningful Workflow Names

```python
# Good
with trace(workflow_name="Order Fulfillment"):
    ...

with trace(workflow_name="Customer Onboarding"):
    ...

# Avoid generic names
with trace(workflow_name="Agent Run"):  # Too generic
    ...
```

### 2. Group Related Operations

```python
# Group by conversation
conversation_id = "conv_abc123"

with trace(workflow_name="Chat", group_id=conversation_id):
    await Runner.run(agent, message1, session=session)

# Later in same conversation
with trace(workflow_name="Chat", group_id=conversation_id):
    await Runner.run(agent, message2, session=session)
```

### 3. Add Useful Metadata

```python
with trace(
    workflow_name="Support",
    metadata={
        "user_tier": "premium",
        "request_type": "billing",
        "source": "mobile_app",
    }
):
    await Runner.run(agent, user_message)
```

### 4. Trace Errors for Debugging

```python
try:
    with trace(workflow_name="Risky Operation"):
        result = await Runner.run(agent, risky_input)
except Exception as e:
    # Error is captured in trace
    print(f"Check trace for details: {e}")
    raise
```

---

## Production Tracing Pattern

```python
import os
from agents import Agent, Runner, trace, RunConfig
from datetime import datetime

async def handle_request(user_id: str, message: str, conversation_id: str):
    """Production request handler with tracing."""

    agent = Agent(
        name="Production Agent",
        instructions="Help users.",
    )

    # Create trace with full context
    with trace(
        workflow_name=os.getenv("SERVICE_NAME", "Agent Service"),
        group_id=conversation_id,
        metadata={
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": os.getenv("ENVIRONMENT", "production"),
            "version": os.getenv("APP_VERSION", "1.0.0"),
        }
    ):
        try:
            result = await Runner.run(agent, message)
            return {
                "success": True,
                "response": result.final_output,
            }
        except Exception as e:
            # Error captured in trace for debugging
            return {
                "success": False,
                "error": str(e),
            }
```

---

## Viewing Traces

Traces can be viewed in:

1. **OpenAI Dashboard**: Visual trace explorer
2. **API Export**: Programmatic access to trace data
3. **Third-Party Tools**: Integration with observability platforms

```python
# Trace URL pattern
# https://platform.openai.com/traces/{trace_id}
```
