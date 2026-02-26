# Feature Specification: Phase 4 Agent Templates

**Feature Branch**: `004-phase4-agent-templates`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Phase 4 Agent Templates - Create 6 pre-built OpenAI Agents SDK templates for rapid agent generation"

## Overview

This phase creates 6 production-ready agent templates that transform the AI Employee into an "Agent Factory". Each template provides pre-built multi-agent patterns using OpenAI Agents SDK, enabling 1-2 minute agent generation vs 5-10 minutes for custom builds.

### Template Architecture

Each template follows OpenAI Agents SDK best practices:

| Pattern | Description | SDK Feature |
|---------|-------------|-------------|
| **Handoffs** | Agent-to-agent delegation | `handoffs=[agent1, agent2]` |
| **Orchestrator** | Central manager with sub-agents | Agent-as-tool pattern |
| **Structured Output** | Type-safe responses | `output_type=PydanticModel` |
| **Guardrails** | Input/output validation | `InputGuardrail`, `OutputGuardrail` |
| **Tools** | Built-in + custom tools | `WebSearchTool`, `FileSearchTool`, `@function_tool` |
| **Sessions** | Conversation persistence | `SQLiteSession`, `RedisSession` |

---

## 6 Templates Specification

### Template 1: Basic Chatbot (Priority: P0)

**Structure**: Single Agent
**Use Case**: FAQ bot, simple assistant, conversational interface

```
┌─────────────────────────────┐
│      Basic Chatbot Agent    │
│  ┌───────────────────────┐  │
│  │ Instructions          │  │
│  │ Tools (optional)      │  │
│  │ Memory (SQLiteSession)│  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Files Generated**:
- `main.py` - Agent definition + FastAPI server
- `config.py` - Configuration settings
- `requirements.txt` - Dependencies
- `.env.example` - Environment variables
- `README.md` - Setup instructions

**SDK Features Used**:
- `Agent` with custom instructions
- `SQLiteSession` for memory
- Optional `WebSearchTool`
- `Runner.run()` for execution

---

### Template 2: Customer Support (Priority: P0)

**Structure**: Triage Agent + 3 Specialist Agents
**Use Case**: Support desk, helpdesk, customer service

```
┌─────────────────────────────────────────────────┐
│                  Triage Agent                    │
│  "Route to appropriate specialist"               │
│                                                  │
│  handoffs=[billing, technical, general]          │
└──────────────┬───────────────┬──────────────────┘
               │               │
    ┌──────────▼───┐   ┌───────▼────────┐   ┌─────────────┐
    │ Billing Agent │   │ Technical Agent│   │General Agent│
    │ Payment issues│   │ Troubleshooting│   │ FAQ/General │
    │ Invoice help  │   │ Bug reports    │   │ Information │
    └───────────────┘   └────────────────┘   └─────────────┘
```

**Files Generated**:
- `main.py` - FastAPI server with WebSocket
- `agents/triage.py` - Triage agent with handoffs
- `agents/billing.py` - Billing specialist
- `agents/technical.py` - Technical specialist
- `agents/general.py` - General inquiries
- `tools/ticket.py` - Ticket creation tool
- `config.py` - Configuration
- `requirements.txt` - Dependencies
- `.env.example` - Environment variables
- `README.md` - Setup instructions

**SDK Features Used**:
- `handoffs=[billing_agent, technical_agent, general_agent]`
- `handoff_description` for routing hints
- `RECOMMENDED_PROMPT_PREFIX` for handoff awareness
- `on_handoff` callbacks for logging
- Optional escalation with `EscalationData` input type

---

### Template 3: Data Processor (Priority: P1)

**Structure**: Input Validator → Processor → Output Formatter
**Use Case**: Data entry, report generation, ETL pipelines

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Input Agent    │────▶│ Processing Agent│────▶│  Output Agent   │
│                 │     │                 │     │                 │
│ - Validate data │     │ - Transform     │     │ - Format output │
│ - Check schema  │     │ - Calculate     │     │ - Generate report│
│ - Clean input   │     │ - Aggregate     │     │ - Export data   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Files Generated**:
- `main.py` - Pipeline orchestration
- `agents/input_validator.py` - Data validation agent
- `agents/processor.py` - Data processing agent
- `agents/output_formatter.py` - Output formatting agent
- `models/schemas.py` - Pydantic data models
- `tools/data_tools.py` - Data manipulation tools
- `config.py` - Configuration
- `requirements.txt` - Dependencies
- `.env.example` - Environment variables
- `README.md` - Setup instructions

**SDK Features Used**:
- `output_type=ValidatedData` for structured input
- `output_type=ProcessedResult` for processing
- `output_type=FormattedOutput` for final output
- Code-based orchestration (chaining agents)
- `InputGuardrail` for data validation

---

### Template 4: Multi-Agent System (Priority: P1)

**Structure**: Orchestrator + Multiple Specialist Agents
**Use Case**: Complex workflows, enterprise systems, modular architecture

```
┌───────────────────────────────────────────────────────┐
│                   Orchestrator Agent                   │
│  "Coordinate specialists and manage workflow"          │
│                                                        │
│  Uses agents as tools (maintains control)              │
└────────────┬─────────────┬─────────────┬──────────────┘
             │             │             │
    ┌────────▼───┐  ┌──────▼─────┐  ┌────▼────────┐
    │ Specialist │  │ Specialist │  │ Specialist  │
    │ Agent A    │  │ Agent B    │  │ Agent C     │
    │ (Research) │  │ (Analysis) │  │ (Reporting) │
    └────────────┘  └────────────┘  └─────────────┘
```

**Files Generated**:
- `main.py` - FastAPI server
- `agents/orchestrator.py` - Central coordinator
- `agents/specialists/` - Directory for specialist agents
- `tools/shared_tools.py` - Common tools
- `context/shared_context.py` - Shared state management
- `config.py` - Configuration
- `requirements.txt` - Dependencies
- `.env.example` - Environment variables
- `README.md` - Setup instructions

**SDK Features Used**:
- Agent-as-tool pattern (orchestrator invokes specialists)
- Shared context via `RunContextWrapper`
- `output_type` for structured communication
- Parallel agent execution when possible
- `run_config` for execution settings

---

### Template 5: RAG Assistant (Priority: P1)

**Structure**: Document Ingestion → Query Understanding → Response Generation
**Use Case**: Knowledge base, document Q&A, enterprise search

```
┌─────────────────────────────────────────────────────────┐
│                    RAG Assistant                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ FileSearch   │  │ Query Agent  │  │ Response Agent│  │
│  │ Tool         │  │              │  │               │  │
│  │              │  │ Understand   │  │ Generate      │  │
│  │ Vector Store │  │ user intent  │  │ answer        │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  Uses: FileSearchTool with vector_store_ids             │
└─────────────────────────────────────────────────────────┘
```

**Files Generated**:
- `main.py` - FastAPI server with file upload
- `agents/rag_agent.py` - Main RAG agent with FileSearchTool
- `agents/query_agent.py` - Query understanding/rewriting
- `tools/document_tools.py` - Document processing tools
- `setup_vectorstore.py` - Vector store initialization
- `config.py` - Configuration
- `requirements.txt` - Dependencies
- `.env.example` - Environment variables
- `README.md` - Setup instructions (including vector store setup)

**SDK Features Used**:
- `FileSearchTool(vector_store_ids=["VS_ID"], max_num_results=5)`
- `include_search_results=True` for citations
- `ranking_options` for relevance tuning
- `filters` for metadata-based search
- Optional `WebSearchTool` for hybrid search

---

### Template 6: Task Automation (Priority: P2)

**Structure**: Planner → Executor(s) → Verifier
**Use Case**: Workflow automation, scheduled tasks, batch processing

```
┌─────────────────┐
│  Planner Agent  │
│                 │
│ - Break down    │
│   task          │
│ - Create steps  │
│ - Assign to     │
│   executors     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Executor Pool               │
│  ┌──────────┐  ┌──────────┐        │
│  │Executor 1│  │Executor 2│  ...   │
│  │(API Call)│  │(File Op) │        │
│  └──────────┘  └──────────┘        │
└────────────────────┬────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │Verifier Agent│
              │              │
              │ - Check      │
              │   results    │
              │ - Validate   │
              │ - Report     │
              └──────────────┘
```

**Files Generated**:
- `main.py` - Task orchestration server
- `agents/planner.py` - Task planning agent
- `agents/executor.py` - Task execution agent(s)
- `agents/verifier.py` - Result verification agent
- `models/task_models.py` - Task/Step Pydantic models
- `tools/execution_tools.py` - Execution tools
- `scheduler.py` - Optional cron/scheduling
- `config.py` - Configuration
- `requirements.txt` - Dependencies
- `.env.example` - Environment variables
- `README.md` - Setup instructions

**SDK Features Used**:
- `output_type=TaskPlan` for structured planning
- While-loop evaluation pattern (run until verifier passes)
- Code-based orchestration for step execution
- `OutputGuardrail` for result validation
- Optional `CodeInterpreterTool` for dynamic execution

---

## User Stories

### User Story 1 - Quick Agent from Template (Priority: P0)

**As a** client,
**I want to** request a common agent type,
**So that** I get working code in 1-2 minutes instead of 5-10.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-1.1 | Client can request "customer support bot" | Template auto-selected |
| AC-1.2 | AI Employee uses Customer Support template | Check generated structure |
| AC-1.3 | Customization questions asked (domain, tools) | Test conversation |
| AC-1.4 | Complete code generated in <2 minutes | Time measurement |
| AC-1.5 | Code pushed to GitHub automatically | Check repo |

---

### User Story 2 - Template Customization (Priority: P0)

**As a** client,
**I want to** customize a template for my specific needs,
**So that** I get tailored code without starting from scratch.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-2.1 | AI Employee asks domain-specific questions | Test conversation |
| AC-2.2 | Agent names customized to client domain | Check code |
| AC-2.3 | Tools selected based on requirements | Check tools config |
| AC-2.4 | Instructions tailored to use case | Check agent instructions |
| AC-2.5 | Handoffs configured appropriately | Check handoff setup |

---

### User Story 3 - RAG Knowledge Base (Priority: P1)

**As a** client with documents,
**I want to** create a knowledge base agent,
**So that** users can query my documentation.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-3.1 | RAG Assistant template selected | Check template |
| AC-3.2 | FileSearchTool configured with vector_store_ids | Check code |
| AC-3.3 | Document upload instructions included | Check README |
| AC-3.4 | Vector store setup script provided | Check setup file |
| AC-3.5 | Citation/source references enabled | Check include_search_results |

---

### User Story 4 - Multi-Agent Enterprise System (Priority: P1)

**As an** enterprise client,
**I want to** create a complex multi-agent system,
**So that** I can handle sophisticated workflows.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-4.1 | Multi-Agent template selected | Check template |
| AC-4.2 | Orchestrator properly configured | Check orchestrator code |
| AC-4.3 | Specialists created based on requirements | Check specialist agents |
| AC-4.4 | Shared context management implemented | Check context handling |
| AC-4.5 | Scalable architecture provided | Check code structure |

---

## Functional Requirements

### Template System Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Templates stored in `templates/` directory | P0 |
| FR-002 | Each template has metadata.json with info | P0 |
| FR-003 | Template selection based on client request | P0 |
| FR-004 | Customization via code-generation skill | P0 |
| FR-005 | All templates use OpenAI Agents SDK | P0 |
| FR-006 | Templates include FastAPI server | P0 |
| FR-007 | Templates include Docker support | P1 |
| FR-008 | Templates include comprehensive README | P0 |

### Code Generation Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-009 | Agent names customized to client domain | P0 |
| FR-010 | Instructions tailored to use case | P0 |
| FR-011 | Tools selected based on requirements | P0 |
| FR-012 | Handoffs configured appropriately | P0 |
| FR-013 | Structured outputs defined with Pydantic | P1 |
| FR-014 | Guardrails added for production use | P1 |
| FR-015 | Session/memory configured if needed | P1 |

---

## Template Directory Structure

```
templates/
├── basic-chatbot/
│   ├── metadata.json
│   ├── main.py.template
│   ├── config.py.template
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md.template
├── customer-support/
│   ├── metadata.json
│   ├── main.py.template
│   ├── agents/
│   │   ├── triage.py.template
│   │   ├── billing.py.template
│   │   ├── technical.py.template
│   │   └── general.py.template
│   ├── tools/
│   │   └── ticket.py.template
│   ├── config.py.template
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md.template
├── data-processor/
│   ├── metadata.json
│   ├── ... (similar structure)
├── multi-agent-system/
│   ├── metadata.json
│   ├── ... (similar structure)
├── rag-assistant/
│   ├── metadata.json
│   ├── ... (similar structure)
└── task-automation/
    ├── metadata.json
    ├── ... (similar structure)
```

### metadata.json Format

```json
{
  "name": "customer-support",
  "displayName": "Customer Support",
  "description": "Multi-agent support system with triage and specialists",
  "agents": ["triage", "billing", "technical", "general"],
  "patterns": ["handoffs", "triage"],
  "sdkFeatures": ["handoffs", "guardrails", "sessions"],
  "useCases": ["support desk", "helpdesk", "customer service"],
  "keywords": ["support", "customer", "help", "service", "ticket"],
  "complexity": "medium",
  "estimatedSetupTime": "5 minutes"
}
```

---

## Integration with Existing Skills

### code-generation Skill Updates

The code-generation skill will be enhanced to:

1. **Template Detection**: Analyze client request to match templates
2. **Template Selection**: Choose best matching template
3. **Customization**: Apply client-specific modifications
4. **Generation**: Produce final code from template

```
Client Request → Template Match → Customization Questions → Generate Code
```

### Template Matching Logic

```python
# Pseudo-code for template matching
keywords_to_template = {
    ["faq", "chatbot", "assistant", "simple"]: "basic-chatbot",
    ["support", "customer", "help", "service"]: "customer-support",
    ["data", "process", "etl", "report"]: "data-processor",
    ["multi", "complex", "enterprise", "workflow"]: "multi-agent-system",
    ["rag", "knowledge", "document", "search"]: "rag-assistant",
    ["automate", "task", "schedule", "batch"]: "task-automation",
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Template selection accuracy | > 90% |
| Generation time (from template) | < 2 minutes |
| Generated code runs without errors | > 95% |
| Client satisfaction with templates | > 85% |
| Templates covering client requests | > 80% |

---

## Dependencies

| Component | Status | Notes |
|-----------|--------|-------|
| Phase 1 Foundation | Complete | NanoClaw, WhatsApp |
| Phase 2 Agent Skills | Complete | code-generation skill |
| Phase 3 GitHub Integration | Complete | Push to GitHub |
| OpenAI Agents SDK | External | v0.7.0+ |

---

## References

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-python/)
- [Multi-Agent Orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
- [Handoffs Documentation](https://openai.github.io/openai-agents-python/handoffs/)
- [FileSearchTool (RAG)](https://openai.github.io/openai-agents-python/tools/)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI Cookbook - Orchestrating Agents](https://cookbook.openai.com/examples/orchestrating_agents)
