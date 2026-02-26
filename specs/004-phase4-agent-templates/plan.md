# Phase 4: Agent Templates - Implementation Plan

## Overview

Implementation plan for creating 6 OpenAI Agents SDK templates that enable rapid agent generation.

---

## Architecture Decisions

### AD-1: Template Storage Location

**Decision**: Store templates in `nanoclaw/container/templates/`

**Rationale**:
- Templates need to be accessible inside container (where code-generation runs)
- Keeps templates separate from skills
- Allows easy template updates without affecting core code

**Alternatives Considered**:
- `templates/` at project root - not accessible in container
- Inside `skills/code-generation/` - too tightly coupled

---

### AD-2: Template Format

**Decision**: Use `.template` extension with placeholder syntax `{{VARIABLE}}`

**Rationale**:
- Simple string replacement
- Human-readable templates
- Easy to maintain and update

**Template Variables**:
```
{{AGENT_NAME}}        - Custom agent name
{{DOMAIN}}            - Client's domain/industry
{{INSTRUCTIONS}}      - Customized instructions
{{TOOLS}}             - Selected tools list
{{HANDOFFS}}          - Handoff configuration
{{OUTPUT_TYPE}}       - Pydantic model name
```

---

### AD-3: Template Selection Mechanism

**Decision**: Keyword matching in code-generation skill

**Rationale**:
- Skill already handles code generation
- Natural language understanding via Claude
- Can fallback to custom generation if no match

**Flow**:
```
1. Client request analyzed
2. Keywords extracted
3. Match against template metadata
4. If match > 70% confidence → use template
5. If no match → custom generation (existing flow)
```

---

### AD-4: Template Customization Approach

**Decision**: Two-phase customization (questions + generation)

**Phase 1 - Gather Requirements**:
- Domain/industry
- Specific agent names
- Tools needed
- Integration requirements

**Phase 2 - Apply to Template**:
- Replace placeholders
- Add/remove optional sections
- Configure environment variables

---

## Component Design

### C1: Template Manager Module

**Location**: `nanoclaw/container/templates/template-manager.py`

**Responsibilities**:
- List available templates
- Load template metadata
- Match request to template
- Apply customizations
- Generate final code

```python
class TemplateManager:
    def list_templates() -> List[TemplateMetadata]
    def match_template(request: str) -> Optional[str]
    def load_template(name: str) -> Template
    def customize(template: Template, config: Dict) -> GeneratedCode
```

---

### C2: Template Metadata Schema

**File**: `metadata.json` in each template directory

```json
{
  "name": "string",
  "displayName": "string",
  "description": "string",
  "version": "1.0.0",
  "agents": ["agent1", "agent2"],
  "patterns": ["handoffs", "orchestrator"],
  "sdkFeatures": ["handoffs", "guardrails", "sessions"],
  "useCases": ["use case 1", "use case 2"],
  "keywords": ["keyword1", "keyword2"],
  "complexity": "simple|medium|complex",
  "files": [
    {"path": "main.py", "template": "main.py.template"},
    {"path": "agents/triage.py", "template": "agents/triage.py.template"}
  ],
  "variables": [
    {"name": "DOMAIN", "description": "Client domain", "required": true},
    {"name": "AGENT_PREFIX", "description": "Prefix for agent names", "default": ""}
  ]
}
```

---

### C3: Skill Integration

**Update**: `code-generation/SKILL.md`

Add template-aware workflow:

```markdown
## Template-Based Generation

When client request matches a template:

1. Identify template match using keywords
2. Ask template-specific questions
3. Load template files
4. Apply customizations
5. Generate final code structure
6. Push to GitHub (if enabled)

### Template Detection

Look for these patterns:
- "FAQ bot" / "chatbot" / "assistant" → basic-chatbot
- "customer support" / "helpdesk" → customer-support
- "data processing" / "ETL" / "reports" → data-processor
- "multi-agent" / "complex workflow" → multi-agent-system
- "knowledge base" / "RAG" / "document search" → rag-assistant
- "automation" / "scheduled tasks" → task-automation
```

---

## Template Specifications

### T1: basic-chatbot

**Files**:
```
basic-chatbot/
├── metadata.json
├── main.py.template
├── config.py.template
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md.template
```

**Key Code Pattern**:
```python
from agents import Agent, Runner, SQLiteSession

agent = Agent(
    name="{{AGENT_NAME}}",
    instructions="""{{INSTRUCTIONS}}""",
    tools=[{{TOOLS}}],
)

async def chat(message: str, session_id: str):
    session = SQLiteSession(session_id)
    result = await Runner.run(agent, message, session=session)
    return result.final_output
```

---

### T2: customer-support

**Files**:
```
customer-support/
├── metadata.json
├── main.py.template
├── agents/
│   ├── __init__.py
│   ├── triage.py.template
│   ├── billing.py.template
│   ├── technical.py.template
│   └── general.py.template
├── tools/
│   └── ticket.py.template
├── config.py.template
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md.template
```

**Key Code Pattern**:
```python
from agents import Agent, handoff
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

billing_agent = Agent(
    name="{{DOMAIN}} Billing",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle billing inquiries for {{DOMAIN}}. {{BILLING_INSTRUCTIONS}}""",
    handoff_description="Handles billing, payments, invoices",
)

triage_agent = Agent(
    name="{{DOMAIN}} Support",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are the first point of contact for {{DOMAIN}} support.
    Route to appropriate specialist based on the inquiry.""",
    handoffs=[billing_agent, technical_agent, general_agent],
)
```

---

### T3: data-processor

**Files**:
```
data-processor/
├── metadata.json
├── main.py.template
├── agents/
│   ├── input_validator.py.template
│   ├── processor.py.template
│   └── output_formatter.py.template
├── models/
│   └── schemas.py.template
├── tools/
│   └── data_tools.py.template
├── config.py.template
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md.template
```

**Key Code Pattern**:
```python
from pydantic import BaseModel
from agents import Agent, Runner

class {{INPUT_MODEL}}(BaseModel):
    {{INPUT_FIELDS}}

class {{OUTPUT_MODEL}}(BaseModel):
    {{OUTPUT_FIELDS}}

validator = Agent(
    name="Input Validator",
    instructions="Validate and clean input data",
    output_type={{INPUT_MODEL}},
)

processor = Agent(
    name="Data Processor",
    instructions="Process validated data",
    output_type={{OUTPUT_MODEL}},
)

# Code-based orchestration
async def process_data(raw_input: str):
    validated = await Runner.run(validator, raw_input)
    processed = await Runner.run(processor, str(validated.final_output))
    return processed.final_output
```

---

### T4: multi-agent-system

**Files**:
```
multi-agent-system/
├── metadata.json
├── main.py.template
├── agents/
│   ├── orchestrator.py.template
│   └── specialists/
│       ├── __init__.py
│       └── specialist.py.template
├── context/
│   └── shared_context.py.template
├── tools/
│   └── shared_tools.py.template
├── config.py.template
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md.template
```

**Key Code Pattern**:
```python
from agents import Agent, Runner, function_tool

# Specialist as tool
@function_tool
async def call_{{SPECIALIST_NAME}}(query: str, ctx) -> str:
    """{{SPECIALIST_DESCRIPTION}}"""
    result = await Runner.run({{SPECIALIST_NAME}}_agent, query, context=ctx.context)
    return result.final_output

orchestrator = Agent(
    name="{{ORCHESTRATOR_NAME}}",
    instructions="""You coordinate multiple specialists.
    Use the appropriate specialist tool for each task.""",
    tools=[call_{{SPECIALIST_NAME}}, ...],
)
```

---

### T5: rag-assistant

**Files**:
```
rag-assistant/
├── metadata.json
├── main.py.template
├── agents/
│   └── rag_agent.py.template
├── tools/
│   └── document_tools.py.template
├── setup_vectorstore.py
├── config.py.template
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md.template
```

**Key Code Pattern**:
```python
from agents import Agent, Runner, FileSearchTool

rag_agent = Agent(
    name="{{AGENT_NAME}}",
    instructions="""You are a knowledge assistant for {{DOMAIN}}.
    Use the file search tool to find relevant information.
    Always cite your sources.""",
    tools=[
        FileSearchTool(
            vector_store_ids=["{{VECTOR_STORE_ID}}"],
            max_num_results={{MAX_RESULTS}},
            include_search_results=True,
        ),
    ],
)
```

---

### T6: task-automation

**Files**:
```
task-automation/
├── metadata.json
├── main.py.template
├── agents/
│   ├── planner.py.template
│   ├── executor.py.template
│   └── verifier.py.template
├── models/
│   └── task_models.py.template
├── tools/
│   └── execution_tools.py.template
├── scheduler.py.template
├── config.py.template
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md.template
```

**Key Code Pattern**:
```python
from pydantic import BaseModel
from agents import Agent, Runner

class TaskPlan(BaseModel):
    steps: list[str]
    estimated_time: str

class TaskResult(BaseModel):
    success: bool
    output: str
    errors: list[str] = []

planner = Agent(
    name="Task Planner",
    instructions="Break down tasks into executable steps",
    output_type=TaskPlan,
)

verifier = Agent(
    name="Result Verifier",
    instructions="Verify task results meet requirements",
    output_type=TaskResult,
)

# Evaluation loop
async def execute_with_verification(task: str):
    plan = await Runner.run(planner, task)
    result = await execute_plan(plan.final_output)

    while True:
        verification = await Runner.run(verifier, str(result))
        if verification.final_output.success:
            return result
        # Re-execute with feedback
        result = await execute_plan(plan.final_output, feedback=verification.final_output.errors)
```

---

## Implementation Phases

### Phase A: Template Infrastructure

1. Create `templates/` directory structure
2. Create `metadata.json` schema
3. Implement TemplateManager class
4. Add template listing to skill

### Phase B: Core Templates (P0)

1. Implement basic-chatbot template
2. Implement customer-support template
3. Test template generation end-to-end

### Phase C: Advanced Templates (P1)

1. Implement data-processor template
2. Implement multi-agent-system template
3. Implement rag-assistant template

### Phase D: Automation Template (P2)

1. Implement task-automation template
2. Add scheduling support
3. Test verification loop

### Phase E: Integration

1. Update code-generation skill
2. Add template detection logic
3. Test full workflow via WhatsApp
4. Update documentation

---

## Testing Strategy

### Unit Tests

- Template loading
- Placeholder replacement
- Metadata parsing

### Integration Tests

- Template selection from natural language
- Full code generation from template
- GitHub push of generated code

### End-to-End Tests

- WhatsApp conversation → Template selection → Code generation → GitHub push
- Each template type tested with sample request

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template mismatch | Medium | Fallback to custom generation |
| Outdated SDK patterns | High | Version templates, regular updates |
| Complex customization | Medium | Clear variable documentation |
| Template maintenance | Medium | Modular template structure |

---

## Success Criteria

1. All 6 templates implemented and tested
2. Template selection accuracy > 90%
3. Generation time < 2 minutes for template-based
4. Generated code runs without modifications
5. Clear documentation for each template
