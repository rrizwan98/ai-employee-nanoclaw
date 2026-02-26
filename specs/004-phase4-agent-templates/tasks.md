# Phase 4: Agent Templates - Implementation Tasks

## Overview

Detailed tasks for implementing 6 OpenAI Agents SDK templates.

**Status**: Ready for Implementation

---

## Phase A: Template Infrastructure

### T001: Create templates directory structure

**Priority**: P0
**Estimate**: XS
**Files**: `nanoclaw/container/templates/`

**Implementation**:
```bash
mkdir -p nanoclaw/container/templates/{basic-chatbot,customer-support,data-processor,multi-agent-system,rag-assistant,task-automation}
```

**Acceptance Criteria**:
- [x] All 6 template directories created
- [x] Directory accessible inside container

---

### T002: Create metadata.json schema and examples

**Priority**: P0
**Estimate**: S
**File**: `nanoclaw/container/templates/*/metadata.json`

**Implementation**:
Create metadata.json for each template with:
```json
{
  "name": "template-name",
  "displayName": "Template Display Name",
  "description": "Template description",
  "version": "1.0.0",
  "agents": ["agent1", "agent2"],
  "patterns": ["handoffs"],
  "sdkFeatures": ["handoffs", "guardrails"],
  "useCases": ["use case 1"],
  "keywords": ["keyword1", "keyword2"],
  "complexity": "simple|medium|complex",
  "files": [],
  "variables": []
}
```

**Acceptance Criteria**:
- [x] All 6 templates have metadata.json
- [x] Schema consistent across templates
- [x] Keywords comprehensive for matching

---

### T003: Create TemplateManager utility

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/container/templates/template_manager.py`

**Implementation**:
```python
import os
import json
from pathlib import Path
from typing import List, Dict, Optional

TEMPLATES_DIR = Path(__file__).parent

class TemplateMetadata:
    name: str
    displayName: str
    keywords: List[str]
    # ... other fields

class TemplateManager:
    def __init__(self):
        self.templates_dir = TEMPLATES_DIR
        self._load_templates()

    def _load_templates(self):
        """Load all template metadata"""
        self.templates = {}
        for template_dir in self.templates_dir.iterdir():
            if template_dir.is_dir():
                metadata_path = template_dir / "metadata.json"
                if metadata_path.exists():
                    with open(metadata_path) as f:
                        self.templates[template_dir.name] = json.load(f)

    def list_templates(self) -> List[Dict]:
        """Return list of available templates"""
        return list(self.templates.values())

    def match_template(self, request: str) -> Optional[str]:
        """Match request to best template using keywords"""
        request_lower = request.lower()
        best_match = None
        best_score = 0

        for name, metadata in self.templates.items():
            score = sum(1 for kw in metadata.get("keywords", []) if kw in request_lower)
            if score > best_score:
                best_score = score
                best_match = name

        return best_match if best_score >= 2 else None

    def load_template(self, name: str) -> Dict:
        """Load template files and metadata"""
        template_dir = self.templates_dir / name
        if not template_dir.exists():
            raise ValueError(f"Template {name} not found")

        metadata = self.templates[name]
        files = {}

        for file_info in metadata.get("files", []):
            template_path = template_dir / file_info["template"]
            if template_path.exists():
                with open(template_path) as f:
                    files[file_info["path"]] = f.read()

        return {"metadata": metadata, "files": files}

    def customize(self, template: Dict, variables: Dict[str, str]) -> Dict[str, str]:
        """Apply variable substitutions to template files"""
        customized = {}
        for path, content in template["files"].items():
            for var_name, var_value in variables.items():
                content = content.replace(f"{{{{{var_name}}}}}", var_value)
            customized[path] = content
        return customized
```

**Acceptance Criteria**:
- [x] list_templates() returns all 6 templates
- [x] match_template() correctly identifies templates
- [x] load_template() loads all template files
- [x] customize() replaces all placeholders

---

## Phase B: Core Templates (P0)

### T004: Implement basic-chatbot template

**Priority**: P0
**Estimate**: M
**Directory**: `nanoclaw/container/templates/basic-chatbot/`

**Files to Create**:

1. **metadata.json**:
```json
{
  "name": "basic-chatbot",
  "displayName": "Basic Chatbot",
  "description": "Single agent chatbot with optional memory and tools",
  "version": "1.0.0",
  "agents": ["chatbot"],
  "patterns": ["single-agent"],
  "sdkFeatures": ["sessions", "tools"],
  "useCases": ["FAQ bot", "simple assistant", "conversational interface"],
  "keywords": ["faq", "chatbot", "assistant", "simple", "basic", "bot", "conversation"],
  "complexity": "simple",
  "files": [
    {"path": "main.py", "template": "main.py.template"},
    {"path": "config.py", "template": "config.py.template"},
    {"path": "requirements.txt", "template": "requirements.txt"},
    {"path": ".env.example", "template": ".env.example"},
    {"path": "Dockerfile", "template": "Dockerfile"},
    {"path": "README.md", "template": "README.md.template"}
  ],
  "variables": [
    {"name": "AGENT_NAME", "description": "Name of the chatbot", "required": true},
    {"name": "DOMAIN", "description": "Client domain/industry", "required": true},
    {"name": "INSTRUCTIONS", "description": "Custom instructions", "required": true},
    {"name": "USE_MEMORY", "description": "Enable SQLiteSession", "default": "true"},
    {"name": "USE_WEB_SEARCH", "description": "Enable WebSearchTool", "default": "false"}
  ]
}
```

2. **main.py.template**:
```python
"""
{{AGENT_NAME}} - {{DOMAIN}} Chatbot
Generated by AI Employee using OpenAI Agents SDK
"""
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents import Agent, Runner, SQLiteSession, WebSearchTool
from config import settings

app = FastAPI(title="{{AGENT_NAME}}")

# Agent definition
agent = Agent(
    name="{{AGENT_NAME}}",
    instructions="""{{INSTRUCTIONS}}""",
    tools=[WebSearchTool()] if settings.USE_WEB_SEARCH else [],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    session_id: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        session = SQLiteSession(request.session_id) if settings.USE_MEMORY else None
        result = await Runner.run(agent, request.message, session=session)
        return ChatResponse(
            response=result.final_output,
            session_id=request.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "agent": "{{AGENT_NAME}}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

3. **config.py.template**, **requirements.txt**, **.env.example**, **Dockerfile**, **README.md.template**

**Acceptance Criteria**:
- [x] All template files created
- [x] Generated code runs without errors
- [x] FastAPI server starts successfully
- [x] Chat endpoint works correctly

---

### T005: Implement customer-support template

**Priority**: P0
**Estimate**: L
**Directory**: `nanoclaw/container/templates/customer-support/`

**Files to Create**:

1. **metadata.json** (with keywords: support, customer, help, service, ticket, helpdesk)

2. **main.py.template** - FastAPI server with WebSocket support

3. **agents/triage.py.template**:
```python
from agents import Agent
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
from .billing import billing_agent
from .technical import technical_agent
from .general import general_agent

triage_agent = Agent(
    name="{{DOMAIN}} Support Triage",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are the first point of contact for {{DOMAIN}} customer support.

    Your role:
    1. Greet the customer professionally
    2. Understand their issue
    3. Route to the appropriate specialist:
       - Billing issues (payments, invoices, refunds) → Billing Agent
       - Technical issues (bugs, errors, how-to) → Technical Agent
       - General questions (info, policies) → General Agent

    Always be empathetic and professional.
    """,
    handoffs=[billing_agent, technical_agent, general_agent],
)
```

4. **agents/billing.py.template**, **agents/technical.py.template**, **agents/general.py.template**

5. **tools/ticket.py.template**:
```python
from agents import function_tool

@function_tool
async def create_ticket(
    customer_id: str,
    issue_type: str,
    description: str,
    priority: str = "normal"
) -> str:
    """Create a support ticket for tracking."""
    # Integration point for ticket system
    ticket_id = f"TKT-{customer_id[:4]}-{hash(description) % 10000:04d}"
    return f"Ticket created: {ticket_id} (Priority: {priority})"

@function_tool
async def escalate_issue(
    ticket_id: str,
    reason: str
) -> str:
    """Escalate a ticket to a human supervisor."""
    return f"Ticket {ticket_id} escalated. Reason: {reason}. A supervisor will contact you within 24 hours."
```

**Acceptance Criteria**:
- [x] All 4 agents defined with proper handoffs
- [x] Triage correctly routes to specialists
- [x] Ticket tools functional
- [x] End-to-end conversation flow works

---

### T006: Implement data-processor template

**Priority**: P1
**Estimate**: M
**Directory**: `nanoclaw/container/templates/data-processor/`

**Key Files**:
- agents/input_validator.py.template
- agents/processor.py.template
- agents/output_formatter.py.template
- models/schemas.py.template (Pydantic models)

**Acceptance Criteria**:
- [ ] Input validation with structured output
- [ ] Processing pipeline works
- [ ] Output formatting correct
- [ ] Error handling implemented

---

### T007: Implement multi-agent-system template

**Priority**: P1
**Estimate**: L
**Directory**: `nanoclaw/container/templates/multi-agent-system/`

**Key Files**:
- agents/orchestrator.py.template (agent-as-tool pattern)
- agents/specialists/*.py.template
- context/shared_context.py.template

**Acceptance Criteria**:
- [ ] Orchestrator invokes specialists as tools
- [ ] Shared context management works
- [ ] Parallel execution supported
- [ ] Scalable structure

---

### T008: Implement rag-assistant template

**Priority**: P1
**Estimate**: M
**Directory**: `nanoclaw/container/templates/rag-assistant/`

**Key Files**:
- agents/rag_agent.py.template (FileSearchTool)
- setup_vectorstore.py (vector store initialization)

**Implementation**:
```python
from agents import Agent, FileSearchTool

rag_agent = Agent(
    name="{{AGENT_NAME}}",
    instructions="""You are a knowledge assistant for {{DOMAIN}}.

    Guidelines:
    1. Search the knowledge base for relevant information
    2. Provide accurate answers based on the documents
    3. Always cite your sources
    4. If information is not found, say so clearly
    """,
    tools=[
        FileSearchTool(
            vector_store_ids=["{{VECTOR_STORE_ID}}"],
            max_num_results={{MAX_RESULTS}},
            include_search_results=True,
        ),
    ],
)
```

**Acceptance Criteria**:
- [ ] FileSearchTool configured correctly
- [ ] Vector store setup documented
- [ ] Citations included in responses
- [ ] README has clear setup instructions

---

### T009: Implement task-automation template

**Priority**: P2
**Estimate**: L
**Directory**: `nanoclaw/container/templates/task-automation/`

**Key Files**:
- agents/planner.py.template
- agents/executor.py.template
- agents/verifier.py.template
- models/task_models.py.template
- scheduler.py.template (optional cron)

**Implementation Pattern**:
```python
# Evaluation loop pattern
async def execute_with_verification(task: str, max_retries: int = 3):
    plan = await Runner.run(planner, task)

    for attempt in range(max_retries):
        result = await execute_plan(plan.final_output)
        verification = await Runner.run(verifier, str(result))

        if verification.final_output.success:
            return result

        # Feedback loop
        feedback = verification.final_output.errors
        plan = await Runner.run(planner, f"{task}\n\nPrevious errors: {feedback}")

    raise Exception("Max retries exceeded")
```

**Acceptance Criteria**:
- [ ] Planner creates structured task plans
- [ ] Executor handles multiple task types
- [ ] Verifier validates results
- [ ] Retry loop works correctly

---

## Phase C: Skill Integration

### T010: Update code-generation skill for template awareness

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/container/skills/code-generation/SKILL.md`

**Implementation**:
Add template detection and selection logic:

```markdown
## Template-Based Generation

### Step 1: Detect Template Match

Analyze client request for template keywords:

| Keywords | Template |
|----------|----------|
| faq, chatbot, assistant, simple | basic-chatbot |
| support, customer, help, service, ticket | customer-support |
| data, process, etl, report, validation | data-processor |
| multi-agent, complex, enterprise, workflow | multi-agent-system |
| rag, knowledge, document, search, qa | rag-assistant |
| automate, task, schedule, batch, workflow | task-automation |

### Step 2: Template Customization Questions

If template matched, ask:
1. Domain/industry name
2. Specific agent names (or use defaults)
3. Required tools
4. Integration needs

### Step 3: Generate from Template

Use mcp__nanoclaw__load_template and mcp__nanoclaw__customize_template tools.

### Step 4: Fallback

If no template matches (confidence < 70%), use custom generation flow.
```

**Acceptance Criteria**:
- [x] Template detection works
- [x] Customization questions asked
- [x] Template generation integrated
- [x] Fallback to custom works

---

### T011: Add template IPC tools

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts`

**Implementation**:
Add tools for template operations:

```typescript
const TEMPLATE_TOOLS = [
  {
    name: 'list_templates',
    description: 'List all available agent templates',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'match_template',
    description: 'Match a client request to the best template',
    inputSchema: {
      type: 'object',
      properties: {
        request: { type: 'string', description: 'Client request text' }
      },
      required: ['request']
    }
  },
  {
    name: 'load_template',
    description: 'Load a specific template',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name' }
      },
      required: ['name']
    }
  },
  {
    name: 'generate_from_template',
    description: 'Generate code from template with customizations',
    inputSchema: {
      type: 'object',
      properties: {
        template_name: { type: 'string' },
        variables: { type: 'object' }
      },
      required: ['template_name', 'variables']
    }
  }
];
```

**Acceptance Criteria**:
- [x] All 4 template tools added
- [x] Tools accessible from skills
- [x] Template generation works end-to-end (host handler added)

---

## Phase D: Testing & Documentation

### T012: Create template tests

**Priority**: P1
**Estimate**: M
**File**: `nanoclaw/scripts/test-templates.ts`

**Test Cases**:
1. Template loading for all 6 templates
2. Keyword matching accuracy
3. Variable substitution
4. Generated code syntax validation
5. End-to-end generation test

**Acceptance Criteria**:
- [x] All templates load correctly
- [x] Matching tests pass
- [x] Generated code is valid Python

---

### T013: Update documentation

**Priority**: P1
**Estimate**: S
**Files**: Various README.md files

**Updates Needed**:
1. Main README - add template section
2. Each template README - usage instructions
3. Skill documentation - template workflow
4. CLAUDE.md - template capabilities

**Acceptance Criteria**:
- [x] Template usage documented
- [x] Each template has setup guide (via README.md.template)
- [x] Examples provided

---

## Task Dependencies

```
T001 (directories)
    │
    ├──▶ T002 (metadata) ──▶ T003 (TemplateManager)
    │                              │
    │                              ▼
    │                    ┌─────────────────────┐
    │                    │   T004-T009         │
    │                    │   (6 Templates)     │
    │                    └─────────────────────┘
    │                              │
    └──▶ T010 (skill update) ◀─────┘
              │
              ▼
         T011 (IPC tools)
              │
              ▼
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
T012 (tests)      T013 (docs)
```

---

## Summary

| Phase | Tasks | Priority | Estimate |
|-------|-------|----------|----------|
| A: Infrastructure | T001-T003 | P0 | S+M |
| B: Core Templates | T004-T005 | P0 | M+L |
| B: Advanced Templates | T006-T009 | P1-P2 | M+L+M+L |
| C: Integration | T010-T011 | P0 | M+M |
| D: Testing & Docs | T012-T013 | P1 | M+S |

**Total Tasks**: 13
**Critical Path**: T001 → T002 → T003 → T004 → T010 → T011

---

## Implementation Notes

**OpenAI Agents SDK Version**: v0.7.0+

**Key SDK Features Used**:
- `Agent` with `handoffs`, `tools`, `output_type`
- `handoff()` function with callbacks
- `RECOMMENDED_PROMPT_PREFIX` for handoff awareness
- `FileSearchTool` with `vector_store_ids`
- `SQLiteSession` for memory
- `@function_tool` decorator
- `Runner.run()` async execution
- `InputGuardrail`, `OutputGuardrail`

**References**:
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Handoffs](https://openai.github.io/openai-agents-python/handoffs/)
- [Multi-Agent](https://openai.github.io/openai-agents-python/multi_agent/)
- [Tools](https://openai.github.io/openai-agents-python/tools/)
