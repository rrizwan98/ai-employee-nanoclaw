# Tasks: Phase 2 - Context7 Live Knowledge Integration

**Input**: Design documents from `/specs/006-phase2-context7-integration/`
**Prerequisites**: plan.md, spec.md
**Dependency**: Phase 5 TDD (Level 1-2 validation after updates)

**Tests**: Each component must have unit tests. Updates must pass TDD Level 1-2.

**Organization**: Tasks grouped by component for incremental implementation.

## Format: `[ID] [P?] [Component] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Component]**: Which module (CACHE, QUERY, COMPARE, UPDATE, IPC, SKILL, TEST)
- Paths: `nanoclaw/container/agent-runner/src/context7/` for modules

---

## Phase 1: Setup (Module Structure)

**Purpose**: Create Context7 module directory structure and base files

- [ ] T001 [SETUP] Create `nanoclaw/container/agent-runner/src/context7/` directory
- [ ] T002 [P] [SETUP] Create `nanoclaw/container/agent-runner/src/context7/index.ts` - exports all modules
- [ ] T003 [P] [SETUP] Create `nanoclaw/container/agent-runner/src/context7/types.ts` - type definitions
- [ ] T004 [SETUP] Add Context7 module types:
  ```typescript
  interface QueryPoint { id, libraryId, query, appliesTo, priority, targetFiles }
  interface ComparisonResult { queryPointId, status, severity, differences }
  interface PatternDifference { type, description, context7Pattern, currentPattern, suggestedFix }
  interface CacheEntry { libraryId, query, response, timestamp, expiresAt }
  interface VerificationResult { success, queriesExecuted, cacheHits, updatesApplied, warnings }
  ```

**Checkpoint**: Module structure ready, types defined

---

## Phase 2: Cache Module (FR-023 to FR-026)

**Purpose**: In-memory cache for Context7 responses (30-minute TTL)

**Independent Test**: Cache stores and retrieves entries correctly, expires after TTL

### Implementation for Cache

- [ ] T005 [CACHE] Create `nanoclaw/container/agent-runner/src/context7/cache.ts`
- [ ] T006 [CACHE] Implement `Context7Cache` class with Map<string, CacheEntry>
- [ ] T007 [CACHE] Add `getCacheKey(libraryId, query)` - returns consistent hash
- [ ] T008 [CACHE] Add `get(libraryId, query)` - returns entry or null if expired
- [ ] T009 [CACHE] Add `set(libraryId, query, response)` - stores with 30-min TTL
- [ ] T010 [CACHE] Add `invalidate()` - clears entire cache
- [ ] T011 [CACHE] Add `getStats()` - returns hit/miss counts for logging
- [ ] T012 [P] [TEST] Create `nanoclaw/container/agent-runner/src/context7/__tests__/cache.test.ts`
- [ ] T013 [TEST] Add test: cache stores and retrieves correctly
- [ ] T014 [TEST] Add test: cache returns null for expired entries
- [ ] T015 [TEST] Add test: cache invalidation clears all entries

**Checkpoint**: Cache complete - `npm run test -- cache.test.ts` passes

---

## Phase 3: Query Points Definition (FR-006 to FR-012)

**Purpose**: Define all mandatory SDK query points

**Independent Test**: Query points are correctly defined with all required fields

### Implementation for Query Points

- [ ] T016 [QUERY] Create `nanoclaw/container/agent-runner/src/context7/query-points.ts`
- [ ] T017 [QUERY] Define `QueryPoint` interface with all fields
- [ ] T018 [QUERY] Add query point: `agent_class` - Agent constructor parameters
- [ ] T019 [P] [QUERY] Add query point: `websearch_tool` - WebSearchTool syntax
- [ ] T020 [P] [QUERY] Add query point: `code_interpreter_tool` - CodeInterpreterTool + tool_config
- [ ] T021 [P] [QUERY] Add query point: `file_search_tool` - FileSearchTool + vector_store_ids
- [ ] T022 [P] [QUERY] Add query point: `chatkit_store` - Store interface methods
- [ ] T023 [P] [QUERY] Add query point: `fastapi_chatkit` - FastAPI integration
- [ ] T024 [P] [QUERY] Add query point: `nextjs_chatkit` - Next.js CDN integration
- [ ] T025 [QUERY] Add `getQueryPointsForRequest(requestType)` - filters by backend/frontend/both
- [ ] T026 [P] [TEST] Create `nanoclaw/container/agent-runner/src/context7/__tests__/query-points.test.ts`
- [ ] T027 [TEST] Add test: all 7 query points are defined
- [ ] T028 [TEST] Add test: getQueryPointsForRequest filters correctly

**Checkpoint**: Query points complete - all 7 mandatory queries defined

---

## Phase 4: Pattern Comparator (FR-013 to FR-017)

**Purpose**: Compare Context7 responses with existing patterns, detect meaningful differences

**Independent Test**: Comparator detects new parameters, changed signatures, ignores whitespace

### Implementation for Pattern Comparator

- [ ] T029 [COMPARE] Create `nanoclaw/container/agent-runner/src/context7/pattern-comparator.ts`
- [ ] T030 [COMPARE] Implement `PatternComparator` class
- [ ] T031 [COMPARE] Add `extractCodeBlocks(text)` - extracts Python/TypeScript code from markdown
- [ ] T032 [COMPARE] Add `compareSignatures(context7Code, templateCode)` - detects signature changes
- [ ] T033 [COMPARE] Add `compareImports(context7Code, templateCode)` - detects import path changes
- [ ] T034 [COMPARE] Add `compareParameters(context7Code, templateCode)` - detects new required params
- [ ] T035 [COMPARE] Add `normalizeCode(code)` - removes whitespace/comments for comparison
- [ ] T036 [COMPARE] Add `compare(context7Response, currentPattern)` - main comparison method
- [ ] T037 [COMPARE] Add `determineSeverity(differences)` - returns critical/warning/info
- [ ] T038 [P] [TEST] Create `nanoclaw/container/agent-runner/src/context7/__tests__/pattern-comparator.test.ts`
- [ ] T039 [TEST] Add test: detects new required parameter
- [ ] T040 [TEST] Add test: detects changed method signature
- [ ] T041 [TEST] Add test: detects new import path
- [ ] T042 [TEST] Add test: ignores whitespace differences
- [ ] T043 [TEST] Add test: handles malformed input gracefully

**Checkpoint**: Comparator complete - correctly detects meaningful differences

---

## Phase 5: Reference Updater (FR-018 to FR-022)

**Purpose**: Update skill reference files when SDK patterns change

**Independent Test**: Reference files are updated while preserving structure

### Implementation for Reference Updater

- [ ] T044 [UPDATE] Create `nanoclaw/container/agent-runner/src/context7/reference-updater.ts`
- [ ] T045 [UPDATE] Implement `ReferenceUpdater` class with skills path config
- [ ] T046 [UPDATE] Add `findSection(content, queryPointId)` - finds relevant section in markdown
- [ ] T047 [UPDATE] Add `extractCurrentPattern(section)` - extracts code block from section
- [ ] T048 [UPDATE] Add `applyUpdates(content, section, differences)` - replaces code blocks
- [ ] T049 [UPDATE] Add `preserveCustomNotes(original, updated)` - keeps user comments
- [ ] T050 [UPDATE] Add `updateReference(referenceFile, queryPointId, context7Response, differences)` - main method
- [ ] T051 [UPDATE] Add `backupReference(referenceFile)` - creates backup before update
- [ ] T052 [P] [TEST] Create `nanoclaw/container/agent-runner/src/context7/__tests__/reference-updater.test.ts`
- [ ] T053 [TEST] Add test: finds correct section for query point
- [ ] T054 [TEST] Add test: updates code block while preserving structure
- [ ] T055 [TEST] Add test: preserves custom notes/comments
- [ ] T056 [TEST] Add test: creates backup before update

**Checkpoint**: Reference updater complete - updates files correctly

---

## Phase 6: Template Updater (FR-004)

**Purpose**: Update template patterns when SDK patterns change

**Independent Test**: Templates are updated, pass TDD Level 1 after update

### Implementation for Template Updater

- [ ] T057 [UPDATE] Create `nanoclaw/container/agent-runner/src/context7/template-updater.ts`
- [ ] T058 [UPDATE] Implement `TemplateUpdater` class with templates path config
- [ ] T059 [UPDATE] Add `findTemplateFiles(queryPoint)` - finds affected template files
- [ ] T060 [UPDATE] Add `extractTemplatePattern(templateContent, queryPointId)` - gets current pattern
- [ ] T061 [UPDATE] Add `updateTemplatePattern(content, oldPattern, newPattern)` - replaces pattern
- [ ] T062 [UPDATE] Add `updateTemplate(templateFile, queryPointId, context7Response, differences)` - main method
- [ ] T063 [UPDATE] Add `validateTemplateAfterUpdate(templateFile)` - runs TDD Level 1
- [ ] T064 [P] [TEST] Create `nanoclaw/container/agent-runner/src/context7/__tests__/template-updater.test.ts`
- [ ] T065 [TEST] Add test: finds correct template files for query point
- [ ] T066 [TEST] Add test: updates pattern in template
- [ ] T067 [TEST] Add test: validates template passes TDD Level 1 after update

**Checkpoint**: Template updater complete - updates templates correctly

---

## Phase 7: Context7 Verifier (FR-001 to FR-003)

**Purpose**: Main orchestrator - runs verification before code generation

**Independent Test**: Verifier queries all points, compares, updates, returns result

### Implementation for Verifier

- [ ] T068 [VERIFY] Create `nanoclaw/container/agent-runner/src/context7/verifier.ts`
- [ ] T069 [VERIFY] Implement `Context7Verifier` class with all dependencies
- [ ] T070 [VERIFY] Add `queryContext7(queryPoint)` - calls existing IPC tool, handles errors
- [ ] T071 [VERIFY] Add `processQueryPoint(queryPoint)` - query → compare → update if needed
- [ ] T072 [VERIFY] Add `verify(options)` - main verification method:
  ```typescript
  async verify(options: {
    templateName: string;
    requestType: 'backend' | 'frontend' | 'both';
    forceRefresh?: boolean;
  }): Promise<VerificationResult>
  ```
- [ ] T073 [VERIFY] Add error handling with graceful fallback to cached/existing patterns
- [ ] T074 [VERIFY] Add logging for all queries, comparisons, and updates
- [ ] T075 [P] [TEST] Create `nanoclaw/container/agent-runner/src/context7/__tests__/verifier.test.ts`
- [ ] T076 [TEST] Add test: queries all mandatory points for backend request
- [ ] T077 [TEST] Add test: queries frontend points only when frontend requested
- [ ] T078 [TEST] Add test: uses cache when available
- [ ] T079 [TEST] Add test: falls back gracefully when Context7 unavailable
- [ ] T080 [TEST] Add test: applies updates when mismatch detected

**Checkpoint**: Verifier complete - orchestrates full verification flow

---

## Phase 8: IPC Integration (FR-031 to FR-034)

**Purpose**: Integrate Context7 verification into generate_from_template IPC tool

**Independent Test**: IPC tool calls verifier before generation, includes verification result

### Implementation for IPC Integration

- [ ] T081 [IPC] Modify `nanoclaw/container/agent-runner/src/ipc-mcp-stdio.ts`:
  - Add import for Context7Verifier
  - Create verifier instance
- [ ] T082 [IPC] Modify `generate_from_template` tool:
  - Add verification step BEFORE template selection
  - Log verification results
  - Continue with generation after verification
- [ ] T083 [IPC] Add `context7_verified: boolean` to IPC response
- [ ] T084 [IPC] Add `patterns_updated: string[]` to IPC response
- [ ] T085 [IPC] Add `force_context7_refresh` parameter to tool
- [ ] T086 [IPC] Modify `generate_frontend_from_template` similarly
- [ ] T087 [P] [TEST] Add integration test: IPC calls verifier before generation
- [ ] T088 [TEST] Add integration test: response includes context7_verified flag

**Checkpoint**: IPC integration complete - verification runs automatically

---

## Phase 9: Skill Updates

**Purpose**: Update skill documentation to reflect mandatory Context7 verification

### Implementation for Skill Updates

- [ ] T089 [SKILL] Modify `.claude/skills/code-generation/skill.md`:
  - Change "Use Context7..." to "Context7 verification is MANDATORY"
  - Add section explaining automatic verification
  - Document `force_context7_refresh` parameter
- [ ] T090 [P] [SKILL] Modify `.claude/skills/agent-builder/SKILL.md`:
  - Add note that Context7 verifies patterns before code-generation handoff
  - Update Context7 section to reflect mandatory status
- [ ] T091 [SKILL] Update `.claude/CLAUDE.md`:
  - Add Phase 2 Context7 Integration to Current Status
  - Mark as complete when done
- [ ] T092 [P] [SKILL] Update `nanoclaw/container/CLAUDE.md`:
  - Update Context7 section to reflect mandatory verification

**Checkpoint**: Skills updated - documentation reflects mandatory Context7

---

## Phase 10: End-to-End Testing

**Purpose**: Verify complete flow works correctly

### Implementation for E2E Tests

- [ ] T093 [E2E] Create test scenario: outdated template pattern
  - Use template with old `Agent()` signature
  - Trigger generation
  - Verify Context7 queries
  - Verify template updated
  - Verify generated code correct
- [ ] T094 [E2E] Create test scenario: outdated reference file
  - Modify reference to have old import path
  - Trigger generation
  - Verify reference updated
- [ ] T095 [E2E] Create test scenario: Context7 unavailable
  - Mock network failure
  - Trigger generation
  - Verify fallback to existing patterns
  - Verify warning logged
- [ ] T096 [E2E] Create test scenario: cache hit
  - Query same pattern twice
  - Verify second query uses cache
  - Verify no duplicate API call
- [ ] T097 [E2E] Verify TDD Level 1-2 pass after Context7 updates

**Checkpoint**: E2E tests pass - full flow works correctly

---

## Phase 11: Polish & Documentation

**Purpose**: Final touches and documentation

- [ ] T098 [P] [DOC] Add README.md to `nanoclaw/container/agent-runner/src/context7/`
- [ ] T099 [P] [DOC] Document all exported functions and classes
- [ ] T100 [DOC] Add logging configuration for Context7 module
- [ ] T101 [DOC] Create troubleshooting guide for Context7 issues
- [ ] T102 [FINAL] Run full test suite: `npm run test`
- [ ] T103 [FINAL] Verify with manual code generation test
- [ ] T104 [FINAL] Create PHR for Phase 2 implementation

**Checkpoint**: Phase 2 complete - Context7 Live Knowledge Integration operational

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
     ↓
┌────┴────┬─────────────────────┐
↓         ↓                     ↓
Phase 2   Phase 3
(Cache)   (Query Points)
     ↓         ↓
     └─────────┼─────────────────────┘
               ↓
          Phase 4 (Pattern Comparator)
               ↓
     ┌─────────┴─────────┐
     ↓                   ↓
Phase 5              Phase 6
(Reference Updater)  (Template Updater)
     ↓                   ↓
     └─────────┬─────────┘
               ↓
          Phase 7 (Verifier) ← Orchestrates all modules
               ↓
          Phase 8 (IPC Integration)
               ↓
     ┌─────────┴─────────┐
     ↓                   ↓
Phase 9              Phase 10
(Skill Updates)      (E2E Tests)
     ↓                   ↓
     └─────────┬─────────┘
               ↓
          Phase 11 (Polish)
```

### Within Each Phase

1. Write test file first (TDD!)
2. Run test - verify it fails
3. Implement module
4. Run test - verify it passes
5. Add remaining tests
6. Phase checkpoint validation

### Parallel Opportunities

```bash
# Phase 1 - Setup files in parallel:
T002, T003 (index.ts, types.ts)

# Phase 2 - Cache tests in parallel:
T012 can start after T006

# Phase 3 - Query points in parallel:
T019, T020, T021, T022, T023, T024 (all query point definitions)

# Phase 4 - Comparator tests in parallel:
T039, T040, T041, T042, T043 (different test scenarios)

# Phase 5 - Updater tests in parallel:
T053, T054, T055, T056 (different test scenarios)

# Phase 9 - Skill updates in parallel:
T089, T090, T091, T092 (different files)
```

---

## Implementation Strategy

### MVP First (Cache + Query Points + Comparator + Verifier + IPC)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Cache (T005-T015)
3. Complete Phase 3: Query Points (T016-T028)
4. Complete Phase 4: Pattern Comparator (T029-T043)
5. Complete Phase 7: Verifier (T068-T080) - uses existing templates/references
6. Complete Phase 8: IPC Integration (T081-T088)
7. **VALIDATE**: Generate code, verify Context7 queries in logs
8. **STOP**: MVP complete - Context7 verification working

### Incremental Delivery

1. **MVP**: Setup + Cache + Query Points + Comparator + Verifier + IPC → Deploy
2. **Enhancement 1**: Add Reference Updater (Phase 5) → References auto-update
3. **Enhancement 2**: Add Template Updater (Phase 6) → Templates auto-update
4. **Enhancement 3**: Add E2E Tests + Polish → Full verification system

### Test-Driven Development

1. Write test that expects specific behavior
2. Run test - verify it fails (red)
3. Implement minimal code to pass
4. Run test - verify it passes (green)
5. Refactor if needed
6. Repeat

---

## Summary

| Phase | Tasks | Parallel Tasks | Time Estimate |
|-------|-------|----------------|---------------|
| Phase 1: Setup | 4 | 2 | ~15 min |
| Phase 2: Cache | 11 | 1 | ~30 min |
| Phase 3: Query Points | 13 | 7 | ~30 min |
| Phase 4: Pattern Comparator | 15 | 1 | ~1 hour |
| Phase 5: Reference Updater | 13 | 1 | ~45 min |
| Phase 6: Template Updater | 11 | 1 | ~45 min |
| Phase 7: Verifier | 13 | 1 | ~1 hour |
| Phase 8: IPC Integration | 8 | 1 | ~45 min |
| Phase 9: Skill Updates | 4 | 3 | ~20 min |
| Phase 10: E2E Tests | 5 | 0 | ~1 hour |
| Phase 11: Polish | 7 | 2 | ~30 min |
| **Total** | **104** | **20** | **~8 hours** |

---

## Verification Checklist

After all tasks complete, verify:

- [ ] Context7 verification runs BEFORE every `generate_from_template` call
- [ ] All 7 query points are queried for backend requests
- [ ] Frontend query points added for frontend requests
- [ ] Cache reduces duplicate API calls
- [ ] Mismatch detection triggers template update
- [ ] Mismatch detection triggers reference update
- [ ] Fallback works when Context7 unavailable
- [ ] IPC response includes `context7_verified: true`
- [ ] Updated templates pass TDD Level 1-2
- [ ] Updated references are valid markdown
- [ ] Logs show all Context7 queries and results

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Context7 queries per generation | 7 (backend) or 8+ (frontend) |
| Cache hit rate (same session) | >80% |
| Generation time increase | <5 seconds |
| SDK pattern mismatch detection | 100% |
| Fallback success rate | 100% |
| TDD Level 1-2 pass after updates | 100% |

---

## Notes

- Context7 API may have rate limits - implement exponential backoff
- Cache should survive process restarts (optional: persist to file)
- Reference updates must preserve custom notes/comments
- Template updates must maintain valid Jinja2 syntax
- All updates should be atomic (backup before modify)
- Logging is critical for debugging - log all queries and responses
