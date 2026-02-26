# AI Employee Plan: Agent Builder Assistant

## Overview

WhatsApp-based AI Employee jo clients ke liye **General Purpose** custom AI Agents banata hai using OpenAI Agent SDK.

**Key Decisions:**
- **Domain**: General Purpose (koi bhi type ka agent)
- **Delivery**: Code files WhatsApp pe bhejenge
- **Billing**: Abhi nahi, baad mein add karenge

**Architecture**: NanoClaw (Body) + Claude Agent SDK (Brain) + OpenAI Agents SDK (Orchestrator)

---

## 6-Layer Architecture Implementation

```
Layer 6: Body          → NanoClaw (WhatsApp integration)
Layer 5: Orchestrator  → OpenAI Agents SDK (multi-agent routing)
Layer 4: Brain         → Claude Agent SDK (reasoning)
Layer 3: Intelligence  → Agent Skills + MCP Servers
Layer 2: Data          → PostgreSQL + Redis + File Storage
Layer 1: Security      → Container isolation
```

---

## Phase 1: Foundation Setup

### 1.1 NanoClaw Installation (Body)
- [ ] NanoClaw repository clone karna
- [ ] Claude Code se `/setup` run karna
- [ ] WhatsApp integration configure karna (@whiskeysockets/baileys)
- [ ] Container isolation verify karna (Docker/Apple Containers)
- [ ] Per-group memory setup (har client ka alag CLAUDE.md)

### 1.2 Directory Structure
```
junior-nanoclaw/
├── .claude/
│   ├── skills/                    # Agent Skills
│   │   ├── agent-builder/         # Main agent building skill
│   │   ├── client-communication/  # WhatsApp conversation handling
│   │   ├── requirements-gathering/# Client requirements samajhna
│   │   └── code-generation/       # Agent code generate karna
│   └── CLAUDE.md                  # Global memory
├── mcp-servers/                   # MCP Tool Servers
│   ├── agent_factory.py           # Agent generation tools
│   ├── template_manager.py        # Agent templates
│   └── deployment_helper.py       # Deployment tools
├── templates/                     # Agent Templates
│   ├── basic-chatbot/
│   ├── customer-support/
│   ├── data-processor/
│   └── multi-agent-system/
├── client-agents/                 # Generated agents storage
│   └── {client_id}/
│       ├── agent/
│       ├── config/
│       └── docs/
└── data/
    ├── clients.db                 # Client information
    ├── conversations/             # Conversation history
    └── deployments/               # Deployment records
```

---

## Phase 2: Agent Skills Development

### 2.1 Core Skill: agent-builder
```markdown
# .claude/skills/agent-builder/SKILL.md

name: agent-builder
description: >
  Use when client wants to create a new AI agent.
  Handles requirements gathering, architecture design,
  code generation, and deployment assistance.

## Workflow
1. Client requirements samjho (domain, features, integrations)
2. Suitable template select karo
3. OpenAI Agents SDK structure generate karo
4. MCP servers define karo agar zaroorat ho
5. Code generate karo with proper handoffs
6. Testing instructions provide karo
7. Deployment guide do
```

### 2.2 Skill: client-communication
```markdown
# .claude/skills/client-communication/SKILL.md

name: client-communication
description: >
  WhatsApp pe client communication handle karna.
  Professional tone, Urdu/English support.

## Rules
- Friendly lekin professional raho
- Technical terms explain karo simple words mein
- Progress updates dete raho
- Confirmations lo har major step pe
```

### 2.3 Skill: requirements-gathering
```markdown
# .claude/skills/requirements-gathering/SKILL.md

name: requirements-gathering
description: >
  Client se agent requirements gather karna
  through structured conversation.

## Questions to Ask
1. Agent ka purpose kya hai?
2. Kis platform pe deploy karna hai?
3. Kaunsi APIs/integrations chahiye?
4. Multi-agent ya single agent?
5. Koi specific compliance requirements?
6. Budget/hosting preferences?
```

### 2.4 Skill: code-generation
```markdown
# .claude/skills/code-generation/SKILL.md

name: code-generation
description: >
  OpenAI Agents SDK code generate karna
  based on client requirements.

## Standards
- OpenAI Agents SDK patterns follow karo
- Proper type hints use karo
- Error handling include karo
- Handoffs properly define karo
- Guardrails implement karo
```

---

## Phase 3: MCP Servers Development

### 3.1 agent_factory.py (Core Tool Server)
```python
# Tools to include:
- create_agent_project()      # New project scaffold
- add_agent_to_project()      # Add specialist agent
- define_handoff()            # Agent handoffs setup
- add_guardrail()             # Safety guardrails
- generate_agent_code()       # Final code generation
- validate_agent_structure()  # Structure validation
```

### 3.2 template_manager.py
```python
# Tools to include:
- list_templates()            # Available templates
- get_template_details()      # Template info
- customize_template()        # Template modification
- create_custom_template()    # New template from scratch
```

### 3.3 deployment_helper.py
```python
# Tools to include:
- generate_dockerfile()       # Docker setup
- create_requirements_txt()   # Dependencies
- generate_env_template()     # Environment variables
- create_deployment_guide()   # Step-by-step guide
- estimate_hosting_cost()     # Cost estimation
```

---

## Phase 4: General Purpose Agent Templates

### 4.1 Basic Chatbot Template
- Single agent structure
- Simple conversation handling
- Basic memory/context
- **Use case**: FAQ bot, simple assistant

### 4.2 Customer Support Template
- Triage agent
- Specialist agents (billing, technical, general)
- Escalation handoffs
- Ticket creation integration
- **Use case**: Support desk, helpdesk

### 4.3 Data Processor Template
- Input validation agent
- Processing agent
- Output formatting agent
- Error handling
- **Use case**: Data entry, report generation

### 4.4 Multi-Agent System Template
- Orchestrator agent
- Multiple specialist agents
- Complex handoff patterns
- Shared context management
- **Use case**: Complex workflows, enterprise systems

### 4.5 RAG Assistant Template
- Document ingestion agent
- Query understanding agent
- Response generation agent
- **Use case**: Knowledge base, document Q&A

### 4.6 Task Automation Template
- Task planner agent
- Executor agents
- Verification agent
- **Use case**: Workflow automation, scheduled tasks

---

## Phase 5: Conversation Flow Design

### 5.1 Initial Contact
```
Client: "Mujhe ek AI agent banwana hai"
Employee: "Zaroor! Kuch sawaal poochta hoon:
          1. Agent ka main purpose kya hoga?
          2. Kis cheez mein madad karega?"
```

### 5.2 Requirements Phase
```
Employee: "Samajh gaya. Ab batao:
          - Kaunsi APIs connect karni hain?
          - Single agent ya team chahiye?
          - Koi security requirements?"
```

### 5.3 Design Phase
```
Employee: "Ye raha proposed design:
          [Architecture diagram description]
          Agree ho to code generate karta hoon."
```

### 5.4 Generation Phase
```
Employee: "Code ready hai! Files bhej raha hoon:
          1. main.py (main agent code)
          2. agents.py (agent definitions)
          3. requirements.txt
          4. README.md (setup guide)
          5. .env.example

          [Files as WhatsApp documents]"
```

### 5.5 File Delivery (WhatsApp)
```
- Zip file create karo with all code
- WhatsApp document ke tor pe bhejo
- Setup instructions text mein bhi do
- Video tutorial link (optional)
```

### 5.6 Support Phase
```
Employee: "Koi issues hain to batao.
          Testing mein help chahiye?"
```

---

## Phase 6: Data Layer Setup

### 6.1 SQLite/PostgreSQL Schema
```sql
-- Clients table
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    whatsapp_number TEXT,
    name TEXT,
    created_at TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    name TEXT,
    status TEXT,
    requirements JSON,
    created_at TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    project_id TEXT,
    messages JSON,
    updated_at TIMESTAMP
);
```

### 6.2 File Storage
- Generated agents: `client-agents/{client_id}/`
- Templates: `templates/`
- Conversation logs: `data/conversations/`

---

## Phase 7: Security Implementation

### 7.1 Container Isolation
- Har agent generation task alag container mein
- Client data isolated
- No cross-client data access

### 7.2 Programmatic Tool Calling
- Sensitive data container ke andar process
- Generated code scan karo vulnerabilities ke liye
- API keys kabhi log na hon

### 7.3 Audit Logging
- Har action log karo
- Client requests track karo
- Generated code history rakho

---

## Phase 8: OpenAI Agents SDK Integration

### 8.1 Main Orchestrator Agent
```
AgentBuilderOrchestrator
├── handles: initial conversation, routing
├── handoffs_to: [RequirementsAgent, DesignAgent, CodeGenAgent]
└── guardrails: [InputValidator, ContentFilter]
```

### 8.2 Specialist Agents
```
RequirementsAgent
├── purpose: Requirements gathering
└── tools: [ask_questions, validate_requirements, save_requirements]

DesignAgent
├── purpose: Architecture design
└── tools: [select_template, design_architecture, create_diagram]

CodeGenAgent
├── purpose: Code generation
└── tools: [generate_code, validate_code, create_files]

DeploymentAgent
├── purpose: Deployment assistance
└── tools: [create_dockerfile, generate_docs, estimate_costs]
```

### 8.3 Handoff Pattern
```
Client Message → Orchestrator → Route to Specialist
                     ↓
              Specialist completes task
                     ↓
              Handoff back to Orchestrator
                     ↓
              Response to Client via WhatsApp
```

---

## Implementation Order

### Week 1-2: Foundation
1. NanoClaw setup + WhatsApp connection
2. Basic directory structure
3. SQLite database setup

### Week 3-4: Skills Development
1. agent-builder skill
2. client-communication skill
3. requirements-gathering skill
4. code-generation skill

### Week 5-6: MCP Servers
1. agent_factory.py server
2. template_manager.py server
3. deployment_helper.py server

### Week 7-8: Templates
1. Basic chatbot template
2. Customer support template
3. Multi-agent template

### Week 9-10: Integration
1. OpenAI Agents SDK orchestration
2. Handoff implementation
3. End-to-end testing

### Week 11-12: Polish
1. Error handling improvement
2. Security hardening
3. Documentation
4. Client testing

---

## Files to Create

### Core Files
1. `.claude/skills/agent-builder/SKILL.md`
2. `.claude/skills/client-communication/SKILL.md`
3. `.claude/skills/requirements-gathering/SKILL.md`
4. `.claude/skills/code-generation/SKILL.md`
5. `mcp-servers/agent_factory.py`
6. `mcp-servers/template_manager.py`
7. `mcp-servers/deployment_helper.py`

### Configuration
8. `nanoclaw.config.ts` (NanoClaw configuration)
9. `.env.example` (environment variables)
10. `docker-compose.yml` (development setup)

### Templates
11. `templates/basic-chatbot/` (basic template)
12. `templates/customer-support/` (support template)
13. `templates/multi-agent/` (complex template)

### Database
14. `data/schema.sql` (database schema)

### Documentation
15. `README.md` (setup instructions)

---

## Success Criteria

1. WhatsApp se smoothly baat ho sake
2. Requirements properly gather ho jayein
3. Working agent code generate ho
4. Deployment guide complete ho
5. Client apne server pe deploy kar sake
6. Security vulnerabilities na hon
