# OpenAI Agents SDK - MCP Server Integration Reference

Complete reference for Model Context Protocol (MCP) server integration in OpenAI Agents SDK v0.7.0+.

---

## Overview

MCP servers extend agent capabilities with external tools. Four integration options:

| Type | Class | Where Runs | Transport |
|------|-------|-----------|-----------|
| Hosted MCP | HostedMCPTool | OpenAI infrastructure | HTTPS |
| Streamable HTTP | MCPServerStreamableHttp | Local/Remote | HTTP |
| SSE (deprecated) | MCPServerSse | Local/Remote | HTTP+SSE |
| Stdio | MCPServerStdio | Local subprocess | stdin/stdout |

---

## Hosted MCP (HostedMCPTool)

MCP servers running on OpenAI's infrastructure. No local setup required.

```python
import asyncio
from agents import Agent, Runner, HostedMCPTool

async def main():
    agent = Agent(
        name="Git Assistant",
        tools=[
            HostedMCPTool(
                tool_config={
                    "type": "mcp",
                    "server_label": "gitmcp",
                    "server_url": "https://gitmcp.io/openai/codex",
                    "require_approval": "never",
                }
            )
        ],
    )

    result = await Runner.run(agent, "What languages are used in this repository?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

### Configuration Options

| Parameter | Type | Description |
|-----------|------|-------------|
| type | str | Always "mcp" |
| server_label | str | Identifier for the server |
| server_url | str | HTTPS URL of the MCP server |
| require_approval | str | "never" or "always" |

---

## Stdio MCP (MCPServerStdio)

Run MCP servers as local subprocesses. Best for local tools, filesystems, and CLI tools.

### Basic Example

```python
from pathlib import Path
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

current_dir = Path(__file__).parent
samples_dir = current_dir / "sample_files"

async with MCPServerStdio(
    name="Filesystem Server",
    params={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", str(samples_dir)],
    },
) as server:
    agent = Agent(
        name="File Assistant",
        instructions="Use the filesystem tools to help users with their files.",
        mcp_servers=[server],
    )

    result = await Runner.run(agent, "List all files in the directory")
    print(result.final_output)
```

### Common MCP Servers via npx

```python
# Filesystem server
async with MCPServerStdio(
    name="Filesystem",
    params={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"],
    },
) as fs_server:
    ...

# GitHub server
async with MCPServerStdio(
    name="GitHub",
    params={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {"GITHUB_TOKEN": os.getenv("GITHUB_TOKEN")},
    },
) as github_server:
    ...

# Slack server
async with MCPServerStdio(
    name="Slack",
    params={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-slack"],
        "env": {"SLACK_TOKEN": os.getenv("SLACK_TOKEN")},
    },
) as slack_server:
    ...
```

### Python MCP Server

```python
async with MCPServerStdio(
    name="Custom Python Server",
    params={
        "command": "python",
        "args": ["-m", "my_mcp_server"],
        "cwd": "/path/to/server",
    },
) as python_server:
    ...
```

---

## SSE MCP (MCPServerSse)

**Note**: SSE transport is deprecated. Use Streamable HTTP for new integrations.

```python
from agents import Agent, Runner
from agents.mcp import MCPServerSse
from agents.model_settings import ModelSettings

workspace_id = "demo-workspace"

async with MCPServerSse(
    name="SSE Server",
    params={
        "url": "http://localhost:8000/sse",
        "headers": {"X-Workspace": workspace_id},
    },
    cache_tools_list=True,
) as server:
    agent = Agent(
        name="Assistant",
        mcp_servers=[server],
        model_settings=ModelSettings(tool_choice="required"),
    )

    result = await Runner.run(agent, "What tools are available?")
    print(result.final_output)
```

---

## Streamable HTTP MCP (MCPServerStreamableHttp)

For HTTP-based MCP servers supporting streaming.

```python
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async with MCPServerStreamableHttp(
    name="HTTP Server",
    params={
        "url": "http://localhost:8000/mcp",
        "headers": {"Authorization": f"Bearer {token}"},
    },
) as server:
    agent = Agent(
        name="Assistant",
        mcp_servers=[server],
    )

    result = await Runner.run(agent, "Execute the task")
    print(result.final_output)
```

---

## Multiple MCP Servers

Combine multiple MCP servers for comprehensive capabilities:

```python
from agents import Agent, Runner, HostedMCPTool
from agents.mcp import MCPServerStdio

async def main():
    # Local filesystem server
    async with MCPServerStdio(
        name="Filesystem",
        params={
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"],
        },
    ) as fs_server:

        # Agent with multiple MCP sources
        agent = Agent(
            name="Power Assistant",
            instructions="""You have access to:
            - Local filesystem for reading/writing files
            - Git repository information via hosted MCP
            Use the appropriate tool for each task.""",
            mcp_servers=[fs_server],  # Local servers
            tools=[
                HostedMCPTool(  # Hosted servers
                    tool_config={
                        "type": "mcp",
                        "server_label": "gitmcp",
                        "server_url": "https://gitmcp.io/openai/codex",
                        "require_approval": "never",
                    }
                )
            ],
        )

        result = await Runner.run(
            agent,
            "Read the README.md file and tell me about the project"
        )
        print(result.final_output)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## MCP with FastAPI

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

# Store MCP server in app state
mcp_server = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global mcp_server

    # Start MCP server on app startup
    mcp_server = MCPServerStdio(
        name="Filesystem",
        params={
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"],
        },
    )
    await mcp_server.__aenter__()

    yield

    # Stop MCP server on shutdown
    await mcp_server.__aexit__(None, None, None)

app = FastAPI(lifespan=lifespan)

@app.post("/chat")
async def chat(message: str):
    agent = Agent(
        name="File Assistant",
        instructions="Help users with files.",
        mcp_servers=[mcp_server],
    )

    result = await Runner.run(agent, message)
    return {"response": result.final_output}
```

---

## Tool Caching

Cache MCP tool lists for better performance:

```python
async with MCPServerStdio(
    name="Filesystem",
    params={...},
    cache_tools_list=True,  # Cache tool definitions
) as server:
    ...
```

---

## MCP Server Selection Guide

| Use Case | Recommended Type |
|----------|-----------------|
| Public API (GitHub, etc.) | HostedMCPTool |
| Local filesystem | MCPServerStdio |
| Custom Python tools | MCPServerStdio |
| Remote HTTP server | MCPServerStreamableHttp |
| Legacy SSE server | MCPServerSse (deprecated) |

---

## Building Custom MCP Server

Create your own MCP server for custom tools:

```python
# my_mcp_server.py
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("my-tools")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="my_tool",
            description="Does something useful",
            inputSchema={
                "type": "object",
                "properties": {
                    "input": {"type": "string"}
                },
                "required": ["input"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "my_tool":
        return [TextContent(
            type="text",
            text=f"Processed: {arguments['input']}"
        )]

if __name__ == "__main__":
    import asyncio
    asyncio.run(app.run_stdio())
```

Use in agent:

```python
async with MCPServerStdio(
    name="My Tools",
    params={
        "command": "python",
        "args": ["my_mcp_server.py"],
    },
) as server:
    agent = Agent(
        name="Assistant",
        mcp_servers=[server],
    )
```

---

## Environment Variables for MCP

```python
import os

# Pass environment to MCP server
async with MCPServerStdio(
    name="GitHub",
    params={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
            "GITHUB_TOKEN": os.getenv("GITHUB_TOKEN"),
            "GITHUB_ORG": os.getenv("GITHUB_ORG"),
        },
    },
) as server:
    ...
```

---

## Error Handling

```python
from agents.mcp import MCPServerStdio

try:
    async with MCPServerStdio(
        name="Filesystem",
        params={
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"],
        },
    ) as server:
        agent = Agent(name="Assistant", mcp_servers=[server])
        result = await Runner.run(agent, "List files")

except FileNotFoundError:
    print("MCP server command not found. Install: npm install -g npx")

except ConnectionError:
    print("Failed to connect to MCP server")

except Exception as e:
    print(f"MCP error: {e}")
```
