/**
 * Verification Module Unit Tests
 *
 * Run with: node src/verification/__tests__/verification.test.mjs
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
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${testName}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${testName} (expected: ${expected}, got: ${actual})`);
    failed++;
  }
}

// Import modules from dist using file:// URLs
const distPath = join(__dirname, '..', '..', '..', 'dist', 'verification');

let configModule, typesModule, endpointModule, alertModule, autoFixerModule;

try {
  configModule = await import(pathToFileURL(join(distPath, 'config.js')).href);
  endpointModule = await import(pathToFileURL(join(distPath, 'endpoint-extractor.js')).href);
  alertModule = await import(pathToFileURL(join(distPath, 'human-alert.js')).href);
  autoFixerModule = await import(pathToFileURL(join(distPath, 'auto-fixer.js')).href);
} catch (err) {
  console.error('Failed to import modules. Make sure to run `npm run build` first.');
  console.error(err);
  process.exit(1);
}

const {
  MAX_ATTEMPTS,
  VERIFICATION_TIMEOUT_MS,
  STANDARD_ENDPOINTS,
  KNOWN_FIX_PATTERNS,
} = configModule;

const {
  extractEndpoints,
  EndpointExtractor,
  getEndpointExtractor,
} = endpointModule;

const {
  formatAlert,
  formatEscalation,
  analyzeError,
  HumanAlertManager,
  getHumanAlertManager,
} = alertModule;

const {
  parseErrorType,
  AutoFixer,
  getAutoFixer,
} = autoFixerModule;

console.log('='.repeat(60));
console.log('Verification Module Unit Tests');
console.log('='.repeat(60));
console.log('');

// ============================================================================
// Test Suite 1: Configuration
// ============================================================================
console.log('Test Suite 1: Configuration');
console.log('-'.repeat(40));

assertEqual(MAX_ATTEMPTS, 3, 'MAX_ATTEMPTS is 3');
assertEqual(VERIFICATION_TIMEOUT_MS, 60000, 'VERIFICATION_TIMEOUT_MS is 60000');
assert(Array.isArray(STANDARD_ENDPOINTS), 'STANDARD_ENDPOINTS is array');
assert(STANDARD_ENDPOINTS.length >= 2, 'Has at least 2 standard endpoints');
assert(typeof KNOWN_FIX_PATTERNS === 'object', 'KNOWN_FIX_PATTERNS is object');

console.log('');

// ============================================================================
// Test Suite 2: Endpoint Extractor
// ============================================================================
console.log('Test Suite 2: Endpoint Extractor');
console.log('-'.repeat(40));

// Test 2.1: Extract from simple FastAPI code
const simpleCode = `
from fastapi import FastAPI
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/chatkit")
def chatkit():
    return {}
`;

const endpoints1 = extractEndpoints(simpleCode);
assert(endpoints1.length >= 2, 'Extracts at least 2 endpoints from simple code');

// Test 2.2: Extract custom endpoints
const customCode = `
@app.get("/users/{user_id}")
def get_user(user_id: int):
    pass

@app.post("/orders")
def create_order():
    pass

@app.delete("/items/{id}")
def delete_item(id: str):
    pass
`;

const endpoints2 = extractEndpoints(customCode);
assert(endpoints2.some(e => e.path === '/users/{user_id}'), 'Extracts parameterized endpoint');
assert(endpoints2.some(e => e.method === 'DELETE'), 'Extracts DELETE endpoint');

// Test 2.3: Singleton pattern
const ext1 = getEndpointExtractor();
const ext2 = getEndpointExtractor();
assert(ext1 === ext2, 'EndpointExtractor is singleton');

// Test 2.4: Instance methods
const extractor = new EndpointExtractor();
assert(typeof extractor.extract === 'function', 'Has extract method');

console.log('');

// ============================================================================
// Test Suite 3: Human Alert
// ============================================================================
console.log('Test Suite 3: Human Alert');
console.log('-'.repeat(40));

// Test 3.1: Format alert
const alert = {
  attempt: 1,
  max_attempts: 3,
  status: 'error',
  project_path: '/test/path',
  project_type: 'backend',
  error: {
    type: 'import',
    location: 'main.py:10',
    message: 'ImportError: cannot import Agent',
  },
  analysis: 'SDK import changed',
  fix: {
    applied: 'Changed import path',
    source: 'Context7',
  },
  timestamp: new Date().toISOString(),
};

const formatted = formatAlert(alert);
assert(formatted.includes('Attempt 1/3'), 'Alert includes attempt count');
assert(formatted.includes('import'), 'Alert includes error type');
assert(formatted.includes('main.py:10'), 'Alert includes location');

// Test 3.2: Analyze error
const analysis1 = analyzeError('import', 'chatkit import error');
assert(analysis1.includes('ChatKit'), 'Analyzes ChatKit import error');

const analysis2 = analyzeError('directive', 'use client missing');
assert(analysis2.includes('Next.js'), 'Analyzes use client error');

// Test 3.3: Alert manager singleton
const mgr1 = getHumanAlertManager();
const mgr2 = getHumanAlertManager();
assert(mgr1 === mgr2, 'HumanAlertManager is singleton');

console.log('');

// ============================================================================
// Test Suite 4: Auto-Fixer
// ============================================================================
console.log('Test Suite 4: Auto-Fixer');
console.log('-'.repeat(40));

// Test 4.1: Parse error type
const err1 = { message: 'ImportError: cannot import Agent', level: 'level2', type: 'unknown' };
assertEqual(parseErrorType(err1), 'import', 'Parses ImportError');

const err2 = { message: 'SyntaxError: invalid syntax', level: 'level1', type: 'unknown' };
assertEqual(parseErrorType(err2), 'syntax', 'Parses SyntaxError');

const err3 = { message: 'TypeError: missing argument', level: 'level2', type: 'unknown' };
assertEqual(parseErrorType(err3), 'type', 'Parses TypeError');

const err4 = { message: 'use client directive missing', level: 'level4', type: 'unknown' };
assertEqual(parseErrorType(err4), 'directive', 'Parses directive error');

// Test 4.2: Auto-fixer singleton
const fixer1 = getAutoFixer();
const fixer2 = getAutoFixer();
assert(fixer1 === fixer2, 'AutoFixer is singleton');

// Test 4.3: Auto-fixer methods
const fixer = new AutoFixer();
assert(typeof fixer.fix === 'function', 'Has fix method');
assert(typeof fixer.setContext7Query === 'function', 'Has setContext7Query method');
assert(typeof fixer.configure === 'function', 'Has configure method');

console.log('');

// ============================================================================
// Test Suite 5: Known Fix Patterns
// ============================================================================
console.log('Test Suite 5: Known Fix Patterns');
console.log('-'.repeat(40));

// Test 5.1: CodeInterpreterTool pattern
const citPattern = KNOWN_FIX_PATTERNS['CodeInterpreterTool()'];
assert(citPattern !== undefined, 'Has CodeInterpreterTool pattern');
assert(citPattern.correct.includes('tool_config'), 'Fix includes tool_config');

// Test 5.2: ChatKit import patterns
const ckPattern = KNOWN_FIX_PATTERNS['from chatkit.stores'];
assert(ckPattern !== undefined, 'Has chatkit.stores pattern');
assert(ckPattern.correct === 'from chatkit.store', 'Fix is singular import');

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
  console.log('All tests passed!');
  process.exit(0);
} else {
  console.log(`${failed} test(s) failed`);
  process.exit(1);
}
