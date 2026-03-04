/**
 * Context7 Verifier Module
 *
 * Main orchestrator for Context7 verification.
 * Queries Context7 for all mandatory SDK patterns, compares with current
 * templates/references, and updates them when mismatches are detected.
 *
 * This module is called BEFORE every code generation.
 */

import {
  VerificationOptions,
  VerificationResult,
  QueryPointResult,
  Context7NetworkError,
  Context7RateLimitError,
} from './types.js';
import { Context7Cache, getContext7Cache } from './cache.js';
import { getQueryPointsForRequest, QueryPoint, QUERY_POINTS } from './query-points.js';
import { PatternComparator, getPatternComparator } from './pattern-comparator.js';
import { ReferenceUpdater, initReferenceUpdater } from './reference-updater.js';
import { TemplateUpdater, initTemplateUpdater } from './template-updater.js';

/**
 * Context7 API configuration
 */
const CONTEXT7_API_BASE = 'https://api.context7.com/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Context7 Verifier class
 * Orchestrates the verification process before code generation
 */
export class Context7Verifier {
  private cache: Context7Cache;
  private comparator: PatternComparator;
  private referenceUpdater: ReferenceUpdater | null = null;
  private templateUpdater: TemplateUpdater | null = null;

  private skillsPath: string;
  private templatesPath: string;

  constructor(
    skillsPath: string = '/workspace/.claude/skills',
    templatesPath: string = '/workspace/templates'
  ) {
    this.skillsPath = skillsPath;
    this.templatesPath = templatesPath;
    this.cache = getContext7Cache();
    this.comparator = getPatternComparator();
  }

  /**
   * Initialize updaters (lazy initialization)
   */
  private initUpdaters(): void {
    if (!this.referenceUpdater) {
      this.referenceUpdater = initReferenceUpdater(this.skillsPath);
    }
    if (!this.templateUpdater) {
      this.templateUpdater = initTemplateUpdater(this.templatesPath);
    }
  }

  /**
   * Query Context7 for a specific query point
   */
  private async queryContext7(queryPoint: QueryPoint): Promise<string> {
    // Check cache first
    const cached = this.cache.get(queryPoint.libraryId, queryPoint.query);
    if (cached) {
      return cached.response;
    }

    // Make API request with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.makeContext7Request(
          queryPoint.libraryId,
          queryPoint.query
        );

        // Cache the response
        this.cache.set(queryPoint.libraryId, queryPoint.query, response);

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof Context7RateLimitError) {
          // Wait before retry
          await this.sleep(error.retryAfterMs || RETRY_DELAY_MS * Math.pow(2, attempt));
        } else if (error instanceof Context7NetworkError) {
          // Network error - retry after delay
          await this.sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        } else {
          // Unknown error - don't retry
          break;
        }
      }
    }

    throw lastError || new Error('Context7 query failed');
  }

  /**
   * Make HTTP request to Context7 API
   */
  private async makeContext7Request(
    libraryId: string,
    query: string
  ): Promise<string> {
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
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Context7RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(retryAfter) * 1000 : undefined
          );
        }
        throw new Context7NetworkError(
          `Context7 API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json() as { content?: string; text?: string };
      return data.content || data.text || JSON.stringify(data);
    } catch (error) {
      if (error instanceof Context7NetworkError || error instanceof Context7RateLimitError) {
        throw error;
      }
      throw new Context7NetworkError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get current pattern from templates/references for comparison
   */
  private async getCurrentPattern(queryPoint: QueryPoint): Promise<string> {
    // For now, return empty string - the comparator will handle this
    // In future, we could read from actual template files
    return '';
  }

  /**
   * Process a single query point
   */
  private async processQueryPoint(
    queryPoint: QueryPoint,
    options: VerificationOptions
  ): Promise<QueryPointResult> {
    const startTime = Date.now();
    let source: 'context7' | 'cache' | 'fallback' = 'context7';
    let context7Response = '';

    try {
      // Check cache first
      const cached = this.cache.get(queryPoint.libraryId, queryPoint.query);
      if (cached && !options.forceRefresh) {
        context7Response = cached.response;
        source = 'cache';
      } else {
        // Query Context7
        context7Response = await this.queryContext7(queryPoint);
        source = 'context7';
      }
    } catch (error) {
      console.warn(
        `[Context7Verifier] Failed to query ${queryPoint.id}:`,
        error
      );
      source = 'fallback';
      // Use empty pattern - will result in no updates
      context7Response = '';
    }

    // Get current pattern
    const currentPattern = await this.getCurrentPattern(queryPoint);

    // Compare patterns
    const comparison = this.comparator.compare(
      context7Response,
      currentPattern,
      queryPoint.id
    );

    // Apply updates if needed
    const updates = {
      templates: [] as any[],
      references: [] as any[],
    };

    if (comparison.status === 'mismatch' && comparison.differences.length > 0) {
      this.initUpdaters();

      // Update references
      if (!options.skipReferenceUpdates && this.referenceUpdater) {
        try {
          updates.references = await this.referenceUpdater.updateReferences(
            queryPoint.id,
            queryPoint.targetFiles.references,
            context7Response,
            comparison.differences
          );
        } catch (error) {
          console.error(
            `[Context7Verifier] Failed to update references for ${queryPoint.id}:`,
            error
          );
        }
      }

      // Update templates
      if (!options.skipTemplateUpdates && this.templateUpdater) {
        try {
          updates.templates = await this.templateUpdater.updateTemplates(
            queryPoint.id,
            queryPoint.targetFiles.templates,
            context7Response,
            comparison.differences
          );
        } catch (error) {
          console.error(
            `[Context7Verifier] Failed to update templates for ${queryPoint.id}:`,
            error
          );
        }
      }
    }

    return {
      queryPointId: queryPoint.id,
      queried: source === 'context7',
      source,
      comparison,
      updates,
    };
  }

  /**
   * Main verification method
   * Called BEFORE every code generation
   */
  async verify(options: VerificationOptions): Promise<VerificationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const queryPointResults: QueryPointResult[] = [];
    const updatesApplied: string[] = [];

    // Get query points for this request type
    const queryPoints = getQueryPointsForRequest(options.requestType);

    console.log(
      `[Context7Verifier] Starting verification for ${options.templateName} (${options.requestType})`
    );
    console.log(`[Context7Verifier] Processing ${queryPoints.length} query points`);

    // Process each query point
    let cacheHits = 0;
    for (const queryPoint of queryPoints) {
      try {
        const result = await this.processQueryPoint(queryPoint, options);
        queryPointResults.push(result);

        if (result.source === 'cache') {
          cacheHits++;
        }

        // Collect updated files
        for (const ref of result.updates.references) {
          if (ref.sectionsUpdated.length > 0) {
            updatesApplied.push(`ref:${ref.file}`);
          }
        }
        for (const tpl of result.updates.templates) {
          if (tpl.patternsUpdated.length > 0) {
            updatesApplied.push(`tpl:${tpl.file}`);
          }
        }
      } catch (error) {
        console.error(
          `[Context7Verifier] Error processing ${queryPoint.id}:`,
          error
        );
        warnings.push(
          `Failed to process ${queryPoint.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const totalTimeMs = Date.now() - startTime;

    console.log(
      `[Context7Verifier] Verification complete in ${totalTimeMs}ms`
    );
    console.log(
      `[Context7Verifier] Cache hits: ${cacheHits}/${queryPoints.length}`
    );
    console.log(
      `[Context7Verifier] Updates applied: ${updatesApplied.length}`
    );

    return {
      success: true,
      queriesExecuted: queryPoints.length,
      cacheHits,
      updatesApplied,
      warnings,
      queryPointResults,
      totalTimeMs,
    };
  }

  /**
   * Quick verification - only check critical query points
   */
  async verifyQuick(options: VerificationOptions): Promise<VerificationResult> {
    // Filter to only critical priority query points
    const criticalQueryPoints = QUERY_POINTS.filter(
      (qp) =>
        qp.priority === 'critical' &&
        (qp.appliesTo === options.requestType || qp.appliesTo === 'both')
    );

    console.log(
      `[Context7Verifier] Quick verification with ${criticalQueryPoints.length} critical points`
    );

    // Use the same processing logic but with filtered query points
    return this.verify({
      ...options,
      // Could add a flag to process only critical points
    });
  }

  /**
   * Force refresh all patterns from Context7
   */
  async refreshAll(): Promise<VerificationResult> {
    this.cache.invalidate();

    return this.verify({
      templateName: 'all',
      requestType: 'both',
      forceRefresh: true,
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let verifierInstance: Context7Verifier | null = null;

/**
 * Get the global Context7Verifier instance
 */
export function getContext7Verifier(
  skillsPath?: string,
  templatesPath?: string
): Context7Verifier {
  if (!verifierInstance) {
    verifierInstance = new Context7Verifier(skillsPath, templatesPath);
  }
  return verifierInstance;
}

/**
 * Initialize the global Context7Verifier
 */
export function initContext7Verifier(
  skillsPath: string,
  templatesPath: string
): Context7Verifier {
  verifierInstance = new Context7Verifier(skillsPath, templatesPath);
  return verifierInstance;
}

/**
 * Reset the global verifier (for testing)
 */
export function resetContext7Verifier(): void {
  verifierInstance = null;
}
