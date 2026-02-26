#!/usr/bin/env npx ts-node
/**
 * Template Tests for NanoClaw
 * Tests template loading, matching, and generation functionality.
 *
 * Run with: npx ts-node scripts/test-templates.ts
 */

import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.join(__dirname, '..', 'container', 'templates');

interface TemplateMetadata {
  name: string;
  displayName?: string;
  display_name?: string;
  description: string;
  version: string;
  keywords?: string[];
  tags?: string[];
  variables?: Record<string, unknown> | Array<{ name: string; description: string }>;
  files?: Array<{ path: string; template: string }>;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function log(msg: string): void {
  console.log(msg);
}

function pass(name: string): void {
  results.push({ name, passed: true });
  log(`  ✓ ${name}`);
}

function fail(name: string, error: string): void {
  results.push({ name, passed: false, error });
  log(`  ✗ ${name}: ${error}`);
}

// ============================================================================
// Test 1: All templates load correctly
// ============================================================================
function testTemplateLoading(): void {
  log('\n📦 Test 1: Template Loading');

  const expectedTemplates = [
    'basic-chatbot',
    'customer-support',
    'data-processor',
    'multi-agent-system',
    'rag-assistant',
    'task-automation',
  ];

  for (const templateName of expectedTemplates) {
    const templateDir = path.join(TEMPLATES_DIR, templateName);
    const metadataPath = path.join(templateDir, 'metadata.json');

    if (!fs.existsSync(templateDir)) {
      fail(`load-${templateName}`, `Directory not found: ${templateDir}`);
      continue;
    }

    if (!fs.existsSync(metadataPath)) {
      fail(`load-${templateName}`, `metadata.json not found`);
      continue;
    }

    try {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata: TemplateMetadata = JSON.parse(content);

      // Validate required fields
      if (!metadata.name) {
        fail(`load-${templateName}`, 'Missing name field');
        continue;
      }

      if (!metadata.description) {
        fail(`load-${templateName}`, 'Missing description field');
        continue;
      }

      pass(`load-${templateName}`);
    } catch (err) {
      fail(`load-${templateName}`, `Parse error: ${err}`);
    }
  }
}

// ============================================================================
// Test 2: Keyword matching accuracy
// ============================================================================
function testKeywordMatching(): void {
  log('\n🔍 Test 2: Keyword Matching');

  const testCases = [
    { request: 'I need a simple FAQ chatbot', expected: 'basic-chatbot' },
    { request: 'Build me a customer support system', expected: 'customer-support' },
    { request: 'I want to process and validate data', expected: 'data-processor' },
    { request: 'Create a multi-agent workflow system', expected: 'multi-agent-system' },
    { request: 'Document search and RAG assistant', expected: 'rag-assistant' },
    { request: 'Task automation and scheduling bot', expected: 'task-automation' },
  ];

  // Load all templates and their keywords
  const templates = new Map<string, string[]>();

  const templateDirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);

  for (const name of templateDirs) {
    const metadataPath = path.join(TEMPLATES_DIR, name, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata: TemplateMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      templates.set(name, metadata.keywords || metadata.tags || []);
    }
  }

  // Simple keyword matching function (same logic as template-ipc.ts)
  function matchTemplate(request: string): string | null {
    const requestLower = request.toLowerCase();
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [name, keywords] of templates) {
      let score = 0;
      for (const keyword of keywords) {
        if (requestLower.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = name;
      }
    }

    return bestScore >= 2 ? bestMatch : null;
  }

  for (const { request, expected } of testCases) {
    const matched = matchTemplate(request);
    if (matched === expected) {
      pass(`match-${expected}`);
    } else {
      fail(`match-${expected}`, `Expected "${expected}", got "${matched}"`);
    }
  }
}

// ============================================================================
// Test 3: Variable substitution
// ============================================================================
function testVariableSubstitution(): void {
  log('\n🔄 Test 3: Variable Substitution');

  const testContent = `
# {{AGENT_NAME}} Configuration
DOMAIN={{DOMAIN}}
USE_MEMORY={{USE_MEMORY}}
Company: {{COMPANY_NAME}}
`;

  const variables = {
    AGENT_NAME: 'TestBot',
    DOMAIN: 'E-commerce',
    USE_MEMORY: 'true',
    COMPANY_NAME: 'Acme Inc',
  };

  let result = testContent;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }

  // Check all variables were replaced
  if (result.includes('{{')) {
    fail('variable-substitution', 'Some placeholders not replaced');
  } else if (!result.includes('TestBot')) {
    fail('variable-substitution', 'AGENT_NAME not substituted');
  } else if (!result.includes('E-commerce')) {
    fail('variable-substitution', 'DOMAIN not substituted');
  } else if (!result.includes('Acme Inc')) {
    fail('variable-substitution', 'COMPANY_NAME not substituted');
  } else {
    pass('variable-substitution');
  }
}

// ============================================================================
// Test 4: Template file existence
// ============================================================================
function testTemplateFiles(): void {
  log('\n📁 Test 4: Template File Existence');

  const templateDirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);

  for (const templateName of templateDirs) {
    const templateDir = path.join(TEMPLATES_DIR, templateName);
    const metadataPath = path.join(templateDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      fail(`files-${templateName}`, 'metadata.json not found');
      continue;
    }

    const metadata: TemplateMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Check if files declared in metadata exist
    if (metadata.files && Array.isArray(metadata.files)) {
      let allFilesExist = true;
      const missingFiles: string[] = [];

      for (const fileInfo of metadata.files) {
        const filePath = path.join(templateDir, fileInfo.template);
        if (!fs.existsSync(filePath)) {
          allFilesExist = false;
          missingFiles.push(fileInfo.template);
        }
      }

      if (allFilesExist) {
        pass(`files-${templateName}`);
      } else {
        fail(`files-${templateName}`, `Missing: ${missingFiles.join(', ')}`);
      }
    } else {
      // If no explicit files list, just check for essential files
      const essentialFiles = ['main.py.template', 'requirements.txt'];
      let hasEssentials = true;

      for (const essential of essentialFiles) {
        if (!fs.existsSync(path.join(templateDir, essential))) {
          hasEssentials = false;
          break;
        }
      }

      if (hasEssentials) {
        pass(`files-${templateName}`);
      } else {
        fail(`files-${templateName}`, 'Missing essential template files');
      }
    }
  }
}

// ============================================================================
// Test 5: Python syntax validation (basic check)
// ============================================================================
function testPythonSyntax(): void {
  log('\n🐍 Test 5: Python Syntax Validation (basic)');

  const templateDirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);

  for (const templateName of templateDirs) {
    const templateDir = path.join(TEMPLATES_DIR, templateName);
    const mainPyPath = path.join(templateDir, 'main.py.template');

    if (!fs.existsSync(mainPyPath)) {
      fail(`syntax-${templateName}`, 'main.py.template not found');
      continue;
    }

    const content = fs.readFileSync(mainPyPath, 'utf-8');

    // Basic Python syntax checks
    const issues: string[] = [];

    // Check for balanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push('unbalanced parentheses');
    }

    // Check for balanced brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push('unbalanced brackets');
    }

    // Check for balanced braces (excluding template vars)
    const contentNoTemplateVars = content.replace(/\{\{[^}]+\}\}/g, '');
    const openBraces = (contentNoTemplateVars.match(/\{/g) || []).length;
    const closeBraces = (contentNoTemplateVars.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push('unbalanced braces');
    }

    // Check for common Python keywords present
    if (!content.includes('import') && !content.includes('from')) {
      issues.push('no imports found');
    }

    if (issues.length === 0) {
      pass(`syntax-${templateName}`);
    } else {
      fail(`syntax-${templateName}`, issues.join(', '));
    }
  }
}

// ============================================================================
// Run all tests
// ============================================================================
function main(): void {
  log('🧪 NanoClaw Template Tests');
  log('==========================');

  testTemplateLoading();
  testKeywordMatching();
  testVariableSubstitution();
  testTemplateFiles();
  testPythonSyntax();

  // Summary
  log('\n📊 Test Summary');
  log('===============');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    log('\n❌ Failed tests:');
    for (const result of results.filter(r => !r.passed)) {
      log(`  - ${result.name}: ${result.error}`);
    }
    process.exit(1);
  } else {
    log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main();
