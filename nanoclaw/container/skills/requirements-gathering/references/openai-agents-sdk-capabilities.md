# OpenAI Agents SDK - Capabilities Reference

Complete reference of all SDK capabilities for requirements gathering questions.

---

## Agent Types

| Type | Description | Use Case | SDK Class |
|------|-------------|----------|-----------|
| Standard | Text-based chatbot | FAQ, support, assistant | `Agent` |
| Realtime | Voice/audio agent | Phone bot, voice assistant | `RealtimeAgent` |
| Multi-Agent | Team of specialists | Complex workflows, routing | `Agent` with `handoffs` |

---

## Hosted Tools (OpenAI Infrastructure)

Tools that run on OpenAI's servers - no local setup needed.

| Tool | Description | Client Question | Keywords |
|------|-------------|-----------------|----------|
| WebSearchTool | Search the web | "Need current/online info?" | web, search, current, online, research |
| FileSearchTool | Search uploaded documents | "Search your own documents?" | document, file, knowledge, RAG, upload |
| CodeInterpreterTool | Run Python code | "Need calculations/analysis?" | calculate, analyze, data, python |
| ImageGenerationTool | Create images with DALL-E | "Generate images?" | image, picture, visual, create |
| ComputerTool | Automate browser/desktop | "Automate browser tasks?" | automate, browser, scrape, click |

### Tool Question Template

```
Which capabilities do you need?

1. 🔍 Web search - Find current information online
2. 📄 Document search - Search your own files/knowledge base
3. 🧮 Code execution - Calculations, data analysis
4. 🎨 Image generation - Create images
5. ⚙️ Custom actions - Connect to your systems (database, email, etc.)
```

---

## Memory/Session Options

| Type | Description | Client Question | Best For |
|------|-------------|-----------------|----------|
| None | No memory | "Each chat starts fresh?" | Simple Q&A, stateless |
| SQLite | Local file storage | "Remember on one server?" | Development, single-instance |
| Redis | Network storage | "Scale to many users?" | Production, distributed |

### Memory Question Template

```
Should the agent remember past conversations?

1. ❌ No memory - Each conversation starts fresh
2. 💾 Simple memory - Remember on one server
3. ☁️ Scalable memory - For many users/servers
```

---

## Guardrails Options

### Input Guardrails

| Guardrail | Description | Client Indicator |
|-----------|-------------|------------------|
| Max Length | Limit input size | Default: always add |
| Content Filter | Block inappropriate | "Keep conversations professional" |
| PII Detection | Block sensitive data | "Don't accept personal data" |

### Output Guardrails

| Guardrail | Description | Client Indicator |
|-----------|-------------|------------------|
| No PII | Remove personal info | "Don't expose customer data" |
| Brand Safe | Filter language | "Keep responses professional" |
| Length Limit | Cap response size | "Keep responses concise" |

### Guardrails Question (Optional)

```
Any safety requirements?

1. ✅ Standard (recommended) - Basic protections
2. 🔒 Strict - No PII, professional language only
3. 🚀 Minimal - For trusted environments
```

---

## Output Types

| Type | Description | Client Question | Use Case |
|------|-------------|-----------------|----------|
| Text | Free-form responses | Default | Conversations, Q&A |
| Structured | JSON with schema | "Need specific data format?" | Data extraction, forms |

### Structured Output Fields

Common fields to ask about:

```
What information should the agent extract?

Examples:
- Name, date, time (calendar events)
- Product, quantity, price (orders)
- Issue type, severity, status (tickets)
```

---

## Realtime Voice Configuration

### Voice Options

| Voice | Style | Best For |
|-------|-------|----------|
| alloy | Neutral, balanced | General purpose |
| ash | Warm, natural | Friendly support |
| echo | Clear, articulate | Professional |
| fable | Expressive, dynamic | Storytelling |
| onyx | Deep, authoritative | Announcements |
| nova | Energetic, friendly | Upbeat interactions |
| shimmer | Soft, soothing | Calm support |

### Audio Format Options

| Format | Description | Use Case |
|--------|-------------|----------|
| pcm16 | High quality | Web/mobile apps |
| g711_ulaw | Telephony (US) | Phone systems |
| g711_alaw | Telephony (EU) | Phone systems |

### Turn Detection Options

| Type | Description | Use Case |
|------|-------------|----------|
| semantic_vad | AI-based natural pauses | Conversational |
| server_vad | Simple voice detection | Low latency |

---

## Multi-Agent Patterns

### Common Specialist Types

| Specialist | Description | Triggers |
|------------|-------------|----------|
| Billing | Payment, invoices | "billing", "payment", "invoice" |
| Technical | Tech support | "bug", "error", "technical" |
| Sales | Product, pricing | "pricing", "buy", "product" |
| General | Catch-all | Everything else |

### Handoff Question Template

```
What specialists do you need?

Examples:
- Billing support (payments, invoices)
- Technical support (bugs, errors)
- Sales (pricing, products)
- General inquiries

List your specialists:
```

---

## Deployment Options

| Type | Description | Client Question | Best For |
|------|-------------|-----------------|----------|
| Local | Run on computer | "Run locally?" | Development |
| Docker | Container | "Standard deployment?" | Production |
| Cloud | Managed service | "Cloud hosting?" | Scalable |

### Server Options

| Server | Description | Features |
|--------|-------------|----------|
| FastAPI | HTTP + WebSocket | Recommended |
| None | CLI only | Scripts, testing |

---

## Frontend Options

| Option | Description | Files | Template |
|--------|-------------|-------|----------|
| Full Website | Landing page + chat | 30+ Next.js | `nextjs-chatkit-ui` |
| Chat Widget | Embeddable chat | 5-10 React | `chatkit-react` |
| API Only | No frontend | 0 | None |

### Frontend Question Template

```
Do you need a website/UI to use your agent?

1. 🌐 Yes - Full website with chat (landing page + chat widget)
2. 💬 Yes - Just a chat widget (embed in existing site)
3. 🔌 No - API only (I'll build my own frontend)
```

---

## Capability-to-Config Mapping

Quick reference for mapping client answers to AgentConfig:

| Client Says | Config Key | Config Value |
|-------------|------------|--------------|
| "FAQ bot" | agent_type | "standard" |
| "Voice assistant" | agent_type | "realtime" |
| "Support team" | agent_type | "multi-agent" |
| "Search the web" | tools.hosted | ["web_search"] |
| "Search my docs" | tools.hosted | ["file_search"] |
| "Do calculations" | tools.hosted | ["code_interpreter"] |
| "Create images" | tools.hosted | ["image_generation"] |
| "Remember chats" | memory.type | "sqlite" |
| "Many users" | memory.type | "redis" |
| "No memory" | memory.type | "none" |
| "JSON output" | output.type | "structured" |
| "Docker" | deployment.type | "docker" |
| "Need website" | frontend.needs_frontend | true |

---

## Complete Capabilities Matrix

Use this to understand what combinations are possible:

| Capability | Standard | Realtime | Multi-Agent |
|------------|----------|----------|-------------|
| WebSearchTool | ✅ | ✅ | ✅ |
| FileSearchTool | ✅ | ✅ | ✅ |
| CodeInterpreterTool | ✅ | ❌ | ✅ |
| ImageGenerationTool | ✅ | ❌ | ✅ |
| ComputerTool | ✅ | ❌ | ✅ |
| Custom Tools | ✅ | ✅ | ✅ |
| MCP Servers | ✅ | ❌ | ✅ |
| SQLiteSession | ✅ | ❌ | ✅ |
| RedisSession | ✅ | ❌ | ✅ |
| Structured Output | ✅ | ❌ | ✅ |
| Input Guardrails | ✅ | ✅ | ✅ |
| Output Guardrails | ✅ | ✅ | ✅ |
| Handoffs | ✅ | ✅ | ✅ (required) |
| Voice | ❌ | ✅ | ❌ (use realtime specialists) |
