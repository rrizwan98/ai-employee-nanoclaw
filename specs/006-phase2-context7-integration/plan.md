# Implementation Plan: Phase 2 - Context7 Live Knowledge Integration

**Branch**: `006-phase2-context7-integration` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-phase2-context7-integration/spec.md`

## Summary

Make Context7 verification **MANDATORY** before every code generation. Query latest SDK patterns, compare with existing templates and skill references, auto-update both when differences detected. This eliminates SDK version mismatch errors by ensuring code patterns are always current.

## Technical Context

**Language/Version**: TypeScript (IPC tools), Markdown (references)
**Primary Dependencies**: Context7 API, existing IPC infrastructure
**Storage**: In-memory cache for Context7 responses
**Testing**: Integration with Phase 5 TDD (Level 1-2 must pass after updates)
**Target Platform**: Docker container (agent environment)
**Project Type**: Intelligence upgrade to code generation pipeline
**Performance Goals**: <5 seconds added to generation time (with caching)
**Constraints**: Must not break existing IPC interface, must work when Context7 offline
**Scale/Scope**: 7 query points, 8+ reference files, 6+ templates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity | PASS | Adds verification layer, no new abstractions |
| Modularity | PASS | Context7 verifier is standalone module |
| Testability | PASS | Can mock Context7 responses for testing |
| No Over-engineering | PASS | Builds on existing Context7 IPC tools |
| TDD Compliance | PASS | Integrates with Phase 5 TDD validation |

## Project Structure

### Documentation (this feature)

```text
specs/006-phase2-context7-integration/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Implementation tasks (created by /sp.tasks)
```

### Source Code (repository root)

```text
nanoclaw/container/agent-runner/src/
├── ipc-mcp-stdio.ts              # MODIFIED: Add Context7 verification step
├── context7/                      # NEW: Context7 verification modules
│   ├── verifier.ts               # NEW: Main verification orchestrator
│   ├── query-points.ts           # NEW: Query point definitions
│   ├── pattern-comparator.ts     # NEW: Pattern comparison logic
│   ├── reference-updater.ts      # NEW: Skill reference update logic
│   ├── template-updater.ts       # NEW: Template pattern update logic
│   └── cache.ts                  # NEW: In-memory caching
└── index.ts                       # MODIFIED: Import new modules

.claude/skills/
├── agent-builder/
│   ├── SKILL.md                  # MODIFIED: Add Context7 MANDATORY section
│   └── references/               # AUTO-UPDATED by Context7
│       ├── openai-agents-sdk-tools.md
│       ├── openai-agents-sdk-memory.md
│       └── ...
├── code-generation/
│   ├── skill.md                  # MODIFIED: Add Context7 pre-generation step
│   └── references/
│       ├── code-templates.md     # AUTO-UPDATED by Context7
│       └── import-mappings.md    # AUTO-UPDATED by Context7
```

**Structure Decision**: Context7 modules in dedicated `context7/` directory for clean separation. Skill references remain in existing locations but become auto-updatable.

## Architecture

### Context7 Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              CONTEXT7 VERIFICATION PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. IPC: generate_from_template called                          │
│                     ↓                                            │
│  2. VERIFY: Check Context7 cache for recent queries             │
│                     ↓                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 3. QUERY: For each Query Point:                             ││
│  │    ┌────────────────────────────────────────────────────┐   ││
│  │    │ context7_query_docs(libraryId, query)              │   ││
│  │    │                                                     │   ││
│  │    │ Query Points:                                       │   ││
│  │    │ • Agent class constructor                           │   ││
│  │    │ • WebSearchTool syntax                              │   ││
│  │    │ • CodeInterpreterTool + tool_config                 │   ││
│  │    │ • FileSearchTool + vector_store_ids                 │   ││
│  │    │ • ChatKit Store interface                           │   ││
│  │    │ • FastAPI ChatKit integration                       │   ││
│  │    │ • Next.js ChatKit CDN (if frontend)                 │   ││
│  │    └────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                     ↓                                            │
│  4. COMPARE: Context7 response vs current patterns              │
│                     ↓                                            │
│     ┌─────────────┬─────────────┐                               │
│     │  MATCH      │  MISMATCH   │                               │
│     │  (no change)│  (update!)  │                               │
│     └──────┬──────┴──────┬──────┘                               │
│            ↓             ↓                                       │
│     5a. Continue    5b. UPDATE:                                 │
│         to gen      ├── Templates (.template)                   │
│                     └── References (references/*.md)            │
│                          ↓                                       │
│  6. GENERATE: Proceed with template generation                  │
│                     ↓                                            │
│  7. VALIDATE: Phase 5 TDD (Level 1-2)                          │
│                     ↓                                            │
│  8. RETURN: IPC response with context7_verified: true           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Query Points Definition

```typescript
// query-points.ts

interface QueryPoint {
  id: string;
  libraryId: string;
  query: string;
  appliesTo: 'backend' | 'frontend' | 'both';
  priority: 'critical' | 'high' | 'medium';
  targetFiles: {
    templates: string[];
    references: string[];
  };
}

const QUERY_POINTS: QueryPoint[] = [
  {
    id: 'agent_class',
    libraryId: '/openai/openai-agents-python',
    query: 'Agent class constructor parameters and signature',
    appliesTo: 'backend',
    priority: 'critical',
    targetFiles: {
      templates: ['*/agents.py.template', '*/agents_config.py.template'],
      references: ['openai-agents-sdk-tools.md'],
    },
  },
  {
    id: 'websearch_tool',
    libraryId: '/openai/openai-agents-python',
    query: 'WebSearchTool initialization parameters search_context_size',
    appliesTo: 'backend',
    priority: 'high',
    targetFiles: {
      templates: ['*/agents.py.template'],
      references: ['openai-agents-sdk-tools.md'],
    },
  },
  {
    id: 'code_interpreter_tool',
    libraryId: '/openai/openai-agents-python',
    query: 'CodeInterpreterTool tool_config container parameter',
    appliesTo: 'backend',
    priority: 'critical',
    targetFiles: {
      templates: ['*/agents.py.template'],
      references: ['openai-agents-sdk-tools.md'],
    },
  },
  {
    id: 'chatkit_store',
    libraryId: '/openai/chatkit-python',
    query: 'Store interface methods with context parameter signature',
    appliesTo: 'backend',
    priority: 'critical',
    targetFiles: {
      templates: ['*/store.py.template'],
      references: ['code-templates.md'],
    },
  },
  {
    id: 'fastapi_chatkit',
    libraryId: '/openai/chatkit-python',
    query: 'ChatKitServer FastAPI StreamingResult integration',
    appliesTo: 'backend',
    priority: 'high',
    targetFiles: {
      templates: ['*/main.py.template', '*/server.py.template'],
      references: ['code-templates.md'],
    },
  },
  {
    id: 'nextjs_chatkit',
    libraryId: '/openai/chatkit-js',
    query: 'ChatKit CDN web component openai-chatkit integration',
    appliesTo: 'frontend',
    priority: 'critical',
    targetFiles: {
      templates: ['nextjs-chatkit-ui/*'],
      references: ['code-templates.md'],
    },
  },
  {
    id: 'file_search_tool',
    libraryId: '/openai/openai-agents-python',
    query: 'FileSearchTool vector_store_ids max_num_results parameters',
    appliesTo: 'backend',
    priority: 'medium',
    targetFiles: {
      templates: ['*/agents.py.template'],
      references: ['openai-agents-sdk-tools.md'],
    },
  },
];
```

### Pattern Comparator Logic

```typescript
// pattern-comparator.ts

interface ComparisonResult {
  queryPointId: string;
  status: 'match' | 'mismatch' | 'unknown';
  severity: 'critical' | 'warning' | 'info';
  differences: PatternDifference[];
}

interface PatternDifference {
  type: 'new_parameter' | 'changed_signature' | 'new_import' | 'deprecated';
  description: string;
  context7Pattern: string;
  currentPattern: string;
  suggestedFix: string;
}

class PatternComparator {
  /**
   * Compare Context7 response with current template pattern
   */
  compare(context7Response: string, currentPattern: string): ComparisonResult {
    // 1. Extract code snippets from Context7 response
    const context7Code = this.extractCodeBlocks(context7Response);

    // 2. Extract patterns from current template
    const templateCode = this.extractCodeBlocks(currentPattern);

    // 3. Compare signatures
    const signatureDiffs = this.compareSignatures(context7Code, templateCode);

    // 4. Compare imports
    const importDiffs = this.compareImports(context7Code, templateCode);

    // 5. Check for new required parameters
    const paramDiffs = this.compareParameters(context7Code, templateCode);

    return {
      status: this.determineStatus(signatureDiffs, importDiffs, paramDiffs),
      severity: this.determineSeverity(signatureDiffs, importDiffs, paramDiffs),
      differences: [...signatureDiffs, ...importDiffs, ...paramDiffs],
    };
  }

  private determineStatus(/*...*/): 'match' | 'mismatch' | 'unknown' {
    // If any critical differences, return 'mismatch'
    // If only cosmetic differences, return 'match'
    // If unable to parse, return 'unknown'
  }
}
```

### Reference Updater Logic

```typescript
// reference-updater.ts

class ReferenceUpdater {
  private basePath: string;

  constructor(skillsPath: string) {
    this.basePath = skillsPath;
  }

  /**
   * Update a reference file with new patterns from Context7
   */
  async updateReference(
    referenceFile: string,
    queryPointId: string,
    context7Response: string,
    differences: PatternDifference[]
  ): Promise<UpdateResult> {
    // 1. Read existing reference file
    const content = await fs.readFile(
      path.join(this.basePath, referenceFile),
      'utf-8'
    );

    // 2. Find section for this query point
    const section = this.findSection(content, queryPointId);

    // 3. Apply updates while preserving structure
    const updated = this.applyUpdates(content, section, differences);

    // 4. Write updated content
    await fs.writeFile(
      path.join(this.basePath, referenceFile),
      updated,
      'utf-8'
    );

    return {
      file: referenceFile,
      sectionsUpdated: [queryPointId],
      differencesApplied: differences.length,
    };
  }

  private findSection(content: string, queryPointId: string): string {
    // Use regex to find relevant section based on query point
    // e.g., for 'agent_class', find "## Agent Class" or similar
  }

  private applyUpdates(/*...*/): string {
    // Replace code blocks while preserving surrounding text
    // Preserve custom notes/comments
  }
}
```

### Cache Implementation

```typescript
// cache.ts

interface CacheEntry {
  libraryId: string;
  query: string;
  response: string;
  timestamp: number;
  expiresAt: number;
}

class Context7Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  getCacheKey(libraryId: string, query: string): string {
    return `${libraryId}::${query}`;
  }

  get(libraryId: string, query: string): CacheEntry | null {
    const key = this.getCacheKey(libraryId, query);
    const entry = this.cache.get(key);

    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(libraryId: string, query: string, response: string): void {
    const key = this.getCacheKey(libraryId, query);
    this.cache.set(key, {
      libraryId,
      query,
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  invalidate(): void {
    this.cache.clear();
  }
}
```

### IPC Integration

```typescript
// Modified generate_from_template in ipc-mcp-stdio.ts

server.tool(
  'generate_from_template',
  // ... existing description
  async (args) => {
    // NEW: Step 0 - Context7 Verification
    const verifier = new Context7Verifier();
    const verification = await verifier.verify({
      templateName: args.template_name,
      requestType: args.request_type || 'backend',
      forceRefresh: args.force_context7_refresh || false,
    });

    // Log verification results
    console.log(`[Context7] Verified: ${verification.queriesExecuted} queries`);
    console.log(`[Context7] Updates: ${verification.updatesApplied.length}`);

    // If updates were applied, templates/references are now current
    if (verification.updatesApplied.length > 0) {
      console.log(`[Context7] Applied updates to:`);
      verification.updatesApplied.forEach(u => console.log(`  - ${u}`));
    }

    // Existing template generation logic
    // ... (unchanged)

    // Modified response
    return {
      content: [{
        type: 'text',
        text: `Generated ${fileCount} files from ${args.template_name} template`,
      }],
      // NEW: Add verification metadata
      context7_verified: true,
      patterns_updated: verification.updatesApplied,
      cache_hits: verification.cacheHits,
    };
  }
);
```

## Complexity Tracking

> No violations - extending existing patterns

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Dependencies

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Context7 API | v1 | Live SDK documentation |
| Existing IPC tools | current | context7_query_docs already exists |

### Internal Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Context7 IPC tools | Complete | Lines 1097-1319 in ipc-mcp-stdio.ts |
| Template generation | Complete | Existing IPC tools |
| Skill references | Complete | Files in .claude/skills/*/references/ |
| Phase 5 TDD | Complete | Level 1-2 validation after updates |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Context7 API down | Medium | Medium | Fallback to cached/existing patterns |
| Rate limiting | Low | Medium | Exponential backoff, cache aggressively |
| Incorrect pattern detection | Medium | High | Conservative comparison, human review option |
| Reference file corruption | Low | High | Atomic writes, backup before update |
| Breaking template syntax | Medium | High | TDD Level 1 validation after updates |

## Error Handling Strategy

```typescript
// Graceful degradation when Context7 unavailable

async function verifyWithFallback(): Promise<VerificationResult> {
  try {
    // Try Context7 first
    return await verifyWithContext7();
  } catch (error) {
    if (error instanceof NetworkError) {
      // Use cached patterns
      console.warn('[Context7] Network error, using cached patterns');
      return {
        success: true,
        source: 'cache',
        warning: 'Context7 unavailable, using cached patterns',
      };
    }
    if (error instanceof RateLimitError) {
      // Exponential backoff
      await sleep(Math.pow(2, retryCount) * 1000);
      return verifyWithFallback();
    }
    // Unknown error - continue with existing patterns
    console.error('[Context7] Unknown error:', error);
    return {
      success: true,
      source: 'existing',
      warning: 'Context7 verification failed, using existing patterns',
    };
  }
}
```

## Execution Commands

```bash
# Build and test
cd nanoclaw/container/agent-runner
npm run build

# Run tests
npm run test

# Test Context7 integration specifically
npm run test -- --grep "Context7"

# Manual verification
# 1. Start container
docker run -it nanoclaw-agent:latest bash

# 2. Trigger code generation
# (via IPC - generate_from_template)

# 3. Check logs for Context7 queries
cat /workspace/logs/context7.log
```

## Success Verification

After implementation, verify:

1. **Context7 queries execute**: Every `generate_from_template` call logs Context7 queries
2. **Templates update on mismatch**: Intentionally use outdated pattern, verify template is updated
3. **References update on mismatch**: Check `.claude/skills/*/references/` files for updates
4. **Cache works**: Second generation uses cache (no duplicate queries)
5. **Fallback works**: Disable network, verify generation continues with warning
6. **TDD passes**: Updated templates pass Phase 5 TDD Level 1-2

## Verification Checklist

```
[ ] Context7 queried BEFORE every generation
[ ] All 7 query points covered
[ ] Templates updated on mismatch
[ ] References updated on mismatch
[ ] Cache reduces API calls
[ ] Fallback works when offline
[ ] TDD Level 1-2 pass after updates
[ ] IPC response includes context7_verified flag
```

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement in order: Query Points → Comparator → Cache → Updaters → IPC Integration
3. Test each component before integration
4. Verify with Phase 5 TDD after all updates
