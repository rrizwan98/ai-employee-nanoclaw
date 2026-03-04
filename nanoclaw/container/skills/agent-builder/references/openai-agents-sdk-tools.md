# OpenAI Agents SDK - Tools Reference

Complete reference for all tools available in OpenAI Agents SDK v0.7.0+.

---

## Hosted Tools (OpenAI Infrastructure)

These tools run on OpenAI's infrastructure and require no local setup.

### 1. WebSearchTool

**Use for**: Finding current information, research, news, real-time data

```python
from agents import Agent, WebSearchTool

agent = Agent(
    name="Research Assistant",
    instructions="Search the web to answer questions with current information.",
    tools=[
        WebSearchTool(
            search_context_size="medium",  # Options: "low", "medium", "high"
        ),
    ],
)
```

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| search_context_size | str | "medium" | Amount of context to include |

---

### 2. FileSearchTool (RAG)

**Use for**: Document Q&A, knowledge base search, internal docs

```python
from agents import Agent, FileSearchTool

agent = Agent(
    name="Document Assistant",
    instructions="Search through documents to find relevant information.",
    tools=[
        FileSearchTool(
            vector_store_ids=["vs_abc123"],  # Required: Vector store IDs
            max_num_results=5,               # Optional: Limit results
        ),
    ],
)
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vector_store_ids | list[str] | Yes | OpenAI Vector Store IDs |
| max_num_results | int | No | Maximum results to return |

**Note**: Client must create vector_store_id via OpenAI API first:
```python
# Create vector store (OpenAI API)
from openai import OpenAI
client = OpenAI()
vector_store = client.vector_stores.create(name="My Knowledge Base")
# vector_store.id = "vs_abc123"
```

---

### 3. CodeInterpreterTool

**Use for**: Calculations, data analysis, Python execution, file processing

```python
from agents import Agent, CodeInterpreterTool

agent = Agent(
    name="Data Analyst",
    instructions="Use code to analyze data and create visualizations.",
    tools=[CodeInterpreterTool()],
)
```

**Capabilities**:
- Execute Python code in sandbox
- Process uploaded files
- Generate charts/visualizations
- Mathematical calculations
- Data transformations

---

### 4. ImageGenerationTool

**Use for**: Creating images, visual content, DALL-E generation

```python
from agents import Agent, ImageGenerationTool

agent = Agent(
    name="Artist",
    instructions="Generate images based on user descriptions.",
    tools=[ImageGenerationTool()],
)
```

---

### 5. ComputerTool

**Use for**: Browser automation, web scraping, desktop GUI tasks

```python
from agents import Agent, ComputerTool

agent = Agent(
    name="Automation Agent",
    instructions="Automate browser and desktop tasks.",
    tools=[ComputerTool()],
)
```

**Requires**: Implementation of `Computer` or `AsyncComputer` interface:

```python
from agents.computer import AsyncComputer

class MyComputer(AsyncComputer):
    environment = "browser"  # or "desktop"
    dimensions = (1024, 768)

    async def screenshot(self) -> str:
        """Return base64 encoded screenshot"""
        return ""

    async def click(self, x: int, y: int, button: str = "left"):
        """Click at coordinates"""
        pass

    async def double_click(self, x: int, y: int):
        """Double click at coordinates"""
        pass

    async def scroll(self, x: int, y: int, scroll_x: int, scroll_y: int):
        """Scroll at position"""
        pass

    async def type(self, text: str):
        """Type text"""
        pass

    async def wait(self):
        """Wait for page load"""
        pass

    async def move(self, x: int, y: int):
        """Move mouse to coordinates"""
        pass

    async def keypress(self, keys: list[str]):
        """Press keys"""
        pass

    async def drag(self, path: list[tuple[int, int]]):
        """Drag along path"""
        pass
```

---

### 6. HostedMCPTool

**Use for**: Connecting to remote MCP servers hosted on OpenAI infrastructure

```python
from agents import Agent, HostedMCPTool

agent = Agent(
    name="MCP Agent",
    tools=[
        HostedMCPTool(
            tool_config={
                "type": "mcp",
                "server_label": "gitmcp",
                "server_url": "https://gitmcp.io/openai/codex",
                "require_approval": "never",  # "never", "always"
            }
        )
    ],
)
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| type | str | Always "mcp" |
| server_label | str | Identifier for the server |
| server_url | str | URL of the MCP server |
| require_approval | str | "never" or "always" |

---

## Custom Tools (@function_tool)

Transform Python functions into agent tools.

### Basic Function Tool

```python
from agents import Agent, function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get current weather for a city.

    Args:
        city: The city name to get weather for.
    """
    return f"Weather in {city}: Sunny, 72°F"

agent = Agent(
    name="Assistant",
    tools=[get_weather],
)
```

### Async Function Tool

```python
@function_tool
async def fetch_data(url: str) -> str:
    """Fetch data from a URL.

    Args:
        url: The URL to fetch data from.
    """
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()
```

### With Pydantic Field Constraints

```python
from typing import Annotated
from pydantic import Field

@function_tool
def rate_item(
    item_id: str,
    score: Annotated[int, Field(ge=1, le=5, description="Rating from 1 to 5")]
) -> str:
    """Rate an item with a score."""
    return f"Item {item_id} rated {score}/5"
```

### With Context Access

```python
from agents import function_tool, RunContextWrapper

@function_tool
async def get_user_info(ctx: RunContextWrapper, user_id: str) -> str:
    """Get user information.

    Args:
        user_id: The user's unique identifier.
    """
    # Access context data
    session_data = ctx.context.get("session", {})
    return f"User {user_id} from session {session_data}"
```

### With Timeout

```python
@function_tool(timeout=5.0)
async def slow_operation(data: str) -> str:
    """Process data with a timeout limit."""
    import asyncio
    await asyncio.sleep(2)
    return f"Processed: {data}"
```

### With Timeout Exception

```python
from agents import function_tool, ToolTimeoutError

@function_tool(timeout=1.5, timeout_behavior="raise_exception")
async def critical_operation() -> str:
    """Operation that must complete or fail."""
    import asyncio
    await asyncio.sleep(5)
    return "done"

# Usage with error handling
try:
    result = await Runner.run(agent, "Run the tool")
except ToolTimeoutError as e:
    print(f"{e.tool_name} timed out in {e.timeout_seconds} seconds")
```

### With Custom Error Handler

```python
from agents import function_tool, RunContextWrapper

def custom_error_handler(ctx: RunContextWrapper, error: Exception) -> str:
    return f"Tool failed gracefully: {str(error)}"

@function_tool(failure_error_function=custom_error_handler)
def risky_operation(value: int) -> str:
    """An operation that might fail."""
    if value < 0:
        raise ValueError("Value must be positive")
    return f"Result: {value * 2}"
```

---

## Combined Tools Example

```python
from agents import Agent, WebSearchTool, FileSearchTool, CodeInterpreterTool

research_agent = Agent(
    name="Full Research Assistant",
    instructions="""You are a research assistant that can:
    - Search the web for current information
    - Search through uploaded documents
    - Run code for data analysis
    Use the appropriate tool based on the user's request.""",
    tools=[
        WebSearchTool(),
        FileSearchTool(vector_store_ids=["vs_documents"]),
        CodeInterpreterTool(),
    ],
)
```
