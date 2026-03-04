/**
 * Context7 Module Unit Tests
 *
 * Run with: node src/context7/__tests__/context7.test.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper for assertions
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName} (expected: ${expected}, got: ${actual})`);
    failed++;
  }
}

// Import modules from dist using file:// URLs
const distPath = join(__dirname, '..', '..', '..', 'dist', 'context7');

const cacheModule = await import(pathToFileURL(join(distPath, 'cache.js')).href);
const queryPointsModule = await import(pathToFileURL(join(distPath, 'query-points.js')).href);
const comparatorModule = await import(pathToFileURL(join(distPath, 'pattern-comparator.js')).href);
const refUpdaterModule = await import(pathToFileURL(join(distPath, 'reference-updater.js')).href);
const tplUpdaterModule = await import(pathToFileURL(join(distPath, 'template-updater.js')).href);
const verifierModule = await import(pathToFileURL(join(distPath, 'verifier.js')).href);

const { Context7Cache, getContext7Cache, resetGlobalCache } = cacheModule;
const { QUERY_POINTS, getQueryPointsForRequest } = queryPointsModule;
const { PatternComparator, getPatternComparator } = comparatorModule;
const { ReferenceUpdater } = refUpdaterModule;
const { TemplateUpdater } = tplUpdaterModule;
const { Context7Verifier } = verifierModule;

console.log('='.repeat(60));
console.log('Context7 Module Unit Tests');
console.log('='.repeat(60));
console.log('');

// ============================================================================
// Test Suite 1: Cache
// ============================================================================
console.log('📦 Test Suite 1: Cache');
console.log('-'.repeat(40));

// Test 1.1: Cache instantiation
const cache = new Context7Cache();
assert(cache !== null, 'Cache instantiates');

// Test 1.2: Cache set and get
cache.set('test-lib', 'test-query', 'test-response');
const entry = cache.get('test-lib', 'test-query');
assert(entry !== null, 'Cache returns entry after set');
assertEqual(entry?.response, 'test-response', 'Cache stores correct response');

// Test 1.3: Cache miss
const missEntry = cache.get('nonexistent', 'query');
assert(missEntry === null, 'Cache returns null for missing entry');

// Test 1.4: Cache stats
const stats = cache.getStats();
assert(stats.entries === 1, 'Cache stats shows correct entry count');
assert(stats.hits >= 1, 'Cache stats tracks hits');
assert(stats.misses >= 1, 'Cache stats tracks misses');

// Test 1.5: Cache key generation
const key1 = cache.getCacheKey('lib', 'Query One');
const key2 = cache.getCacheKey('lib', 'query one');
assertEqual(key1, key2, 'Cache key is case-insensitive');

// Test 1.6: Cache invalidation
cache.invalidate();
const afterInvalidate = cache.get('test-lib', 'test-query');
assert(afterInvalidate === null, 'Cache invalidate clears entries');

// Test 1.7: Global cache singleton
const globalCache1 = getContext7Cache();
const globalCache2 = getContext7Cache();
assert(globalCache1 === globalCache2, 'Global cache is singleton');

// Test 1.8: Reset global cache
resetGlobalCache();
const newGlobalCache = getContext7Cache();
assert(newGlobalCache !== globalCache1, 'Reset creates new global cache');

console.log('');

// ============================================================================
// Test Suite 2: Query Points
// ============================================================================
console.log('📦 Test Suite 2: Query Points');
console.log('-'.repeat(40));

// Test 2.1: Query points count
assertEqual(QUERY_POINTS.length, 7, 'Has 7 mandatory query points');

// Test 2.2: Required query point IDs
const requiredIds = [
  'agent_class',
  'websearch_tool',
  'code_interpreter_tool',
  'file_search_tool',
  'chatkit_store',
  'fastapi_chatkit',
  'nextjs_chatkit'
];

requiredIds.forEach(id => {
  const found = QUERY_POINTS.find(qp => qp.id === id);
  assert(found !== undefined, `Query point '${id}' exists`);
});

// Test 2.3: Query point structure
const agentClass = QUERY_POINTS.find(qp => qp.id === 'agent_class');
assert(agentClass?.libraryId !== undefined, 'Query point has libraryId');
assert(agentClass?.query !== undefined, 'Query point has query');
assert(agentClass?.appliesTo !== undefined, 'Query point has appliesTo');
assert(agentClass?.priority !== undefined, 'Query point has priority');

// Test 2.4: Filter by request type (if function exists)
if (typeof getQueryPointsForRequest === 'function') {
  const backendPoints = getQueryPointsForRequest('backend');
  assert(Array.isArray(backendPoints), 'getQueryPointsForRequest returns array');
}

console.log('');

// ============================================================================
// Test Suite 3: Pattern Comparator
// ============================================================================
console.log('📦 Test Suite 3: Pattern Comparator');
console.log('-'.repeat(40));

// Test 3.1: Comparator instantiation
const comparator = new PatternComparator();
assert(comparator !== null, 'Comparator instantiates');

// Test 3.2: Extract code blocks from markdown
const markdown = '```python\ndef foo(): pass\n```';
const blocks = comparator.extractCodeBlocks(markdown);
assert(blocks.length > 0, 'Extracts code blocks from markdown');

// Test 3.3: Normalize code
const code = '  def foo():  # comment\n    pass  ';
const normalized = comparator.normalizeCode(code);
assert(!normalized.includes('#'), 'Normalize removes comments');

// Test 3.4: Extract signatures
const sigCode = 'def hello(name: str, age: int = 0): pass';
const sigs = comparator.extractSignatures(sigCode);
assert(sigs.has('hello'), 'Extracts function signatures');

// Test 3.5: Extract imports
const importCode = 'from agents import Agent, Runner\nimport os';
const imports = comparator.extractImports(importCode);
assert(imports.has('agents'), 'Extracts from imports');
assert(imports.has('os'), 'Extracts direct imports');

// Test 3.6: Compare method - same code
const result1 = comparator.compare('def foo(): pass', 'def foo(): pass', 'test');
assertEqual(result1.status, 'match', 'Same code returns match');

// Test 3.7: Compare method returns proper structure
const result2 = comparator.compare('def bar(): pass', 'def foo(): pass', 'test');
assert(result2.queryPointId === 'test', 'Result has queryPointId');
assert(result2.status !== undefined, 'Result has status');
assert(Array.isArray(result2.differences), 'Result has differences array');

// Test 3.8: Singleton pattern
const comp1 = getPatternComparator();
const comp2 = getPatternComparator();
assert(comp1 === comp2, 'Pattern comparator is singleton');

console.log('');

// ============================================================================
// Test Suite 4: Reference Updater
// ============================================================================
console.log('📦 Test Suite 4: Reference Updater');
console.log('-'.repeat(40));

// Test 4.1: Reference Updater instantiation
const refUpdater = new ReferenceUpdater();
assert(refUpdater !== null, 'Reference Updater instantiates');

// Test 4.2: Has required methods
assert(typeof refUpdater.findSection === 'function', 'Has findSection method');
assert(typeof refUpdater.updateReference === 'function', 'Has updateReference method');

console.log('');

// ============================================================================
// Test Suite 5: Template Updater
// ============================================================================
console.log('📦 Test Suite 5: Template Updater');
console.log('-'.repeat(40));

// Test 5.1: Template Updater instantiation
const tplUpdater = new TemplateUpdater();
assert(tplUpdater !== null, 'Template Updater instantiates');

// Test 5.2: Has required methods
assert(typeof tplUpdater.findTemplateFiles === 'function', 'Has findTemplateFiles method');
assert(typeof tplUpdater.updateTemplate === 'function', 'Has updateTemplate method');

console.log('');

// ============================================================================
// Test Suite 6: Context7 Verifier
// ============================================================================
console.log('📦 Test Suite 6: Context7 Verifier');
console.log('-'.repeat(40));

// Test 6.1: Verifier instantiation
const verifier = new Context7Verifier();
assert(verifier !== null, 'Verifier instantiates');

// Test 6.2: Has verify method
assert(typeof verifier.verify === 'function', 'Has verify method');

console.log('');

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('');

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} test(s) failed`);
  process.exit(1);
}
