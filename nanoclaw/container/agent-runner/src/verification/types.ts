/**
 * Verification Types
 *
 * Type definitions for Phase 3 Verification Sandbox
 */

/**
 * Verification test levels (from 4-Level TDD System)
 */
export type VerificationLevel = 'level1' | 'level2' | 'level3' | 'level4';

/**
 * Project type being verified
 */
export type ProjectType = 'backend' | 'frontend';

/**
 * Error type classification for auto-fix
 */
export type ErrorType =
  | 'syntax'      // AST parse errors
  | 'import'      // ImportError, ModuleNotFoundError
  | 'type'        // TypeError, incorrect signatures
  | 'directive'   // Missing 'use client'
  | 'build'       // npm run build failures
  | 'runtime'     // Agent init, server start errors
  | 'endpoint'    // Endpoint response errors
  | 'unknown';    // Unclassified errors

/**
 * Fix source - where the fix pattern came from
 */
export type FixSource = 'Skills' | 'Templates' | 'Context7' | 'Manual';

/**
 * Single verification error
 */
export interface VerificationError {
  level: VerificationLevel;
  type: ErrorType;
  message: string;
  location?: string;      // file:line if available
  stack?: string;         // Full stack trace
  raw?: string;           // Raw error output
}

/**
 * Result of a single test level
 */
export interface LevelResult {
  level: VerificationLevel;
  passed: boolean;
  errors: VerificationError[];
  duration_ms: number;
  details?: Record<string, unknown>;
}

/**
 * Endpoint test result
 */
export interface EndpointTest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expected_status: number;
  actual_status?: number;
  passed: boolean;
  response_time_ms?: number;
  error?: string;
}

/**
 * Fix applied to code
 */
export interface Fix {
  errorPattern: string;   // What was wrong
  correct: string;        // What it should be
  source: FixSource;      // Where we found the fix
  file?: string;          // File modified
  line?: number;          // Line modified
}

/**
 * Result of auto-fix attempt
 */
export interface FixResult {
  applied: boolean;
  fix?: Fix;
  reason?: string;        // Why fix wasn't applied
}

/**
 * Single auto-fix attempt record
 */
export interface AutoFixAttempt {
  attempt_number: number;
  timestamp: string;
  errors: VerificationError[];
  fix_applied?: Fix;
  verification_after: {
    passed: boolean;
    levels: Record<VerificationLevel, LevelResult>;
  };
}

/**
 * Human alert for verification attempt
 */
export interface HumanAlert {
  attempt: number;
  max_attempts: number;
  status: 'verifying' | 'error' | 'fixed' | 'passed' | 'escalated';
  project_path: string;
  project_type: ProjectType;
  error?: {
    type: ErrorType;
    location: string;
    message: string;
  };
  analysis?: string;
  fix?: {
    applied: string;
    source: FixSource;
  };
  timestamp: string;
}

/**
 * Complete verification result
 */
export interface VerificationResult {
  success: boolean;
  project_path: string;
  project_type: ProjectType;
  attempts: number;
  max_attempts: number;

  // Final state
  levels: {
    level1: LevelResult;
    level2: LevelResult;
    level3: LevelResult;
    level4: LevelResult;
  };

  // Endpoint details (backend only)
  endpoints?: {
    tested: number;
    passed: number;
    failures: EndpointTest[];
  };

  // Build details (frontend only)
  build?: {
    success: boolean;
    errors: string[];
    use_client_missing: string[];
  };

  // Attempt history
  history: AutoFixAttempt[];

  // Delivery decision
  delivery_ready: boolean;
  requires_human: boolean;

  // Timing
  total_duration_ms: number;
  started_at: string;
  completed_at: string;
}

/**
 * Verification request parameters
 */
export interface VerificationRequest {
  project_path: string;
  project_type: ProjectType;
  auto_fix?: boolean;       // Default: true
  max_attempts?: number;    // Default: 3
  run_level_3?: boolean;    // Default: true
  run_level_4?: boolean;    // Default: true
  timeout_ms?: number;      // Default: 60000
}

/**
 * Sandbox test output (from Python/Shell scripts)
 */
export interface SandboxOutput {
  success: boolean;
  levels: {
    level1?: { passed: boolean; errors: string[]; };
    level2?: { passed: boolean; errors: string[]; };
    level3?: { passed: boolean; errors: string[]; };
    level4?: { passed: boolean; errors: string[]; endpoints?: EndpointTest[]; };
  };
  duration_ms: number;
  raw_output?: string;
}
