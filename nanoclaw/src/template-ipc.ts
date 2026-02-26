/**
 * Template IPC Handler for NanoClaw
 * Processes template operations requested via IPC files from containers.
 * Uses TemplateManager to load, match, and generate code from templates.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from './logger.js';

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
 */
function handleGenerateFromTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    template_name: string;
    variables: Record<string, string>;
    output_dir?: string;
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

  logger.info(
    {
      template: params.template_name,
      files: Object.keys(result.files).length,
      outputDir: result.outputDir,
    },
    'Template generated via IPC'
  );

  return {
    success: true,
    id: request.id,
    timestamp: new Date().toISOString(),
    result: {
      files: result.files,
      output_dir: result.outputDir,
      file_count: Object.keys(result.files).length,
    },
  };
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
      // Check for correct version
      if (!content.includes('"@openai/chatkit-react": "^0.1.9"')) {
        errors.push('package.json MUST have @openai/chatkit-react version ^0.1.9');
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
 */
function handleGenerateFrontendFromTemplate(request: TemplateIPCRequest): TemplateIPCResponse {
  const params = request.params as {
    template_name: string;
    variables: Record<string, string>;
    output_dir?: string;
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

  logger.info(
    {
      template: params.template_name,
      files: Object.keys(result.files).length,
      outputDir: result.outputDir,
      chatKitValidation: 'passed',
    },
    'Frontend template generated via IPC with ChatKit validation'
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
    },
  };
}
