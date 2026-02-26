# Phase 3: External MCP Integration

## Overview

Integrate external MCP servers (Context7, GitHub) into the Agent Builder AI Employee to provide latest documentation access and GitHub-based code delivery options.

## Problem Statement

Currently, the AI Employee:
1. Uses internal knowledge which may be outdated for OpenAI Agents SDK
2. Only delivers code via WhatsApp ZIP files
3. Cannot create repositories or PRs for clients
4. Cannot update existing GitHub projects with new versions

## Goals

- **G1**: Access latest documentation for accurate code generation
- **G2**: Offer GitHub repository creation as delivery option
- **G3**: Create PRs for updates to existing GitHub projects
- **G4**: Maintain backward compatibility with ZIP delivery

## Non-Goals

- Building custom MCP servers (use existing Context7, GitHub MCP)
- Replacing WhatsApp as primary communication channel
- Requiring GitHub for all clients (optional feature)

---

## User Stories

### User Story 1 - Context7 Documentation Integration (Priority: P0)

**As an** AI Employee,
**I want to** access latest documentation via Context7 MCP,
**So that** I can generate accurate, up-to-date agent code.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-1.1 | Agent can query Context7 for OpenAI Agents SDK docs | Test with SDK query |
| AC-1.2 | Agent uses Context7 for error debugging | Test with error message |
| AC-1.3 | Context7 is available in all agent tasks | Check container env |
| AC-1.4 | Fallback to internal knowledge if Context7 unavailable | Test offline scenario |

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Context7 MCP server configured in settings.json | P0 |
| FR-002 | Agent-runner has access to Context7 tools | P0 |
| FR-003 | Skills reference Context7 for latest docs | P0 |
| FR-004 | Error messages prompt Context7 lookup | P1 |

---

### User Story 2 - GitHub Repository Delivery (Priority: P1)

**As a** client,
**I want to** choose GitHub as my code delivery method,
**So that** I can have version-controlled code ready to deploy.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-2.1 | Client asked about GitHub preference during requirements | Test conversation |
| AC-2.2 | New repository created with correct structure | Check GitHub |
| AC-2.3 | Code pushed with proper commit message | Check commit |
| AC-2.4 | Client receives repository URL via WhatsApp | Check message |
| AC-2.5 | ZIP fallback works if GitHub declined | Test decline flow |

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-005 | GitHub IPC handlers implemented in ipc.ts | P0 |
| FR-006 | GITHUB_PERSONAL_ACCESS_TOKEN on host only | P0 |
| FR-007 | Requirements-gathering asks GitHub preference | P0 |
| FR-008 | AgentConfig stores github_delivery settings | P0 |
| FR-009 | Code-generation writes IPC for repo creation | P0 |
| FR-010 | Repository named with project slug | P1 |
| FR-011 | README.md includes setup instructions | P1 |
| FR-017 | IPC response polling with timeout | P0 |
| FR-018 | Error handling for IPC failures | P0 |

---

### User Story 3 - GitHub PR for Updates (Priority: P1)

**As a** client with existing GitHub project,
**I want** updates delivered as Pull Requests,
**So that** I can review changes before merging.

#### Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-3.1 | System detects existing GitHub repo from metadata | Test update flow |
| AC-3.2 | Creates feature branch for update | Check branches |
| AC-3.3 | PR created with change summary | Check PR body |
| AC-3.4 | Client notified via WhatsApp with PR link | Check message |
| AC-3.5 | Version incremented in metadata | Check metadata.json |

#### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-012 | metadata.json stores github_repo URL | P0 |
| FR-013 | Update flow checks for GitHub delivery | P0 |
| FR-014 | Feature branch created: update-v{n} | P0 |
| FR-015 | PR body includes change summary | P1 |
| FR-016 | PR links to previous version diff | P2 |

---

## Technical Requirements

### Architecture: IPC-Based GitHub Operations

Container cannot directly access MCP servers. Instead, container writes IPC request files, host processes them via MCP, and writes results back.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Container                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Claude Agent SDK                          │ │
│  │                                                              │ │
│  │   Skills write IPC requests to /workspace/ipc/github/        │ │
│  │   Skills read IPC responses from same directory              │ │
│  │                                                              │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │ IPC Files
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NanoClaw Host                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      ipc.ts                                  │ │
│  │                                                              │ │
│  │   Watches /data/ipc/{group}/github/*.json                    │ │
│  │   Processes GitHub IPC requests via Octokit                  │ │
│  │   Writes results back to .result files                       │ │
│  │                                                              │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │              GitHub MCP Server (Host-side)                    │ │
│  │              GITHUB_PERSONAL_ACCESS_TOKEN                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### GitHub IPC Operations

| Operation | IPC File | Purpose |
|-----------|----------|---------|
| `github_create_repo` | `create_repo_{id}.json` | Create new repository |
| `github_push_files` | `push_files_{id}.json` | Push code to repo |
| `github_create_branch` | `create_branch_{id}.json` | Create feature branch |
| `github_create_pr` | `create_pr_{id}.json` | Create pull request |
| `github_get_file_contents` | `get_file_{id}.json` | Read existing code |
| `github_list_repos` | `list_repos_{id}.json` | Check existing repos |

### IPC Request/Response Format

**Request** (`/workspace/ipc/github/create_repo_001.json`):
```json
{
  "operation": "github_create_repo",
  "id": "001",
  "timestamp": "2026-02-21T15:30:00Z",
  "params": {
    "name": "faq-bot",
    "description": "AI-powered FAQ chatbot",
    "private": true
  }
}
```

**Response** (`/workspace/ipc/github/create_repo_001.result`):
```json
{
  "success": true,
  "id": "001",
  "timestamp": "2026-02-21T15:30:05Z",
  "result": {
    "repo_url": "https://github.com/owner/faq-bot",
    "clone_url": "https://github.com/owner/faq-bot.git",
    "owner": "owner",
    "name": "faq-bot"
  }
}
```

### Security Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SC-001 | GITHUB_PERSONAL_ACCESS_TOKEN never in container | P0 |
| SC-002 | Token stays on host only, used by ipc.ts | P0 |
| SC-003 | Token scoped to repo permissions only | P0 |
| SC-004 | IPC files contain no sensitive data | P0 |
| SC-005 | Client repos created under their account (future) | P2 |

### Environment Variables (Host Only)

| Variable | Purpose | Required |
|----------|---------|----------|
| GITHUB_PERSONAL_ACCESS_TOKEN | GitHub API access (host-side) | Yes (for GitHub features) |
| GITHUB_DEFAULT_ORG | Default organization for repos | No |

---

## Data Model Changes

### AgentConfig Extension

```json
{
  "delivery": {
    "method": "github" | "whatsapp",
    "github_repo": "owner/repo-name",
    "github_visibility": "public" | "private",
    "create_new_repo": true | false
  }
}
```

### metadata.json Extension

```json
{
  "github_repo": "rrizwan98/faq-bot",
  "github_delivery": true,
  "last_pr_number": 2
}
```

---

## Scenarios

### Scenario 1: New Agent with GitHub Delivery

```
1. Client: "I need an FAQ bot"
2. Requirements gathering (including GitHub question)
3. Client: "Yes, push to GitHub as new repo"
4. AI generates code, saves locally
5. AI creates GitHub repo: client-org/faq-bot
6. AI pushes code with initial commit
7. AI sends repo URL via WhatsApp
```

### Scenario 2: Update Existing GitHub Project

```
1. Client: "Add web search to my FAQ bot"
2. AI reads metadata.json, finds github_repo
3. AI modifies code locally
4. AI creates branch: update-v2
5. AI creates PR with changes
6. AI sends PR URL via WhatsApp
```

### Scenario 3: Client Declines GitHub

```
1. Client: "I need an FAQ bot"
2. Requirements gathering asks GitHub preference
3. Client: "No, just send ZIP"
4. AI generates code, saves locally
5. AI creates ZIP and sends via WhatsApp
6. metadata.json has github_delivery: false
```

---

## Edge Cases

| ID | Case | Handling |
|----|------|----------|
| EC-001 | GitHub token not configured | Skip GitHub features, use ZIP |
| EC-002 | Repo name conflict | Append timestamp suffix |
| EC-003 | GitHub API rate limit | Retry with backoff, notify user |
| EC-004 | PR creation fails | Save locally, send ZIP fallback |
| EC-005 | Client changes delivery preference | Update metadata, proceed accordingly |

---

## Dependencies

| Component | Status | Notes |
|-----------|--------|-------|
| Context7 MCP | Host-side | `@upstash/context7-mcp` (Claude Code) |
| GitHub MCP | Host-side | `@modelcontextprotocol/server-github` (via ipc.ts) |
| IPC System | Existing | `nanoclaw/src/ipc.ts` |
| Agent Storage (US6) | Complete | Phase 1 PR #3 |
| Code Generation Skill | Complete | Phase 2 |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Context7 query success rate | > 95% |
| GitHub repo creation success | > 99% |
| PR creation success | > 99% |
| Fallback to ZIP when needed | 100% |

---

## Out of Scope (Future)

- OAuth flow for client's own GitHub tokens
- GitLab/Bitbucket support
- CI/CD pipeline generation
- Issue creation for bugs
