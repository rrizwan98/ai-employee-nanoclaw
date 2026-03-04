/**
 * Pattern Comparator Module
 *
 * Compares Context7 responses with existing template/reference patterns.
 * Detects meaningful differences like new parameters, changed signatures, new imports.
 */

import {
  ComparisonResult,
  PatternDifference,
  DifferenceType,
  Severity,
  PatternComparisonError,
} from './types.js';

/**
 * Regex patterns for extracting code elements
 */
const PATTERNS = {
  // Match Python class definitions: class Foo(Bar):
  classDefinition: /class\s+(\w+)\s*\(([^)]*)\)\s*:/g,

  // Match Python function/method definitions: def foo(arg1, arg2):
  functionDefinition: /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->[\s\w\[\],|]+)?:/g,

  // Match Python imports: from X import Y or import X
  pythonImport: /(?:from\s+([\w.]+)\s+import\s+([^#\n]+)|import\s+([^#\n]+))/g,

  // Match TypeScript/JavaScript imports
  tsImport: /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g,

  // Match code blocks in markdown
  codeBlock: /```(?:python|typescript|javascript|tsx|jsx)?\n([\s\S]*?)```/g,

  // Match constructor parameters: Agent(name=..., instructions=...)
  constructorParams: /(\w+)\s*\(([^)]+)\)/g,

  // Match parameter with type hint: param: Type
  paramWithType: /(\w+)\s*:\s*([^,=]+)(?:\s*=\s*([^,)]+))?/g,
};

/**
 * Pattern Comparator class
 * Compares Context7 documentation with current patterns
 */
export class PatternComparator {
  /**
   * Extract code blocks from markdown text
   */
  extractCodeBlocks(text: string): string[] {
    const blocks: string[] = [];
    const regex = new RegExp(PATTERNS.codeBlock);
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push(match[1].trim());
    }

    // If no code blocks found, treat entire text as code
    if (blocks.length === 0 && text.includes('def ') || text.includes('class ') || text.includes('import ')) {
      blocks.push(text);
    }

    return blocks;
  }

  /**
   * Normalize code for comparison (remove whitespace, comments)
   */
  normalizeCode(code: string): string {
    return code
      // Remove Python comments
      .replace(/#.*$/gm, '')
      // Remove TypeScript/JavaScript comments
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove docstrings
      .replace(/"""[\s\S]*?"""/g, '')
      .replace(/'''[\s\S]*?'''/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract function/method signatures from code
   */
  extractSignatures(code: string): Map<string, string[]> {
    const signatures = new Map<string, string[]>();
    const regex = new RegExp(PATTERNS.functionDefinition);
    let match;

    while ((match = regex.exec(code)) !== null) {
      const funcName = match[1];
      const params = match[2]
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p && p !== 'self' && p !== 'cls');
      signatures.set(funcName, params);
    }

    return signatures;
  }

  /**
   * Extract class constructor parameters
   */
  extractConstructorParams(code: string, className: string): string[] {
    // Look for class definition and __init__ method
    const initRegex = new RegExp(
      `class\\s+${className}[^:]*:[\\s\\S]*?def\\s+__init__\\s*\\(([^)]+)\\)`,
      'i'
    );
    const match = code.match(initRegex);

    if (match) {
      return match[1]
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p && p !== 'self');
    }

    // Fallback: look for direct instantiation pattern
    const instanceRegex = new RegExp(`${className}\\s*\\(([^)]+)\\)`, 'i');
    const instanceMatch = code.match(instanceRegex);

    if (instanceMatch) {
      return instanceMatch[1]
        .split(',')
        .map((p) => {
          // Extract parameter name (before = or :)
          const nameMatch = p.trim().match(/^(\w+)/);
          return nameMatch ? nameMatch[1] : p.trim();
        })
        .filter((p) => p);
    }

    return [];
  }

  /**
   * Extract import statements
   */
  extractImports(code: string): Map<string, Set<string>> {
    const imports = new Map<string, Set<string>>();

    // Python imports
    const pyRegex = new RegExp(PATTERNS.pythonImport);
    let match;

    while ((match = pyRegex.exec(code)) !== null) {
      if (match[1] && match[2]) {
        // from X import Y
        const module = match[1];
        const items = match[2].split(',').map((i) => i.trim());
        const existing = imports.get(module) || new Set();
        items.forEach((item) => existing.add(item));
        imports.set(module, existing);
      } else if (match[3]) {
        // import X
        const modules = match[3].split(',').map((m) => m.trim());
        modules.forEach((m) => {
          imports.set(m, new Set(['*']));
        });
      }
    }

    return imports;
  }

  /**
   * Compare signatures between Context7 and current code
   */
  compareSignatures(
    context7Code: string,
    currentCode: string
  ): PatternDifference[] {
    const differences: PatternDifference[] = [];

    const context7Sigs = this.extractSignatures(context7Code);
    const currentSigs = this.extractSignatures(currentCode);

    // Check for new or changed signatures in Context7
    for (const [funcName, context7Params] of context7Sigs) {
      const currentParams = currentSigs.get(funcName);

      if (!currentParams) {
        // New function/method
        differences.push({
          type: 'new_method',
          description: `New method found: ${funcName}`,
          context7Pattern: `def ${funcName}(${context7Params.join(', ')})`,
          currentPattern: '',
          suggestedFix: `Add method: def ${funcName}(${context7Params.join(', ')})`,
        });
      } else {
        // Check for new parameters
        const newParams = context7Params.filter(
          (p) => !currentParams.some((cp) => this.paramNamesMatch(p, cp))
        );

        if (newParams.length > 0) {
          differences.push({
            type: 'new_parameter',
            description: `New parameters in ${funcName}: ${newParams.join(', ')}`,
            context7Pattern: `def ${funcName}(${context7Params.join(', ')})`,
            currentPattern: `def ${funcName}(${currentParams.join(', ')})`,
            suggestedFix: `Update signature to: def ${funcName}(${context7Params.join(', ')})`,
          });
        }

        // Check for changed parameter types
        for (const context7Param of context7Params) {
          const currentParam = currentParams.find((cp) =>
            this.paramNamesMatch(context7Param, cp)
          );
          if (currentParam && !this.paramsEqual(context7Param, currentParam)) {
            differences.push({
              type: 'changed_signature',
              description: `Parameter changed in ${funcName}: ${context7Param}`,
              context7Pattern: context7Param,
              currentPattern: currentParam,
              suggestedFix: `Update parameter: ${context7Param}`,
            });
          }
        }
      }
    }

    // Check for removed methods (deprecated)
    for (const [funcName, currentParams] of currentSigs) {
      if (!context7Sigs.has(funcName)) {
        differences.push({
          type: 'deprecated',
          description: `Method may be deprecated: ${funcName}`,
          context7Pattern: '',
          currentPattern: `def ${funcName}(${currentParams.join(', ')})`,
          suggestedFix: `Verify if ${funcName} is still needed`,
        });
      }
    }

    return differences;
  }

  /**
   * Compare imports between Context7 and current code
   */
  compareImports(
    context7Code: string,
    currentCode: string
  ): PatternDifference[] {
    const differences: PatternDifference[] = [];

    const context7Imports = this.extractImports(context7Code);
    const currentImports = this.extractImports(currentCode);

    // Check for new or changed imports
    for (const [module, context7Items] of context7Imports.entries()) {
      const currentItems = currentImports.get(module);

      if (!currentItems) {
        // New module import
        const items = Array.from(context7Items as Set<string>).join(', ');
        differences.push({
          type: 'new_import',
          description: `New import: from ${module} import ${items}`,
          context7Pattern: `from ${module} import ${items}`,
          currentPattern: '',
          suggestedFix: `Add: from ${module} import ${items}`,
        });
      } else {
        // Check for new items from same module
        const newItems = Array.from(context7Items as Set<string>).filter(
          (item: string) => !currentItems.has(item)
        );

        if (newItems.length > 0) {
          differences.push({
            type: 'new_import',
            description: `New imports from ${module}: ${newItems.join(', ')}`,
            context7Pattern: `from ${module} import ${Array.from(context7Items as Set<string>).join(', ')}`,
            currentPattern: `from ${module} import ${Array.from(currentItems as Set<string>).join(', ')}`,
            suggestedFix: `Update: from ${module} import ${Array.from(context7Items as Set<string>).join(', ')}`,
          });
        }
      }
    }

    return differences;
  }

  /**
   * Compare constructor parameters for a specific class
   */
  compareParameters(
    context7Code: string,
    currentCode: string,
    className: string = 'Agent'
  ): PatternDifference[] {
    const differences: PatternDifference[] = [];

    const context7Params = this.extractConstructorParams(context7Code, className);
    const currentParams = this.extractConstructorParams(currentCode, className);

    // Find new required parameters
    const newParams = context7Params.filter(
      (p) => !currentParams.some((cp) => this.paramNamesMatch(p, cp))
    );

    if (newParams.length > 0) {
      differences.push({
        type: 'new_parameter',
        description: `New parameters for ${className}: ${newParams.join(', ')}`,
        context7Pattern: `${className}(${context7Params.join(', ')})`,
        currentPattern: `${className}(${currentParams.join(', ')})`,
        suggestedFix: `Update ${className} to include: ${newParams.join(', ')}`,
      });
    }

    return differences;
  }

  /**
   * Check if two parameter names match (ignoring type hints and defaults)
   */
  private paramNamesMatch(param1: string, param2: string): boolean {
    const name1 = param1.split(/[:\s=]/)[0].trim();
    const name2 = param2.split(/[:\s=]/)[0].trim();
    return name1.toLowerCase() === name2.toLowerCase();
  }

  /**
   * Check if two parameters are equal (including type hints)
   */
  private paramsEqual(param1: string, param2: string): boolean {
    const normalized1 = this.normalizeCode(param1);
    const normalized2 = this.normalizeCode(param2);
    return normalized1 === normalized2;
  }

  /**
   * Determine severity based on differences found
   */
  determineSeverity(differences: PatternDifference[]): Severity {
    if (differences.length === 0) {
      return 'info';
    }

    const hasCritical = differences.some(
      (d) =>
        d.type === 'new_parameter' ||
        d.type === 'changed_signature' ||
        d.type === 'removed_method'
    );

    if (hasCritical) {
      return 'critical';
    }

    const hasWarning = differences.some(
      (d) => d.type === 'new_import' || d.type === 'deprecated'
    );

    if (hasWarning) {
      return 'warning';
    }

    return 'info';
  }

  /**
   * Main comparison method
   */
  compare(
    context7Response: string,
    currentPattern: string,
    queryPointId: string
  ): ComparisonResult {
    const startTime = Date.now();

    try {
      // Extract code blocks from both
      const context7Blocks = this.extractCodeBlocks(context7Response);
      const currentBlocks = this.extractCodeBlocks(currentPattern);

      // Combine all code blocks
      const context7Code = context7Blocks.join('\n');
      const currentCode = currentBlocks.join('\n') || currentPattern;

      // Run all comparisons
      const signatureDiffs = this.compareSignatures(context7Code, currentCode);
      const importDiffs = this.compareImports(context7Code, currentCode);

      // Combine differences
      const allDifferences = [...signatureDiffs, ...importDiffs];

      // Determine status
      const status =
        allDifferences.length === 0
          ? 'match'
          : allDifferences.some(
              (d) =>
                d.type === 'new_parameter' || d.type === 'changed_signature'
            )
          ? 'mismatch'
          : 'match'; // Minor differences don't trigger mismatch

      return {
        queryPointId,
        status,
        severity: this.determineSeverity(allDifferences),
        differences: allDifferences,
        comparisonTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      throw new PatternComparisonError(
        `Failed to compare patterns: ${error instanceof Error ? error.message : String(error)}`,
        queryPointId
      );
    }
  }
}

// Singleton instance
let comparatorInstance: PatternComparator | null = null;

/**
 * Get the global PatternComparator instance
 */
export function getPatternComparator(): PatternComparator {
  if (!comparatorInstance) {
    comparatorInstance = new PatternComparator();
  }
  return comparatorInstance;
}
