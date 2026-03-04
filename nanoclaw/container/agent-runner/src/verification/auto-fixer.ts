/**
 * Auto-Fixer Module
 *
 * Automatically fixes common verification errors using Skills, Templates, and Context7
 */

import * as fs from 'fs';
import * as path from 'path';
import { KNOWN_FIX_PATTERNS } from './config.js';
import type {
  VerificationError,
  FixResult,
  Fix,
  ErrorType,
  FixSource,
} from './types.js';

/**
 * Parse error type from error message
 */
export function parseErrorType(error: VerificationError): ErrorType {
  const msg = error.message.toLowerCase();

  if (msg.includes('syntaxerror') || msg.includes('{{') || msg.includes('}}')) {
    return 'syntax';
  }
  if (msg.includes('importerror') || msg.includes('modulenotfounderror') || msg.includes('cannot import')) {
    return 'import';
  }
  if (msg.includes('typeerror') || msg.includes('argument') || msg.includes('parameter')) {
    return 'type';
  }
  if (msg.includes('use client') || msg.includes('"use client"')) {
    return 'directive';
  }
  if (msg.includes('build failed') || msg.includes('tsc') || msg.includes('typescript')) {
    return 'build';
  }
  if (msg.includes('server') || msg.includes('agent') || msg.includes('runtime')) {
    return 'runtime';
  }
  if (msg.includes('endpoint') || msg.includes('status') || msg.includes('404') || msg.includes('500')) {
    return 'endpoint';
  }

  return 'unknown';
}

/**
 * Auto-Fixer class
 */
export class AutoFixer {
  private static instance: AutoFixer;
  private skillsPath: string;
  private templatesPath: string;
  private context7QueryFn?: (libraryId: string, query: string) => Promise<string>;

  private constructor() {
    // Default paths - can be configured
    this.skillsPath = process.env.SKILLS_PATH || '/workspace/.claude/skills';
    this.templatesPath = process.env.TEMPLATES_PATH || '/workspace/templates';
  }

  static getInstance(): AutoFixer {
    if (!AutoFixer.instance) {
      AutoFixer.instance = new AutoFixer();
    }
    return AutoFixer.instance;
  }

  /**
   * Set Context7 query function for live documentation lookup
   */
  setContext7Query(fn: (libraryId: string, query: string) => Promise<string>): void {
    this.context7QueryFn = fn;
  }

  /**
   * Configure paths
   */
  configure(options: { skillsPath?: string; templatesPath?: string }): void {
    if (options.skillsPath) this.skillsPath = options.skillsPath;
    if (options.templatesPath) this.templatesPath = options.templatesPath;
  }

  /**
   * Attempt to fix errors in project
   */
  async fix(errors: VerificationError[], projectPath: string): Promise<FixResult> {
    for (const error of errors) {
      // Step 1: Check known patterns from Skills
      const skillFix = this.checkKnownPatterns(error);
      if (skillFix) {
        const applied = await this.applyFix(skillFix, projectPath);
        if (applied) {
          return { applied: true, fix: skillFix };
        }
      }

      // Step 2: Check Skills reference files
      const skillRefFix = await this.checkSkillsReferences(error);
      if (skillRefFix) {
        const applied = await this.applyFix(skillRefFix, projectPath);
        if (applied) {
          return { applied: true, fix: skillRefFix };
        }
      }

      // Step 3: Check Templates for correct code
      const templateFix = await this.checkTemplates(error, projectPath);
      if (templateFix) {
        const applied = await this.applyFix(templateFix, projectPath);
        if (applied) {
          return { applied: true, fix: templateFix };
        }
      }

      // Step 4: Query Context7 for latest pattern
      const context7Fix = await this.queryContext7(error);
      if (context7Fix) {
        const applied = await this.applyFix(context7Fix, projectPath);
        if (applied) {
          return { applied: true, fix: context7Fix };
        }
      }

      // Step 5: Handle "use client" directive
      if (error.type === 'directive' || error.message.includes('use client')) {
        const directiveFix = await this.fixUseClientDirective(error, projectPath);
        if (directiveFix) {
          return { applied: true, fix: directiveFix };
        }
      }
    }

    return { applied: false, reason: 'No fix available for errors' };
  }

  /**
   * Check known fix patterns (from config)
   */
  private checkKnownPatterns(error: VerificationError): Fix | null {
    const msg = error.message;

    for (const [pattern, fixPattern] of Object.entries(KNOWN_FIX_PATTERNS)) {
      if (msg.includes(pattern)) {
        return {
          errorPattern: pattern,
          correct: fixPattern.correct,
          source: 'Skills' as FixSource,
        };
      }
    }

    return null;
  }

  /**
   * Check Skills reference files for patterns
   */
  private async checkSkillsReferences(error: VerificationError): Promise<Fix | null> {
    try {
      const refDirs = [
        path.join(this.skillsPath, 'agent-builder', 'references'),
        path.join(this.skillsPath, 'code-generation', 'references'),
      ];

      for (const refDir of refDirs) {
        if (!fs.existsSync(refDir)) continue;

        const files = fs.readdirSync(refDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
          const content = fs.readFileSync(path.join(refDir, file), 'utf-8');

          // Look for code blocks with correct patterns
          const codeBlocks = this.extractCodeBlocks(content);
          for (const block of codeBlocks) {
            // Check if this block might fix our error
            const fix = this.matchBlockToError(error, block, file);
            if (fix) {
              return fix;
            }
          }
        }
      }
    } catch (err) {
      console.error('[AutoFixer] Skills reference check failed:', err);
    }

    return null;
  }

  /**
   * Check Templates for correct code
   */
  private async checkTemplates(error: VerificationError, projectPath: string): Promise<Fix | null> {
    try {
      if (!fs.existsSync(this.templatesPath)) return null;

      const templateDirs = fs.readdirSync(this.templatesPath);

      for (const dir of templateDirs) {
        const templateDir = path.join(this.templatesPath, dir);
        if (!fs.statSync(templateDir).isDirectory()) continue;

        const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.template'));
        for (const file of files) {
          const content = fs.readFileSync(path.join(templateDir, file), 'utf-8');

          // Look for patterns that might fix the error
          const fix = this.matchTemplateToError(error, content, file);
          if (fix) {
            return fix;
          }
        }
      }
    } catch (err) {
      console.error('[AutoFixer] Template check failed:', err);
    }

    return null;
  }

  /**
   * Query Context7 for latest SDK pattern
   */
  private async queryContext7(error: VerificationError): Promise<Fix | null> {
    if (!this.context7QueryFn) {
      console.log('[AutoFixer] Context7 not configured');
      return null;
    }

    try {
      const errorType = parseErrorType(error);
      let libraryId = '/openai/openai-agents-python';
      let query = error.message;

      // Select appropriate library based on error
      if (error.message.includes('chatkit')) {
        libraryId = '/websites/openai_github_io_chatkit-python';
        query = `correct import and usage for ${error.message}`;
      } else if (error.message.includes('next') || error.message.includes('react')) {
        libraryId = '/vercel/next.js';
        query = `fix for ${error.message}`;
      } else {
        query = `correct syntax for ${error.message}`;
      }

      const response = await this.context7QueryFn(libraryId, query);

      // Parse response for code fix
      const codeBlocks = this.extractCodeBlocks(response);
      if (codeBlocks.length > 0) {
        return {
          errorPattern: error.message.slice(0, 50),
          correct: codeBlocks[0].slice(0, 200),
          source: 'Context7' as FixSource,
        };
      }
    } catch (err) {
      console.error('[AutoFixer] Context7 query failed:', err);
    }

    return null;
  }

  /**
   * Fix missing "use client" directive
   */
  private async fixUseClientDirective(
    error: VerificationError,
    projectPath: string
  ): Promise<Fix | null> {
    try {
      // Extract file path from error
      const fileMatch = error.message.match(/([^\s]+\.(tsx?|jsx?))/);
      if (!fileMatch) return null;

      const filePath = path.join(projectPath, fileMatch[1]);
      if (!fs.existsSync(filePath)) return null;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check if "use client" is missing
      if (!content.startsWith("'use client'") && !content.startsWith('"use client"')) {
        const newContent = "'use client'\n\n" + content;
        fs.writeFileSync(filePath, newContent);

        return {
          errorPattern: 'Missing "use client" directive',
          correct: "'use client' added to " + fileMatch[1],
          source: 'Manual' as FixSource,
          file: filePath,
          line: 1,
        };
      }
    } catch (err) {
      console.error('[AutoFixer] Use client fix failed:', err);
    }

    return null;
  }

  /**
   * Apply fix to project files
   */
  private async applyFix(fix: Fix, projectPath: string): Promise<boolean> {
    try {
      // If fix has specific file, apply there
      if (fix.file) {
        const filePath = path.isAbsolute(fix.file)
          ? fix.file
          : path.join(projectPath, fix.file);

        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf-8');
          content = content.replace(fix.errorPattern, fix.correct);
          fs.writeFileSync(filePath, content);
          return true;
        }
      }

      // Otherwise, search all Python/TypeScript files
      const extensions = ['.py', '.ts', '.tsx', '.js', '.jsx'];
      const files = this.findFiles(projectPath, extensions);

      for (const file of files) {
        let content = fs.readFileSync(file, 'utf-8');
        if (content.includes(fix.errorPattern)) {
          content = content.replace(new RegExp(this.escapeRegex(fix.errorPattern), 'g'), fix.correct);
          fs.writeFileSync(file, content);
          fix.file = file;
          return true;
        }
      }
    } catch (err) {
      console.error('[AutoFixer] Apply fix failed:', err);
    }

    return false;
  }

  /**
   * Extract code blocks from markdown
   */
  private extractCodeBlocks(markdown: string): string[] {
    const blocks: string[] = [];
    const regex = /```(?:python|typescript|javascript|tsx|jsx)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(markdown)) !== null) {
      blocks.push(match[1].trim());
    }

    return blocks;
  }

  /**
   * Match code block to error for potential fix
   */
  private matchBlockToError(
    error: VerificationError,
    block: string,
    sourceFile: string
  ): Fix | null {
    // Look for patterns in the error message that appear in the block
    const keywords = ['import', 'from', 'class', 'def', 'function', 'const'];

    for (const keyword of keywords) {
      if (error.message.includes(keyword)) {
        // Find relevant line in block
        const lines = block.split('\n');
        for (const line of lines) {
          if (line.includes(keyword) && !line.startsWith('#') && !line.startsWith('//')) {
            // This might be the correct pattern
            return {
              errorPattern: this.extractPattern(error.message),
              correct: line.trim(),
              source: 'Skills' as FixSource,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Match template content to error
   */
  private matchTemplateToError(
    error: VerificationError,
    templateContent: string,
    sourceFile: string
  ): Fix | null {
    // Similar to matchBlockToError but for templates
    const pattern = this.extractPattern(error.message);
    if (!pattern) return null;

    // Find line in template that might be the fix
    const lines = templateContent.split('\n');
    for (const line of lines) {
      if (line.includes('import') || line.includes('from') || line.includes('def')) {
        // Check if this line relates to the error
        if (this.lineRelatesTo(line, error)) {
          return {
            errorPattern: pattern,
            correct: line.replace(/\{\{[^}]+\}\}/g, '').trim(), // Remove template vars
            source: 'Templates' as FixSource,
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract error pattern for replacement
   */
  private extractPattern(errorMessage: string): string {
    // Try to extract the problematic code from error message
    const patterns = [
      /cannot import ['"](.*?)['"]/,
      /has no attribute ['"](.*?)['"]/,
      /undefined.*['"](.*?)['"]/,
      /['"](.*?)['"] is not defined/,
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) return match[1];
    }

    return errorMessage.slice(0, 50);
  }

  /**
   * Check if a line relates to an error
   */
  private lineRelatesTo(line: string, error: VerificationError): boolean {
    const errorWords = error.message.toLowerCase().split(/\W+/);
    const lineWords = line.toLowerCase().split(/\W+/);

    // Check for common words
    const commonWords = errorWords.filter((w: string) => lineWords.includes(w) && w.length > 3);
    return commonWords.length >= 2;
  }

  /**
   * Find all files with given extensions in directory
   */
  private findFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    const walk = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton getter
export function getAutoFixer(): AutoFixer {
  return AutoFixer.getInstance();
}
