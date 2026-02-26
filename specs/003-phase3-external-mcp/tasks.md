# Phase 3: External MCP Integration - Tasks (IPC Approach)

## Overview

Tasks for implementing GitHub integration via IPC (Inter-Process Communication) between containers and host.

**Status**: Implementation Complete (2026-02-21)

---

## Phase A: GitHub IPC Infrastructure (Host-Side)

### T001: Create GitHub IPC directory structure

**Priority**: P0
**Estimate**: XS
**File**: `nanoclaw/src/container-runner.ts`

**Implementation**:
Add github directory creation in `buildVolumeMounts()`:

```typescript
const groupIpcDir = path.join(DATA_DIR, 'ipc', group.folder);
fs.mkdirSync(path.join(groupIpcDir, 'github'), { recursive: true });
```

**Acceptance Criteria**:
- [ ] `data/ipc/{group}/github/` directory created
- [ ] Directory mounted to container at `/workspace/ipc/github`

---

### T002: Create github-ipc.ts handler file

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/src/github-ipc.ts` (NEW)

**Implementation**:
Create new file with GitHub operation handlers using Octokit:

```typescript
import { Octokit } from '@octokit/rest';

export interface GitHubIPCRequest {
  operation: string;
  id: string;
  timestamp: string;
  params: any;
}

export interface GitHubIPCResponse {
  success: boolean;
  id: string;
  timestamp: string;
  result?: any;
  error?: string;
}

export async function handleCreateRepo(params): Promise<GitHubIPCResponse>;
export async function handlePushFiles(params): Promise<GitHubIPCResponse>;
export async function handleCreateBranch(params): Promise<GitHubIPCResponse>;
export async function handleCreatePR(params): Promise<GitHubIPCResponse>;
export async function handleGetFileContents(params): Promise<GitHubIPCResponse>;
export async function handleListRepos(params): Promise<GitHubIPCResponse>;
```

**Acceptance Criteria**:
- [ ] All 6 GitHub handlers implemented
- [ ] Octokit used for API calls
- [ ] Proper error handling
- [ ] TypeScript types defined

---

### T003: Add GitHub IPC watcher to ipc.ts

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/src/ipc.ts`

**Implementation**:
Add GitHub IPC processing to existing IPC watcher:

```typescript
import { processGitHubOperation } from './github-ipc.js';

// In watchIPC or processIPC function:
async function handleGitHubIPC(groupFolder: string): Promise<void> {
  const githubDir = path.join(DATA_DIR, 'ipc', groupFolder, 'github');
  if (!fs.existsSync(githubDir)) return;

  const files = fs.readdirSync(githubDir)
    .filter(f => f.endsWith('.json') && !f.endsWith('.result'));

  for (const file of files) {
    const requestPath = path.join(githubDir, file);
    const resultPath = requestPath.replace('.json', '.result');

    if (fs.existsSync(resultPath)) continue;

    const request = JSON.parse(fs.readFileSync(requestPath, 'utf-8'));
    const result = await processGitHubOperation(request);
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  }
}
```

**Acceptance Criteria**:
- [ ] GitHub IPC files watched
- [ ] Requests processed and results written
- [ ] Integrated with existing IPC watcher loop

---

### T004: Add @octokit/rest dependency

**Priority**: P0
**Estimate**: XS
**File**: `nanoclaw/package.json`

**Implementation**:
```bash
npm install @octokit/rest
```

**Acceptance Criteria**:
- [ ] @octokit/rest in dependencies
- [ ] Types available

---

## Phase B: Container-Side IPC Client

### T005: Add GitHub tools to ipc-mcp-stdio.ts

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts`

**Implementation**:
Add 6 new tools to the MCP server:

```typescript
const GITHUB_TOOLS = [
  {
    name: 'github_create_repo',
    description: 'Create a new GitHub repository',
    inputSchema: { /* ... */ }
  },
  {
    name: 'github_push_files',
    description: 'Push files to a GitHub repository',
    inputSchema: { /* ... */ }
  },
  {
    name: 'github_create_branch',
    description: 'Create a new branch',
    inputSchema: { /* ... */ }
  },
  {
    name: 'github_create_pr',
    description: 'Create a pull request',
    inputSchema: { /* ... */ }
  },
  {
    name: 'github_get_file_contents',
    description: 'Get file contents from a repository',
    inputSchema: { /* ... */ }
  },
  {
    name: 'github_list_repos',
    description: 'List repositories',
    inputSchema: { /* ... */ }
  }
];
```

**Acceptance Criteria**:
- [ ] All 6 tools defined with schemas
- [ ] Tools write IPC request files
- [ ] Tools poll for IPC result files
- [ ] Timeout handling (30 seconds)

---

### T006: Implement IPC request/response in tool handlers

**Priority**: P0
**Estimate**: M
**File**: `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts`

**Implementation**:
Each tool should:
1. Generate unique request ID
2. Write request to `/workspace/ipc/github/{operation}_{id}.json`
3. Poll for `/workspace/ipc/github/{operation}_{id}.result`
4. Return result or timeout error

```typescript
async function callGitHubIPC(operation: string, params: any): Promise<any> {
  const id = Date.now().toString();
  const ipcDir = '/workspace/ipc/github';
  const requestFile = `${ipcDir}/${operation}_${id}.json`;
  const resultFile = `${ipcDir}/${operation}_${id}.result`;

  // Write request
  await fs.writeFile(requestFile, JSON.stringify({
    operation, id, timestamp: new Date().toISOString(), params
  }));

  // Poll for result
  const timeout = 30000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fs.exists(resultFile)) {
      const result = JSON.parse(await fs.readFile(resultFile, 'utf-8'));
      await fs.unlink(requestFile);
      await fs.unlink(resultFile);
      return result;
    }
    await sleep(500);
  }
  throw new Error(`GitHub IPC timeout: ${operation}`);
}
```

**Acceptance Criteria**:
- [ ] Request files created correctly
- [ ] Polling works with 500ms interval
- [ ] 30 second timeout
- [ ] Cleanup of request/result files

---

## Phase C: Update Skills

### T007: Update code-generation skill for IPC

**Priority**: P0
**Estimate**: S
**File**: `nanoclaw/container/skills/code-generation/SKILL.md`

**Implementation**:
Replace direct MCP calls with IPC tool usage:

```markdown
### GitHub Delivery (via IPC)

Use the IPC-based GitHub tools:

1. `github_create_repo` - Create repository
2. `github_push_files` - Push code
3. `github_create_branch` - Create update branch
4. `github_create_pr` - Create pull request
```

**Acceptance Criteria**:
- [ ] Skill references IPC tools
- [ ] Examples show correct tool usage
- [ ] Fallback to ZIP documented

---

### T008: Remove old MCP configuration from container-runner.ts

**Priority**: P1
**Estimate**: S
**File**: `nanoclaw/src/container-runner.ts`

**Implementation**:
Remove mcpServers config and token injection (no longer needed for GitHub):

```typescript
// Remove from settings.json:
// - mcpServers.github configuration
// - injectSecretsIntoSettings for GITHUB_PERSONAL_ACCESS_TOKEN

// Keep Context7 if using Claude Code directly
```

**Acceptance Criteria**:
- [ ] GitHub MCP config removed from settings.json
- [ ] Token injection simplified
- [ ] Context7 config remains (for Claude Code)

---

## Phase D: Testing

### T009: Create GitHub IPC test script

**Priority**: P1
**Estimate**: S
**File**: `nanoclaw/scripts/test-github-ipc.ts` (NEW)

**Implementation**:
Test script to verify IPC flow:

```typescript
// 1. Write test request to data/ipc/test/github/
// 2. Call processGitHubIPC
// 3. Verify result file created
// 4. Verify GitHub repo created
```

**Acceptance Criteria**:
- [ ] Test creates repo successfully
- [ ] Test pushes files successfully
- [ ] Test creates PR successfully

---

### T010: End-to-end test via WhatsApp

**Priority**: P1
**Estimate**: M
**File**: Manual test

**Test Steps**:
1. Start NanoClaw: `npm run dev`
2. Send WhatsApp: "Build me an FAQ bot, push to GitHub"
3. Answer delivery preference: "New GitHub repo"
4. Verify repo created on GitHub
5. Verify code pushed
6. Verify WhatsApp receives repo URL

**Acceptance Criteria**:
- [ ] Full flow works via WhatsApp
- [ ] Repo visible on GitHub
- [ ] Setup instructions in WhatsApp message

---

## Task Dependencies

```
T001 (dir structure)
    │
    ├──▶ T002 (github-ipc.ts) ──▶ T003 (ipc.ts watcher)
    │
    └──▶ T004 (@octokit/rest)
                                          │
T005 (container tools) ──▶ T006 (IPC impl) ──┤
                                          │
T007 (skill update) ◀─────────────────────┘
                    │
T008 (cleanup) ◀────┘
                    │
T009 (test script) ◀┘
    │
    ▼
T010 (E2E test)
```

---

## Summary

| Phase | Tasks | Priority | Status |
|-------|-------|----------|--------|
| A: Host IPC Infrastructure | T001-T004 | P0 | Complete |
| B: Container IPC Client | T005-T006 | P0 | Complete |
| C: Skill Updates | T007-T008 | P0-P1 | Complete |
| D: Testing | T009-T010 | P1 | Pending |

**Total Tasks**: 10
**Critical Path**: T001 → T002 → T003 → T005 → T006 → T007 → T010

## Implementation Notes (2026-02-21)

**Files Created/Modified:**
- `nanoclaw/src/github-ipc.ts` - NEW: GitHub IPC handlers using Octokit
- `nanoclaw/src/ipc.ts` - Added GitHub IPC watcher and processGitHubOperation import
- `nanoclaw/src/container-runner.ts` - Added github IPC directory, removed MCP config
- `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts` - Added 6 GitHub IPC tools
- `nanoclaw/container/skills/code-generation/SKILL.md` - Updated to use IPC tools
- `nanoclaw/package.json` - Added @octokit/rest dependency

**Build Status:** TypeScript build successful
