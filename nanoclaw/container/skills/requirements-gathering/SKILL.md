---
name: requirements-gathering
description: Gather client requirements for AI agent building through structured questions. Use when client wants to build an agent. Triggers on "build", "create", "need agent", "make bot", "banao", "chahiye agent". Ask maximum 5-7 questions.
---

# Requirements Gathering Skill

Extract client requirements through targeted questions and produce structured AgentConfig JSON for code generation.

## References

| Reference | Description |
|-----------|-------------|
| [openai-agents-sdk-capabilities.md](references/openai-agents-sdk-capabilities.md) | All SDK capabilities for questions |
| [agent-config-schema.md](references/agent-config-schema.md) | Complete AgentConfig JSON schema |

---

## Quick Question Flow

Ask **maximum 5-7 questions** based on context:

| # | Question | Required | Maps To |
|---|----------|----------|---------|
| Q1 | What does agent do? | ✅ Yes | description, instructions |
| Q2 | Text or voice? | Auto-detect | agent_type |
| Q3 | What tools needed? | ✅ Yes | tools |
| Q4 | Remember conversations? | If relevant | memory |
| Q5 | What specialists? | If multi-agent | handoffs |
| Q6 | Structured output? | If data processing | output |
| Q7 | Docker deployment? | ✅ Yes | deployment |
| Q8 | Need website/UI? | Recommended | frontend |

---

## Smart Auto-Detection

### Agent Type Detection

**Before asking Q2**, detect from keywords:

| Keywords | Set agent_type | Skip Q2 |
|----------|---------------|---------|
| voice, phone, call, speak, audio, realtime | "realtime" | ✅ |
| team, specialists, departments, routing, handoff | "multi-agent" | ✅ |
| bot, chatbot, assistant, FAQ | "standard" | ✅ |

### Frontend Detection

**Auto-set `needs_frontend: true`** when client mentions:

| Keywords | Frontend Type |
|----------|--------------|
| website, landing page, full site | full_website |
| chat widget, embed, just chat | chat_widget |
| test, try, use agent (unclear) | full_website |
| API, backend only | api_only |

---

## Question Templates

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

### Q2: Agent Type (If not auto-detected)

```
What type of interaction?

1. 💬 Text chatbot (web/API)
2. 🎤 Voice assistant (phone/realtime)
3. 👥 Multiple specialists working together
```

### Q3: Tools (Required)

```
Which capabilities do you need?

1. 🔍 Web search - Find current information online
2. 📄 Document search - Search your own files
3. 🧮 Code execution - Calculations, data analysis
4. 🎨 Image generation - Create images
5. ⚙️ Custom actions - Connect to your systems
```

### Q4: Memory

```
Should it remember past conversations?

1. ❌ No memory - Each chat starts fresh
2. 💾 Simple memory - Remember on one server
3. ☁️ Scalable memory - For many users
```

### Q5: Multi-Agent Specialists

```
What specialists do you need?

Examples:
- Billing support (payments, invoices)
- Technical support (bugs, errors)
- Sales (pricing, products)
```

### Q6: Structured Output

```
Do you need structured data output?

1. 📝 Free text responses
2. 📊 Structured data (JSON format)

If structured, what fields? Example: "name, date, amount"
```

### Q7: Deployment

```
How will you run this agent?

1. 🖥️ Local (your computer)
2. 🐳 Docker container (recommended)
3. ☁️ Cloud server
```

### Q8: Frontend

```
Do you need a website/UI to use your agent?

1. 🌐 Yes - Full website with chat
2. 💬 Yes - Just a chat widget
3. 🔌 No - API only
```

---

## Realtime Agent Configuration

When `agent_type: "realtime"`, ask additional voice question:

```
What voice style do you prefer?

1. Neutral/balanced (alloy)
2. Warm/natural (ash)
3. Clear/professional (echo)
4. Expressive/dynamic (fable)
5. Deep/authoritative (onyx)
6. Energetic/friendly (nova)
7. Soft/calming (shimmer)
```

**Realtime Defaults:**

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

---

## Smart Defaults

When not explicitly stated, use these defaults:

| Requirement | Default Value |
|-------------|---------------|
| Memory | "sqlite" for multi-turn, "none" for single query |
| Deployment | "docker" |
| Server | "fastapi" |
| Port | 8000 |
| Guardrails | ["max_length"], ["no_pii"] |
| Frontend | Assume "full_website" if unclear |

---

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

---

## AgentConfig JSON Output

After confirmation, produce complete AgentConfig:

```json
{
  "agent_type": "standard",
  "name": "CustomerSupportBot",
  "description": "Customer support chatbot",
  "instructions": "You are a helpful customer support agent...",

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
    "created_at": "2026-02-26T12:00:00Z",
    "version": "1.0"
  }
}
```

---

## Tool-to-Config Mapping

| Client Says | tools.hosted |
|-------------|--------------|
| "search web", "find online" | ["web_search"] |
| "search docs", "knowledge base" | ["file_search"] |
| "calculate", "analyze data" | ["code_interpreter"] |
| "create images" | ["image_generation"] |
| "automate browser" | ["computer"] |

| Client Says | tools.custom |
|-------------|--------------|
| "check inventory" | ["check_inventory"] |
| "send email" | ["send_email"] |
| "book appointment" | ["book_appointment"] |
| "connect to database" | ["query_database"] |

---

## Handling Unclear Responses

```
Client: "I want it to do everything"

Employee: "I understand! Let me suggest the most common setup:
- Web search for finding information
- Memory to remember conversations
- Docker for easy deployment

Would you like to add or remove anything?"
```

```
Client: "Just make it good"

Employee: "I'll set up a recommended configuration:
- FAQ bot with web search
- Conversation memory
- Full website to test it

Does this work for you?"
```

---

## Handoff to agent-builder

Once confirmed, pass AgentConfig JSON to `agent-builder` skill:

1. AgentConfig JSON is complete
2. Client has confirmed requirements
3. Frontend template identified (if needed)

The `agent-builder` skill will:
- Design architecture based on AgentConfig
- Select appropriate SDK patterns
- Prepare for code generation
