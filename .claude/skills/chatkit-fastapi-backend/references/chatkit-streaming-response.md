# ChatKit Server - Streaming Response Reference

Complete guide to streaming responses in ChatKit.

---

## Overview

ChatKit uses Server-Sent Events (SSE) for streaming responses. This enables:
- Real-time text streaming (typewriter effect)
- Progress indicators
- Widget updates
- Error handling mid-stream

---

## Event Types

```python
from chatkit.server.events import (
    TextDeltaEvent,      # Stream text chunks
    ThreadStreamEvent,   # Base event type
    WidgetEvent,         # Render widgets
    ErrorEvent,          # Error messages
)
```

---

## TextDeltaEvent

Stream text incrementally:

```python
async def respond(self, thread, input, context):
    # Stream word by word
    words = "Hello, how can I help you today?".split()
    for word in words:
        yield TextDeltaEvent(word + " ")
        await asyncio.sleep(0.05)  # Simulate typing

    # Or stream larger chunks
    yield TextDeltaEvent("Here's the answer to your question:\n\n")
    yield TextDeltaEvent("First, you need to...")
    yield TextDeltaEvent("\n\nSecond, make sure to...")
```

---

## Streaming from OpenAI

### Direct OpenAI API

```python
import openai

async def respond(self, thread, input, context):
    response = await openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": input.content},
        ],
        stream=True,
    )

    async for chunk in response:
        if chunk.choices[0].delta.content:
            yield TextDeltaEvent(chunk.choices[0].delta.content)
```

### OpenAI Agents SDK

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    model="gpt-4.1",
    instructions="You are helpful.",
)

async def respond(self, thread, input, context):
    result = Runner.run_streamed(
        agent,
        input.content,
    )

    async for event in result.stream_events():
        if event.type == "raw_response_event":
            if hasattr(event.data, 'delta'):
                delta = event.data.delta
                if hasattr(delta, 'content') and delta.content:
                    yield TextDeltaEvent(delta.content)
```

---

## Stream with Tool Calls

Handle agent tool usage:

```python
async def respond(self, thread, input, context):
    result = Runner.run_streamed(agent, input.content)

    async for event in result.stream_events():
        if event.type == "raw_response_event":
            # Text content
            if hasattr(event.data, 'delta'):
                delta = event.data.delta
                if hasattr(delta, 'content') and delta.content:
                    yield TextDeltaEvent(delta.content)

        elif event.type == "tool_call_start":
            # Tool is being called
            yield TextDeltaEvent(f"\n*Searching...*\n")

        elif event.type == "tool_call_end":
            # Tool finished
            yield TextDeltaEvent(f"\n*Done searching.*\n")
```

---

## WidgetEvent

Render interactive widgets:

```python
from chatkit.server.events import WidgetEvent

async def respond(self, thread, input, context):
    yield TextDeltaEvent("Here are your options:\n\n")

    # Button widget
    yield WidgetEvent({
        "type": "button",
        "label": "Book Appointment",
        "onClickAction": "book_appointment",
    })

    # Card widget
    yield WidgetEvent({
        "type": "card",
        "title": "Premium Plan",
        "description": "$99/month",
        "onClickAction": "select_plan",
        "payload": {"plan": "premium"},
    })

    # List widget
    yield WidgetEvent({
        "type": "listView",
        "items": [
            {"title": "Option A", "onClickAction": "select", "payload": {"id": "a"}},
            {"title": "Option B", "onClickAction": "select", "payload": {"id": "b"}},
        ],
    })
```

---

## ErrorEvent

Send errors mid-stream:

```python
from chatkit.server.events import ErrorEvent

async def respond(self, thread, input, context):
    try:
        yield TextDeltaEvent("Processing your request...")

        # Something might fail
        result = await risky_operation()

        yield TextDeltaEvent(f"Result: {result}")

    except ValueError as e:
        yield ErrorEvent(f"Invalid input: {e}")

    except Exception as e:
        yield ErrorEvent("Something went wrong. Please try again.")
```

---

## SSE Format

The actual wire format sent to clients:

```
event: text_delta
data: {"content": "Hello"}

event: text_delta
data: {"content": " there!"}

event: widget
data: {"type": "button", "label": "Click me", "onClickAction": "click"}

event: done
data: {}
```

---

## Response Buffering

### Disable Nginx Buffering

In production with Nginx, disable buffering for SSE:

```python
return StreamingResponse(
    result,
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # Nginx
    }
)
```

### Nginx Config

```nginx
location /chatkit {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
}
```

---

## Chunked Streaming Pattern

For long responses, stream in chunks:

```python
async def respond(self, thread, input, context):
    # Get full response
    full_response = await generate_response(input.content)

    # Stream in chunks (e.g., by sentence)
    import re
    sentences = re.split(r'(?<=[.!?])\s+', full_response)

    for sentence in sentences:
        yield TextDeltaEvent(sentence + " ")
        await asyncio.sleep(0.02)  # Small delay for effect
```

---

## Progress Indicators

Show progress during long operations:

```python
async def respond(self, thread, input, context):
    # Start progress
    yield TextDeltaEvent("Analyzing your request... ")

    # Step 1
    await step_one()
    yield TextDeltaEvent("Done.\n")
    yield TextDeltaEvent("Searching database... ")

    # Step 2
    results = await step_two()
    yield TextDeltaEvent(f"Found {len(results)} results.\n")
    yield TextDeltaEvent("Generating response...\n\n")

    # Final response
    for chunk in generate_chunks(results):
        yield TextDeltaEvent(chunk)
```

---

## Handling Cancellation

Detect if client disconnects:

```python
async def respond(self, thread, input, context):
    request = context.get("request")

    async def stream():
        for i in range(100):
            # Check if client disconnected
            if await request.is_disconnected():
                break

            yield TextDeltaEvent(f"Chunk {i}\n")
            await asyncio.sleep(0.1)

    async for event in stream():
        yield event
```

---

## Complete Streaming Example

```python
from chatkit.server import ChatKitServer, ThreadMetadata, SQLiteThreadStore
from chatkit.server.events import TextDeltaEvent, WidgetEvent, ErrorEvent
from typing import Any, AsyncIterator
import asyncio

from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    model="gpt-4.1",
    instructions="You are a helpful assistant.",
)

class StreamingChatKitServer(ChatKitServer):
    store = SQLiteThreadStore("threads.db")

    async def respond(
        self,
        thread: ThreadMetadata,
        input,
        context: Any,
    ) -> AsyncIterator:

        if not input or not input.content:
            yield TextDeltaEvent("Hello! How can I help you?")
            return

        message = input.content

        try:
            # Show thinking indicator
            yield TextDeltaEvent("*Thinking...*\n\n")

            # Stream from agent
            result = Runner.run_streamed(agent, message)
            full_response = ""

            async for event in result.stream_events():
                if event.type == "raw_response_event":
                    if hasattr(event.data, 'delta'):
                        delta = event.data.delta
                        if hasattr(delta, 'content') and delta.content:
                            full_response += delta.content
                            yield TextDeltaEvent(delta.content)

            # Show follow-up actions
            if "book" in message.lower():
                yield TextDeltaEvent("\n\n")
                yield WidgetEvent({
                    "type": "button",
                    "label": "Book Now",
                    "onClickAction": "book",
                })

        except Exception as e:
            yield ErrorEvent(f"An error occurred: {str(e)}")
```
