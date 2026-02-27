# OpenAI Agents SDK - Realtime Voice Agents Reference

Complete reference for building voice/audio agents with OpenAI Agents SDK v0.7.0+.

---

## Overview

Realtime agents enable voice-based conversations with:
- Low-latency audio streaming
- Natural turn-taking with interruption support
- WebSocket communication
- Real-time transcription

---

## RealtimeAgent Basic Setup

```python
import asyncio
from agents.realtime import RealtimeAgent, RealtimeRunner

async def main():
    # Create the agent
    agent = RealtimeAgent(
        name="Voice Assistant",
        instructions="You are a helpful voice assistant. Keep responses brief and conversational.",
    )

    # Configure the runner
    runner = RealtimeRunner(
        starting_agent=agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "ash",
                "modalities": ["audio"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {"model": "gpt-4o-mini-transcribe"},
                "turn_detection": {
                    "type": "semantic_vad",
                    "interrupt_response": True
                },
            }
        },
    )

    # Start session
    session = await runner.run()

    async with session:
        print("Voice session started!")
        async for event in session:
            handle_event(event)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Voice Options

Available voices for realtime agents:

| Voice | Description |
|-------|-------------|
| alloy | Neutral, balanced |
| ash | Warm, natural |
| echo | Clear, articulate |
| fable | Expressive, dynamic |
| onyx | Deep, authoritative |
| nova | Energetic, friendly |
| shimmer | Soft, soothing |

```python
runner = RealtimeRunner(
    starting_agent=agent,
    config={
        "model_settings": {
            "voice": "alloy",  # Choose voice
            # ...
        }
    },
)
```

---

## Model Settings Configuration

```python
config = {
    "model_settings": {
        # Model selection
        "model_name": "gpt-realtime",

        # Voice selection
        "voice": "ash",

        # Input/output modes
        "modalities": ["audio"],  # ["audio"] or ["audio", "text"]

        # Audio formats
        "input_audio_format": "pcm16",   # pcm16, g711_ulaw, g711_alaw
        "output_audio_format": "pcm16",  # pcm16, g711_ulaw, g711_alaw

        # Transcription
        "input_audio_transcription": {
            "model": "gpt-4o-mini-transcribe"
        },

        # Turn detection
        "turn_detection": {
            "type": "semantic_vad",      # semantic_vad or server_vad
            "interrupt_response": True,   # Allow user interruptions
        },
    }
}
```

---

## Event Handling

```python
async def handle_events(session):
    async for event in session:
        match event.type:
            # Agent lifecycle events
            case "agent_start":
                print(f"Agent started: {event.agent.name}")

            case "agent_end":
                print(f"Agent ended: {event.agent.name}")

            # Handoff events
            case "handoff":
                print(f"Handoff: {event.from_agent.name} → {event.to_agent.name}")

            # Tool events
            case "tool_start":
                print(f"Tool started: {event.tool.name}")

            case "tool_end":
                print(f"Tool ended: {event.tool.name}")
                print(f"Output: {event.output}")

            # Audio events
            case "audio":
                # Raw audio data for playback
                audio_bytes = event.audio
                play_audio(audio_bytes)

            case "audio_end":
                print("Audio finished")

            case "audio_interrupted":
                print("Audio interrupted by user")
                # Handle interruption (stop playback)

            # Transcription events
            case "transcript":
                print(f"Transcript: {event.text}")

            # History events
            case "history_updated":
                pass  # Conversation history updated

            case "history_added":
                pass  # New message added to history

            # Error events
            case "error":
                print(f"Error: {event.error}")

            # Raw model events (for debugging)
            case "raw_model_event":
                print(f"Raw: {event.data}")
```

---

## Realtime Agent with Tools

```python
from agents.realtime import RealtimeAgent, RealtimeRunner
from agents import function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"Weather in {city}: Sunny, 72°F"

@function_tool
def book_appointment(date: str, time: str) -> str:
    """Book an appointment."""
    return f"Appointment booked for {date} at {time}"

agent = RealtimeAgent(
    name="Voice Assistant",
    instructions="""You are a helpful voice assistant.
    You can check weather and book appointments.
    Keep responses conversational and brief.""",
    tools=[get_weather, book_appointment],
)

runner = RealtimeRunner(
    starting_agent=agent,
    config={
        "model_settings": {
            "model_name": "gpt-realtime",
            "voice": "ash",
            "modalities": ["audio"],
        }
    },
)
```

---

## Realtime Agent Handoffs

Route voice calls between specialist agents:

```python
from agents.realtime import RealtimeAgent, realtime_handoff

# Specialist agents
billing_agent = RealtimeAgent(
    name="Billing Support",
    instructions="Handle billing inquiries via voice.",
)

technical_agent = RealtimeAgent(
    name="Technical Support",
    instructions="Handle technical issues via voice.",
)

# Main agent with handoffs
main_agent = RealtimeAgent(
    name="Reception",
    instructions="""You are the first point of contact.
    Route to billing for payment issues.
    Route to technical for product issues.""",
    handoffs=[
        realtime_handoff(
            billing_agent,
            tool_description="Transfer to billing support"
        ),
        realtime_handoff(
            technical_agent,
            tool_description="Transfer to technical support"
        ),
    ],
)
```

---

## FastAPI WebSocket Integration

```python
from fastapi import FastAPI, WebSocket
from agents.realtime import RealtimeAgent, RealtimeRunner

app = FastAPI()

agent = RealtimeAgent(
    name="Voice Bot",
    instructions="You are a helpful voice assistant.",
)

@app.websocket("/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()

    runner = RealtimeRunner(
        starting_agent=agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "ash",
                "modalities": ["audio"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "turn_detection": {
                    "type": "semantic_vad",
                    "interrupt_response": True
                },
            }
        },
    )

    session = await runner.run()

    async with session:
        # Handle incoming audio from client
        async def receive_audio():
            while True:
                try:
                    data = await websocket.receive_bytes()
                    await session.send_audio(data)
                except Exception:
                    break

        # Send events to client
        async def send_events():
            async for event in session:
                if event.type == "audio":
                    await websocket.send_bytes(event.audio)
                elif event.type == "transcript":
                    await websocket.send_json({
                        "type": "transcript",
                        "text": event.text
                    })
                elif event.type == "error":
                    await websocket.send_json({
                        "type": "error",
                        "message": str(event.error)
                    })

        # Run both tasks
        import asyncio
        await asyncio.gather(
            receive_audio(),
            send_events()
        )
```

---

## Audio Format Reference

| Format | Description | Use Case |
|--------|-------------|----------|
| pcm16 | 16-bit PCM | High quality, larger size |
| g711_ulaw | μ-law compressed | Telephony (North America) |
| g711_alaw | A-law compressed | Telephony (Europe) |

```python
# For phone integration
config = {
    "model_settings": {
        "input_audio_format": "g711_ulaw",
        "output_audio_format": "g711_ulaw",
    }
}

# For web/mobile apps
config = {
    "model_settings": {
        "input_audio_format": "pcm16",
        "output_audio_format": "pcm16",
    }
}
```

---

## Turn Detection Options

| Type | Description |
|------|-------------|
| semantic_vad | AI-based detection, natural pauses |
| server_vad | Simple voice activity detection |

```python
# Semantic VAD (recommended)
"turn_detection": {
    "type": "semantic_vad",
    "interrupt_response": True,  # Allow interruptions
}

# Server VAD (faster, less accurate)
"turn_detection": {
    "type": "server_vad",
    "silence_duration_ms": 500,  # Silence before turn end
}
```

---

## Complete Voice Agent Example

```python
import asyncio
from agents.realtime import RealtimeAgent, RealtimeRunner, realtime_handoff
from agents import function_tool

# Tools
@function_tool
def check_order_status(order_id: str) -> str:
    """Check the status of an order."""
    return f"Order {order_id} is shipped and arriving tomorrow."

@function_tool
def get_store_hours() -> str:
    """Get store hours."""
    return "We're open Monday-Friday 9am-6pm, Saturday 10am-4pm."

# Specialist agent
orders_agent = RealtimeAgent(
    name="Orders",
    instructions="Handle order inquiries. Be helpful and concise.",
    tools=[check_order_status],
)

# Main agent
main_agent = RealtimeAgent(
    name="Customer Service",
    instructions="""You are a customer service voice assistant.
    Answer general questions about store hours.
    Transfer to orders specialist for order-related questions.""",
    tools=[get_store_hours],
    handoffs=[
        realtime_handoff(
            orders_agent,
            tool_description="Transfer for order status inquiries"
        ),
    ],
)

async def main():
    runner = RealtimeRunner(
        starting_agent=main_agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "nova",
                "modalities": ["audio", "text"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "gpt-4o-mini-transcribe"
                },
                "turn_detection": {
                    "type": "semantic_vad",
                    "interrupt_response": True,
                },
            }
        },
    )

    session = await runner.run()

    async with session:
        print("Voice assistant ready!")
        async for event in session:
            if event.type == "transcript":
                print(f"User: {event.text}")
            elif event.type == "audio_end":
                print("Assistant finished speaking")
            elif event.type == "handoff":
                print(f"Transferred to {event.to_agent.name}")
            elif event.type == "error":
                print(f"Error: {event.error}")

if __name__ == "__main__":
    asyncio.run(main())
```
