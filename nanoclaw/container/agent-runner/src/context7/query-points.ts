/**
 * Context7 Query Points
 *
 * Defines all mandatory SDK query points for Context7 verification.
 * These queries ensure templates and references stay up-to-date with latest SDK patterns.
 */

import { QueryPoint } from './types.js';

// Re-export QueryPoint type for consumers
export type { QueryPoint } from './types.js';

/**
 * All mandatory query points for Context7 verification
 */
export const QUERY_POINTS: QueryPoint[] = [
  // ============================================================================
  // OpenAI Agents SDK Query Points
  // ============================================================================
  {
    id: 'agent_class',
    libraryId: '/openai/openai-agents-python',
    query: 'Agent class constructor parameters signature name instructions tools handoffs model',
    appliesTo: 'backend',
    priority: 'critical',
    targetFiles: {
      templates: [
        'basic-chatbot/agents_config.py.template',
        'customer-support/agents/*.py.template',
        'multi-agent-system/agents/*.py.template',
        'rag-assistant/agents_config.py.template',
        'task-automation/agents/*.py.template',
        'data-processor/agents_config.py.template',
      ],
      references: [
        'agent-builder/references/openai-agents-sdk-tools.md',
      ],
    },
  },
  {
    id: 'websearch_tool',
    libraryId: '/openai/openai-agents-python',
    query: 'WebSearchTool initialization parameters search_context_size user_location',
    appliesTo: 'backend',
    priority: 'high',
    targetFiles: {
      templates: [
        'basic-chatbot/agents_config.py.template',
        'rag-assistant/agents_config.py.template',
      ],
      references: [
        'agent-builder/references/openai-agents-sdk-tools.md',
      ],
    },
  },
  {
    id: 'code_interpreter_tool',
    libraryId: '/openai/openai-agents-python',
    query: 'CodeInterpreterTool tool_config container parameter initialization',
    appliesTo: 'backend',
    priority: 'critical',
    targetFiles: {
      templates: [
        'data-processor/agents_config.py.template',
        'task-automation/agents/*.py.template',
      ],
      references: [
        'agent-builder/references/openai-agents-sdk-tools.md',
      ],
    },
  },
  {
    id: 'file_search_tool',
    libraryId: '/openai/openai-agents-python',
    query: 'FileSearchTool vector_store_ids max_num_results ranking_options parameters',
    appliesTo: 'backend',
    priority: 'high',
    targetFiles: {
      templates: [
        'rag-assistant/agents_config.py.template',
      ],
      references: [
        'agent-builder/references/openai-agents-sdk-tools.md',
      ],
    },
  },

  // ============================================================================
  // ChatKit Backend Query Points
  // ============================================================================
  {
    id: 'chatkit_store',
    libraryId: '/openai/openai-agents-python',
    query: 'chatkit Store interface methods context parameter load_thread save_thread signature',
    appliesTo: 'backend',
    priority: 'critical',
    targetFiles: {
      templates: [
        'basic-chatbot/store.py.template',
        'customer-support/store.py.template',
        'rag-assistant/store.py.template',
      ],
      references: [
        'code-generation/references/code-templates.md',
      ],
    },
  },
  {
    id: 'fastapi_chatkit',
    libraryId: '/openai/openai-agents-python',
    query: 'ChatKitServer FastAPI StreamingResult respond method integration pattern',
    appliesTo: 'backend',
    priority: 'high',
    targetFiles: {
      templates: [
        'basic-chatbot/main.py.template',
        'basic-chatbot/server.py.template',
        'customer-support/main.py.template',
        'customer-support/server.py.template',
      ],
      references: [
        'code-generation/references/code-templates.md',
      ],
    },
  },

  // ============================================================================
  // Frontend Query Points
  // ============================================================================
  {
    id: 'nextjs_chatkit',
    libraryId: '/vercel/next.js',
    query: 'ChatKit CDN web component openai-chatkit Script strategy beforeInteractive',
    appliesTo: 'frontend',
    priority: 'critical',
    targetFiles: {
      templates: [
        'nextjs-chatkit-ui/**/*.template',
      ],
      references: [
        'code-generation/references/code-templates.md',
      ],
    },
  },
];

/**
 * Get query points filtered by request type
 *
 * @param requestType - Type of request ('backend', 'frontend', or 'both')
 * @returns Filtered list of query points
 */
export function getQueryPointsForRequest(
  requestType: 'backend' | 'frontend' | 'both'
): QueryPoint[] {
  if (requestType === 'both') {
    return QUERY_POINTS;
  }

  return QUERY_POINTS.filter(
    (qp) => qp.appliesTo === requestType || qp.appliesTo === 'both'
  );
}

/**
 * Get a specific query point by ID
 *
 * @param id - Query point ID
 * @returns Query point or undefined
 */
export function getQueryPointById(id: string): QueryPoint | undefined {
  return QUERY_POINTS.find((qp) => qp.id === id);
}

/**
 * Get query points by priority
 *
 * @param priority - Priority level
 * @returns Filtered list of query points
 */
export function getQueryPointsByPriority(
  priority: 'critical' | 'high' | 'medium'
): QueryPoint[] {
  return QUERY_POINTS.filter((qp) => qp.priority === priority);
}

/**
 * Get query points that affect a specific template
 *
 * @param templateName - Name of the template
 * @returns List of query points affecting this template
 */
export function getQueryPointsForTemplate(templateName: string): QueryPoint[] {
  return QUERY_POINTS.filter((qp) =>
    qp.targetFiles.templates.some((pattern) => {
      // Simple glob matching - check if template name matches pattern
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
      return new RegExp(regexPattern).test(templateName);
    })
  );
}

/**
 * Get all unique library IDs used by query points
 */
export function getUniqueLibraryIds(): string[] {
  const ids = new Set(QUERY_POINTS.map((qp) => qp.libraryId));
  return Array.from(ids);
}

/**
 * Get query points grouped by library ID
 */
export function getQueryPointsByLibrary(): Map<string, QueryPoint[]> {
  const grouped = new Map<string, QueryPoint[]>();

  for (const qp of QUERY_POINTS) {
    const existing = grouped.get(qp.libraryId) || [];
    existing.push(qp);
    grouped.set(qp.libraryId, existing);
  }

  return grouped;
}

/**
 * Validate that all required query points are defined
 * Returns list of missing critical query points
 */
export function validateQueryPoints(): string[] {
  const requiredIds = [
    'agent_class',
    'websearch_tool',
    'code_interpreter_tool',
    'chatkit_store',
    'fastapi_chatkit',
    'nextjs_chatkit',
  ];

  const existingIds = new Set(QUERY_POINTS.map((qp) => qp.id));
  const missing: string[] = [];

  for (const id of requiredIds) {
    if (!existingIds.has(id)) {
      missing.push(id);
    }
  }

  return missing;
}
