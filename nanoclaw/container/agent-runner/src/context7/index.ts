/**
 * Context7 Live Knowledge Integration
 *
 * Phase 2: Makes Context7 verification MANDATORY before every code generation.
 * Queries latest SDK patterns, compares with templates/references, and auto-updates
 * when mismatches are detected.
 *
 * Usage:
 * ```typescript
 * import { getContext7Verifier } from './context7';
 *
 * // Before code generation
 * const verifier = getContext7Verifier();
 * const result = await verifier.verify({
 *   templateName: 'basic-chatbot',
 *   requestType: 'backend',
 * });
 *
 * if (result.success) {
 *   console.log(`Verified: ${result.queriesExecuted} queries`);
 *   console.log(`Updates: ${result.updatesApplied.length}`);
 * }
 * ```
 */

// Types
export * from './types.js';

// Cache
export {
  Context7Cache,
  getContext7Cache,
  resetGlobalCache,
} from './cache.js';

// Query Points
export {
  QUERY_POINTS,
  getQueryPointsForRequest,
  getQueryPointById,
  getQueryPointsByPriority,
  getQueryPointsForTemplate,
  getUniqueLibraryIds,
  getQueryPointsByLibrary,
  validateQueryPoints,
} from './query-points.js';

// Pattern Comparator
export {
  PatternComparator,
  getPatternComparator,
} from './pattern-comparator.js';

// Reference Updater
export {
  ReferenceUpdater,
  getReferenceUpdater,
  initReferenceUpdater,
} from './reference-updater.js';

// Template Updater
export {
  TemplateUpdater,
  getTemplateUpdater,
  initTemplateUpdater,
} from './template-updater.js';

// Verifier (Main Entry Point)
export {
  Context7Verifier,
  getContext7Verifier,
  initContext7Verifier,
  resetContext7Verifier,
} from './verifier.js';
