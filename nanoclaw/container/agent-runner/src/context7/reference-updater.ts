/**
 * Reference Updater Module
 *
 * Updates skill reference files in .claude/skills/{skill}/references/*.md
 * when Context7 returns updated SDK patterns.
 * Preserves file structure and custom notes while updating code blocks.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ReferenceUpdateResult,
  PatternDifference,
  FileUpdateError,
} from './types.js';

/**
 * Mapping of query point IDs to their section identifiers in reference files
 */
const SECTION_IDENTIFIERS: Record<string, string[]> = {
  agent_class: ['Agent', 'Agent Class', '## Agent', '### Agent'],
  websearch_tool: ['WebSearchTool', 'Web Search', '## WebSearchTool'],
  code_interpreter_tool: ['CodeInterpreterTool', 'Code Interpreter', '## CodeInterpreterTool'],
  file_search_tool: ['FileSearchTool', 'File Search', '## FileSearchTool'],
  chatkit_store: ['Store', 'ChatKit Store', 'InMemoryStore', '## Store'],
  fastapi_chatkit: ['FastAPI', 'ChatKitServer', 'Server Integration', '## FastAPI'],
  nextjs_chatkit: ['Next.js', 'ChatKit CDN', 'Frontend', '## Next.js'],
};

/**
 * Reference Updater class
 * Updates skill reference markdown files with latest SDK patterns
 */
export class ReferenceUpdater {
  private basePath: string;
  private backupEnabled: boolean;

  constructor(skillsPath: string, backupEnabled: boolean = true) {
    this.basePath = skillsPath;
    this.backupEnabled = backupEnabled;
  }

  /**
   * Find the section in markdown content for a given query point
   */
  findSection(content: string, queryPointId: string): { start: number; end: number; content: string } | null {
    const identifiers = SECTION_IDENTIFIERS[queryPointId] || [queryPointId];

    for (const identifier of identifiers) {
      // Look for section headers (##, ###, etc.)
      const headerRegex = new RegExp(
        `(^#{1,4}\\s*${this.escapeRegex(identifier)}[^\\n]*\\n)([\\s\\S]*?)(?=^#{1,4}\\s|$)`,
        'gmi'
      );

      const match = headerRegex.exec(content);
      if (match) {
        const startIndex = match.index;
        const sectionContent = match[0];
        return {
          start: startIndex,
          end: startIndex + sectionContent.length,
          content: sectionContent,
        };
      }
    }

    return null;
  }

  /**
   * Extract the current pattern/code block from a section
   */
  extractCurrentPattern(section: string): string | null {
    // Look for code blocks
    const codeBlockRegex = /```(?:python|typescript|javascript|tsx)?\n([\s\S]*?)```/g;
    const matches: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(section)) !== null) {
      matches.push(match[1].trim());
    }

    return matches.length > 0 ? matches.join('\n\n') : null;
  }

  /**
   * Update code blocks in a section while preserving structure
   */
  updateSectionCodeBlocks(
    section: string,
    differences: PatternDifference[]
  ): string {
    let updatedSection = section;

    for (const diff of differences) {
      if (diff.currentPattern && diff.suggestedFix) {
        // Replace the old pattern with the new one in code blocks
        const escapedOld = this.escapeRegex(diff.currentPattern);
        const codeBlockRegex = new RegExp(
          `(\`\`\`(?:python|typescript|javascript|tsx)?\\n[\\s\\S]*?)${escapedOld}([\\s\\S]*?\`\`\`)`,
          'g'
        );

        // Try to find and replace within code blocks
        if (codeBlockRegex.test(updatedSection)) {
          updatedSection = updatedSection.replace(
            codeBlockRegex,
            `$1${diff.context7Pattern}$2`
          );
        }
      }
    }

    return updatedSection;
  }

  /**
   * Preserve custom notes (comments, warnings, etc.) during update
   */
  preserveCustomNotes(original: string, updated: string): string {
    // Find custom note markers
    const notePatterns = [
      /<!-- CUSTOM NOTE:[\s\S]*?-->/g,
      /> \*\*Note\*\*:[\s\S]*?(?=\n\n|$)/g,
      /> \*\*Warning\*\*:[\s\S]*?(?=\n\n|$)/g,
      /\*\*IMPORTANT\*\*:[\s\S]*?(?=\n\n|$)/g,
    ];

    let result = updated;

    for (const pattern of notePatterns) {
      const originalNotes: string[] = [];
      let match;

      // Extract notes from original
      while ((match = pattern.exec(original)) !== null) {
        originalNotes.push(match[0]);
      }

      // Check if notes exist in updated, if not, append them
      for (const note of originalNotes) {
        if (!result.includes(note)) {
          // Append note at the end of the section
          result = result.trimEnd() + '\n\n' + note + '\n';
        }
      }
    }

    return result;
  }

  /**
   * Create a backup of a file before updating
   */
  async backupFile(filePath: string): Promise<string | null> {
    if (!this.backupEnabled) {
      return null;
    }

    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
      return backupPath;
    } catch (error) {
      console.warn(`[ReferenceUpdater] Could not create backup: ${error}`);
      return null;
    }
  }

  /**
   * Apply updates to a section
   */
  applyUpdates(
    content: string,
    section: { start: number; end: number; content: string },
    differences: PatternDifference[]
  ): string {
    // Update code blocks in the section
    let updatedSection = this.updateSectionCodeBlocks(section.content, differences);

    // Preserve any custom notes
    updatedSection = this.preserveCustomNotes(section.content, updatedSection);

    // Reconstruct the full content
    const before = content.slice(0, section.start);
    const after = content.slice(section.end);

    return before + updatedSection + after;
  }

  /**
   * Add a new section for a query point that doesn't exist
   */
  addNewSection(
    content: string,
    queryPointId: string,
    context7Response: string
  ): string {
    const identifier = SECTION_IDENTIFIERS[queryPointId]?.[0] || queryPointId;

    // Create new section with Context7 content
    const newSection = `
## ${identifier}

*Updated from Context7 documentation*

${this.formatAsCodeBlock(context7Response)}

`;

    // Add at the end of the file
    return content.trimEnd() + '\n\n' + newSection;
  }

  /**
   * Format text as a markdown code block
   */
  formatAsCodeBlock(text: string, language: string = 'python'): string {
    // Check if text already contains code blocks
    if (text.includes('```')) {
      return text;
    }

    // Check if it looks like code
    if (text.includes('def ') || text.includes('class ') || text.includes('import ')) {
      return `\`\`\`${language}\n${text.trim()}\n\`\`\``;
    }

    return text;
  }

  /**
   * Main update method
   */
  async updateReference(
    referenceFile: string,
    queryPointId: string,
    context7Response: string,
    differences: PatternDifference[]
  ): Promise<ReferenceUpdateResult> {
    const fullPath = path.join(this.basePath, referenceFile);

    try {
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        // File doesn't exist, skip update
        return {
          file: referenceFile,
          sectionsUpdated: [],
          differencesApplied: 0,
          backupCreated: false,
        };
      }

      // Read current content
      let content = await fs.readFile(fullPath, 'utf-8');

      // Create backup
      const backupPath = await this.backupFile(fullPath);

      // Find section for this query point
      const section = this.findSection(content, queryPointId);

      let sectionsUpdated: string[] = [];

      if (section) {
        // Update existing section
        content = this.applyUpdates(content, section, differences);
        sectionsUpdated.push(queryPointId);
      } else if (differences.length > 0) {
        // Add new section if there are differences to document
        content = this.addNewSection(content, queryPointId, context7Response);
        sectionsUpdated.push(queryPointId);
      }

      // Write updated content
      if (sectionsUpdated.length > 0) {
        await fs.writeFile(fullPath, content, 'utf-8');
      }

      return {
        file: referenceFile,
        sectionsUpdated,
        differencesApplied: differences.length,
        backupCreated: backupPath !== null,
        backupPath: backupPath || undefined,
      };
    } catch (error) {
      throw new FileUpdateError(
        `Failed to update reference file: ${error instanceof Error ? error.message : String(error)}`,
        fullPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update multiple reference files for a query point
   */
  async updateReferences(
    queryPointId: string,
    referenceFiles: string[],
    context7Response: string,
    differences: PatternDifference[]
  ): Promise<ReferenceUpdateResult[]> {
    const results: ReferenceUpdateResult[] = [];

    for (const file of referenceFiles) {
      try {
        const result = await this.updateReference(
          file,
          queryPointId,
          context7Response,
          differences
        );
        results.push(result);
      } catch (error) {
        console.error(`[ReferenceUpdater] Error updating ${file}:`, error);
        results.push({
          file,
          sectionsUpdated: [],
          differencesApplied: 0,
          backupCreated: false,
        });
      }
    }

    return results;
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Singleton instance
let updaterInstance: ReferenceUpdater | null = null;

/**
 * Get the global ReferenceUpdater instance
 */
export function getReferenceUpdater(skillsPath?: string): ReferenceUpdater {
  if (!updaterInstance && skillsPath) {
    updaterInstance = new ReferenceUpdater(skillsPath);
  }
  if (!updaterInstance) {
    throw new Error('ReferenceUpdater not initialized. Provide skillsPath.');
  }
  return updaterInstance;
}

/**
 * Initialize the global ReferenceUpdater
 */
export function initReferenceUpdater(
  skillsPath: string,
  backupEnabled: boolean = true
): ReferenceUpdater {
  updaterInstance = new ReferenceUpdater(skillsPath, backupEnabled);
  return updaterInstance;
}
