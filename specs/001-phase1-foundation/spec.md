# Feature Specification: Phase 1 Foundation Setup

**Feature Branch**: `001-phase1-foundation`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "Phase 1 Foundation - NanoClaw setup, WhatsApp integration, Docker container, PostgreSQL database for Agent Builder AI Employee"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - NanoClaw Clone and Setup (Priority: P1)

Developer clones NanoClaw repository and runs the initial setup process. The system should be ready for WhatsApp integration after setup completes.

**Why this priority**: NanoClaw is the "Body" layer of the architecture - without it, no other components can function. This is the foundation for the entire AI Employee system.

**Independent Test**: Can be fully tested by cloning the repository, running setup, and verifying all dependencies are installed and configuration files are created.

**Acceptance Scenarios**:

1. **Given** a fresh environment, **When** developer clones NanoClaw repository, **Then** all source files are available locally in the correct directory structure
2. **Given** NanoClaw is cloned, **When** developer runs the setup process, **Then** all Node.js dependencies are installed successfully
3. **Given** setup is complete, **When** developer checks the configuration, **Then** all required configuration files exist with correct structure

---

### User Story 2 - Docker Container Configuration (Priority: P1)

Developer configures Docker containers for running NanoClaw with proper isolation. Each agent task must execute in its own isolated container.

**Why this priority**: Container isolation is critical for security - it prevents cross-tenant data leakage and provides the sandbox environment required for safe agent execution.

**Independent Test**: Can be tested by building Docker image, running a container, and verifying isolation between multiple container instances.

**Acceptance Scenarios**:

1. **Given** NanoClaw is set up, **When** developer builds Docker image, **Then** image is created successfully with all dependencies
2. **Given** Docker image exists, **When** developer runs a container, **Then** container starts and NanoClaw process is running inside
3. **Given** multiple containers running, **When** checking container filesystems, **Then** each container has isolated filesystem with no shared memory access

---

### User Story 3 - WhatsApp Integration (Priority: P1)

Developer connects NanoClaw to WhatsApp using the test phone number. Messages received on WhatsApp should trigger the agent system.

**Why this priority**: WhatsApp is the primary communication channel for the Agent Builder AI Employee. Without this, no client interaction is possible.

**Independent Test**: Can be tested by scanning QR code with WhatsApp, sending a test message, and verifying the message is received by NanoClaw.

**Acceptance Scenarios**:

1. **Given** NanoClaw is running, **When** QR code is displayed, **Then** developer can scan it with WhatsApp (phone: 03492128287)
2. **Given** WhatsApp is connected, **When** authentication is complete, **Then** credentials are saved for persistent sessions
3. **Given** authenticated session, **When** a message is sent to the connected number, **Then** NanoClaw receives and logs the message
4. **Given** message is received, **When** NanoClaw processes it, **Then** a response can be sent back via WhatsApp

---

### User Story 4 - PostgreSQL Database Setup (Priority: P2)

Developer connects to the PostgreSQL database and creates the required schema for storing clients, projects, and conversation data.

**Why this priority**: Database is needed for persistent storage but the system can function with in-memory storage initially. Schema setup is required before production use.

**Independent Test**: Can be tested by connecting to PostgreSQL, creating tables, and performing CRUD operations.

**Acceptance Scenarios**:

1. **Given** PostgreSQL connection URL, **When** developer connects to database, **Then** connection is established successfully
2. **Given** database connection, **When** schema migration runs, **Then** clients, projects, and conversations tables are created
3. **Given** tables exist, **When** developer inserts test data, **Then** data is persisted and can be retrieved
4. **Given** database is operational, **When** checking SSL connection, **Then** connection uses SSL mode as required by Neon

---

### User Story 5 - Directory Structure Setup (Priority: P2)

Developer creates the directory structure for the Agent Builder AI Employee project, organizing skills, MCP servers, templates, and data storage.

**Why this priority**: Proper directory structure enables organized development but is not blocking for initial functionality.

**Independent Test**: Can be tested by verifying all required directories exist and have correct permissions.

**Acceptance Scenarios**:

1. **Given** employee-nanoclaw project, **When** directory structure is created, **Then** all required folders exist (.claude/skills, mcp-servers, templates, client-agents, data)
2. **Given** directories exist, **When** checking permissions, **Then** all directories are readable and writable
3. **Given** .claude directory exists, **When** CLAUDE.md is created, **Then** global memory file is initialized with project context

---

### User Story 6 - Agent Code Storage System (Priority: P1)

System stores generated agent code locally in organized folder structure, enabling version tracking, manual editing, and incremental updates to existing projects.

**Why this priority**: Without local storage, generated code only goes to WhatsApp. Client cannot request updates to existing agents, and owner cannot manually edit or review code. This is critical for production use.

**Independent Test**: Can be tested by generating an agent, verifying local storage, modifying requirements, and verifying version increment.

**Acceptance Scenarios**:

1. **Given** a client requests a new agent, **When** code is generated, **Then** files are saved to `client-agents/{client_jid}/{project_slug}/current/` before WhatsApp delivery
2. **Given** agent code exists locally, **When** client requests an update, **Then** system reads existing code, modifies it, saves new version to `versions/v{n}/`, updates `current/`, and sends to WhatsApp
3. **Given** multiple projects for same client, **When** listing projects, **Then** each project has separate folder under client's directory
4. **Given** agent is generated, **When** checking database, **Then** `projects` table contains `local_path` pointing to the folder and `current_version` tracking version number
5. **Given** container runs code-generation, **When** saving files, **Then** container has write access to `client-agents/` via volume mount

**Directory Structure**:

```
client-agents/
├── 923032206662@s.whatsapp.net/     # Client JID as folder name
│   ├── faq-bot/                      # Project slug
│   │   ├── current/                  # Latest working version
│   │   │   ├── main.py
│   │   │   ├── agents.py
│   │   │   └── ...
│   │   ├── versions/
│   │   │   ├── v1/                   # First version
│   │   │   └── v2/                   # After update
│   │   └── metadata.json             # Project info, requirements history
│   │
│   └── voice-assistant/              # Another project
│       └── ...
```

**metadata.json Structure**:

```json
{
  "project_id": "uuid",
  "name": "FAQ Bot",
  "slug": "faq-bot",
  "client_jid": "923032206662@s.whatsapp.net",
  "agent_type": "standard",
  "current_version": 2,
  "created_at": "2026-02-20T10:00:00Z",
  "updated_at": "2026-02-20T14:30:00Z",
  "requirements_history": [
    {"version": 1, "requirements": {...}, "date": "..."},
    {"version": 2, "requirements": {...}, "date": "..."}
  ]
}
```

---

### Edge Cases

- What happens when WhatsApp QR code scan fails or times out? (Re-generate QR code)
- How does system handle PostgreSQL connection failure? (Graceful degradation with error logging)
- What happens if Docker container fails to start? (Clear error message with troubleshooting steps)
- How does system handle invalid WhatsApp messages? (Log and skip without crashing)
- What happens when database connection is lost mid-operation? (Automatic reconnection with retry logic)
- What happens when client-agents folder doesn't exist? (Auto-create on first generation)
- What happens when disk is full during code save? (Error message, skip local save, still send to WhatsApp)
- How does system handle special characters in project names? (Slugify to safe folder name)
- What happens when client requests update but project not found locally? (Re-generate from requirements in database)
- How does system handle concurrent updates to same project? (Lock file or queue updates)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST clone NanoClaw repository from GitHub (gavrielc/nanoclaw)
- **FR-002**: System MUST install all Node.js dependencies via npm/pnpm
- **FR-003**: System MUST build Docker image with NanoClaw and all dependencies
- **FR-004**: System MUST provide container isolation using Docker
- **FR-005**: System MUST connect to WhatsApp using @whiskeysockets/baileys library
- **FR-006**: System MUST display QR code for WhatsApp authentication
- **FR-007**: System MUST persist WhatsApp authentication credentials for session continuity
- **FR-008**: System MUST receive and process incoming WhatsApp messages
- **FR-009**: System MUST send responses back via WhatsApp
- **FR-010**: System MUST connect to PostgreSQL database using provided connection URL
- **FR-011**: System MUST create database schema (clients, projects, conversations tables)
- **FR-012**: System MUST use SSL for PostgreSQL connection (Neon requirement)
- **FR-013**: System MUST create organized directory structure for skills, MCP servers, templates
- **FR-014**: System MUST initialize CLAUDE.md for global memory context
- **FR-015**: System MUST store environment variables in .env file (not hardcoded)
- **FR-016**: System MUST create `client-agents/` directory structure for storing generated agent code
- **FR-017**: System MUST save generated code locally BEFORE sending to WhatsApp
- **FR-018**: System MUST organize code by client JID and project slug (`client-agents/{jid}/{slug}/`)
- **FR-019**: System MUST maintain version history in `versions/v{n}/` folders
- **FR-020**: System MUST update `projects` table with `local_path` and `current_version` columns
- **FR-021**: System MUST mount `client-agents/` directory in container for write access
- **FR-022**: System MUST create `metadata.json` for each project with requirements history

### Key Entities

- **NanoClaw Instance**: The running agent body that handles WhatsApp connections, container management, and message routing
- **Docker Container**: Isolated execution environment for each agent task with filesystem isolation
- **WhatsApp Connection**: Persistent WebSocket connection to WhatsApp using baileys library
- **PostgreSQL Database**: External Neon database storing clients, projects, and conversation history
- **Client**: A WhatsApp user who interacts with the Agent Builder
- **Project**: An agent building request from a client with requirements and status
- **Conversation**: Message history between client and Agent Builder
- **Generated Agent**: Local folder containing agent code files, version history, and metadata for a specific project

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can clone and set up NanoClaw within 15 minutes following documentation
- **SC-002**: Docker container builds successfully in under 5 minutes
- **SC-003**: WhatsApp QR code authentication completes within 60 seconds of scan
- **SC-004**: System maintains WhatsApp connection for 24+ hours without requiring re-authentication
- **SC-005**: Messages sent to WhatsApp are received by NanoClaw within 3 seconds
- **SC-006**: Database operations (insert, query) complete within 500ms
- **SC-007**: Container isolation prevents any cross-container data access (100% isolation)
- **SC-008**: System recovers from WhatsApp disconnection automatically within 30 seconds
- **SC-009**: All sensitive credentials are stored in .env file, not in source code
- **SC-010**: Directory structure matches the defined specification exactly
- **SC-011**: Generated agent code is saved locally within 2 seconds of generation
- **SC-012**: Version folders are created correctly on each update (v1, v2, v3...)
- **SC-013**: metadata.json contains complete requirements history for all versions
- **SC-014**: Container can write to client-agents/ directory without permission errors
- **SC-015**: Existing project can be found and updated within 3 seconds of client request

## Assumptions

- Developer has Node.js 18+ installed
- Developer has Docker Desktop installed and running
- Developer has git installed
- WhatsApp account on phone number 03492128287 is active and can scan QR codes
- PostgreSQL database on Neon is accessible from developer's network
- Developer has basic familiarity with terminal/command line operations
- Internet connection is stable for WhatsApp WebSocket connection

## Dependencies

- **External Service**: Neon PostgreSQL Database (provided URL)
- **External Service**: WhatsApp (Meta's messaging platform)
- **Repository**: gavrielc/nanoclaw (GitHub)
- **Library**: @whiskeysockets/baileys (WhatsApp client)
- **Runtime**: Node.js 18+
- **Container**: Docker Engine

## Out of Scope

- Agent Skills development (Phase 2)
- MCP Servers implementation (Phase 2)
- Agent templates creation (Phase 2)
- OpenAI Agents SDK integration (Phase 2)
- Multi-agent orchestration (Phase 2)
- Client billing system (Future)
- Production deployment to cloud (Phase 3)
- Kubernetes orchestration (Phase 3)
