# AgentConfig Schema Reference

Complete schema definition for AgentConfig JSON output.

---

## Full Schema

```json
{
  "agent_type": "standard | realtime | multi-agent",
  "name": "string (agent name)",
  "description": "string (what agent does)",
  "instructions": "string (system prompt)",

  "tools": {
    "hosted": ["web_search", "file_search", "code_interpreter", "image_generation", "computer"],
    "custom": ["tool_name_1", "tool_name_2"],
    "mcp_servers": [
      {
        "name": "string",
        "type": "hosted | stdio | sse | streamable_http",
        "config": {}
      }
    ]
  },

  "memory": {
    "type": "none | sqlite | redis",
    "config": {
      "db_path": "conversations.db",
      "redis_url": "redis://localhost:6379"
    }
  },

  "handoffs": [
    {
      "name": "string (specialist name)",
      "description": "string (when to route)",
      "instructions": "string (specialist behavior)"
    }
  ],

  "guardrails": {
    "input": ["max_length", "content_filter", "pii_detection"],
    "output": ["no_pii", "brand_safe", "length_limit"],
    "tools": ["block_secrets", "redact_output"]
  },

  "output": {
    "type": "text | structured",
    "schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },

  "realtime_config": {
    "voice": "alloy | ash | echo | fable | onyx | nova | shimmer",
    "modalities": ["audio", "text"],
    "input_format": "pcm16 | g711_ulaw | g711_alaw",
    "output_format": "pcm16 | g711_ulaw | g711_alaw",
    "turn_detection": "semantic_vad | server_vad",
    "interrupt": true
  },

  "deployment": {
    "type": "local | docker | cloud",
    "server": "fastapi | none",
    "port": 8000
  },

  "frontend": {
    "needs_frontend": true,
    "type": "full_website | chat_widget | api_only",
    "template": "nextjs-chatkit-ui | chatkit-react",
    "variables": {
      "PROJECT_NAME": "string",
      "BACKEND_URL": "string",
      "BRAND_COLOR": "#hex"
    }
  },

  "metadata": {
    "client_jid": "string (WhatsApp JID)",
    "created_at": "ISO datetime",
    "version": "string"
  }
}
```

---

## Required Fields

These fields must always be present:

| Field | Type | Description |
|-------|------|-------------|
| agent_type | string | "standard", "realtime", or "multi-agent" |
| name | string | Agent name (used in code) |
| description | string | Human-readable description |
| instructions | string | System prompt for agent |
| deployment | object | How to deploy the agent |

---

## Field Details

### agent_type

```json
"agent_type": "standard"
```

| Value | SDK Class | Use Case |
|-------|-----------|----------|
| standard | Agent | Text chatbots, API bots |
| realtime | RealtimeAgent | Voice assistants |
| multi-agent | Agent + handoffs | Specialist teams |

---

### tools

```json
"tools": {
  "hosted": ["web_search", "code_interpreter"],
  "custom": ["check_inventory", "send_email"],
  "mcp_servers": []
}
```

#### Hosted Tool Values

| Value | SDK Import |
|-------|------------|
| web_search | WebSearchTool |
| file_search | FileSearchTool |
| code_interpreter | CodeInterpreterTool |
| image_generation | ImageGenerationTool |
| computer | ComputerTool |

#### Custom Tools

List function names that need to be generated:

```json
"custom": ["get_weather", "book_appointment", "check_order"]
```

#### MCP Servers

```json
"mcp_servers": [
  {
    "name": "Filesystem",
    "type": "stdio",
    "config": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"]
    }
  },
  {
    "name": "GitHub",
    "type": "hosted",
    "config": {
      "server_url": "https://gitmcp.io/org/repo",
      "require_approval": "never"
    }
  }
]
```

---

### memory

```json
"memory": {
  "type": "sqlite",
  "config": {
    "db_path": "conversations.db"
  }
}
```

| Type | Config Keys | Description |
|------|-------------|-------------|
| none | (none) | No persistence |
| sqlite | db_path | Local file |
| redis | redis_url | Network storage |

---

### handoffs

Only for multi-agent type:

```json
"handoffs": [
  {
    "name": "Billing Support",
    "description": "Handle payment and invoice questions",
    "instructions": "You are a billing specialist. Be precise about amounts."
  },
  {
    "name": "Technical Support",
    "description": "Handle technical issues and bugs",
    "instructions": "You are technical support. Ask clarifying questions."
  }
]
```

---

### guardrails

```json
"guardrails": {
  "input": ["max_length"],
  "output": ["no_pii"],
  "tools": []
}
```

#### Input Guardrail Values

| Value | Description |
|-------|-------------|
| max_length | Block inputs > 10000 chars |
| content_filter | Block inappropriate content |
| pii_detection | Block SSN, credit cards, etc. |

#### Output Guardrail Values

| Value | Description |
|-------|-------------|
| no_pii | Redact personal info |
| brand_safe | Professional language |
| length_limit | Cap response length |

#### Tool Guardrail Values

| Value | Description |
|-------|-------------|
| block_secrets | Block API keys in inputs |
| redact_output | Redact secrets in outputs |

---

### output

```json
"output": {
  "type": "structured",
  "schema": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "date": {"type": "string"},
      "amount": {"type": "number"}
    },
    "required": ["name", "date"]
  }
}
```

| Type | Schema Required | Description |
|------|-----------------|-------------|
| text | No | Free-form responses |
| structured | Yes | JSON with Pydantic model |

---

### realtime_config

Only for realtime agent type:

```json
"realtime_config": {
  "voice": "ash",
  "modalities": ["audio", "text"],
  "input_format": "pcm16",
  "output_format": "pcm16",
  "turn_detection": "semantic_vad",
  "interrupt": true
}
```

| Field | Options | Default |
|-------|---------|---------|
| voice | alloy, ash, echo, fable, onyx, nova, shimmer | alloy |
| modalities | ["audio"], ["audio", "text"] | ["audio", "text"] |
| input_format | pcm16, g711_ulaw, g711_alaw | pcm16 |
| output_format | pcm16, g711_ulaw, g711_alaw | pcm16 |
| turn_detection | semantic_vad, server_vad | semantic_vad |
| interrupt | true, false | true |

---

### deployment

```json
"deployment": {
  "type": "docker",
  "server": "fastapi",
  "port": 8000
}
```

| Field | Options | Description |
|-------|---------|-------------|
| type | local, docker, cloud | Deployment method |
| server | fastapi, none | Server framework |
| port | number | HTTP port |

---

### frontend

```json
"frontend": {
  "needs_frontend": true,
  "type": "full_website",
  "template": "nextjs-chatkit-ui",
  "variables": {
    "PROJECT_NAME": "MyBot",
    "BACKEND_URL": "http://localhost:8000",
    "BRAND_COLOR": "#3B82F6"
  }
}
```

| Field | Options | Description |
|-------|---------|-------------|
| needs_frontend | true, false | Whether to generate frontend |
| type | full_website, chat_widget, api_only | Frontend type |
| template | nextjs-chatkit-ui, chatkit-react | Template to use |
| variables | object | Template variables |

---

### metadata

```json
"metadata": {
  "client_jid": "923001234567@s.whatsapp.net",
  "created_at": "2026-02-26T12:00:00Z",
  "version": "1.0"
}
```

| Field | Description |
|-------|-------------|
| client_jid | WhatsApp JID for delivery |
| created_at | ISO timestamp |
| version | Config version |

---

## Example Configs

### Simple FAQ Bot

```json
{
  "agent_type": "standard",
  "name": "FAQBot",
  "description": "FAQ chatbot for company",
  "instructions": "You are a helpful FAQ bot. Answer questions about our company.",
  "tools": {
    "hosted": ["web_search"],
    "custom": [],
    "mcp_servers": []
  },
  "memory": {
    "type": "sqlite",
    "config": {"db_path": "conversations.db"}
  },
  "handoffs": [],
  "guardrails": {
    "input": ["max_length"],
    "output": ["no_pii"],
    "tools": []
  },
  "output": {"type": "text", "schema": null},
  "realtime_config": null,
  "deployment": {"type": "docker", "server": "fastapi", "port": 8000},
  "frontend": {
    "needs_frontend": true,
    "type": "full_website",
    "template": "nextjs-chatkit-ui",
    "variables": {
      "PROJECT_NAME": "FAQBot",
      "BACKEND_URL": "http://localhost:8000"
    }
  },
  "metadata": {
    "client_jid": "923001234567@s.whatsapp.net",
    "created_at": "2026-02-26T12:00:00Z",
    "version": "1.0"
  }
}
```

### Voice Assistant

```json
{
  "agent_type": "realtime",
  "name": "VoiceAssistant",
  "description": "Voice-based appointment booking",
  "instructions": "You are a friendly receptionist. Help callers book appointments.",
  "tools": {
    "hosted": [],
    "custom": ["book_appointment", "check_availability"],
    "mcp_servers": []
  },
  "memory": {"type": "none", "config": {}},
  "handoffs": [],
  "guardrails": {
    "input": [],
    "output": [],
    "tools": []
  },
  "output": {"type": "text", "schema": null},
  "realtime_config": {
    "voice": "nova",
    "modalities": ["audio", "text"],
    "input_format": "pcm16",
    "output_format": "pcm16",
    "turn_detection": "semantic_vad",
    "interrupt": true
  },
  "deployment": {"type": "docker", "server": "fastapi", "port": 8000},
  "frontend": {"needs_frontend": false, "type": "api_only", "template": null, "variables": {}},
  "metadata": {
    "client_jid": "923001234567@s.whatsapp.net",
    "created_at": "2026-02-26T12:00:00Z",
    "version": "1.0"
  }
}
```

### Multi-Agent Support Team

```json
{
  "agent_type": "multi-agent",
  "name": "SupportTeam",
  "description": "Customer support with specialist routing",
  "instructions": "You are the triage agent. Route customers to appropriate specialists.",
  "tools": {
    "hosted": ["web_search"],
    "custom": [],
    "mcp_servers": []
  },
  "memory": {
    "type": "redis",
    "config": {"redis_url": "redis://localhost:6379"}
  },
  "handoffs": [
    {
      "name": "Billing Support",
      "description": "Handle payment and invoice questions",
      "instructions": "You are billing support. Be precise about amounts and dates."
    },
    {
      "name": "Technical Support",
      "description": "Handle technical issues and bugs",
      "instructions": "You are technical support. Ask clarifying questions."
    }
  ],
  "guardrails": {
    "input": ["max_length", "content_filter"],
    "output": ["no_pii", "brand_safe"],
    "tools": []
  },
  "output": {"type": "text", "schema": null},
  "realtime_config": null,
  "deployment": {"type": "docker", "server": "fastapi", "port": 8000},
  "frontend": {
    "needs_frontend": true,
    "type": "chat_widget",
    "template": "chatkit-react",
    "variables": {
      "PROJECT_NAME": "SupportTeam",
      "BACKEND_URL": "http://localhost:8000"
    }
  },
  "metadata": {
    "client_jid": "923001234567@s.whatsapp.net",
    "created_at": "2026-02-26T12:00:00Z",
    "version": "1.0"
  }
}
```
