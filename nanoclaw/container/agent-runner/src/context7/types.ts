/**
 * Context7 Live Knowledge Integration - Type Definitions
 *
 * Phase 2: Makes Context7 verification MANDATORY before every code generation.
 * Queries latest SDK patterns and updates templates/references when mismatches detected.
 */

// ============================================================================
// Query Point Types
// ============================================================================

/**
 * Defines a mandatory SDK query point for Context7 verification
 */
export interface QueryPoint {
  /** Unique identifier for this query point */
  id: string;

  /** Context7 library ID (e.g., '/openai/openai-agents-python') */
  libraryId: string;

  /** Query to send to Context7 */
  query: string;

  /** Whether this applies to backend, frontend, or both */
  appliesTo: 'backend' | 'frontend' | 'both';

  /** Priority level for this query */
  priority: 'critical' | 'high' | 'medium';

  /** Files affected by this query point */
  targetFiles: {
    /** Template files to check/update (glob patterns) */
    templates: string[];
    /** Reference markdown files to check/update */
    references: string[];
  };
}

// ============================================================================
// Pattern Comparison Types
// ============================================================================

/**
 * Type of difference detected between Context7 and current patterns
 */
export type DifferenceType =
  | 'new_parameter'      // New required parameter in SDK
  | 'changed_signature'  // Method signature changed
  | 'new_import'         // Import path changed
  | 'deprecated'         // Pattern is deprecated
  | 'new_method'         // New method available
  | 'removed_method';    // Method removed

/**
 * Severity level of a detected difference
 */
export type Severity = 'critical' | 'warning' | 'info';

/**
 * Represents a single difference between Context7 and current pattern
 */
export interface PatternDifference {
  /** Type of difference */
  type: DifferenceType;

  /** Human-readable description */
  description: string;

  /** Pattern from Context7 (latest) */
  context7Pattern: string;

  /** Current pattern in template/reference */
  currentPattern: string;

  /** Suggested fix to apply */
  suggestedFix: string;

  /** Line number in file (if applicable) */
  lineNumber?: number;
}

/**
 * Result of comparing Context7 response with current patterns
 */
export interface ComparisonResult {
  /** Which query point this comparison is for */
  queryPointId: string;

  /** Overall status */
  status: 'match' | 'mismatch' | 'unknown';

  /** Severity of any mismatches */
  severity: Severity;

  /** List of differences found */
  differences: PatternDifference[];

  /** Time taken for comparison (ms) */
  comparisonTimeMs: number;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * A cached Context7 response
 */
export interface CacheEntry {
  /** Library ID that was queried */
  libraryId: string;

  /** Query that was sent */
  query: string;

  /** Response from Context7 */
  response: string;

  /** When this entry was created */
  timestamp: number;

  /** When this entry expires */
  expiresAt: number;
}

/**
 * Cache statistics for logging/debugging
 */
export interface CacheStats {
  /** Total number of entries in cache */
  entries: number;

  /** Number of cache hits */
  hits: number;

  /** Number of cache misses */
  misses: number;

  /** Hit rate percentage */
  hitRate: number;
}

// ============================================================================
// Update Types
// ============================================================================

/**
 * Result of updating a reference file
 */
export interface ReferenceUpdateResult {
  /** File that was updated */
  file: string;

  /** Sections that were updated */
  sectionsUpdated: string[];

  /** Number of differences applied */
  differencesApplied: number;

  /** Whether a backup was created */
  backupCreated: boolean;

  /** Path to backup file (if created) */
  backupPath?: string;
}

/**
 * Result of updating a template file
 */
export interface TemplateUpdateResult {
  /** Template file that was updated */
  file: string;

  /** Patterns that were updated */
  patternsUpdated: string[];

  /** Whether TDD Level 1 passed after update */
  tddLevel1Passed: boolean;

  /** Any errors from TDD validation */
  tddErrors?: string[];
}

// ============================================================================
// Verification Types
// ============================================================================

/**
 * Options for Context7 verification
 */
export interface VerificationOptions {
  /** Name of template being generated */
  templateName: string;

  /** Type of request (determines which query points to use) */
  requestType: 'backend' | 'frontend' | 'both';

  /** Force refresh - bypass cache */
  forceRefresh?: boolean;

  /** Skip template updates (only update references) */
  skipTemplateUpdates?: boolean;

  /** Skip reference updates (only update templates) */
  skipReferenceUpdates?: boolean;
}

/**
 * Result of a single query point verification
 */
export interface QueryPointResult {
  /** Query point that was verified */
  queryPointId: string;

  /** Whether Context7 was queried (false if cache hit) */
  queried: boolean;

  /** Source of the response */
  source: 'context7' | 'cache' | 'fallback';

  /** Comparison result */
  comparison: ComparisonResult;

  /** Updates applied (if any) */
  updates: {
    templates: TemplateUpdateResult[];
    references: ReferenceUpdateResult[];
  };
}

/**
 * Overall result of Context7 verification
 */
export interface VerificationResult {
  /** Whether verification completed successfully */
  success: boolean;

  /** Number of query points executed */
  queriesExecuted: number;

  /** Number of cache hits */
  cacheHits: number;

  /** List of files that were updated */
  updatesApplied: string[];

  /** Any warnings generated */
  warnings: string[];

  /** Results for each query point */
  queryPointResults: QueryPointResult[];

  /** Total time for verification (ms) */
  totalTimeMs: number;

  /** Error message if success is false */
  error?: string;
}

// ============================================================================
// IPC Response Extension
// ============================================================================

/**
 * Extended IPC response with Context7 verification info
 */
export interface Context7IpcMetadata {
  /** Whether Context7 verification was performed */
  context7_verified: boolean;

  /** List of patterns that were updated */
  patterns_updated: string[];

  /** Number of cache hits during verification */
  cache_hits: number;

  /** Any warnings from verification */
  verification_warnings: string[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error thrown when Context7 API is unavailable
 */
export class Context7NetworkError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'Context7NetworkError';
  }
}

/**
 * Error thrown when Context7 rate limits are hit
 */
export class Context7RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = 'Context7RateLimitError';
  }
}

/**
 * Error thrown when pattern comparison fails
 */
export class PatternComparisonError extends Error {
  constructor(
    message: string,
    public readonly queryPointId: string
  ) {
    super(message);
    this.name = 'PatternComparisonError';
  }
}

/**
 * Error thrown when file update fails
 */
export class FileUpdateError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FileUpdateError';
  }
}
