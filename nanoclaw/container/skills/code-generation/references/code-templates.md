# Code Generation - Templates Reference

Complete code templates for generating OpenAI Agents SDK applications.

---

## Standard Agent Templates

### main.py

```python
"""
{AGENT_NAME} - OpenAI Agents SDK Application
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from agents import Agent, Runner
{TOOL_IMPORTS}
{SESSION_IMPORT}

load_dotenv()

app = FastAPI(title="{AGENT_NAME}")

{TOOL_DEFINITIONS}

agent = Agent(
    name="{AGENT_NAME}",
    instructions="""{INSTRUCTIONS}""",
    tools=[{TOOLS_LIST}],
{GUARDRAILS_CONFIG}
{OUTPUT_TYPE_CONFIG}
)

{SESSION_SETUP}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(message: str, session_id: str = "default"):
{CHAT_HANDLER}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port={PORT})
```

### Chat Handler Variants

**Without Session:**

```python
@app.post("/chat")
async def chat(message: str):
    result = await Runner.run(agent, message)
    return {"response": result.final_output}
```

**With SQLite Session:**

```python
@app.post("/chat")
async def chat(message: str, session_id: str = "default"):
    session = SQLiteSession(session_id, "{DB_PATH}")
    result = await Runner.run(agent, message, session=session)
    return {"response": result.final_output}
```

**With Redis Session:**

```python
@app.post("/chat")
async def chat(message: str, session_id: str = "default"):
    session = RedisSession.from_url(session_id, url=os.getenv("REDIS_URL"))
    result = await Runner.run(agent, message, session=session)
    return {"response": result.final_output}
```

---

## Realtime Agent Templates

### main.py

```python
"""
{AGENT_NAME} - Realtime Voice Agent
"""

import asyncio
import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from agents.realtime import RealtimeAgent, RealtimeRunner
{TOOL_IMPORTS}

load_dotenv()

app = FastAPI(title="{AGENT_NAME}")

{TOOL_DEFINITIONS}

agent = RealtimeAgent(
    name="{AGENT_NAME}",
    instructions="""{INSTRUCTIONS}""",
    tools=[{TOOLS_LIST}],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.websocket("/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()

    runner = RealtimeRunner(
        starting_agent=agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "{VOICE}",
                "modalities": {MODALITIES},
                "input_audio_format": "{INPUT_FORMAT}",
                "output_audio_format": "{OUTPUT_FORMAT}",
                "input_audio_transcription": {"model": "gpt-4o-mini-transcribe"},
                "turn_detection": {
                    "type": "{TURN_DETECTION}",
                    "interrupt_response": {INTERRUPT}
                },
            }
        },
    )

    session = await runner.run()

    async with session:
        async def receive_audio():
            while True:
                try:
                    data = await websocket.receive_bytes()
                    await session.send_audio(data)
                except Exception:
                    break

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

        await asyncio.gather(receive_audio(), send_events())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port={PORT})
```

---

## Multi-Agent Templates

### main.py

```python
"""
{AGENT_NAME} - Multi-Agent System
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from agents import Agent, Runner
{TOOL_IMPORTS}
{SESSION_IMPORT}

load_dotenv()

app = FastAPI(title="{AGENT_NAME}")

{TOOL_DEFINITIONS}

# Specialist Agents
{SPECIALIST_AGENTS}

# Triage Agent
triage_agent = Agent(
    name="{AGENT_NAME}",
    instructions="""{INSTRUCTIONS}""",
    handoffs=[{HANDOFFS_LIST}],
    tools=[{TOOLS_LIST}],
)

{SESSION_SETUP}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(message: str, session_id: str = "default"):
{CHAT_HANDLER}
    return {
        "response": result.final_output,
        "handled_by": result.last_agent.name
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port={PORT})
```

### Specialist Agent Template

```python
{SPECIALIST_NAME}_agent = Agent(
    name="{SPECIALIST_NAME}",
    instructions="""{SPECIALIST_INSTRUCTIONS}""",
    handoff_description="{SPECIALIST_DESCRIPTION}",
    tools=[{SPECIALIST_TOOLS}],
)
```

---

## Tool Templates

### Custom Function Tool

```python
from agents import function_tool

@function_tool
def {TOOL_NAME}({PARAMS}) -> str:
    """{DOCSTRING}

    Args:
{ARGS_DOCS}
    """
    # TODO: Implement {TOOL_NAME}
    return f"Result from {TOOL_NAME}"
```

### Async Function Tool

```python
from agents import function_tool

@function_tool
async def {TOOL_NAME}({PARAMS}) -> str:
    """{DOCSTRING}

    Args:
{ARGS_DOCS}
    """
    # TODO: Implement {TOOL_NAME}
    return f"Result from {TOOL_NAME}"
```

### Function Tool with Timeout

```python
from agents import function_tool

@function_tool(timeout=5.0)
async def {TOOL_NAME}({PARAMS}) -> str:
    """{DOCSTRING}"""
    # TODO: Implement {TOOL_NAME}
    return f"Result from {TOOL_NAME}"
```

---

## Guardrail Templates

### Input Guardrail

```python
from agents import InputGuardrail, GuardrailFunctionOutput

@InputGuardrail
def validate_input_length(context):
    """Block inputs that are too long."""
    if len(context.input) > 10000:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info="Input too long. Maximum 10000 characters."
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)
```

### Output Guardrail

```python
from agents import OutputGuardrail, GuardrailFunctionOutput

@OutputGuardrail
def filter_pii(context):
    """Redact personal information from output."""
    sensitive_patterns = ["ssn", "credit card", "password"]
    output_lower = context.output.lower()

    for pattern in sensitive_patterns:
        if pattern in output_lower:
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                output_info="Response contained sensitive information."
            )

    return GuardrailFunctionOutput(tripwire_triggered=False)
```

### Tool Guardrails

```python
from agents import (
    function_tool,
    tool_input_guardrail,
    tool_output_guardrail,
    ToolGuardrailFunctionOutput,
)

@tool_input_guardrail
def block_secrets(data):
    """Block tools from receiving API keys."""
    args = str(data.context.tool_arguments or "")
    if "sk-" in args or "api_key" in args.lower():
        return ToolGuardrailFunctionOutput.reject_content(
            "Remove secrets before calling this tool."
        )
    return ToolGuardrailFunctionOutput.allow()

@tool_output_guardrail
def redact_output(data):
    """Redact secrets from tool output."""
    output = str(data.output or "")
    if "sk-" in output:
        return ToolGuardrailFunctionOutput.reject_content(
            "Output contained sensitive data."
        )
    return ToolGuardrailFunctionOutput.allow()
```

---

## Structured Output Templates

### models.py

```python
from pydantic import BaseModel, Field
from typing import Optional, List

class {MODEL_NAME}(BaseModel):
    """{MODEL_DESCRIPTION}"""
{FIELDS}
```

### Field Templates

```python
    # Required string field
    name: str = Field(description="The name")

    # Optional string field
    description: Optional[str] = Field(default=None, description="Optional description")

    # List field
    items: List[str] = Field(default_factory=list, description="List of items")

    # Constrained number field
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5")

    # Date field
    date: str = Field(description="Date in YYYY-MM-DD format")
```

---

## requirements.txt Templates

### Standard Agent

```
openai-agents>=0.7.0
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

### Realtime Agent

```
openai-agents[voice]>=0.7.0
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

### With Redis Session

```
openai-agents>=0.7.0
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
redis>=5.0.0
```

---

## Dockerfile Template

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE {PORT}

CMD ["python", "main.py"]
```

---

## .env.example Template

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-...

# Redis URL (if using Redis session)
# REDIS_URL=redis://localhost:6379/0

# Server Configuration
PORT={PORT}
```

---

## README.md Template

```markdown
# {AGENT_NAME}

{DESCRIPTION}

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Run the agent:
   ```bash
   python main.py
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /chat` - Chat with agent
{ADDITIONAL_ENDPOINTS}

## Configuration

{CONFIG_DETAILS}

## Tools

{TOOLS_DOCUMENTATION}
```
