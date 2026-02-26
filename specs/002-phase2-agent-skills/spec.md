# Feature Specification: Phase 2 Agent Skills Development

**Feature Branch**: `002-phase2-agent-skills`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "Phase 2 Agent Skills Development - Create 4 OpenAI Agents SDK expert skills for WhatsApp-based AI Employee that builds custom agents with complete SDK expertise"

## Overview

This phase creates 4 specialized skills for the Agent Builder AI Employee. Each skill follows OpenAI Agents SDK patterns and enables the employee to build production-ready AI agents for clients via WhatsApp conversations.

### OpenAI Agents SDK Expertise Required

The AI Employee must be expert in:

| Category | Features |
|----------|----------|
| **Agent Types** | Standard Agent, RealtimeAgent (voice/WebSocket) |
| **Hosted Tools** | WebSearchTool, FileSearchTool, CodeInterpreterTool, ImageGenerationTool, ComputerTool, HostedMCPTool |
| **Custom Tools** | @function_tool decorator, tool guardrails (input/output validation) |
| **Memory** | SQLiteSession, RedisSession, conversation persistence |
| **Handoffs** | Agent-to-agent delegation, realtime_handoff, multi-agent orchestration |
| **Guardrails** | Input validation, output filtering, content safety |
| **MCP Integration** | MCPServerStdio (local), HostedMCPTool (remote), MCPServerManager |
| **Realtime API** | WebSocket connections, voice streaming, turn detection, audio formats |
| **Runner** | Sync/async execution, streaming, run_config, max_turns |
| **Structured Output** | Pydantic models, output_type configuration |
| **Dynamic Prompts** | Context-aware instructions, callable functions |
| **Human-in-the-Loop** | Approval workflows, interruption handling, RunState persistence |
| **FastAPI Integration** | HTTP endpoints, WebSocket server, streaming responses |
| **Deployment** | Docker containers, environment configuration |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Requests a Standard Agent (Priority: P1)

A client messages the AI Employee on WhatsApp saying "I need a customer support chatbot that can search the web and handle FAQs". The employee gathers requirements, designs the agent architecture, generates complete OpenAI Agents SDK code, and delivers files via WhatsApp.

**Why this priority**: This is the core value proposition - building working agents from natural language requests.

**Independent Test**: Can be fully tested by sending a WhatsApp message requesting an agent and receiving deployable code files.

**Acceptance Scenarios**:

1. **Given** a client sends "I need an FAQ bot", **When** the employee processes the request, **Then** it asks clarifying questions about domain, tools needed, and deployment target
2. **Given** requirements are gathered, **When** the employee generates code, **Then** it produces valid OpenAI Agents SDK Python code with proper Agent, tools, and Runner setup
3. **Given** code is generated, **When** the employee delivers files, **Then** client receives main.py, requirements.txt, .env.example, and README.md via WhatsApp

---

### User Story 2 - Client Requests a Realtime Voice Agent (Priority: P1)

A client wants "a voice assistant that can take phone orders for my restaurant". The employee creates a RealtimeAgent with WebSocket support, voice configuration, and appropriate tools.

**Why this priority**: Realtime agents are a key differentiator and high-value offering.

**Independent Test**: Can be tested by requesting a voice agent and receiving WebSocket-enabled FastAPI server code.

**Acceptance Scenarios**:

1. **Given** a client requests a voice agent, **When** the employee designs the agent, **Then** it uses RealtimeAgent with appropriate voice (alloy, echo, etc.) and turn detection
2. **Given** realtime requirements, **When** code is generated, **Then** it includes FastAPI WebSocket endpoint, audio streaming setup, and RealtimeRunner configuration
3. **Given** voice agent code, **When** client runs it, **Then** it can handle audio input/output via WebSocket connection

---

### User Story 3 - Client Requests Multi-Agent System (Priority: P2)

A client needs "a support system with triage, billing specialist, and technical specialist agents". The employee designs handoffs between agents and generates multi-agent orchestration code.

**Why this priority**: Multi-agent systems demonstrate advanced SDK capabilities and handle complex use cases.

**Independent Test**: Can be tested by requesting a multi-agent system and receiving code with proper handoff configurations.

**Acceptance Scenarios**:

1. **Given** a multi-agent request, **When** the employee designs architecture, **Then** it creates an orchestrator agent with handoffs to specialist agents
2. **Given** handoff design, **When** code is generated, **Then** each agent has proper instructions, tools, and handoff_description
3. **Given** multi-agent code, **When** tested, **Then** conversations correctly route between agents based on user intent

---

### User Story 4 - Client Requests Agent with Memory (Priority: P2)

A client wants "a personal assistant that remembers my preferences across conversations". The employee implements SQLiteSession or RedisSession for persistent memory.

**Why this priority**: Memory/sessions enable stateful agents that provide personalized experiences.

**Independent Test**: Can be tested by requesting a memory-enabled agent and verifying session persistence in generated code.

**Acceptance Scenarios**:

1. **Given** a memory requirement, **When** the employee selects session type, **Then** it recommends SQLiteSession for simple use or RedisSession for scalability
2. **Given** session type selected, **When** code is generated, **Then** it includes proper session initialization, get_items, add_items, and clear_session usage
3. **Given** memory-enabled agent, **When** tested across multiple conversations, **Then** it retains context and user preferences

---

### User Story 5 - Client Requests Agent with Custom Tools (Priority: P2)

A client needs "an agent that can check inventory in my database and send email notifications". The employee creates custom @function_tool decorated functions with proper type hints and guardrails.

**Why this priority**: Custom tools extend agent capabilities beyond built-in tools.

**Independent Test**: Can be tested by requesting custom tools and receiving properly decorated function implementations.

**Acceptance Scenarios**:

1. **Given** custom tool requirements, **When** the employee designs tools, **Then** it creates @function_tool decorated async functions with Pydantic validation
2. **Given** sensitive operations, **When** tools are generated, **Then** they include tool_input_guardrails and tool_output_guardrails for security
3. **Given** custom tool code, **When** integrated with agent, **Then** tools are properly registered and callable by the LLM

---

### User Story 6 - Client Requests Structured Output Agent (Priority: P3)

A client wants "an agent that extracts calendar events from emails and returns structured data". The employee implements output_type with Pydantic BaseModel.

**Why this priority**: Structured output enables reliable data extraction and integration with other systems.

**Independent Test**: Can be tested by requesting structured output and verifying Pydantic model in generated code.

**Acceptance Scenarios**:

1. **Given** structured output requirement, **When** the employee designs the agent, **Then** it creates a Pydantic BaseModel for the output schema
2. **Given** output_type configured, **When** agent runs, **Then** responses conform to the defined schema
3. **Given** structured output, **When** client integrates with their system, **Then** data is predictably formatted

---

### Edge Cases

- What happens when client provides vague requirements? (Employee asks targeted clarifying questions, maximum 5-7)
- How does system handle unsupported tool requests? (Employee explains limitations and suggests alternatives from SDK)
- What if client wants features not in OpenAI Agents SDK? (Employee identifies gaps and proposes workarounds)
- How does employee handle conflicting requirements? (Employee surfaces conflicts and asks for prioritization)
- What if WhatsApp file size limit is exceeded? (Employee splits files or provides zip archive)
- What if client doesn't have Python installed? (README includes setup instructions for all platforms)

---

## Requirements *(mandatory)*

### Functional Requirements

#### Skill: agent-builder

- **FR-001**: Skill MUST generate valid OpenAI Agents SDK Python code that passes syntax validation
- **FR-002**: Skill MUST support all agent types: Agent, RealtimeAgent
- **FR-003**: Skill MUST configure hosted tools: WebSearchTool, FileSearchTool, CodeInterpreterTool, ImageGenerationTool
- **FR-004**: Skill MUST implement custom tools using @function_tool decorator with type hints
- **FR-005**: Skill MUST configure handoffs for multi-agent systems with proper handoff_description
- **FR-006**: Skill MUST implement guardrails (input_guardrail, output_guardrail, tool guardrails)
- **FR-007**: Skill MUST configure sessions (SQLiteSession, RedisSession) for memory persistence
- **FR-008**: Skill MUST support structured output via output_type with Pydantic models
- **FR-009**: Skill MUST generate FastAPI server code for HTTP and WebSocket endpoints
- **FR-010**: Skill MUST create Docker deployment files (Dockerfile, docker-compose.yml)
- **FR-011**: Skill MUST implement MCP server integration (MCPServerStdio, HostedMCPTool)
- **FR-012**: Skill MUST configure RealtimeAgent with voice settings, turn detection, and audio formats
- **FR-013**: Skill MUST implement Runner with streaming support for real-time responses
- **FR-014**: Skill MUST support dynamic instructions via callable functions
- **FR-015**: Skill MUST implement human-in-the-loop approval workflows when requested

#### Skill: client-communication

- **FR-016**: Skill MUST handle bilingual communication (Urdu/English) naturally
- **FR-017**: Skill MUST maintain professional yet friendly tone throughout conversation
- **FR-018**: Skill MUST provide progress updates at each major phase (requirements, design, generation, delivery)
- **FR-019**: Skill MUST confirm understanding before proceeding to next phase
- **FR-020**: Skill MUST explain technical concepts in simple terms for non-technical clients

#### Skill: requirements-gathering

- **FR-021**: Skill MUST identify agent type needed (standard, realtime, multi-agent)
- **FR-022**: Skill MUST determine required tools (built-in and custom)
- **FR-023**: Skill MUST assess memory/session requirements
- **FR-024**: Skill MUST identify deployment target (local, cloud, container)
- **FR-025**: Skill MUST detect security and compliance requirements
- **FR-026**: Skill MUST produce structured requirements JSON for code generation
- **FR-027**: Skill MUST ask maximum 5-7 targeted questions to gather complete requirements

#### Skill: code-generation

- **FR-028**: Skill MUST generate modular, well-structured Python code following OpenAI Agents SDK patterns
- **FR-029**: Skill MUST include comprehensive error handling and logging
- **FR-030**: Skill MUST generate requirements.txt with correct package versions (openai-agents v0.7.0+)
- **FR-031**: Skill MUST create .env.example with all required environment variables
- **FR-032**: Skill MUST generate README.md with setup and usage instructions
- **FR-033**: Skill MUST produce code that passes basic linting (no syntax errors)
- **FR-034**: Skill MUST include inline comments explaining key configurations

### Key Entities

- **Skill**: A reusable capability defined in SKILL.md format with name, description, triggers, workflow, and embedded knowledge
- **AgentConfig**: Structured representation of client requirements (agent_type, tools, memory_type, handoffs, deployment_target)
- **GeneratedAgent**: Output package containing Python code files, configuration files, and documentation
- **ConversationState**: Tracks current phase (greeting, requirements, design, generation, delivery, support)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI Employee can understand and respond to agent build requests in under 30 seconds
- **SC-002**: Requirements gathering completes in 5-7 questions maximum
- **SC-003**: Generated code is syntactically valid (passes Python parser) 100% of the time
- **SC-004**: Generated agents use correct OpenAI Agents SDK patterns (verified by SDK documentation compliance)
- **SC-005**: Code package delivery via WhatsApp completes within 2 minutes of generation
- **SC-006**: Client can run generated agent locally with provided instructions in under 10 minutes
- **SC-007**: 90% of generated agents work correctly on first deployment attempt
- **SC-008**: Support for all 6 hosted tools (WebSearch, FileSearch, CodeInterpreter, ImageGeneration, Computer, HostedMCP)
- **SC-009**: Support for both standard and realtime (voice/WebSocket) agent types
- **SC-010**: Multi-agent systems with up to 5 specialist agents and handoffs supported

---

## Assumptions

- Client has basic Python environment (3.10+) available for running generated agents
- OpenAI API key will be provided by client for their deployed agents
- WhatsApp file sharing supports .py, .txt, .md, and .zip files
- NanoClaw Phase 1 foundation (WhatsApp connection, Docker containers) is operational
- Latest OpenAI Agents SDK version (v0.7.0+) patterns will be followed
- FastAPI is the standard framework for HTTP/WebSocket servers in generated code
- Clients have basic technical literacy to follow README instructions

---

## Out of Scope

- Hosting/deployment of generated agents (client deploys on their infrastructure)
- OpenAI API billing management for generated agents
- Long-term maintenance of generated agents after delivery
- Custom LLM integrations beyond OpenAI models (only OpenAI via SDK supported)
- Mobile app development
- GUI/dashboard for agent management
- Training or fine-tuning custom models
