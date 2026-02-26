# Phase 3: External MCP Integration - Implementation Plan (IPC Approach)

## Overview

This plan details how to integrate GitHub operations into NanoClaw using **IPC (Inter-Process Communication)** between containers and host. The host handles all MCP calls while containers communicate via IPC files.

## Architecture (IPC-Based)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Container                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Claude Agent SDK                          │ │
│  │                                                              │ │
│  │   1. Skill writes: /workspace/ipc/github/create_repo.json    │ │
│  │   2. Skill polls:  /workspace/ipc/github/create_repo.result  │ │
│  │   3. Skill reads result and continues                        │ │
│  │                                                              │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    Mount: /workspace/ipc ←→ data/ipc/{group}
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                     NanoClaw Host                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      ipc.ts (watcher)                        │ │
│  │                                                              │ │
│  │   1. Watches data/ipc/{group}/github/*.json                  │ │
│  │   2. Reads request, calls GitHub MCP                         │ │
│  │   3. Writes result to *.result file                          │ │
│  │                                                              │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │                    GitHub MCP Server                          │ │
│  │           (Connected to Claude Code / NanoClaw)               │ │
│  │                                                              │ │
│  │   GITHUB_PERSONAL_ACCESS_TOKEN (from .env)                   │ │
│  │   Tools: create_repository, push_files, create_pr, etc.      │ │
│  │                                                              │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Why IPC Instead of Direct MCP?

| Aspect | Direct MCP (Old) | IPC Approach (New) |
|--------|------------------|-------------------|
| Token Security | Token in container | Token on host only ✅ |
| Internet in Container | Required for npx | Not needed ✅ |
| Complexity | MCP startup in container | Uses existing IPC ✅ |
| Reliability | MCP might fail to start | IPC already works ✅ |

---

## Implementation Phases

### Phase A: GitHub IPC Infrastructure

**Goal**: Add GitHub operation handlers to host-side IPC system

#### A1. Create GitHub IPC Directory Structure

```
data/ipc/{group}/
├── messages/          # Existing: WhatsApp messages
├── tasks/             # Existing: Scheduled tasks
├── input/             # Existing: User input
└── github/            # NEW: GitHub operations
    ├── create_repo_001.json
    ├── create_repo_001.result
    └── ...
```

#### A2. Add GitHub IPC Handlers to ipc.ts

File: `nanoclaw/src/ipc.ts`

```typescript
// New GitHub IPC handler
async function handleGitHubIPC(groupFolder: string): Promise<void> {
  const githubDir = path.join(DATA_DIR, 'ipc', groupFolder, 'github');
  if (!fs.existsSync(githubDir)) return;

  const files = fs.readdirSync(githubDir)
    .filter(f => f.endsWith('.json') && !f.endsWith('.result'));

  for (const file of files) {
    const requestPath = path.join(githubDir, file);
    const resultPath = requestPath.replace('.json', '.result');

    // Skip if already processed
    if (fs.existsSync(resultPath)) continue;

    const request = JSON.parse(fs.readFileSync(requestPath, 'utf-8'));
    const result = await processGitHubOperation(request);
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  }
}

async function processGitHubOperation(request: GitHubIPCRequest): Promise<GitHubIPCResponse> {
  switch (request.operation) {
    case 'github_create_repo':
      return await handleCreateRepo(request.params);
    case 'github_push_files':
      return await handlePushFiles(request.params);
    case 'github_create_branch':
      return await handleCreateBranch(request.params);
    case 'github_create_pr':
      return await handleCreatePR(request.params);
    case 'github_get_file_contents':
      return await handleGetFileContents(request.params);
    case 'github_list_repos':
      return await handleListRepos(request.params);
    default:
      return { success: false, error: `Unknown operation: ${request.operation}` };
  }
}
```

#### A3. Implement GitHub Operation Handlers

File: `nanoclaw/src/github-ipc.ts` (new file)

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
});

export async function handleCreateRepo(params: CreateRepoParams): Promise<GitHubIPCResponse> {
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: params.name,
      description: params.description,
      private: params.private ?? true,
      auto_init: false
    });

    return {
      success: true,
      result: {
        repo_url: data.html_url,
        clone_url: data.clone_url,
        owner: data.owner.login,
        name: data.name
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ... other handlers
```

---

### Phase B: Container-Side IPC Client

**Goal**: Enable skills to make GitHub requests via IPC

#### B1. Create IPC Client for Skills

File: `nanoclaw/container/agent-runner/src/github-ipc-client.ts` (new file)

```typescript
import fs from 'fs';
import path from 'path';

const IPC_DIR = '/workspace/ipc/github';
const POLL_INTERVAL = 500; // ms
const TIMEOUT = 30000; // 30 seconds

export async function githubIPC(operation: string, params: any): Promise<any> {
  const id = Date.now().toString();
  const requestFile = path.join(IPC_DIR, `${operation}_${id}.json`);
  const resultFile = path.join(IPC_DIR, `${operation}_${id}.result`);

  // Ensure directory exists
  fs.mkdirSync(IPC_DIR, { recursive: true });

  // Write request
  fs.writeFileSync(requestFile, JSON.stringify({
    operation,
    id,
    timestamp: new Date().toISOString(),
    params
  }, null, 2));

  // Poll for result
  const startTime = Date.now();
  while (Date.now() - startTime < TIMEOUT) {
    if (fs.existsSync(resultFile)) {
      const result = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
      // Cleanup
      fs.unlinkSync(requestFile);
      fs.unlinkSync(resultFile);
      return result;
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }

  throw new Error(`GitHub IPC timeout: ${operation}`);
}
```

#### B2. Add GitHub Tools to IPC-MCP

File: `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts`

Add new tools for GitHub operations:

```typescript
// Add to existing tools array
{
  name: 'github_create_repo',
  description: 'Create a new GitHub repository',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Repository name' },
      description: { type: 'string', description: 'Repository description' },
      private: { type: 'boolean', description: 'Private repository' }
    },
    required: ['name']
  }
},
{
  name: 'github_push_files',
  description: 'Push files to a GitHub repository',
  inputSchema: {
    type: 'object',
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      branch: { type: 'string' },
      files: { type: 'array', items: { type: 'object' } },
      message: { type: 'string' }
    },
    required: ['owner', 'repo', 'branch', 'files', 'message']
  }
},
// ... other GitHub tools
```

---

### Phase C: Update Skills for IPC

**Goal**: Update code-generation skill to use IPC for GitHub

#### C1. Update code-generation skill

File: `nanoclaw/container/skills/code-generation/SKILL.md`

Replace direct MCP calls with IPC:

```markdown
### Step 7: GitHub Delivery (via IPC)

If `delivery.method === "github"`:

#### 7.1 Create Repository (if new)
```python
# Write IPC request for repo creation
import json
import os
import time

ipc_dir = "/workspace/ipc/github"
os.makedirs(ipc_dir, exist_ok=True)

request_id = str(int(time.time() * 1000))
request_file = f"{ipc_dir}/github_create_repo_{request_id}.json"
result_file = f"{ipc_dir}/github_create_repo_{request_id}.result"

# Write request
with open(request_file, 'w') as f:
    json.dump({
        "operation": "github_create_repo",
        "id": request_id,
        "params": {
            "name": delivery["github"]["repo_name"],
            "description": agent_config["description"],
            "private": delivery["github"]["visibility"] == "private"
        }
    }, f)

# Poll for result (host will process)
timeout = 30
start = time.time()
while time.time() - start < timeout:
    if os.path.exists(result_file):
        with open(result_file) as f:
            result = json.load(f)
        break
    time.sleep(0.5)
```
```

---

### Phase D: Testing

#### D1. Unit Tests

- Test IPC file creation/reading
- Test GitHub handler functions
- Test timeout handling

#### D2. Integration Tests

1. Start NanoClaw
2. Send "Build FAQ bot, push to GitHub"
3. Verify IPC files created
4. Verify repo created on GitHub
5. Verify WhatsApp receives URL

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `nanoclaw/src/ipc.ts` | Modify | Add GitHub IPC watcher and router |
| `nanoclaw/src/github-ipc.ts` | New | GitHub operation handlers (Octokit) |
| `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts` | Modify | Add GitHub tools |
| `nanoclaw/container/skills/code-generation/SKILL.md` | Modify | Use IPC for GitHub |
| `package.json` | Modify | Add @octokit/rest dependency |

---

## Success Criteria

1. ✅ IPC files created in data/ipc/{group}/github/
2. ✅ Host processes GitHub requests via Octokit
3. ✅ Container receives results via .result files
4. ✅ Repo creation works end-to-end
5. ✅ PR creation works for updates
6. ✅ Fallback to ZIP if GitHub fails
