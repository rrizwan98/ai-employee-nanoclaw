/**
 * Template IPC Handler for NanoClaw
 * Processes template operations requested via IPC files from containers.
 * Uses TemplateManager to load, match, and generate code from templates.
 *
 * Includes automatic TDD validation (Level 1-4) before delivery.
 */
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { logger } from './logger.js';

// =============================================================================
// TDD Validation System
// =============================================================================

interface TDDValidationResult {
  success: boolean;
  level1: { passed: boolean; errors: string[] };
  level2: { passed: boolean; errors: string[] };
  level3: { passed: boolean; errors: string[] };
  level4: { passed: boolean; errors: string[] };
  timing: number;
}

/**
 * Run TDD validation on generated code
 * Executes Level 1-4 tests in sequence
 *
 * Level 1: Syntax tests (fast, no dependencies)
 * Level 2: Import tests (requires Python SDK)
 * Level 3: Runtime tests (requires Docker sandbox)
 * Level 4: Integration tests (requires full stack)
 */
function runTDDValidation(
  projectDir: string,
  options: {
    skipLevel3?: boolean;
    skipLevel4?: boolean;
    useSandbox?: boolean;
  } = {}
): TDDValidationResult {
  const startTime = Date.now();
  const testsDir = path.join(process.cwd(), 'container', 'tests');

  const result: TDDValidationResult = {
    success: true,
    level1: { passed: true, errors: [] },
    level2: { passed: true, errors: [] },
    level3: { passed: true, errors: [] },
    level4: { passed: true, errors: [] },
    timing: 0,
  };

  // Set environment variable for test to find generated project
  const env = {
    ...process.env,
    GENERATED_PROJECT_DIR: projectDir,
  };

  try {
    // Level 1: Syntax Tests (~5 seconds)
    logger.info({ projectDir }, 'Running TDD Level 1: Syntax Tests');
    try {
      execSync(`python -m pytest -m level1 -v --tb=short 2>&1`, {
        cwd: testsDir,
        env,
        timeout: 30000, // 30 seconds
        encoding: 'utf-8',
      });
      result.level1.passed = true;
    } catch (error: any) {
      result.level1.passed = false;
      result.level1.errors = [error.stdout || error.message || 'Level 1 tests failed'];
      result.success = false;
      // Level 1 failure is critical - stop here
      result.timing = Date.now() - startTime;
      return result;
    }

    // Level 2: Import Tests (~15 seconds)
    logger.info({ projectDir }, 'Running TDD Level 2: Import Tests');
    try {
      execSync(`python -m pytest -m level2 -v --tb=short 2>&1`, {
        cwd: testsDir,
        env,
        timeout: 60000, // 60 seconds
        encoding: 'utf-8',
      });
      result.level2.passed = true;
    } catch (error: any) {
      result.level2.passed = false;
      result.level2.errors = [error.stdout || error.message || 'Level 2 tests failed'];
      result.success = false;
      // Level 2 failure is critical - stop here
      result.timing = Date.now() - startTime;
      return result;
    }

    // Level 3: Runtime Tests (~60 seconds) - Optional
    if (!options.skipLevel3 && options.useSandbox) {
      logger.info({ projectDir }, 'Running TDD Level 3: Runtime Tests');
      try {
        execSync(`python -m pytest -m level3 --use-sandbox -v --tb=short 2>&1`, {
          cwd: testsDir,
          env,
          timeout: 120000, // 2 minutes
          encoding: 'utf-8',
        });
        result.level3.passed = true;
      } catch (error: any) {
        result.level3.passed = false;
        result.level3.errors = [error.stdout || error.message || 'Level 3 tests failed'];
        // Level 3 failure is warning - continue to Level 4
      }
    } else {
      result.level3.passed = true;
      result.level3.errors = ['Skipped (no sandbox)'];
    }

    // Level 4: Integration Tests (~120 seconds) - Optional
    if (!options.skipLevel4 && options.useSandbox) {
      logger.info({ projectDir }, 'Running TDD Level 4: Integration Tests');
      try {
        execSync(`python -m pytest -m level4 --use-sandbox -v --tb=short 2>&1`, {
          cwd: testsDir,
          env,
          timeout: 180000, // 3 minutes
          encoding: 'utf-8',
        });
        result.level4.passed = true;
      } catch (error: any) {
        result.level4.passed = false;
        result.level4.errors = [error.stdout || error.message || 'Level 4 tests failed'];
        // Level 4 failure is warning - code can still be delivered
      }
    } else {
      result.level4.passed = true;
      result.level4.errors = ['Skipped (no sandbox)'];
    }

  } catch (error: any) {
    logger.error({ error }, 'TDD validation failed with unexpected error');
    result.success = false;
  }

  result.timing = Date.now() - startTime;

  // Success only if Level 1 and Level 2 pass (critical)
  result.success = result.level1.passed && result.level2.passed;

  logger.info({
    success: result.success,
    level1: result.level1.passed,
    level2: result.level2.passed,
    level3: result.level3.passed,
    level4: result.level4.passed,
    timing: result.timing,
  }, 'TDD validation completed');

  return result;
}

/**
 * Check if Docker sandbox is available
 */
function isSandboxAvailable(): boolean {
  try {
    const result = execSync('docker images -q nanoclaw-test-sandbox:latest 2>&1', {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return !!result.trim();
  } catch {
    return false;
  }
}

// Template directory - inside the container templates directory
const CONTAINER_TEMPLATES_DIR = path.join(
  process.cwd(),
  'container',
  'templates'
);

export interface TemplateIPCRequest {
  operation: string;
  id: string;
  timestamp: string;
  params: Record<string, unknown>;
}

export interface TemplateIPCResponse {
  success: boolean;
  id: string;
  timestamp: string;
  result?: Record<string, unknown>;
  error?: string;
}

interface TemplateMetadata {
  name: string;
  displayName?: string;
  display_name?: string;
  description: string;
  version: string;
  complexity?: string;
  keywords?: string[];
  tags?: string[];
  variables?: Record<string, {
    description: string;
    type: string;
    required?: boolean;
    default?: unknown;
  }> | Array<{
    name: string;
    description: string;
    required?: boolean;
    default?: unknown;
  }>;
  files?: Array<{
    path: string;
    template: string;
  }>;
}

interface LoadedTemplate {
  metadata: TemplateMetadata;
  files: Record<string, string>;
}

/**
 * Load template metadata from a directory
 */
function loadTemplateMetadata(templateDir: string): TemplateMetadata | null {
  const metadataPath = path.join(templateDir, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content) as TemplateMetadata;
  } catch (error) {
    logger.warn({ templateDir, error }, 'Failed to load template metadata');
    return null;
  }
}

/**
 * Get all available templates
 */
function getAvailableTemplates(): Map<string, TemplateMetadata> {
  const templates = new Map<string, TemplateMetadata>();

  if (!fs.existsSync(CONTAINER_TEMPLATES_DIR)) {
    logger.warn({ dir: CONTAINER_TEMPLATES_DIR }, 'Templates directory not found');
    return templates;
  }

  const entries = fs.readdirSync(CONTAINER_TEMPLATES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
      const templateDir = path.join(CONTAINER_TEMPLATES_DIR, entry.name);
      const metadata = loadTemplateMetadata(templateDir);
      if (metadata) {
        templates.set(entry.name, metadata);
      }
    }
  }

  return templates;
}

/**
 * Load a specific template with all its files
 */
function loadTemplate(name: string): LoadedTemplate | null {
  const templateDir = path.join(CONTAINER_TEMPLATES_DIR, name);

  if (!fs.existsSync(templateDir)) {
    return null;
  }

  const metadata = loadTemplateMetadata(templateDir);
  if (!metadata) {
    return null;
  }

  const files: Record<string, string> = {};

  // If metadata has explicit file list, use that
  if (metadata.files && Array.isArray(metadata.files)) {
    for (const fileInfo of metadata.files) {
      const templatePath = path.join(templateDir, fileInfo.template);
      if (fs.existsSync(templatePath)) {
        files[fileInfo.path] = fs.readFileSync(templatePath, 'utf-8');
      }
    }
  } else {
    // Otherwise, load all template files from the directory
    const loadFilesRecursively = (dir: string, basePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          loadFilesRecursively(fullPath, relativePath);
        } else if (entry.name !== 'metadata.json') {
          // Convert .template extension to actual filename
          const outputPath = entry.name.endsWith('.template')
            ? relativePath.replace(/\.template$/, '')
            : relativePath;
          files[outputPath] = fs.readFileSync(fullPath, 'utf-8');
        }
      }
    };

    loadFilesRecursively(templateDir);
  }

  return { metadata, files };
}

/**
 * Match a client request to the best template using keyword scoring
 */
function matchTemplate(
  request: string,
  minScore: number = 2
): { template: string | null; score: number; matchedKeywords: string[] } {
  const templates = getAvailableTemplates();
  const requestLower = request.toLowerCase();

  let bestMatch: string | null = null;
  let bestScore = 0;
  let matchedKeywords: string[] = [];

  for (const [name, metadata] of templates) {
    // Get keywords from either keywords or tags field
    const keywords = metadata.keywords || metadata.tags || [];
    const matches: string[] = [];

    for (const keyword of keywords) {
      if (requestLower.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    }

    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestMatch = name;
      matchedKeywords = matches;
    }
  }

  return {
    template: bestScore >= minScore ? bestMatch : null,
    score: bestScore,
    matchedKeywords,
  };
}

/**
 * Apply variable substitutions to template content
 */
function applySubstitutions(content: string, variables: Record<string, string>): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    // Replace {{VARIABLE}} pattern
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }

  return result;
}

/**
 * Generate code from a template with customizations
 */
function generateFromTemplate(
  templateName: string,
  variables: Record<string, string>,
  outputDir?: string
): { files: Record<string, string>; outputDir: string } | null {
  const template = loadTemplate(templateName);
  if (!template) {
    return null;
  }

  const customizedFiles: Record<string, string> = {};

  for (const [filePath, content] of Object.entries(template.files)) {
    customizedFiles[filePath] = applySubstitutions(content, variables);
  }

  // Determine output directory
  const actualOutputDir = outputDir || path.join('/tmp', `template-${Date.now()}`);

  // Write files to output directory
  fs.mkdirSync(actualOutputDir, { recursive: true });

  for (const [filePath, content] of Object.entries(customizedFiles)) {
    const fullPath = path.join(actualOutputDir, filePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  return {
    files: customizedFiles,
    outputDir: actualOutputDir,
  };
}

/**
 * Process a template IPC operation request
 */
export async function processTemplateOperation(
  request: TemplateIPCRequest
): Promise<TemplateIPCResponse> {
  try {
    switch (request.operation) {
      // Backend template operations
      case 'list_templates':
        return handleListTemplates(request);

      case 'match_template':
        return handleMatchTemplate(request);

      case 'load_template':
        return handleLoadTemplate(request);

      case 'generate_from_template':
        return handleGenerateFromTemplate(request);

      // TDD Validation for ANY project (template or manual code)
      case 'validate_project_code':
        return handleValidateProjectCode(request);

      // Frontend template operations
      case 'is_frontend_request':
        return handleIsFrontendRequest(request);

      case 'list_frontend_templates':
        return handleListFrontendTemplates(request);

      case 'match_frontend_template':
        return handleMatchFrontendTemplate(request);

      case 'load_frontend_template':
        return handleLoadFrontendTemplate(request);

      case 'generate_frontend_from_template':
        return handleGenerateFrontendFromTemplate(request);

      default:
        return {
          success: false,
          id: request.id,
          timestamp: new Date().toISOString(),
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    logger.error({ error, operation: request.operation }, 'Template IPC operation failed');
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handle list_templates operation
 */
function handleListTemplates(request: TemplateIPCRequest): TemplateIPCResponse {
  const templates = getAvailableTemplates();

  const templateList = Array.from(templates.entries()).map(([name, metadata]) => ({
    name,
    displayName: metadata.displayName || metadata.display_name || name,
    description: metadata.description,
    complexity: metadata.complexity || 'medium',
    keywords: metadata.keywords || metadata.tags || [],
  }));

  logger.info({ count: templateList.length }, 'Templates listed via IPC');

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      templates: templateList,
      count: templateList.length,
    },
  };
}

/**
 * Handle match_template operation
 */
function handleMatchTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    request: string;
    min_score?: number;
  };

  const { template, score, matchedKeywords } = matchTemplate(
    params.request,
    params.min_score || 2
  );

  logger.info(
    { request: params.request, template, score, matchedKeywords },
    'Template matched via IPC'
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      template,
      score,
      matched_keywords: matchedKeywords,
    },
  };
}

/**
 * Handle load_template operation
 */
function handleLoadTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as { name: string };

  const template = loadTemplate(params.name);
  if (!template) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Template not found: ${params.name}`,
    };
  }

  // Convert variables to array format for consistent response
  let variablesList: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: unknown;
  }> = [];

  if (template.metadata.variables) {
    if (Array.isArray(template.metadata.variables)) {
      variablesList = template.metadata.variables.map((v) => ({
        name: v.name,
        description: v.description,
        required: v.required || false,
        default: v.default,
      }));
    } else {
      // Convert object format to array
      variablesList = Object.entries(template.metadata.variables).map(([name, info]) => ({
        name,
        description: info.description,
        required: info.required || false,
        default: info.default,
      }));
    }
  }

  logger.info({ template: params.name }, 'Template loaded via IPC');

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      metadata: {
        name: template.metadata.name,
        displayName: template.metadata.displayName || template.metadata.display_name,
        description: template.metadata.description,
        version: template.metadata.version,
        complexity: template.metadata.complexity,
        variables: variablesList,
      },
      files: template.files,
      file_count: Object.keys(template.files).length,
    },
  };
}

/**
 * Handle generate_from_template operation
 *
 * IMPORTANT: This now includes automatic TDD validation!
 * Code will NOT be delivered if Level 1 or Level 2 tests fail.
 */
function handleGenerateFromTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    template_name: string;
    variables: Record<string, string>;
    output_dir?: string;
    skip_tdd_validation?: boolean;  // Allow skipping for development
    run_full_validation?: boolean;  // Include Level 3-4 with sandbox
  };

  const result = generateFromTemplate(
    params.template_name,
    params.variables,
    params.output_dir
  );

  if (!result) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Failed to generate from template: ${params.template_name}`,
    };
  }

  // ==========================================================================
  // AUTOMATIC TDD VALIDATION - MANDATORY BEFORE DELIVERY
  // ==========================================================================
  let tddResult: TDDValidationResult | null = null;

  if (!params.skip_tdd_validation) {
    logger.info({ outputDir: result.outputDir }, 'Running automatic TDD validation before delivery');

    const sandboxAvailable = isSandboxAvailable();
    tddResult = runTDDValidation(result.outputDir, {
      useSandbox: sandboxAvailable && (params.run_full_validation || false),
      skipLevel3: !params.run_full_validation,
      skipLevel4: !params.run_full_validation,
    });

    // BLOCK DELIVERY if Level 1 or Level 2 fails
    if (!tddResult.success) {
      logger.error({
        template: params.template_name,
        level1: tddResult.level1,
        level2: tddResult.level2,
      }, 'TDD validation FAILED - blocking delivery');

      const errorMessages: string[] = [];
      if (!tddResult.level1.passed) {
        errorMessages.push(`Level 1 (Syntax) FAILED: ${tddResult.level1.errors.join('; ')}`);
      }
      if (!tddResult.level2.passed) {
        errorMessages.push(`Level 2 (Import) FAILED: ${tddResult.level2.errors.join('; ')}`);
      }

      return {
        success: false,
        id: request.id,
        timestamp: new Date().toISOString(),
        error: `⛔ TDD VALIDATION FAILED - DELIVERY BLOCKED\n\n${errorMessages.join('\n\n')}\n\nFix the errors and regenerate.`,
        result: {
          tdd_validation: {
            success: false,
            level1: tddResult.level1,
            level2: tddResult.level2,
            level3: tddResult.level3,
            level4: tddResult.level4,
            timing_ms: tddResult.timing,
          },
          files: result.files,
          output_dir: result.outputDir,
        },
      };
    }
  }

  logger.info(
    {
      template: params.template_name,
      files: Object.keys(result.files).length,
      outputDir: result.outputDir,
      tdd_validated: tddResult ? tddResult.success : 'skipped',
    },
    'Template generated via IPC with TDD validation'
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      files: result.files,
      output_dir: result.outputDir,
      file_count: Object.keys(result.files).length,
      tdd_validation: tddResult ? {
        success: tddResult.success,
        level1: tddResult.level1.passed,
        level2: tddResult.level2.passed,
        level3: tddResult.level3.passed,
        level4: tddResult.level4.passed,
        timing_ms: tddResult.timing,
      } : { skipped: true },
    },
  };
}

// ============================================================================
// validate_project_code - TDD Validation for ANY Project (Template or Manual)
// ============================================================================

/**
 * Handle validate_project_code operation
 *
 * This is the MANDATORY TDD validation tool that Claude MUST call
 * before delivering ANY code - whether from template or manual.
 *
 * Usage:
 * - Call this tool BEFORE packaging ZIP for delivery
 * - If Level 1-2 fail, DO NOT DELIVER
 * - If Level 3-4 fail, WARN client but can deliver
 */
function handleValidateProjectCode(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    project_path: string;           // Path to project directory
    project_type?: 'backend' | 'frontend' | 'auto';  // Type of project
    run_level_3?: boolean;          // Run Level 3 runtime tests (default: true)
    run_level_4?: boolean;          // Run Level 4 integration tests (default: false)
  };

  if (!params.project_path) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: 'project_path is required',
    };
  }

  // Verify project path exists
  if (!fs.existsSync(params.project_path)) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Project path does not exist: ${params.project_path}`,
    };
  }

  logger.info(
    { projectPath: params.project_path, projectType: params.project_type || 'auto' },
    'Running TDD validation on project via validate_project_code'
  );

  // Determine project type if auto
  let projectType = params.project_type || 'auto';
  if (projectType === 'auto') {
    // Check for frontend indicators
    const hasPackageJson = fs.existsSync(path.join(params.project_path, 'package.json'));
    const hasNextConfig = fs.existsSync(path.join(params.project_path, 'next.config.js')) ||
                          fs.existsSync(path.join(params.project_path, 'next.config.ts'));
    const hasPythonFiles = fs.readdirSync(params.project_path).some(f => f.endsWith('.py'));

    if (hasNextConfig || (hasPackageJson && !hasPythonFiles)) {
      projectType = 'frontend';
    } else {
      projectType = 'backend';
    }
    logger.info({ detectedType: projectType }, 'Auto-detected project type');
  }

  // Run TDD validation
  const sandboxAvailable = isSandboxAvailable();
  const runLevel3 = params.run_level_3 !== false;  // Default true
  const runLevel4 = params.run_level_4 === true;   // Default false

  let tddResult: TDDValidationResult;

  if (projectType === 'frontend') {
    // Frontend-specific validation
    tddResult = runFrontendTDDValidation(params.project_path, {
      runLevel3,
      runLevel4,
    });
  } else {
    // Backend validation using existing function
    tddResult = runTDDValidation(params.project_path, {
      useSandbox: sandboxAvailable,
      skipLevel3: !runLevel3,
      skipLevel4: !runLevel4,
    });
  }

  // Build detailed result
  const resultDetails = {
    project_path: params.project_path,
    project_type: projectType,
    tdd_validation: {
      success: tddResult.success,
      level1: {
        passed: tddResult.level1.passed,
        errors: tddResult.level1.errors,
        description: 'Syntax Tests - Must pass for delivery',
      },
      level2: {
        passed: tddResult.level2.passed,
        errors: tddResult.level2.errors,
        description: 'Import Tests - Must pass for delivery',
      },
      level3: {
        passed: tddResult.level3.passed,
        errors: tddResult.level3.errors,
        description: 'Runtime Tests - Should pass (warn if fail)',
      },
      level4: {
        passed: tddResult.level4.passed,
        errors: tddResult.level4.errors,
        description: 'Integration Tests - Recommended (notify if fail)',
      },
      timing_ms: tddResult.timing,
    },
    delivery_decision: tddResult.success
      ? '✅ SAFE TO DELIVER - Level 1-2 passed'
      : '⛔ DO NOT DELIVER - Level 1 or 2 failed',
    warnings: [] as string[],
  };

  // Add warnings for Level 3-4 failures
  if (!tddResult.level3.passed && tddResult.level3.errors[0] !== 'Skipped (no sandbox)') {
    resultDetails.warnings.push('Level 3 (Runtime) failed - notify client');
  }
  if (!tddResult.level4.passed && tddResult.level4.errors[0] !== 'Skipped (no sandbox)') {
    resultDetails.warnings.push('Level 4 (Integration) failed - notify client');
  }

  logger.info(
    {
      projectPath: params.project_path,
      success: tddResult.success,
      level1: tddResult.level1.passed,
      level2: tddResult.level2.passed,
      level3: tddResult.level3.passed,
      level4: tddResult.level4.passed,
    },
    'validate_project_code completed'
  );

  // Return failure if Level 1-2 don't pass
  if (!tddResult.success) {
    const errorMessages: string[] = [];
    if (!tddResult.level1.passed) {
      errorMessages.push(`Level 1 (Syntax) FAILED:\n${tddResult.level1.errors.join('\n')}`);
    }
    if (!tddResult.level2.passed) {
      errorMessages.push(`Level 2 (Import) FAILED:\n${tddResult.level2.errors.join('\n')}`);
    }

    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `⛔ TDD VALIDATION FAILED - DO NOT DELIVER!\n\n${errorMessages.join('\n\n')}\n\nFix the errors before delivery.`,
      result: resultDetails,
    };
  }

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: resultDetails,
  };
}

/**
 * Run frontend-specific TDD validation
 * Uses TypeScript compiler and npm build instead of pytest
 */
function runFrontendTDDValidation(
  projectDir: string,
  options: {
    runLevel3?: boolean;
    runLevel4?: boolean;
  } = {}
): TDDValidationResult {
  const startTime = Date.now();

  const result: TDDValidationResult = {
    success: true,
    level1: { passed: true, errors: [] },
    level2: { passed: true, errors: [] },
    level3: { passed: true, errors: [] },
    level4: { passed: true, errors: [] },
    timing: 0,
  };

  try {
    // Level 1: TypeScript Syntax Check
    logger.info({ projectDir }, 'Running Frontend TDD Level 1: TypeScript Syntax');
    try {
      execSync('npx tsc --noEmit 2>&1', {
        cwd: projectDir,
        timeout: 60000,
        encoding: 'utf-8',
      });
      result.level1.passed = true;
    } catch (error: any) {
      result.level1.passed = false;
      result.level1.errors = [error.stdout || error.message || 'TypeScript compilation failed'];
      result.success = false;
      result.timing = Date.now() - startTime;
      return result;
    }

    // Level 2: Dependency/Import Check (npm install + basic import test)
    logger.info({ projectDir }, 'Running Frontend TDD Level 2: Dependencies');
    try {
      // Check if node_modules exists, if not run npm install
      if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
        execSync('npm install 2>&1', {
          cwd: projectDir,
          timeout: 120000,
          encoding: 'utf-8',
        });
      }
      // Run tests if they exist
      execSync('npm test --passWithNoTests 2>&1', {
        cwd: projectDir,
        timeout: 60000,
        encoding: 'utf-8',
      });
      result.level2.passed = true;
    } catch (error: any) {
      result.level2.passed = false;
      result.level2.errors = [error.stdout || error.message || 'Import/dependency check failed'];
      result.success = false;
      result.timing = Date.now() - startTime;
      return result;
    }

    // Level 3: Build Check (npm run build)
    if (options.runLevel3 !== false) {
      logger.info({ projectDir }, 'Running Frontend TDD Level 3: Build');
      try {
        execSync('npm run build 2>&1', {
          cwd: projectDir,
          timeout: 180000, // 3 minutes for build
          encoding: 'utf-8',
        });
        result.level3.passed = true;
      } catch (error: any) {
        result.level3.passed = false;
        result.level3.errors = [error.stdout || error.message || 'Build failed'];
        // Level 3 failure is warning, not blocking
      }
    } else {
      result.level3.errors = ['Skipped'];
    }

    // Level 4: Dev Server Check
    if (options.runLevel4) {
      logger.info({ projectDir }, 'Running Frontend TDD Level 4: Dev Server');
      try {
        // Start dev server in background
        const devProcess = spawn('npm', ['run', 'dev'], {
          cwd: projectDir,
          detached: true,
          stdio: 'pipe',
        });

        // Wait a bit for server to start (using sync sleep)
        execSync('sleep 5', { timeout: 10000 });

        // Check if server is responding
        try {
          execSync('curl -s http://localhost:3000 > /dev/null 2>&1', {
            timeout: 10000,
          });
          result.level4.passed = true;
        } catch {
          result.level4.passed = false;
          result.level4.errors = ['Dev server not responding on localhost:3000'];
        }

        // Kill the dev server
        if (devProcess.pid) {
          try {
            process.kill(-devProcess.pid);
          } catch {
            // Ignore kill errors
          }
        }
      } catch (error: any) {
        result.level4.passed = false;
        result.level4.errors = [error.message || 'Dev server test failed'];
      }
    } else {
      result.level4.errors = ['Skipped'];
    }

  } catch (error: any) {
    logger.error({ error }, 'Frontend TDD validation failed with unexpected error');
    result.success = false;
  }

  result.timing = Date.now() - startTime;
  result.success = result.level1.passed && result.level2.passed;

  return result;
}

// ============================================================================
// Frontend Template Operations
// These handle frontend-specific templates (Next.js, ChatKit, etc.)
// ============================================================================

// Frontend-specific keywords for matching
const FRONTEND_KEYWORDS = new Set([
  'website', 'frontend', 'ui', 'landing', 'page', 'nextjs', 'next.js',
  'react', 'chat widget', 'chatkit', 'web app', 'dashboard', 'portal',
  'test agent', 'try agent', 'use agent', 'interface'
]);

/**
 * Check if a template is a frontend template
 */
function isFrontendTemplate(metadata: TemplateMetadata): boolean {
  // Check explicit type field
  const metaAny = metadata as unknown as Record<string, unknown>;
  if (metaAny.type === 'frontend') {
    return true;
  }
  // Check framework
  if (metaAny.framework && ['nextjs', 'react', 'vue'].includes(metaAny.framework as string)) {
    return true;
  }
  // Check keywords
  const keywords = (metadata.keywords || metadata.tags || []).map(k => k.toLowerCase());
  const frontendKeywords = ['frontend', 'website', 'nextjs', 'react', 'chatkit', 'ui'];
  for (const kw of keywords) {
    if (frontendKeywords.includes(kw)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all available frontend templates
 */
function getAvailableFrontendTemplates(): Map<string, TemplateMetadata> {
  const allTemplates = getAvailableTemplates();
  const frontendTemplates = new Map<string, TemplateMetadata>();

  for (const [name, metadata] of allTemplates) {
    if (isFrontendTemplate(metadata)) {
      frontendTemplates.set(name, metadata);
    }
  }

  return frontendTemplates;
}

/**
 * Check if a request is asking for frontend
 */
function checkIsFrontendRequest(request: string): boolean {
  const requestLower = request.toLowerCase();
  for (const keyword of FRONTEND_KEYWORDS) {
    if (requestLower.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * Match a request to the best frontend template
 */
function matchFrontendTemplate(
  request: string,
  minScore: number = 1
): { template: string | null; score: number; matchedKeywords: string[] } {
  const templates = getAvailableFrontendTemplates();
  const requestLower = request.toLowerCase();

  let bestMatch: string | null = null;
  let bestScore = 0;
  let matchedKeywords: string[] = [];

  for (const [name, metadata] of templates) {
    const keywords = metadata.keywords || metadata.tags || [];
    const matches: string[] = [];

    for (const keyword of keywords) {
      if (requestLower.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    }

    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestMatch = name;
      matchedKeywords = matches;
    }
  }

  return {
    template: bestScore >= minScore ? bestMatch : null,
    score: bestScore,
    matchedKeywords,
  };
}

/**
 * Handle is_frontend_request operation
 */
function handleIsFrontendRequest(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as { request: string };

  const isFrontend = checkIsFrontendRequest(params.request);

  logger.info({ request: params.request, isFrontend }, 'Frontend request check via IPC');

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      is_frontend: isFrontend,
    },
  };
}

/**
 * Handle list_frontend_templates operation
 */
function handleListFrontendTemplates(request: TemplateIPCRequest): TemplateIPCResponse {
  const templates = getAvailableFrontendTemplates();

  const templateList = Array.from(templates.entries()).map(([name, metadata]) => {
    const metaAny = metadata as unknown as Record<string, unknown>;
    return {
      name,
      displayName: metadata.displayName || metadata.display_name || name,
      description: metadata.description,
      complexity: metadata.complexity || 'medium',
      framework: metaAny.framework || 'unknown',
      keywords: metadata.keywords || metadata.tags || [],
    };
  });

  logger.info({ count: templateList.length }, 'Frontend templates listed via IPC');

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      templates: templateList,
      count: templateList.length,
    },
  };
}

/**
 * Handle match_frontend_template operation
 */
function handleMatchFrontendTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    request: string;
    min_score?: number;
  };

  const { template, score, matchedKeywords } = matchFrontendTemplate(
    params.request,
    params.min_score || 1
  );

  logger.info(
    { request: params.request, template, score, matchedKeywords },
    'Frontend template matched via IPC'
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      template,
      score,
      matched_keywords: matchedKeywords,
    },
  };
}

/**
 * Handle load_frontend_template operation
 */
function handleLoadFrontendTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as { name: string };

  // Check if it's a frontend template
  const frontendTemplates = getAvailableFrontendTemplates();
  if (!frontendTemplates.has(params.name)) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Frontend template not found: ${params.name}. Use list_frontend_templates to see available options.`,
    };
  }

  const template = loadTemplate(params.name);
  if (!template) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Failed to load frontend template: ${params.name}`,
    };
  }

  // Convert variables to array format
  let variablesList: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: unknown;
  }> = [];

  if (template.metadata.variables) {
    if (Array.isArray(template.metadata.variables)) {
      variablesList = template.metadata.variables.map((v) => ({
        name: v.name,
        description: v.description,
        required: v.required || false,
        default: v.default,
      }));
    } else {
      variablesList = Object.entries(template.metadata.variables).map(([name, info]) => ({
        name,
        description: info.description,
        required: info.required || false,
        default: info.default,
      }));
    }
  }

  const metaAny = template.metadata as unknown as Record<string, unknown>;

  logger.info({ template: params.name }, 'Frontend template loaded via IPC');

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      metadata: {
        name: template.metadata.name,
        displayName: template.metadata.displayName || template.metadata.display_name,
        description: template.metadata.description,
        version: template.metadata.version,
        complexity: template.metadata.complexity,
        framework: metaAny.framework || 'unknown',
        variables: variablesList,
      },
      files: template.files,
      file_count: Object.keys(template.files).length,
    },
  };
}

/**
 * Validate ChatKit integration in generated files
 * Ensures ChatWidget.tsx uses @openai/chatkit-react correctly
 */
function validateChatKitIntegration(files: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Find ChatWidget.tsx file (could be in different paths)
  const chatWidgetPath = Object.keys(files).find(
    (path) => path.includes('ChatWidget.tsx') || path.includes('ChatWidget.ts')
  );

  if (chatWidgetPath) {
    const content = files[chatWidgetPath];

    // Check for required ChatKit import
    if (!content.includes('@openai/chatkit-react')) {
      errors.push('ChatWidget.tsx MUST import from @openai/chatkit-react');
    }

    // Check for useChatKit hook
    if (!content.includes('useChatKit')) {
      errors.push('ChatWidget.tsx MUST use useChatKit hook');
    }

    // Check for ChatKit component
    if (!content.includes('<ChatKit')) {
      errors.push('ChatWidget.tsx MUST render <ChatKit> component');
    }

    // Check for FORBIDDEN patterns (custom fetch implementation)
    if (content.includes('await fetch(') && content.includes('useState<Message')) {
      errors.push('ChatWidget.tsx contains FORBIDDEN custom fetch implementation');
    }

    // Check for FORBIDDEN lucide-react chat icons
    if (content.includes('lucide-react') && content.includes('MessageCircle')) {
      errors.push('ChatWidget.tsx contains FORBIDDEN lucide-react icons for chat');
    }
  }

  // Validate package.json has correct chatkit version
  const packageJsonPath = Object.keys(files).find((path) => path.endsWith('package.json'));
  if (packageJsonPath) {
    const content = files[packageJsonPath];
    if (content.includes('@openai/chatkit-react')) {
      // Check that chatkit-react is present (version not pinned - use latest)
      if (!content.includes('"@openai/chatkit-react"')) {
        errors.push('package.json MUST have @openai/chatkit-react');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Handle generate_frontend_from_template operation
 *
 * IMPORTANT: This now includes automatic TDD validation!
 * Code will NOT be delivered if Level 1 or Level 2 tests fail.
 * For frontend, Level 3 includes npm run build verification.
 */
function handleGenerateFrontendFromTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    template_name: string;
    variables: Record<string, string>;
    output_dir?: string;
    skip_tdd_validation?: boolean;  // Allow skipping for development
    run_full_validation?: boolean;  // Include Level 3-4 with sandbox
  };

  // Check if it's a frontend template
  const frontendTemplates = getAvailableFrontendTemplates();
  if (!frontendTemplates.has(params.template_name)) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Frontend template not found: ${params.template_name}. Use list_frontend_templates to see available options.`,
    };
  }

  const result = generateFromTemplate(
    params.template_name,
    params.variables,
    params.output_dir
  );

  if (!result) {
    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `Failed to generate frontend from template: ${params.template_name}`,
    };
  }

  // Validate ChatKit integration in generated files
  const validation = validateChatKitIntegration(result.files);
  if (!validation.valid) {
    logger.error(
      {
        template: params.template_name,
        errors: validation.errors,
      },
      'ChatKit validation failed for generated frontend'
    );

    return {
      success: false,
      id: request.id,
      timestamp: new Date().toISOString(),
      error: `ChatKit validation failed:\n${validation.errors.join('\n')}\n\nPlease check the template files.`,
    };
  }

  // ==========================================================================
  // AUTOMATIC TDD VALIDATION - MANDATORY BEFORE DELIVERY
  // ==========================================================================
  let tddResult: TDDValidationResult | null = null;

  if (!params.skip_tdd_validation) {
    logger.info({ outputDir: result.outputDir }, 'Running automatic TDD validation for frontend');

    const sandboxAvailable = isSandboxAvailable();
    tddResult = runTDDValidation(result.outputDir, {
      useSandbox: sandboxAvailable && (params.run_full_validation || false),
      skipLevel3: !params.run_full_validation,
      skipLevel4: !params.run_full_validation,
    });

    // BLOCK DELIVERY if Level 1 or Level 2 fails
    if (!tddResult.success) {
      logger.error({
        template: params.template_name,
        level1: tddResult.level1,
        level2: tddResult.level2,
      }, 'TDD validation FAILED for frontend - blocking delivery');

      const errorMessages: string[] = [];
      if (!tddResult.level1.passed) {
        errorMessages.push(`Level 1 (Syntax) FAILED: ${tddResult.level1.errors.join('; ')}`);
      }
      if (!tddResult.level2.passed) {
        errorMessages.push(`Level 2 (Import) FAILED: ${tddResult.level2.errors.join('; ')}`);
      }

      return {
        success: false,
        id: request.id,
        timestamp: new Date().toISOString(),
        error: `⛔ TDD VALIDATION FAILED - DELIVERY BLOCKED\n\n${errorMessages.join('\n\n')}\n\nFix the errors and regenerate.`,
        result: {
          tdd_validation: {
            success: false,
            level1: tddResult.level1,
            level2: tddResult.level2,
            level3: tddResult.level3,
            level4: tddResult.level4,
            timing_ms: tddResult.timing,
          },
          files: result.files,
          output_dir: result.outputDir,
        },
      };
    }
  }

  logger.info(
    {
      template: params.template_name,
      files: Object.keys(result.files).length,
      outputDir: result.outputDir,
      chatKitValidation: 'passed',
      tdd_validated: tddResult ? tddResult.success : 'skipped',
    },
    'Frontend template generated via IPC with ChatKit + TDD validation'
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      files: result.files,
      output_dir: result.outputDir,
      file_count: Object.keys(result.files).length,
      chatkit_validated: true,
      tdd_validation: tddResult ? {
        success: tddResult.success,
        level1: tddResult.level1.passed,
        level2: tddResult.level2.passed,
        level3: tddResult.level3.passed,
        level4: tddResult.level4.passed,
        timing_ms: tddResult.timing,
      } : { skipped: true },
    },
  };
}
