/**
 * Stdio MCP Server for NanoClaw
 * Standalone process that agent teams subagents can inherit.
 * Reads context from environment variables, writes IPC files for the host.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { CronExpressionParser } from 'cron-parser';

const IPC_DIR = '/workspace/ipc';
const MESSAGES_DIR = path.join(IPC_DIR, 'messages');
const TASKS_DIR = path.join(IPC_DIR, 'tasks');
const GITHUB_DIR = path.join(IPC_DIR, 'github');

// GitHub IPC timeout and polling configuration
const GITHUB_IPC_TIMEOUT = 30000; // 30 seconds
const GITHUB_IPC_POLL_INTERVAL = 500; // 500ms

// Context from environment variables (set by the agent runner)
const chatJid = process.env.NANOCLAW_CHAT_JID!;
const groupFolder = process.env.NANOCLAW_GROUP_FOLDER!;
const isMain = process.env.NANOCLAW_IS_MAIN === '1';

function writeIpcFile(dir: string, data: object): string {
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const filepath = path.join(dir, filename);

  // Atomic write: temp file then rename
  const tempPath = `${filepath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, filepath);

  return filename;
}

/**
 * Call GitHub operation via IPC.
 * Writes a request file and polls for the result file.
 */
async function callGitHubIPC(operation: string, params: object): Promise<{
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}> {
  fs.mkdirSync(GITHUB_DIR, { recursive: true });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const requestFile = path.join(GITHUB_DIR, `${operation}_${id}.json`);
  const resultFile = path.join(GITHUB_DIR, `${operation}_${id}.result`);

  // Write request file
  const request = {
    operation,
    id,
    timestamp: new Date().toISOString(),
    params,
  };

  // Atomic write
  const tempPath = `${requestFile}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(request, null, 2));
  fs.renameSync(tempPath, requestFile);

  // Poll for result
  const startTime = Date.now();
  while (Date.now() - startTime < GITHUB_IPC_TIMEOUT) {
    if (fs.existsSync(resultFile)) {
      const result = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));

      // Cleanup files
      try {
        fs.unlinkSync(requestFile);
        fs.unlinkSync(resultFile);
      } catch {
        // Ignore cleanup errors
      }

      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, GITHUB_IPC_POLL_INTERVAL));
  }

  // Cleanup on timeout
  try {
    fs.unlinkSync(requestFile);
  } catch {
    // Ignore cleanup errors
  }

  return {
    success: false,
    error: `GitHub IPC timeout after ${GITHUB_IPC_TIMEOUT}ms: ${operation}`,
  };
}

const server = new McpServer({
  name: 'nanoclaw',
  version: '1.0.0',
});

server.tool(
  'send_message',
  "Send a message to the user or group immediately while you're still running. Use this for progress updates or to send multiple messages. You can call this multiple times. Note: when running as a scheduled task, your final output is NOT sent to the user — use this tool if you need to communicate with the user or group.",
  {
    text: z.string().describe('The message text to send'),
    sender: z.string().optional().describe('Your role/identity name (e.g. "Researcher"). When set, messages appear from a dedicated bot in Telegram.'),
  },
  async (args) => {
    const data: Record<string, string | undefined> = {
      type: 'message',
      chatJid,
      text: args.text,
      sender: args.sender || undefined,
      groupFolder,
      timestamp: new Date().toISOString(),
    };

    writeIpcFile(MESSAGES_DIR, data);

    return { content: [{ type: 'text' as const, text: 'Message sent.' }] };
  },
);

server.tool(
  'schedule_task',
  `Schedule a recurring or one-time task. The task will run as a full agent with access to all tools.

CONTEXT MODE - Choose based on task type:
\u2022 "group": Task runs in the group's conversation context, with access to chat history. Use for tasks that need context about ongoing discussions, user preferences, or recent interactions.
\u2022 "isolated": Task runs in a fresh session with no conversation history. Use for independent tasks that don't need prior context. When using isolated mode, include all necessary context in the prompt itself.

If unsure which mode to use, you can ask the user. Examples:
- "Remind me about our discussion" \u2192 group (needs conversation context)
- "Check the weather every morning" \u2192 isolated (self-contained task)
- "Follow up on my request" \u2192 group (needs to know what was requested)
- "Generate a daily report" \u2192 isolated (just needs instructions in prompt)

MESSAGING BEHAVIOR - The task agent's output is sent to the user or group. It can also use send_message for immediate delivery, or wrap output in <internal> tags to suppress it. Include guidance in the prompt about whether the agent should:
\u2022 Always send a message (e.g., reminders, daily briefings)
\u2022 Only send a message when there's something to report (e.g., "notify me if...")
\u2022 Never send a message (background maintenance tasks)

SCHEDULE VALUE FORMAT (all times are LOCAL timezone):
\u2022 cron: Standard cron expression (e.g., "*/5 * * * *" for every 5 minutes, "0 9 * * *" for daily at 9am LOCAL time)
\u2022 interval: Milliseconds between runs (e.g., "300000" for 5 minutes, "3600000" for 1 hour)
\u2022 once: Local time WITHOUT "Z" suffix (e.g., "2026-02-01T15:30:00"). Do NOT use UTC/Z suffix.`,
  {
    prompt: z.string().describe('What the agent should do when the task runs. For isolated mode, include all necessary context here.'),
    schedule_type: z.enum(['cron', 'interval', 'once']).describe('cron=recurring at specific times, interval=recurring every N ms, once=run once at specific time'),
    schedule_value: z.string().describe('cron: "*/5 * * * *" | interval: milliseconds like "300000" | once: local timestamp like "2026-02-01T15:30:00" (no Z suffix!)'),
    context_mode: z.enum(['group', 'isolated']).default('group').describe('group=runs with chat history and memory, isolated=fresh session (include context in prompt)'),
    target_group_jid: z.string().optional().describe('(Main group only) JID of the group to schedule the task for. Defaults to the current group.'),
  },
  async (args) => {
    // Validate schedule_value before writing IPC
    if (args.schedule_type === 'cron') {
      try {
        CronExpressionParser.parse(args.schedule_value);
      } catch {
        return {
          content: [{ type: 'text' as const, text: `Invalid cron: "${args.schedule_value}". Use format like "0 9 * * *" (daily 9am) or "*/5 * * * *" (every 5 min).` }],
          isError: true,
        };
      }
    } else if (args.schedule_type === 'interval') {
      const ms = parseInt(args.schedule_value, 10);
      if (isNaN(ms) || ms <= 0) {
        return {
          content: [{ type: 'text' as const, text: `Invalid interval: "${args.schedule_value}". Must be positive milliseconds (e.g., "300000" for 5 min).` }],
          isError: true,
        };
      }
    } else if (args.schedule_type === 'once') {
      const date = new Date(args.schedule_value);
      if (isNaN(date.getTime())) {
        return {
          content: [{ type: 'text' as const, text: `Invalid timestamp: "${args.schedule_value}". Use ISO 8601 format like "2026-02-01T15:30:00.000Z".` }],
          isError: true,
        };
      }
    }

    // Non-main groups can only schedule for themselves
    const targetJid = isMain && args.target_group_jid ? args.target_group_jid : chatJid;

    const data = {
      type: 'schedule_task',
      prompt: args.prompt,
      schedule_type: args.schedule_type,
      schedule_value: args.schedule_value,
      context_mode: args.context_mode || 'group',
      targetJid,
      createdBy: groupFolder,
      timestamp: new Date().toISOString(),
    };

    const filename = writeIpcFile(TASKS_DIR, data);

    return {
      content: [{ type: 'text' as const, text: `Task scheduled (${filename}): ${args.schedule_type} - ${args.schedule_value}` }],
    };
  },
);

server.tool(
  'list_tasks',
  "List all scheduled tasks. From main: shows all tasks. From other groups: shows only that group's tasks.",
  {},
  async () => {
    const tasksFile = path.join(IPC_DIR, 'current_tasks.json');

    try {
      if (!fs.existsSync(tasksFile)) {
        return { content: [{ type: 'text' as const, text: 'No scheduled tasks found.' }] };
      }

      const allTasks = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));

      const tasks = isMain
        ? allTasks
        : allTasks.filter((t: { groupFolder: string }) => t.groupFolder === groupFolder);

      if (tasks.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No scheduled tasks found.' }] };
      }

      const formatted = tasks
        .map(
          (t: { id: string; prompt: string; schedule_type: string; schedule_value: string; status: string; next_run: string }) =>
            `- [${t.id}] ${t.prompt.slice(0, 50)}... (${t.schedule_type}: ${t.schedule_value}) - ${t.status}, next: ${t.next_run || 'N/A'}`,
        )
        .join('\n');

      return { content: [{ type: 'text' as const, text: `Scheduled tasks:\n${formatted}` }] };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error reading tasks: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  },
);

server.tool(
  'pause_task',
  'Pause a scheduled task. It will not run until resumed.',
  { task_id: z.string().describe('The task ID to pause') },
  async (args) => {
    const data = {
      type: 'pause_task',
      taskId: args.task_id,
      groupFolder,
      isMain,
      timestamp: new Date().toISOString(),
    };

    writeIpcFile(TASKS_DIR, data);

    return { content: [{ type: 'text' as const, text: `Task ${args.task_id} pause requested.` }] };
  },
);

server.tool(
  'resume_task',
  'Resume a paused task.',
  { task_id: z.string().describe('The task ID to resume') },
  async (args) => {
    const data = {
      type: 'resume_task',
      taskId: args.task_id,
      groupFolder,
      isMain,
      timestamp: new Date().toISOString(),
    };

    writeIpcFile(TASKS_DIR, data);

    return { content: [{ type: 'text' as const, text: `Task ${args.task_id} resume requested.` }] };
  },
);

server.tool(
  'cancel_task',
  'Cancel and delete a scheduled task.',
  { task_id: z.string().describe('The task ID to cancel') },
  async (args) => {
    const data = {
      type: 'cancel_task',
      taskId: args.task_id,
      groupFolder,
      isMain,
      timestamp: new Date().toISOString(),
    };

    writeIpcFile(TASKS_DIR, data);

    return { content: [{ type: 'text' as const, text: `Task ${args.task_id} cancellation requested.` }] };
  },
);

server.tool(
  'register_group',
  `Register a new WhatsApp group so the agent can respond to messages there. Main group only.

Use available_groups.json to find the JID for a group. The folder name should be lowercase with hyphens (e.g., "family-chat").`,
  {
    jid: z.string().describe('The WhatsApp JID (e.g., "120363336345536173@g.us")'),
    name: z.string().describe('Display name for the group'),
    folder: z.string().describe('Folder name for group files (lowercase, hyphens, e.g., "family-chat")'),
    trigger: z.string().describe('Trigger word (e.g., "@Andy")'),
  },
  async (args) => {
    if (!isMain) {
      return {
        content: [{ type: 'text' as const, text: 'Only the main group can register new groups.' }],
        isError: true,
      };
    }

    const data = {
      type: 'register_group',
      jid: args.jid,
      name: args.name,
      folder: args.folder,
      trigger: args.trigger,
      timestamp: new Date().toISOString(),
    };

    writeIpcFile(TASKS_DIR, data);

    return {
      content: [{ type: 'text' as const, text: `Group "${args.name}" registered. It will start receiving messages immediately.` }],
    };
  },
);

// ============================================================================
// GitHub IPC Tools
// These tools communicate with the host via IPC files to perform GitHub operations.
// The host processes requests using Octokit and writes results back.
// ============================================================================

server.tool(
  'github_create_repo',
  `Create a new GitHub repository. The repository will be created under the authenticated user's account.

Returns: repo_url, clone_url, owner, name, full_name`,
  {
    name: z.string().describe('Repository name (e.g., "my-project")'),
    description: z.string().optional().describe('Repository description'),
    private: z.boolean().optional().default(true).describe('Whether the repository should be private (default: true)'),
    auto_init: z.boolean().optional().default(false).describe('Initialize with README.md (default: false)'),
  },
  async (args) => {
    const result = await callGitHubIPC('github_create_repo', {
      name: args.name,
      description: args.description,
      private: args.private,
      auto_init: args.auto_init,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to create repository: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    return {
      content: [{
        type: 'text' as const,
        text: `Repository created successfully!\n\nURL: ${r.repo_url}\nClone: ${r.clone_url}\nOwner: ${r.owner}\nName: ${r.name}`,
      }],
    };
  },
);

server.tool(
  'github_push_files',
  `Push multiple files to a GitHub repository in a single commit.

Use this to push code files after generating them. All files are committed together.`,
  {
    owner: z.string().describe('Repository owner (username)'),
    repo: z.string().describe('Repository name'),
    branch: z.string().describe('Branch name to push to (e.g., "main")'),
    files: z.array(z.object({
      path: z.string().describe('File path in the repository (e.g., "src/index.ts")'),
      content: z.string().describe('File content'),
    })).describe('Array of files to push'),
    message: z.string().describe('Commit message'),
  },
  async (args) => {
    const result = await callGitHubIPC('github_push_files', {
      owner: args.owner,
      repo: args.repo,
      branch: args.branch,
      files: args.files,
      message: args.message,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to push files: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    return {
      content: [{
        type: 'text' as const,
        text: `Files pushed successfully!\n\nCommit: ${r.commit_sha}\nFiles pushed: ${r.files_pushed}`,
      }],
    };
  },
);

server.tool(
  'github_create_branch',
  `Create a new branch in a GitHub repository.

Use this before pushing updates to create a feature branch.`,
  {
    owner: z.string().describe('Repository owner (username)'),
    repo: z.string().describe('Repository name'),
    branch: z.string().describe('New branch name (e.g., "update-v2")'),
    from_branch: z.string().optional().describe('Source branch to create from (defaults to default branch)'),
  },
  async (args) => {
    const result = await callGitHubIPC('github_create_branch', {
      owner: args.owner,
      repo: args.repo,
      branch: args.branch,
      from_branch: args.from_branch,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to create branch: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    return {
      content: [{
        type: 'text' as const,
        text: `Branch created successfully!\n\nBranch: ${r.branch}\nSHA: ${r.sha}`,
      }],
    };
  },
);

server.tool(
  'github_create_pr',
  `Create a pull request in a GitHub repository.

Use this after pushing changes to a feature branch to create a PR for review.`,
  {
    owner: z.string().describe('Repository owner (username)'),
    repo: z.string().describe('Repository name'),
    title: z.string().describe('Pull request title'),
    head: z.string().describe('Branch containing changes (e.g., "update-v2")'),
    base: z.string().describe('Target branch to merge into (e.g., "main")'),
    body: z.string().optional().describe('Pull request description/body'),
    draft: z.boolean().optional().default(false).describe('Create as draft PR'),
  },
  async (args) => {
    const result = await callGitHubIPC('github_create_pr', {
      owner: args.owner,
      repo: args.repo,
      title: args.title,
      head: args.head,
      base: args.base,
      body: args.body,
      draft: args.draft,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to create pull request: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    return {
      content: [{
        type: 'text' as const,
        text: `Pull request created successfully!\n\nPR #${r.pr_number}: ${r.pr_url}`,
      }],
    };
  },
);

server.tool(
  'github_get_file_contents',
  `Get the contents of a file or directory from a GitHub repository.

Use this to read existing code when making updates.`,
  {
    owner: z.string().describe('Repository owner (username)'),
    repo: z.string().describe('Repository name'),
    path: z.string().describe('File or directory path (e.g., "src/index.ts")'),
    branch: z.string().optional().describe('Branch name (defaults to default branch)'),
  },
  async (args) => {
    const result = await callGitHubIPC('github_get_file_contents', {
      owner: args.owner,
      repo: args.repo,
      path: args.path,
      branch: args.branch,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to get file contents: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;

    if (r.type === 'directory') {
      const entries = r.entries as Array<{ name: string; path: string; type: string }>;
      const listing = entries.map((e) => `${e.type === 'dir' ? '[DIR]' : '[FILE]'} ${e.path}`).join('\n');
      return {
        content: [{
          type: 'text' as const,
          text: `Directory listing for ${args.path}:\n\n${listing}`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `File: ${r.path}\nSize: ${r.size} bytes\n\n---\n${r.content}`,
      }],
    };
  },
);

server.tool(
  'github_list_repos',
  `List GitHub repositories for the authenticated user.

Use this to find existing repositories or check if a repo already exists.`,
  {
    type: z.enum(['all', 'owner', 'member']).optional().default('owner').describe('Repository type filter'),
    sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional().default('updated').describe('Sort order'),
    per_page: z.number().optional().default(30).describe('Number of results per page (max 100)'),
  },
  async (args) => {
    const result = await callGitHubIPC('github_list_repos', {
      type: args.type,
      sort: args.sort,
      per_page: args.per_page,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to list repositories: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    const repos = r.repositories as Array<{
      full_name: string;
      html_url: string;
      description: string | null;
      private: boolean;
    }>;

    if (repos.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No repositories found.' }],
      };
    }

    const listing = repos.map((repo) =>
      `${repo.private ? '[PRIVATE]' : '[PUBLIC]'} ${repo.full_name}\n  ${repo.description || '(no description)'}\n  ${repo.html_url}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${repos.length} repositories:\n\n${listing}`,
      }],
    };
  },
);

// ============================================================================
// Template IPC Tools
// These tools communicate with the host via IPC files for template operations.
// Templates are pre-built OpenAI Agents SDK code patterns for rapid generation.
// ============================================================================

const TEMPLATES_DIR = path.join(IPC_DIR, 'templates');
const TEMPLATE_IPC_TIMEOUT = 10000; // 10 seconds
const TEMPLATE_IPC_POLL_INTERVAL = 200; // 200ms

/**
 * Call template operation via IPC.
 * Writes a request file and polls for the result file.
 */
async function callTemplateIPC(operation: string, params: object): Promise<{
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}> {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const requestFile = path.join(TEMPLATES_DIR, `${operation}_${id}.json`);
  const resultFile = path.join(TEMPLATES_DIR, `${operation}_${id}.result`);

  // Write request file
  const request = {
    operation,
    id,
    timestamp: new Date().toISOString(),
    params,
  };

  // Atomic write
  const tempPath = `${requestFile}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(request, null, 2));
  fs.renameSync(tempPath, requestFile);

  // Poll for result
  const startTime = Date.now();
  while (Date.now() - startTime < TEMPLATE_IPC_TIMEOUT) {
    if (fs.existsSync(resultFile)) {
      const result = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));

      // Cleanup files
      try {
        fs.unlinkSync(requestFile);
        fs.unlinkSync(resultFile);
      } catch {
        // Ignore cleanup errors
      }

      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, TEMPLATE_IPC_POLL_INTERVAL));
  }

  // Cleanup on timeout
  try {
    fs.unlinkSync(requestFile);
  } catch {
    // Ignore cleanup errors
  }

  return {
    success: false,
    error: `Template IPC timeout after ${TEMPLATE_IPC_TIMEOUT}ms: ${operation}`,
  };
}

server.tool(
  'list_templates',
  `List all available agent templates.

Templates are pre-built OpenAI Agents SDK patterns that can be customized.
Returns template names, descriptions, complexity, and keywords.

Use this to show available templates to the client before matching.`,
  {},
  async () => {
    const result = await callTemplateIPC('list_templates', {});

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to list templates: ${result.error}` }],
        isError: true,
      };
    }

    const templates = result.result!.templates as Array<{
      name: string;
      displayName: string;
      description: string;
      complexity: string;
      keywords: string[];
    }>;

    if (templates.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No templates found.' }],
      };
    }

    const listing = templates.map((t) =>
      `**${t.displayName}** (${t.name})\n  ${t.description}\n  Complexity: ${t.complexity}\n  Keywords: ${t.keywords.slice(0, 5).join(', ')}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Available templates (${templates.length}):\n\n${listing}`,
      }],
    };
  },
);

server.tool(
  'match_template',
  `Match a client request to the best template using keyword matching.

Returns the best matching template name and confidence score.
If score >= 2, the template is a good match.
If score < 2, fallback to custom generation.

Example: "I need a customer support bot" → customer-support (score: 2)`,
  {
    request: z.string().describe('Client request text describing what they want to build'),
    min_score: z.number().optional().default(2).describe('Minimum keyword matches required (default: 2)'),
  },
  async (args) => {
    const result = await callTemplateIPC('match_template', {
      request: args.request,
      min_score: args.min_score,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to match template: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;

    if (!r.template) {
      return {
        content: [{
          type: 'text' as const,
          text: `No template matched for: "${args.request}"\n\nFallback to custom generation recommended.`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Template matched: ${r.template}\nConfidence score: ${r.score}\nMatched keywords: ${(r.matched_keywords as string[]).join(', ')}\n\nUse load_template to get template details.`,
      }],
    };
  },
);

server.tool(
  'load_template',
  `Load a specific template with its metadata, files, and variables.

Returns:
- metadata: Template info (name, description, features)
- files: Template file contents
- variables: Required and optional customization variables

Use this after match_template to get template details before generating.`,
  {
    name: z.string().describe('Template name (e.g., "basic-chatbot", "customer-support")'),
  },
  async (args) => {
    const result = await callTemplateIPC('load_template', {
      name: args.name,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to load template: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    const metadata = r.metadata as {
      name: string;
      displayName: string;
      description: string;
      variables: Array<{ name: string; description: string; required: boolean; default?: string }>;
    };

    const variablesList = metadata.variables.map((v) =>
      `- ${v.name}${v.required ? ' (required)' : ''}: ${v.description}${v.default ? ` [default: ${v.default}]` : ''}`
    ).join('\n');

    const filesList = Object.keys(r.files as object).join('\n- ');

    return {
      content: [{
        type: 'text' as const,
        text: `Template: ${metadata.displayName}\n\n${metadata.description}\n\n**Variables to customize:**\n${variablesList}\n\n**Files included:**\n- ${filesList}\n\nUse generate_from_template with variables to generate code.`,
      }],
    };
  },
);

server.tool(
  'generate_from_template',
  `Generate code from a template with customizations.

Takes a template name and variable substitutions.
Returns generated files ready for delivery (WhatsApp ZIP or GitHub).

Example:
  template_name: "basic-chatbot"
  variables: {
    "AGENT_NAME": "HelpBot",
    "DOMAIN": "E-commerce",
    "USE_WEB_SEARCH": "true"
  }`,
  {
    template_name: z.string().describe('Template name to generate from'),
    variables: z.record(z.string()).describe('Variable substitutions (key-value pairs)'),
    output_dir: z.string().optional().describe('Output directory for generated files (defaults to temp)'),
  },
  async (args) => {
    const result = await callTemplateIPC('generate_from_template', {
      template_name: args.template_name,
      variables: args.variables,
      output_dir: args.output_dir,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to generate from template: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    const files = r.files as Record<string, string>;
    const filesList = Object.keys(files).join('\n- ');

    return {
      content: [{
        type: 'text' as const,
        text: `Generated ${Object.keys(files).length} files from ${args.template_name} template:\n\n- ${filesList}\n\nOutput directory: ${r.output_dir}\n\nFiles are ready for delivery via WhatsApp ZIP or GitHub.`,
      }],
    };
  },
);

// ============================================================================
// Frontend Template IPC Tools
// These tools handle frontend/UI templates (Next.js, ChatKit, etc.)
// Separate from backend templates to support full-stack generation.
// ============================================================================

server.tool(
  'is_frontend_request',
  `Check if a client request is asking for frontend/UI.

Detects keywords like: website, frontend, UI, landing page, chat widget, nextjs, etc.
Use this to determine if you should use frontend templates instead of backend templates.

Returns: true if request is for frontend, false otherwise.`,
  {
    request: z.string().describe('Client request text to analyze'),
  },
  async (args) => {
    const result = await callTemplateIPC('is_frontend_request', {
      request: args.request,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to check frontend request: ${result.error}` }],
        isError: true,
      };
    }

    const isFrontend = result.result!.is_frontend as boolean;

    return {
      content: [{
        type: 'text' as const,
        text: isFrontend
          ? `✅ This IS a frontend request. Use frontend templates (nextjs-chatkit-ui, etc.)`
          : `❌ This is NOT a frontend request. Use backend templates.`,
      }],
    };
  },
);

server.tool(
  'list_frontend_templates',
  `List all available frontend templates.

Frontend templates include: Next.js websites, ChatKit widgets, landing pages.
Returns template names, descriptions, framework, and keywords.

Use this to show frontend options to the client.`,
  {},
  async () => {
    const result = await callTemplateIPC('list_frontend_templates', {});

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to list frontend templates: ${result.error}` }],
        isError: true,
      };
    }

    const templates = result.result!.templates as Array<{
      name: string;
      displayName: string;
      description: string;
      complexity: string;
      framework: string;
      keywords: string[];
    }>;

    if (templates.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No frontend templates found.' }],
      };
    }

    const listing = templates.map((t) =>
      `**${t.displayName}** (${t.name})\n  ${t.description}\n  Framework: ${t.framework} | Complexity: ${t.complexity}\n  Keywords: ${t.keywords.slice(0, 5).join(', ')}`
    ).join('\n\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Available frontend templates (${templates.length}):\n\n${listing}`,
      }],
    };
  },
);

server.tool(
  'match_frontend_template',
  `Match a client request to the best frontend template.

Returns the best matching frontend template name and confidence score.
Use this when client asks for: website, UI, landing page, chat widget, etc.

Example: "I need a website with chat" → nextjs-chatkit-ui (score: 3)`,
  {
    request: z.string().describe('Client request text describing what they want'),
    min_score: z.number().optional().default(1).describe('Minimum keyword matches required (default: 1)'),
  },
  async (args) => {
    const result = await callTemplateIPC('match_frontend_template', {
      request: args.request,
      min_score: args.min_score,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to match frontend template: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;

    if (!r.template) {
      return {
        content: [{
          type: 'text' as const,
          text: `No frontend template matched for: "${args.request}"\n\nAvailable frontend templates: nextjs-chatkit-ui`,
        }],
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Frontend template matched: ${r.template}\nConfidence score: ${r.score}\nMatched keywords: ${(r.matched_keywords as string[]).join(', ')}\n\nUse load_frontend_template to get template details.`,
      }],
    };
  },
);

server.tool(
  'load_frontend_template',
  `Load a frontend template with its metadata, files, and variables.

Returns:
- metadata: Template info (name, framework, features)
- files: Template file contents (components, pages, etc.)
- variables: Customization variables (project name, colors, etc.)

Use this after match_frontend_template to get details before generating.`,
  {
    name: z.string().describe('Frontend template name (e.g., "nextjs-chatkit-ui")'),
  },
  async (args) => {
    const result = await callTemplateIPC('load_frontend_template', {
      name: args.name,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to load frontend template: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    const metadata = r.metadata as {
      name: string;
      displayName: string;
      description: string;
      framework: string;
      variables: Array<{ name: string; description: string; required: boolean; default?: string }>;
    };

    const variablesList = metadata.variables.map((v) =>
      `- ${v.name}${v.required ? ' (required)' : ''}: ${v.description}${v.default ? ` [default: ${v.default}]` : ''}`
    ).join('\n');

    const filesList = Object.keys(r.files as object).join('\n- ');

    return {
      content: [{
        type: 'text' as const,
        text: `Frontend Template: ${metadata.displayName}\nFramework: ${metadata.framework}\n\n${metadata.description}\n\n**Variables to customize:**\n${variablesList}\n\n**Files included:**\n- ${filesList}\n\nUse generate_frontend_from_template with variables to generate code.`,
      }],
    };
  },
);

server.tool(
  'generate_frontend_from_template',
  `Generate frontend code from a template with customizations.

Takes a frontend template name and variable substitutions.
Returns generated files ready for delivery.

IMPORTANT: Always use this for frontend generation instead of writing custom code.
This ensures proper ChatKit integration and consistent component structure.

Example:
  template_name: "nextjs-chatkit-ui"
  variables: {
    "PROJECT_NAME": "my-saas",
    "PROJECT_TITLE": "My SaaS App",
    "COMPANY_NAME": "Acme Inc",
    "BACKEND_URL": "http://localhost:8000/chatkit"
  }`,
  {
    template_name: z.string().describe('Frontend template name to generate from'),
    variables: z.record(z.string()).describe('Variable substitutions (key-value pairs)'),
    output_dir: z.string().optional().describe('Output directory for generated files'),
  },
  async (args) => {
    const result = await callTemplateIPC('generate_frontend_from_template', {
      template_name: args.template_name,
      variables: args.variables,
      output_dir: args.output_dir,
    });

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to generate frontend from template: ${result.error}` }],
        isError: true,
      };
    }

    const r = result.result!;
    const files = r.files as Record<string, string>;
    const fileCount = Object.keys(files).length;

    // Categorize files
    const components = Object.keys(files).filter(f => f.includes('/components/')).length;
    const pages = Object.keys(files).filter(f => f.includes('/app/')).length;
    const configs = Object.keys(files).filter(f => f.endsWith('.json') || f.endsWith('.config.js') || f.endsWith('.config.ts')).length;

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Generated ${fileCount} frontend files from ${args.template_name} template:\n\n📁 Summary:\n- Components: ${components} files\n- Pages: ${pages} files\n- Configs: ${configs} files\n\nOutput directory: ${r.output_dir}\n\n🚀 Next steps:\n1. cd frontend\n2. npm install\n3. npm run dev\n\nFiles are ready for delivery via WhatsApp ZIP or GitHub.`,
      }],
    };
  },
);

// ============================================================================
// Context7 Tools
// Query up-to-date documentation for any library/framework
// ============================================================================

const CONTEXT7_API_BASE = 'https://api.context7.com/v1';

/**
 * Call Context7 API to resolve library ID
 */
async function resolveContext7LibraryId(
  query: string,
  libraryName: string
): Promise<{ success: boolean; libraries?: Array<Record<string, unknown>>; error?: string }> {
  try {
    const response = await fetch(`${CONTEXT7_API_BASE}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        libraryName,
      }),
    });

    if (!response.ok) {
      // Fallback: try direct library ID format
      const directId = `/${libraryName.replace(/\s+/g, '-').toLowerCase()}`;
      return {
        success: true,
        libraries: [{
          libraryId: directId,
          name: libraryName,
          description: `Documentation for ${libraryName}`,
          snippets: 0,
          sourceReputation: 'Unknown',
        }],
      };
    }

    const data = await response.json();
    return { success: true, libraries: data.libraries || [] };
  } catch (error) {
    // Fallback for network errors - return common library patterns
    const commonLibraries: Record<string, string> = {
      'openai agents sdk': '/openai/openai-agents-python',
      'openai-agents': '/openai/openai-agents-python',
      'chatkit': '/openai/chatkit-js',
      'chatkit-react': '/openai/chatkit-js',
      'nextjs': '/vercel/next.js',
      'next.js': '/vercel/next.js',
      'react': '/facebook/react',
      'fastapi': '/tiangolo/fastapi',
      'pydantic': '/pydantic/pydantic',
    };

    const lowerName = libraryName.toLowerCase();
    for (const [key, id] of Object.entries(commonLibraries)) {
      if (lowerName.includes(key)) {
        return {
          success: true,
          libraries: [{
            libraryId: id,
            name: libraryName,
            description: `Documentation for ${libraryName}`,
            snippets: 50,
            sourceReputation: 'High',
          }],
        };
      }
    }

    return {
      success: false,
      error: `Failed to resolve library: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Call Context7 API to query documentation
 */
async function queryContext7Docs(
  libraryId: string,
  query: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(`${CONTEXT7_API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libraryId,
        query,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Context7 API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, content: data.content || data.text || JSON.stringify(data) };
  } catch (error) {
    return {
      success: false,
      error: `Failed to query docs: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

server.tool(
  'context7_resolve_library',
  `Resolve a library/package name to a Context7 library ID.

Use this tool to find the correct library ID before querying documentation.
Returns matching libraries with their IDs, descriptions, and quality scores.

Common library IDs:
- OpenAI Agents SDK: /openai/openai-agents-python
- ChatKit React: /openai/chatkit-js
- Next.js: /vercel/next.js
- FastAPI: /tiangolo/fastapi
- React: /facebook/react

Example:
  libraryName: "openai agents sdk"
  query: "How to create an agent with tools"`,
  {
    libraryName: z.string().describe('Library name to search for (e.g., "openai agents sdk", "chatkit-react", "nextjs")'),
    query: z.string().describe('What you want to learn about this library'),
  },
  async (args) => {
    const result = await resolveContext7LibraryId(args.query, args.libraryName);

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to resolve library: ${result.error}` }],
        isError: true,
      };
    }

    const libraries = result.libraries || [];
    if (libraries.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `No libraries found for "${args.libraryName}". Try a different name or check spelling.`,
        }],
      };
    }

    const listing = libraries.slice(0, 5).map((lib) => {
      const id = lib.libraryId || lib.id || 'unknown';
      const name = lib.name || args.libraryName;
      const desc = lib.description || 'No description';
      const snippets = lib.snippets || lib.codeSnippets || 0;
      const rep = lib.sourceReputation || 'Unknown';
      return `**${name}**\n  ID: ${id}\n  ${desc}\n  Snippets: ${snippets} | Reputation: ${rep}`;
    }).join('\n\n');

    const bestMatch = libraries[0];
    const bestId = bestMatch.libraryId || bestMatch.id;

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${libraries.length} matching libraries:\n\n${listing}\n\n✅ Best match: ${bestId}\n\nUse context7_query_docs with this library ID to get documentation.`,
      }],
    };
  },
);

server.tool(
  'context7_query_docs',
  `Query up-to-date documentation for a library using Context7.

Use this AFTER resolving the library ID with context7_resolve_library.
Returns relevant documentation, code examples, and API references.

Common library IDs (can use directly):
- /openai/openai-agents-python - OpenAI Agents SDK
- /openai/chatkit-js - ChatKit React
- /vercel/next.js - Next.js
- /tiangolo/fastapi - FastAPI

Example:
  libraryId: "/openai/openai-agents-python"
  query: "How to use WebSearchTool with an agent"`,
  {
    libraryId: z.string().describe('Context7 library ID (e.g., "/openai/openai-agents-python")'),
    query: z.string().describe('Specific question about the library'),
  },
  async (args) => {
    const result = await queryContext7Docs(args.libraryId, args.query);

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Failed to query documentation: ${result.error}` }],
        isError: true,
      };
    }

    const content = result.content || 'No documentation found for this query.';

    // Truncate if too long
    const maxLength = 8000;
    const truncated = content.length > maxLength
      ? content.substring(0, maxLength) + '\n\n... (truncated)'
      : content;

    return {
      content: [{
        type: 'text' as const,
        text: `📚 Documentation for ${args.libraryId}:\n\nQuery: "${args.query}"\n\n${truncated}`,
      }],
    };
  },
);

// Start the stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
