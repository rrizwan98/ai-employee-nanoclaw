/**
 * Verification Configuration
 *
 * Constants and configuration for Phase 3 Verification Sandbox
 */

/**
 * Maximum auto-fix attempts before human escalation
 */
export const MAX_ATTEMPTS = 3;

/**
 * Verification timeout in milliseconds (60 seconds)
 */
export const VERIFICATION_TIMEOUT_MS = 60000;

/**
 * Server startup timeout in milliseconds (10 seconds)
 */
export const SERVER_STARTUP_TIMEOUT_MS = 10000;

/**
 * Endpoint test timeout in milliseconds (5 seconds per endpoint)
 */
export const ENDPOINT_TEST_TIMEOUT_MS = 5000;

/**
 * Build timeout in milliseconds (120 seconds for npm run build)
 */
export const BUILD_TIMEOUT_MS = 120000;

/**
 * Test port for server verification
 */
export const TEST_PORT = 8765;

/**
 * Standard endpoints that MUST be tested
 */
export const STANDARD_ENDPOINTS = [
  { path: '/health', method: 'GET' as const, expected_status: 200 },
  { path: '/chatkit', method: 'POST' as const, expected_status: 200 },
];

/**
 * Known error patterns and their fixes (from Skills)
 */
export const KNOWN_FIX_PATTERNS: Record<string, { correct: string; source: string }> = {
  // CodeInterpreterTool fix
  'CodeInterpreterTool()': {
    correct: 'CodeInterpreterTool(tool_config={"type": "code_interpreter"})',
    source: 'agent-builder/references/openai-agents-sdk-tools.md',
  },

  // ChatKit import fixes
  'from chatkit.stores': {
    correct: 'from chatkit.store',
    source: 'code-generation/references/chatkit-backend.md',
  },
  'from chatkit.types import ContentItem': {
    correct: 'from chatkit.types import ThreadItem',
    source: 'code-generation/references/chatkit-backend.md',
  },
  'from chatkit.types import AttachmentItem': {
    correct: 'from chatkit.types import Attachment',
    source: 'code-generation/references/chatkit-backend.md',
  },

  // Page format fix
  'Page(items=': {
    correct: 'Page(data=',
    source: 'code-generation/references/chatkit-backend.md',
  },

  // Missing context parameter
  'def load_thread(self, thread_id: str)': {
    correct: 'def load_thread(self, thread_id: str, context: dict)',
    source: 'code-generation/references/chatkit-backend.md',
  },
};

/**
 * Python patterns to extract endpoints from code
 */
export const ENDPOINT_PATTERNS = [
  // FastAPI decorators
  /@app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gi,
  // APIRouter decorators
  /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/gi,
];

/**
 * Frontend files that need "use client" directive
 */
export const CLIENT_HOOK_PATTERNS = [
  'useState',
  'useEffect',
  'useRef',
  'useCallback',
  'useMemo',
  'useContext',
  'useReducer',
];

export const CLIENT_EVENT_PATTERNS = [
  'onClick',
  'onChange',
  'onSubmit',
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
];

/**
 * Human alert format template
 */
export const ALERT_TEMPLATE = `
VERIFICATION ALERT - Attempt {attempt}/{max_attempts}

ERROR: {error_type}
LOCATION: {location}
MESSAGE: {message}

ANALYSIS: {analysis}

FIX APPLIED: {fix_applied}
SOURCE: {fix_source}
`.trim();

/**
 * Escalation message template
 */
export const ESCALATION_TEMPLATE = `
VERIFICATION FAILED - Human Review Required

PROJECT: {project_path}
TYPE: {project_type}
ATTEMPTS: {attempts}/{max_attempts}

FINAL ERROR:
{final_error}

ATTEMPT HISTORY:
{attempt_history}

Please review and fix manually.
`.trim();
