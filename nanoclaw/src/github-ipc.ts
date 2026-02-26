/**
 * GitHub IPC Handler for NanoClaw
 * Processes GitHub operations requested via IPC files from containers.
 * Uses Octokit to make GitHub API calls on behalf of the container.
 */
import { Octokit } from '@octokit/rest';
import { readEnvFile } from './env.js';
import { logger } from './logger.js';

// Initialize Octokit with the GitHub token from .env file
function getOctokit(): Octokit | null {
  const secrets = readEnvFile(['GITHUB_PERSONAL_ACCESS_TOKEN']);
  const token = secrets.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    logger.warn('GITHUB_PERSONAL_ACCESS_TOKEN not set in .env, GitHub IPC disabled');
    return null;
  }
  return new Octokit({ auth: token });
}

export interface GitHubIPCRequest {
  operation: string;
  id: string;
  timestamp: string;
  params: Record<string, unknown>;
}

export interface GitHubIPCResponse {
  success: boolean;
  id: string;
  timestamp: string;
  result?: Record<string, unknown>;
  error?: string;
}

/**
 * Process a GitHub IPC operation request
 */
export async function processGitHubOperation(
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const octokit = getOctokit();
  if (!octokit) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: 'GitHub token not configured',
    };
  }

  try {
    switch (request.operation) {
      case 'github_create_repo':
        return await handleCreateRepo(octokit, request);
      case 'github_push_files':
        return await handlePushFiles(octokit, request);
      case 'github_create_branch':
        return await handleCreateBranch(octokit, request);
      case 'github_create_pr':
        return await handleCreatePR(octokit, request);
      case 'github_get_file_contents':
        return await handleGetFileContents(octokit, request);
      case 'github_list_repos':
        return await handleListRepos(octokit, request);
      default:
        return {
          success: false,
          id: request.id,
          timestamp: new Date().toISOString(),
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    logger.error({ error, operation: request.operation }, 'GitHub IPC operation failed');
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create a new GitHub repository
 */
async function handleCreateRepo(
  octokit: Octokit,
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const params = request.params as {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
  };

  const { data } = await octokit.repos.createForAuthenticatedUser({
    name: params.name,
    description: params.description,
    private: params.private ?? true,
    auto_init: true,  // Always initialize with README so repo has a branch for pushing
  });

  logger.info({ repo: data.full_name }, 'GitHub repository created via IPC');

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      repo_url: data.html_url,
      clone_url: data.clone_url,
      owner: data.owner.login,
      name: data.name,
      full_name: data.full_name,
    },
  };
}

/**
 * Push files to a GitHub repository
 * Handles both empty repos (no commits) and repos with existing commits
 */
async function handlePushFiles(
  octokit: Octokit,
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const params = request.params as {
    owner: string;
    repo: string;
    branch: string;
    files: Array<{ path: string; content: string }>;
    message: string;
  };

  // Check if repo is empty (no commits/branches)
  let baseSha: string | null = null;
  let baseTreeSha: string | null = null;
  let isEmptyRepo = false;

  try {
    // Try to get the target branch reference
    const { data: ref } = await octokit.git.getRef({
      owner: params.owner,
      repo: params.repo,
      ref: `heads/${params.branch}`,
    });
    baseSha = ref.object.sha;
  } catch {
    // Branch doesn't exist, try default branch
    try {
      const { data: repoData } = await octokit.repos.get({
        owner: params.owner,
        repo: params.repo,
      });
      const { data: ref } = await octokit.git.getRef({
        owner: params.owner,
        repo: params.repo,
        ref: `heads/${repoData.default_branch}`,
      });
      baseSha = ref.object.sha;
    } catch {
      // No branches exist - this is an empty repo
      isEmptyRepo = true;
      logger.info({ repo: `${params.owner}/${params.repo}` }, 'Empty repo detected, creating initial commit');
    }
  }

  // Get base tree SHA if repo has commits
  if (baseSha) {
    const { data: baseCommit } = await octokit.git.getCommit({
      owner: params.owner,
      repo: params.repo,
      commit_sha: baseSha,
    });
    baseTreeSha = baseCommit.tree.sha;
  }

  // Create blobs for each file
  const tree = await Promise.all(
    params.files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner: params.owner,
        repo: params.repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      });
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      };
    }),
  );

  // Create tree - with or without base_tree depending on repo state
  const createTreeParams: {
    owner: string;
    repo: string;
    tree: typeof tree;
    base_tree?: string;
  } = {
    owner: params.owner,
    repo: params.repo,
    tree,
  };

  // Only include base_tree if repo has existing commits
  if (baseTreeSha) {
    createTreeParams.base_tree = baseTreeSha;
  }

  const { data: newTree } = await octokit.git.createTree(createTreeParams);

  // Create commit - with or without parents depending on repo state
  const createCommitParams: {
    owner: string;
    repo: string;
    message: string;
    tree: string;
    parents: string[];
  } = {
    owner: params.owner,
    repo: params.repo,
    message: params.message,
    tree: newTree.sha,
    parents: baseSha ? [baseSha] : [], // Empty parents for initial commit
  };

  const { data: newCommit } = await octokit.git.createCommit(createCommitParams);

  // Create or update branch reference
  if (isEmptyRepo) {
    // Create new branch for empty repo
    await octokit.git.createRef({
      owner: params.owner,
      repo: params.repo,
      ref: `refs/heads/${params.branch}`,
      sha: newCommit.sha,
    });
  } else {
    // Update existing branch
    try {
      await octokit.git.updateRef({
        owner: params.owner,
        repo: params.repo,
        ref: `heads/${params.branch}`,
        sha: newCommit.sha,
      });
    } catch {
      // Branch doesn't exist yet, create it
      await octokit.git.createRef({
        owner: params.owner,
        repo: params.repo,
        ref: `refs/heads/${params.branch}`,
        sha: newCommit.sha,
      });
    }
  }

  logger.info(
    { repo: `${params.owner}/${params.repo}`, branch: params.branch, files: params.files.length, isEmptyRepo },
    'Files pushed via IPC',
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      commit_sha: newCommit.sha,
      commit_url: newCommit.html_url,
      files_pushed: params.files.length,
    },
  };
}

/**
 * Create a new branch
 */
async function handleCreateBranch(
  octokit: Octokit,
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const params = request.params as {
    owner: string;
    repo: string;
    branch: string;
    from_branch?: string;
  };

  // Get the source branch SHA
  const { data: repoData } = await octokit.repos.get({
    owner: params.owner,
    repo: params.repo,
  });
  const sourceBranch = params.from_branch || repoData.default_branch;

  const { data: ref } = await octokit.git.getRef({
    owner: params.owner,
    repo: params.repo,
    ref: `heads/${sourceBranch}`,
  });

  // Create new branch
  await octokit.git.createRef({
    owner: params.owner,
    repo: params.repo,
    ref: `refs/heads/${params.branch}`,
    sha: ref.object.sha,
  });

  logger.info(
    { repo: `${params.owner}/${params.repo}`, branch: params.branch },
    'Branch created via IPC',
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      branch: params.branch,
      sha: ref.object.sha,
    },
  };
}

/**
 * Create a pull request
 */
async function handleCreatePR(
  octokit: Octokit,
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const params = request.params as {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body?: string;
    draft?: boolean;
  };

  const { data } = await octokit.pulls.create({
    owner: params.owner,
    repo: params.repo,
    title: params.title,
    head: params.head,
    base: params.base,
    body: params.body,
    draft: params.draft,
  });

  logger.info(
    { repo: `${params.owner}/${params.repo}`, pr: data.number },
    'Pull request created via IPC',
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      pr_number: data.number,
      pr_url: data.html_url,
      state: data.state,
    },
  };
}

/**
 * Get file contents from a repository
 */
async function handleGetFileContents(
  octokit: Octokit,
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const params = request.params as {
    owner: string;
    repo: string;
    path: string;
    branch?: string;
  };

  const { data } = await octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.branch,
  });

  // Handle file content (not directory)
  if ('content' in data && 'encoding' in data) {
    const content =
      data.encoding === 'base64'
        ? Buffer.from(data.content, 'base64').toString('utf-8')
        : data.content;

    return {
      success: true,
      id: request.id,
      timestamp: new Date().toISOString(),
      result: {
        content,
        sha: data.sha,
        size: data.size,
        name: data.name,
        path: data.path,
      },
    };
  }

  // Directory listing
  if (Array.isArray(data)) {
    return {
      success: true,
      id: request.id,
      timestamp: new Date().toISOString(),
      result: {
        type: 'directory',
        entries: data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          sha: item.sha,
        })),
      },
    };
  }

  return {
    success: false,
    id: request.id,
    timestamp: new Date().toISOString(),
    error: 'Unexpected content type',
  };
}

/**
 * List repositories for the authenticated user
 */
async function handleListRepos(
  octokit: Octokit,
  request: GitHubIPCRequest,
): Promise<GitHubIPCResponse> {
  const params = request.params as {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    per_page?: number;
  };

  const { data } = await octokit.repos.listForAuthenticatedUser({
    type: params.type || 'owner',
    sort: params.sort || 'updated',
    per_page: params.per_page || 30,
  });

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      repositories: data.map((repo) => ({
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        description: repo.description,
        private: repo.private,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
      })),
      count: data.length,
    },
  };
}
