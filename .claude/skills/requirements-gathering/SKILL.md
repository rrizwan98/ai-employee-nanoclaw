---
name: requirements-gathering
description: Gather client requirements for AI agent building through structured questions. Use when client wants to build an agent. Triggers on "build", "create", "need agent", "make bot", "banao", "chahiye agent". Ask maximum 5-7 questions.
---

# Requirements Gathering Skill

Extract client requirements through targeted questions and produce structured AgentConfig JSON for code generation.

## Question Flow (Maximum 7 Questions)

### Q1: Purpose (Required)
```
What will your agent help with?

Examples:
- Customer support / FAQ
- Voice ordering / phone assistant
- Data extraction / processing
- Document Q&A / research
- Task automation
```

**Maps to:** `description`, `instructions`

### Q2: Agent Type (Required)
```
What type of interaction?

1. Text chatbot (web/API)
2. Voice assistant (phone/realtime)
3. Multiple specialists working together
```

**Maps to:** `agent_type` (standard | realtime | multi-agent)

### Q3: Tools (Required)
```
Which capabilities do you need?

1. Web search (find info online)
2. Document search (your files/knowledge base)
3. Code execution (calculations, data analysis)
4. Image generation (create images)
5. Custom actions (database, email, API calls)
```

**Maps to:** `tools.hosted`, `tools.custom`

### Q4: Memory (If applicable)
```
Should it remember past conversations?

1. No memory (each conversation fresh)
2. Simple memory (local storage)
3. Scalable memory (for many users)
```

**Maps to:** `memory.type` (none | sqlite | redis)

### Q5: Multi-Agent (If Q2 = multi-agent)
```
What specialists do you need?

Example: "Billing support, Technical support, General inquiries"
```

**Maps to:** `handoffs[]`

### Q6: Output Format (If data processing)
```
Do you need structured data output?

1. Free text responses
2. Structured data (JSON format)

If structured, what fields? Example: "name, date, amount"
```

**Maps to:** `output.type`, `output.schema`

### Q7: Deployment (Required)
```
How will you run this agent?

1. Local (your computer)
2. Docker container
3. Cloud server
```

**Maps to:** `deployment.type`

### Q8: Frontend/UI (Optional but Recommended)
```
Do you need a website/UI to use your agent?

1. Yes - Full website with chat (landing page + chat widget)
2. Yes - Just a chat widget (to embed in existing site)
3. No - API only (I'll build my own frontend)
```

**Maps to:** `needs_frontend`, `frontend_type`

**IMPORTANT Frontend Rules:**
- If client says "test", "try", "use the agent" → Assume they need frontend
- If client says "website", "landing page", "UI" → needs_frontend: true
- Default to option 1 (full website) if unclear

## Automatic Agent Type Detection

Detect agent type from keywords before asking Q2:

### Realtime/Voice Detection Keywords

| Language | Keywords |
|----------|----------|
| English | voice, phone, call, speak, talk, audio, realtime, real-time, conversation, telephone, IVR |
| Urdu | awaaz, phone, call, baat, sunna, bolna |

If detected → Set `agent_type: "realtime"` and skip Q2.

### Multi-Agent Detection Keywords

| Language | Keywords |
|----------|----------|
| English | team, specialists, departments, routing, handoff, transfer, multiple agents |
| Urdu | team, departments, transfer |

If detected → Set `agent_type: "multi-agent"` and ask Q5.

### Realtime Config Defaults

When `agent_type: "realtime"`:

```json
{
  "realtime_config": {
    "voice": "alloy",
    "modalities": ["audio", "text"],
    "input_format": "pcm16",
    "output_format": "pcm16",
    "turn_detection": "semantic_vad",
    "interrupt": true
  }
}
```

### Voice Selection (Optional Q for Realtime)

```
What voice style do you prefer?

1. Neutral/balanced (alloy)
2. Warm/conversational (echo)
3. Expressive/storytelling (fable)
4. Deep/authoritative (onyx)
5. Energetic/friendly (nova)
6. Soft/calming (shimmer)
7. Clear/professional (ash)
```

**Maps to:** `realtime_config.voice`

## Smart Question Selection

Not all questions needed every time:

| If Client Says | Skip Questions |
|----------------|----------------|
| "simple chatbot" | Q5, Q6 |
| "voice assistant" | Q2, Q6 (auto-detect realtime) |
| "phone bot" | Q2, Q6 (auto-detect realtime) |
| "just FAQ bot" | Q4, Q5, Q6 |
| "data extraction" | Q2 (assume standard), Q5 |
| "support team" | Q2 (auto-detect multi-agent) |

## Frontend Auto-Detection

Automatically set `needs_frontend: true` when client mentions:

| Language | Keywords |
|----------|----------|
| English | website, frontend, UI, landing page, chat widget, test agent, try agent, use agent, interface, web app, dashboard, portal |
| Urdu | website, page, test karna, use karna, dekh sakein |

**Frontend Type Selection:**

| Keywords | Frontend Type | Template |
|----------|--------------|----------|
| "full website", "landing page", "complete site" | `full_website` | `nextjs-chatkit-ui` |
| "chat widget", "embed", "just chat" | `chat_widget` | `chatkit-react` |
| "test", "try", "use" (unclear) | `full_website` | `nextjs-chatkit-ui` |

## AgentConfig JSON Output

After gathering requirements, produce:

```json
{
  "agent_type": "standard",
  "name": "CustomerSupportBot",
  "description": "Customer support chatbot for e-commerce",
  "instructions": "You are a helpful customer support agent...",

  "tools": {
    "hosted": ["web_search"],
    "custom": [],
    "mcp_servers": []
  },

  "memory": {
    "type": "sqlite",
    "config": {
      "db_path": "conversations.db"
    }
  },

  "handoffs": [],

  "guardrails": {
    "input": ["max_length"],
    "output": ["no_pii"]
  },

  "output": {
    "type": "text",
    "schema": null
  },

  "realtime_config": null,

  "deployment": {
    "type": "docker",
    "server": "fastapi",
    "port": 8000
  },

  "frontend": {
    "needs_frontend": true,
    "type": "full_website",
    "template": "nextjs-chatkit-ui",
    "variables": {
      "PROJECT_NAME": "CustomerSupportBot",
      "BACKEND_URL": "http://localhost:8000",
      "BRAND_COLOR": "#3B82F6"
    }
  },

  "metadata": {
    "client_jid": "923001234567@s.whatsapp.net",
    "created_at": "2026-02-20T12:00:00Z",
    "version": "1.0"
  }
}
```

## Requirement Inference

Make smart defaults when not explicitly stated:

| Requirement | Default |
|-------------|---------|
| Memory not mentioned | `sqlite` for multi-turn, `none` for single query |
| Deployment not mentioned | `docker` |
| Server type | `fastapi` if API needed, `none` for CLI |
| Guardrails | Always include `max_length`, `no_pii` |

## Confirmation Template

After all questions:

```
Great! Here's what I understand:

📋 Agent: [name]
🎯 Type: [standard/realtime/multi-agent]
🔧 Tools: [list]
💾 Memory: [type]
📤 Output: [text/structured]
🚀 Deploy: [docker/local]
🌐 Frontend: [Yes - Full website / Yes - Chat widget only / No - API only]

Should I proceed with this design?
```

## Handling Unclear Responses

If client's answer is unclear:
- Offer examples
- Ask follow-up
- Suggest most common option

```
Client: "I want it to do everything"

Employee: "I understand! Let me suggest the most common setup:
- Web search for finding information
- Memory to remember conversations
- Docker for easy deployment

Would you like to add or remove anything?"
```

## Handoff to agent-builder

Once confirmed, pass AgentConfig JSON to `agent-builder` skill for design and template selection.
