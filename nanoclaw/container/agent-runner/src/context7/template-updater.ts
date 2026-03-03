/**
 * Template Updater Module
 *
 * Updates template files (nanoclaw/container/templates/*.template)
 * when Context7 returns updated SDK patterns.
 * Validates templates pass TDD Level 1 after update.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  TemplateUpdateResult,
  PatternDifference,
  FileUpdateError,
} from './types.js';

/**
 * Pattern mappings for template updates
 */
const PATTERN_MAPPINGS: Record<string, RegExp[]> = {
  agent_class: [
    /Agent\s*\([^)]*\)/g,
    /class\s+\w+Agent[^:]*:/g,
  ],
  websearch_tool: [
    /WebSearchTool\s*\([^)]*\)/g,
  ],
  code_interpreter_tool: [
    /CodeInterpreterTool\s*\([^)]*\)/g,
  ],
  file_search_tool: [
    /FileSearchTool\s*\([^)]*\)/g,
  ],
  chatkit_store: [
    /class\s+\w*Store\s*\([^)]*\):/g,
    /async\s+def\s+(load_thread|save_thread|load_threads)\s*\([^)]*\)/g,
  ],
  fastapi_chatkit: [
    /ChatKitServer\s*\([^)]*\)/g,
    /async\s+def\s+respond\s*\([^)]*\)/g,
  ],
  nextjs_chatkit: [
    /openai-chatkit/g,
    /chatkit\.js/g,
  ],
};

/**
 * Template Updater class
 * Updates template files with latest SDK patterns from Context7
 */
export class TemplateUpdater {
  private templatesPath: string;

  constructor(templatesPath: string) {
    this.templatesPath = templatesPath;
  }

  /**
   * Find template files that match a glob pattern
   */
  async findTemplateFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of patterns) {
      const matchedFiles = await this.globMatch(pattern);
      files.push(...matchedFiles);
    }

    // Remove duplicates
    return [...new Set(files)];
  }

  /**
   * Simple glob matching for template files
   */
  private async globMatch(pattern: string): Promise<string[]> {
    const results: string[] = [];

    // Convert glob pattern to parts
    const parts = pattern.split('/');
    const basePart = parts[0];

    try {
      // List template directories
      const templateDirs = await fs.readdir(this.templatesPath);

      for (const dir of templateDirs) {
        // Check if directory matches first part of pattern
        if (basePart === '**' || basePart === '*' || dir === basePart || dir.includes(basePart.replace('*', ''))) {
          const dirPath = path.join(this.templatesPath, dir);
          const stat = await fs.stat(dirPath);

          if (stat.isDirectory()) {
            // Find template files in this directory
            const files = await this.findFilesRecursive(dirPath, parts.slice(1).join('/'));
            results.push(...files.map(f => path.relative(this.templatesPath, f)));
          }
        }
      }
    } catch (error) {
      console.warn(`[TemplateUpdater] Error matching pattern ${pattern}:`, error);
    }

    return results;
  }

  /**
   * Recursively find files matching pattern
   */
  private async findFilesRecursive(dirPath: string, pattern: string): Promise<string[]> {
    const results: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subResults = await this.findFilesRecursive(fullPath, pattern);
          results.push(...subResults);
        } else if (entry.isFile()) {
          // Check if file matches pattern
          if (this.fileMatchesPattern(entry.name, pattern)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`[TemplateUpdater] Error reading directory ${dirPath}:`, error);
    }

    return results;
  }

  /**
   * Check if a filename matches a pattern
   */
  private fileMatchesPattern(filename: string, pattern: string): boolean {
    // Handle common patterns
    if (pattern === '**' || pattern === '*') {
      return filename.endsWith('.template');
    }

    if (pattern.includes('*')) {
      const regex = new RegExp(
        pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace('.template', '\\.template')
      );
      return regex.test(filename);
    }

    return filename === pattern;
  }

  /**
   * Extract the current pattern from a template file
   */
  extractTemplatePattern(
    content: string,
    queryPointId: string
  ): string | null {
    const patterns = PATTERN_MAPPINGS[queryPointId];
    if (!patterns) return null;

    for (const regex of patterns) {
      const match = content.match(regex);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Update a pattern in template content
   */
  updateTemplatePattern(
    content: string,
    oldPattern: string,
    newPattern: string
  ): string {
    // Escape special regex characters in old pattern
    const escapedOld = oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOld, 'g');

    return content.replace(regex, newPattern);
  }

  /**
   * Validate template after update (TDD Level 1)
   * Checks for valid Python/TypeScript syntax
   */
  async validateTemplateAfterUpdate(
    content: string,
    filePath: string
  ): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for unresolved template variables
    const unresolvedVars = content.match(/\{\{[^}]+\}\}/g);
    // Template variables are allowed in .template files, skip this check

    // Check for basic syntax issues
    const syntaxIssues = this.checkBasicSyntax(content, filePath);
    errors.push(...syntaxIssues);

    // Check for balanced braces/brackets
    const balanceIssues = this.checkBraceBalance(content);
    errors.push(...balanceIssues);

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  /**
   * Basic syntax checks for template content
   */
  private checkBasicSyntax(content: string, filePath: string): string[] {
    const errors: string[] = [];

    if (filePath.endsWith('.py.template')) {
      // Python syntax checks
      if (content.includes('def (') || content.includes('class (')) {
        errors.push('Invalid function/class definition');
      }
      if (/import\s+$/.test(content)) {
        errors.push('Incomplete import statement');
      }
    }

    if (filePath.endsWith('.tsx.template') || filePath.endsWith('.ts.template')) {
      // TypeScript syntax checks
      if (content.includes('import from')) {
        errors.push('Invalid import syntax');
      }
    }

    return errors;
  }

  /**
   * Check for balanced braces, brackets, and parentheses
   */
  private checkBraceBalance(content: string): string[] {
    const errors: string[] = [];
    const stack: string[] = [];
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
    };

    // Remove strings and comments first
    const cleanContent = content
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/`[^`]*`/g, '``')
      .replace(/#.*$/gm, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    for (const char of cleanContent) {
      if (char in pairs) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        const lastOpen = stack.pop();
        if (!lastOpen || pairs[lastOpen] !== char) {
          errors.push(`Unbalanced bracket: ${char}`);
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`Unclosed brackets: ${stack.join(', ')}`);
    }

    return errors;
  }

  /**
   * Main update method for a single template file
   */
  async updateTemplate(
    templateFile: string,
    queryPointId: string,
    context7Response: string,
    differences: PatternDifference[]
  ): Promise<TemplateUpdateResult> {
    const fullPath = path.join(this.templatesPath, templateFile);

    try {
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        return {
          file: templateFile,
          patternsUpdated: [],
          tddLevel1Passed: true,
          tddErrors: [],
        };
      }

      // Read current content
      let content = await fs.readFile(fullPath, 'utf-8');
      const patternsUpdated: string[] = [];

      // Apply each difference
      for (const diff of differences) {
        if (diff.currentPattern && diff.context7Pattern) {
          // Check if the old pattern exists in template
          if (content.includes(diff.currentPattern)) {
            content = this.updateTemplatePattern(
              content,
              diff.currentPattern,
              diff.context7Pattern
            );
            patternsUpdated.push(diff.type);
          }
        }
      }

      // Validate after update
      const validation = await this.validateTemplateAfterUpdate(content, templateFile);

      // Only write if validation passes and there were updates
      if (patternsUpdated.length > 0 && validation.passed) {
        await fs.writeFile(fullPath, content, 'utf-8');
      }

      return {
        file: templateFile,
        patternsUpdated,
        tddLevel1Passed: validation.passed,
        tddErrors: validation.errors,
      };
    } catch (error) {
      throw new FileUpdateError(
        `Failed to update template: ${error instanceof Error ? error.message : String(error)}`,
        fullPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update multiple template files for a query point
   */
  async updateTemplates(
    queryPointId: string,
    templatePatterns: string[],
    context7Response: string,
    differences: PatternDifference[]
  ): Promise<TemplateUpdateResult[]> {
    const results: TemplateUpdateResult[] = [];

    // Find all matching template files
    const templateFiles = await this.findTemplateFiles(templatePatterns);

    for (const file of templateFiles) {
      try {
        const result = await this.updateTemplate(
          file,
          queryPointId,
          context7Response,
          differences
        );
        results.push(result);
      } catch (error) {
        console.error(`[TemplateUpdater] Error updating ${file}:`, error);
        results.push({
          file,
          patternsUpdated: [],
          tddLevel1Passed: false,
          tddErrors: [error instanceof Error ? error.message : String(error)],
        });
      }
    }

    return results;
  }
}

// Singleton instance
let updaterInstance: TemplateUpdater | null = null;

/**
 * Get the global TemplateUpdater instance
 */
export function getTemplateUpdater(templatesPath?: string): TemplateUpdater {
  if (!updaterInstance && templatesPath) {
    updaterInstance = new TemplateUpdater(templatesPath);
  }
  if (!updaterInstance) {
    throw new Error('TemplateUpdater not initialized. Provide templatesPath.');
  }
  return updaterInstance;
}

/**
 * Initialize the global TemplateUpdater
 */
export function initTemplateUpdater(templatesPath: string): TemplateUpdater {
  updaterInstance = new TemplateUpdater(templatesPath);
  return updaterInstance;
}
