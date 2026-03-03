# Code Generation - Import Mappings Reference

Complete mapping of config values to Python imports.

---

## Tool Imports

### Hosted Tools

| Config Value | Python Import |
|--------------|---------------|
| web_search | `from agents import WebSearchTool` |
| file_search | `from agents import FileSearchTool` |
| code_interpreter | `from agents import CodeInterpreterTool` |
| image_generation | `from agents import ImageGenerationTool` |
| computer | `from agents import ComputerTool` |

### Tool Instantiation

| Tool | Instantiation |
|------|---------------|
| WebSearchTool | `WebSearchTool(search_context_size="medium")` |
| FileSearchTool | `FileSearchTool(vector_store_ids=["{VS_ID}"], max_num_results=5)` |
| CodeInterpreterTool | `CodeInterpreterTool(tool_config={"type": "code_interpreter"})` |
| ImageGenerationTool | `ImageGenerationTool()` |
| ComputerTool | `ComputerTool()` |

### MCP Tools

| Type | Import & Setup |
|------|----------------|
| Hosted MCP | `from agents import HostedMCPTool` |
| Stdio MCP | `from agents.mcp import MCPServerStdio` |
| SSE MCP | `from agents.mcp import MCPServerSse` |

---

## Session Imports

| Config Value | Python Import |
|--------------|---------------|
| sqlite | `from agents import SQLiteSession` |
| redis | `from agents.extensions.memory import RedisSession` |
| none | (no import needed) |

### Session Setup

**SQLite:**
```python
session = SQLiteSession(session_id, "conversations.db")
```

**Redis:**
```python
import os
session = RedisSession.from_url(session_id, url=os.getenv("REDIS_URL"))
```

---

## Guardrail Imports

### Input/Output Guardrails

```python
from agents import (
    InputGuardrail,
    OutputGuardrail,
    GuardrailFunctionOutput,
)
```

### Tool Guardrails

```python
from agents import (
    tool_input_guardrail,
    tool_output_guardrail,
    ToolGuardrailFunctionOutput,
)
```

---

## Agent Type Imports

| Agent Type | Python Import |
|------------|---------------|
| standard | `from agents import Agent, Runner` |
| realtime | `from agents.realtime import RealtimeAgent, RealtimeRunner` |
| multi-agent | `from agents import Agent, Runner` |

---

## Structured Output Imports

```python
from pydantic import BaseModel, Field
from typing import Optional, List
```

---

## Handoff Imports

```python
from agents import Agent, handoff, RunContextWrapper
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
```

For realtime handoffs:
```python
from agents.realtime import RealtimeAgent, realtime_handoff
```

---

## Tracing Imports

```python
from agents import trace, RunConfig, set_tracing_export_api_key
```

---

## FastAPI Imports

```python
from fastapi import FastAPI, WebSocket, HTTPException
from pydantic import BaseModel
import uvicorn
```

---

## Complete Import Block Examples

### Standard Agent with Tools and Session

```python
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from agents import (
    Agent,
    Runner,
    SQLiteSession,
    WebSearchTool,
    CodeInterpreterTool,  # Requires: tool_config={"type": "code_interpreter"}
    function_tool,
)
```

### Realtime Agent

```python
import asyncio
import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from agents.realtime import RealtimeAgent, RealtimeRunner
from agents import function_tool
```

### Multi-Agent with Guardrails

```python
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from agents import (
    Agent,
    Runner,
    SQLiteSession,
    WebSearchTool,
    function_tool,
    InputGuardrail,
    OutputGuardrail,
    GuardrailFunctionOutput,
)
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
```

### Agent with Structured Output

```python
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List
from agents import Agent, Runner
```

---

## Config to Import Mapping Function

```python
def get_imports(config: dict) -> list[str]:
    """Generate import statements from AgentConfig."""
    imports = [
        "import os",
        "from dotenv import load_dotenv",
        "from fastapi import FastAPI",
    ]

    # Agent type imports
    if config["agent_type"] == "realtime":
        imports.append("from agents.realtime import RealtimeAgent, RealtimeRunner")
        imports.append("from fastapi import WebSocket")
        imports.append("import asyncio")
    else:
        imports.append("from agents import Agent, Runner")

    # Tool imports
    tool_imports = {
        "web_search": "WebSearchTool",
        "file_search": "FileSearchTool",
        "code_interpreter": "CodeInterpreterTool(tool_config={'type': 'code_interpreter'})",
        "image_generation": "ImageGenerationTool",
        "computer": "ComputerTool",
    }

    hosted_tools = config.get("tools", {}).get("hosted", [])
    if hosted_tools:
        tools_str = ", ".join([tool_imports[t] for t in hosted_tools if t in tool_imports])
        if tools_str:
            imports.append(f"from agents import {tools_str}")

    if config.get("tools", {}).get("custom"):
        imports.append("from agents import function_tool")

    # Session imports
    memory_type = config.get("memory", {}).get("type")
    if memory_type == "sqlite":
        imports.append("from agents import SQLiteSession")
    elif memory_type == "redis":
        imports.append("from agents.extensions.memory import RedisSession")

    # Guardrail imports
    if config.get("guardrails", {}).get("input"):
        imports.append("from agents import InputGuardrail, GuardrailFunctionOutput")
    if config.get("guardrails", {}).get("output"):
        imports.append("from agents import OutputGuardrail, GuardrailFunctionOutput")

    # Structured output imports
    if config.get("output", {}).get("type") == "structured":
        imports.append("from pydantic import BaseModel, Field")
        imports.append("from typing import Optional, List")

    # Handoff imports
    if config.get("handoffs"):
        imports.append("from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX")

    return imports
```

---

## Requirement Mappings

| Feature | Additional Requirements |
|---------|------------------------|
| Realtime Agent | `openai-agents[voice]>=0.7.0` |
| Redis Session | `redis>=5.0.0` |
| MCP Servers | `mcp>=0.1.0` |
| All Others | `openai-agents>=0.7.0` |

### Base Requirements

```
openai-agents>=0.7.0
fastapi>=0.109.0
uvicorn>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```
