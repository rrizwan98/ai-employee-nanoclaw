# ChatKit Server - OpenAI Agents SDK Integration

Complete guide to integrating OpenAI Agents SDK with ChatKit.

---

## Overview

ChatKit + OpenAI Agents SDK enables:
- Streaming responses from agents
- Tool usage with visual feedback
- Multi-agent handoffs
- Session/memory persistence
- Structured output

---

## Basic Integration

```python
from chatkit.server import ChatKitServer, ThreadMetadata, SQLiteThreadStore
from chatkit.server.events import TextDeltaEvent
from typing import Any, AsyncIterator

from agents import Agent, Runner

# Define agent
agent = Agent(
    name="Assistant",
    model="gpt-4.1",
    instructions="You are a helpful assistant.",
)

class AgentChatKitServer(ChatKitServer):
    store = SQLiteThreadStore("threads.db")

    async def respond(self, thread, input, context):
        if not input or not input.content:
            yield TextDeltaEvent("Hello! How can I help?")
            return

        # Run agent with streaming
        result = Runner.run_streamed(agent, input.content)

        # Stream response events
        async for event in result.stream_events():
            if event.type == "raw_response_event":
                if hasattr(event.data, 'delta'):
                    delta = event.data.delta
                    if hasattr(delta, 'content') and delta.content:
                        yield TextDeltaEvent(delta.content)
```

---

## Agent with Tools

```python
from agents import Agent, WebSearchTool, function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get current weather for a city.

    Args:
        city: City name
    """
    # Your implementation
    return f"Weather in {city}: Sunny, 72°F"

@function_tool
async def book_appointment(date: str, time: str) -> str:
    """Book an appointment.

    Args:
        date: Date in YYYY-MM-DD format
        time: Time in HH:MM format
    """
    # Your implementation
    return f"Booked appointment for {date} at {time}"

agent = Agent(
    name="Assistant",
    model="gpt-4.1",
    instructions="""
    You are a helpful assistant.
    - Use get_weather to check weather
    - Use book_appointment to schedule meetings
    - Use web search for current information
    """,
    tools=[
        WebSearchTool(search_context_size="medium"),
        get_weather,
        book_appointment,
    ],
)
```

---

## Tool Call Feedback

Show users when tools are running:

```python
async def respond(self, thread, input, context):
    result = Runner.run_streamed(agent, input.content)

    async for event in result.stream_events():
        # Text streaming
        if event.type == "raw_response_event":
            if hasattr(event.data, 'delta'):
                delta = event.data.delta
                if hasattr(delta, 'content') and delta.content:
                    yield TextDeltaEvent(delta.content)

        # Tool call started
        elif event.type == "tool_call_start":
            tool_name = event.data.name
            yield TextDeltaEvent(f"\n*Using {tool_name}...*\n")

        # Tool call finished
        elif event.type == "tool_call_end":
            yield TextDeltaEvent(f"*Done*\n\n")
```

---

## Session/Memory Integration

Combine ChatKit threads with Agents SDK sessions:

```python
from agents import Agent, Runner, SQLiteSession

agent = Agent(
    name="Assistant",
    model="gpt-4.1",
    instructions="You are helpful. Remember previous conversations.",
)

class MemoryAgentServer(ChatKitServer):
    store = SQLiteThreadStore("threads.db")

    async def respond(self, thread, input, context):
        if not input or not input.content:
            return

        # Create session tied to thread ID
        session = SQLiteSession(
            session_id=thread.id,
            db_path="agent_sessions.db"
        )

        # Run with session
        result = Runner.run_streamed(
            agent,
            input.content,
            session=session,
        )

        async for event in result.stream_events():
            if event.type == "raw_response_event":
                if hasattr(event.data, 'delta'):
                    delta = event.data.delta
                    if hasattr(delta, 'content') and delta.content:
                        yield TextDeltaEvent(delta.content)
```

---

## Multi-Agent with Handoffs

```python
from agents import Agent

# Specialist agents
billing_agent = Agent(
    name="Billing",
    instructions="Handle billing questions. Be precise about amounts.",
    handoff_description="Handle payment and invoice questions",
)

technical_agent = Agent(
    name="Technical",
    instructions="Handle technical issues. Ask clarifying questions.",
    handoff_description="Handle bugs and technical problems",
)

# Triage agent
triage_agent = Agent(
    name="Triage",
    instructions="""
    You are the first point of contact. Route to specialists:
    - Billing questions → Billing agent
    - Technical issues → Technical agent
    - General questions → Answer directly
    """,
    handoffs=[billing_agent, technical_agent],
)

class MultiAgentServer(ChatKitServer):
    store = SQLiteThreadStore("threads.db")

    async def respond(self, thread, input, context):
        result = Runner.run_streamed(triage_agent, input.content)

        async for event in result.stream_events():
            # Handle agent handoff
            if event.type == "handoff":
                target = event.data.target_agent.name
                yield TextDeltaEvent(f"\n*Transferring to {target}...*\n\n")

            # Text content
            elif event.type == "raw_response_event":
                if hasattr(event.data, 'delta'):
                    delta = event.data.delta
                    if hasattr(delta, 'content') and delta.content:
                        yield TextDeltaEvent(delta.content)
```

---

## Structured Output

```python
from pydantic import BaseModel, Field
from typing import List

class ProductRecommendation(BaseModel):
    name: str = Field(description="Product name")
    price: float = Field(description="Price in USD")
    reason: str = Field(description="Why recommended")

class RecommendationList(BaseModel):
    recommendations: List[ProductRecommendation]

agent = Agent(
    name="Recommender",
    model="gpt-4.1",
    instructions="Recommend products based on user needs.",
    output_type=RecommendationList,
)

class StructuredAgentServer(ChatKitServer):
    async def respond(self, thread, input, context):
        result = await Runner.run(agent, input.content)

        # Parse structured output
        recommendations = result.final_output

        yield TextDeltaEvent("Here are my recommendations:\n\n")

        for i, rec in enumerate(recommendations.recommendations, 1):
            yield TextDeltaEvent(
                f"**{i}. {rec.name}** - ${rec.price:.2f}\n"
                f"   {rec.reason}\n\n"
            )
```

---

## Agent Context

Pass context to agents and tools:

```python
from agents import Agent, RunContextWrapper, function_tool
from dataclasses import dataclass

@dataclass
class AgentContext:
    thread_id: str
    user_id: str | None
    request_metadata: dict

@function_tool
def get_user_orders(context: RunContextWrapper[AgentContext]) -> str:
    """Get user's recent orders."""
    user_id = context.context.user_id
    if not user_id:
        return "No user logged in"

    # Fetch orders for user
    orders = fetch_orders(user_id)
    return f"Found {len(orders)} orders"

agent = Agent(
    name="Support",
    tools=[get_user_orders],
)

class ContextAgentServer(ChatKitServer):
    async def respond(self, thread, input, context):
        request = context.get("request")
        user_id = request.headers.get("X-User-ID")

        # Create agent context
        agent_context = AgentContext(
            thread_id=thread.id,
            user_id=user_id,
            request_metadata={},
        )

        result = Runner.run_streamed(
            agent,
            input.content,
            context=agent_context,
        )

        async for event in result.stream_events():
            # ... handle events
            pass
```

---

## Guardrails

```python
from agents import Agent, InputGuardrail, GuardrailFunctionOutput

@InputGuardrail
def check_input_length(context):
    if len(context.input) > 5000:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info="Message too long. Please keep under 5000 characters."
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)

agent = Agent(
    name="Assistant",
    instructions="You are helpful.",
    input_guardrails=[check_input_length],
)

class GuardedAgentServer(ChatKitServer):
    async def respond(self, thread, input, context):
        try:
            result = Runner.run_streamed(agent, input.content)

            async for event in result.stream_events():
                # ... handle events
                pass

        except GuardrailTrippedException as e:
            yield TextDeltaEvent(f"Cannot process: {e.message}")
```

---

## Tracing

Enable tracing for debugging:

```python
from agents import Agent, Runner, set_tracing_export_api_key
from agents.run import RunConfig

# Enable tracing
set_tracing_export_api_key("your-api-key")

class TracedAgentServer(ChatKitServer):
    async def respond(self, thread, input, context):
        result = Runner.run_streamed(
            agent,
            input.content,
            run_config=RunConfig(
                workflow_name="chatkit",
                trace_metadata={
                    "thread_id": thread.id,
                    "user_message": input.content[:100],
                },
            ),
        )

        async for event in result.stream_events():
            # ... handle events
            pass
```

---

## Complete Integration Example

```python
from chatkit.server import ChatKitServer, ThreadMetadata, SQLiteThreadStore
from chatkit.server.events import TextDeltaEvent, WidgetEvent
from typing import Any, AsyncIterator

from agents import Agent, Runner, WebSearchTool, SQLiteSession, function_tool
from agents.run import RunConfig

@function_tool
def get_products(category: str) -> str:
    """Get products by category."""
    products = fetch_products(category)
    return json.dumps([{"name": p.name, "price": p.price} for p in products])

agent = Agent(
    name="ShopAssistant",
    model="gpt-4.1",
    instructions="""
    You are a helpful shopping assistant.
    - Search for products using get_products
    - Use web search for product reviews
    - Help users make purchasing decisions
    """,
    tools=[
        WebSearchTool(),
        get_products,
    ],
)

class ShopChatKitServer(ChatKitServer):
    store = SQLiteThreadStore("data/threads.db")

    async def respond(
        self,
        thread: ThreadMetadata,
        input,
        context: Any,
    ) -> AsyncIterator:

        if not input or not input.content:
            yield TextDeltaEvent("Welcome to our shop! How can I help?")
            return

        # Create session for memory
        session = SQLiteSession(thread.id, "data/sessions.db")

        # Run agent
        result = Runner.run_streamed(
            agent,
            input.content,
            session=session,
            run_config=RunConfig(
                workflow_name="shop_chat",
                trace_metadata={"thread_id": thread.id},
            ),
        )

        async for event in result.stream_events():
            # Tool feedback
            if event.type == "tool_call_start":
                yield TextDeltaEvent(f"\n*Searching products...*\n")

            elif event.type == "tool_call_end":
                yield TextDeltaEvent("*Found results.*\n\n")

            # Text streaming
            elif event.type == "raw_response_event":
                if hasattr(event.data, 'delta'):
                    delta = event.data.delta
                    if hasattr(delta, 'content') and delta.content:
                        yield TextDeltaEvent(delta.content)

        # Show purchase button if products mentioned
        if "buy" in input.content.lower() or "purchase" in input.content.lower():
            yield WidgetEvent({
                "type": "button",
                "label": "View Cart",
                "onClickAction": "view_cart",
            })
```
