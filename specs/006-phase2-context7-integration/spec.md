# Feature Specification: Phase 2 - Context7 Live Knowledge Integration

**Feature Branch**: `006-phase2-context7-integration`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Integrate Context7 as mandatory pre-generation step to verify and update both templates and skill references against latest SDK documentation"

## Overview

Context7 tools exist but are currently optional. This causes outdated SDK patterns to reach clients when:
- OpenAI Agents SDK updates method signatures
- ChatKit library changes import paths
- New parameters become required (like `tool_config` for CodeInterpreterTool)

This phase makes Context7 verification **MANDATORY** before every code generation, updating both:
1. **Templates** - Code generation patterns
2. **Skill References** - Documentation files that guide the agent

### Problem Statement

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT CONTEXT7 GAP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Context7 Tools EXIST but are OPTIONAL:                         │
│  ├── context7_resolve_library (IPC tool)                        │
│  └── context7_query_docs (IPC tool)                             │
│                                                                  │
│  Current Flow:                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│  │ Client  │ →   │ Template│ →   │ Deliver │                   │
│  │ Request │     │ Generate│     │ Code    │                   │
│  └─────────┘     └─────────┘     └─────────┘                   │
│                                                                  │
│  Problems:                                                      │
│  ❌ Templates use OUTDATED SDK patterns                         │
│  ❌ Skill references have STALE documentation                   │
│  ❌ Agent relies on training data (WRONG!)                      │
│  ❌ SDK version changes cause runtime errors                    │
│                                                                  │
│  Recent Failures:                                               │
│  • CodeInterpreterTool missing tool_config parameter            │
│  • chatkit.stores vs chatkit.store import path                  │
│  • Agent class constructor signature changes                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: LIVE KNOWLEDGE SYNC                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NEW Flow (Context7 MANDATORY):                                 │
│                                                                  │
│  ┌─────────┐     ┌─────────────┐     ┌─────────┐     ┌────────┐│
│  │ Client  │ →   │ QUERY       │ →   │ Compare │ →   │Generate││
│  │ Request │     │ CONTEXT7    │     │ & Update│     │ Code   ││
│  └─────────┘     └─────────────┘     └─────────┘     └────────┘│
│                        │                   │                    │
│                        ↓                   ↓                    │
│              ┌──────────────────┐  ┌──────────────┐            │
│              │ Query for each:  │  │ Update BOTH: │            │
│              │ • Agent class    │  │ • Templates  │            │
│              │ • Tools syntax   │  │ • References │            │
│              │ • ChatKit Store  │  │              │            │
│              │ • FastAPI+ChatKit│  │              │            │
│              └──────────────────┘  └──────────────┘            │
│                                                                  │
│  Benefits:                                                      │
│  ✅ Always latest SDK patterns                                  │
│  ✅ Skill references stay accurate                              │
│  ✅ No training data reliance                                   │
│  ✅ Fewer runtime errors                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pre-Generation Context7 Verification (Priority: P1)

Before any code generation, the system MUST query Context7 for the latest SDK patterns and compare them against current templates. If patterns differ, templates are updated before generation.

**Why this priority**: This is the core functionality - without this, all other features are meaningless. Every code generation must go through Context7 verification.

**Independent Test**: Can be fully tested by triggering code generation and verifying Context7 queries are made before template rendering.

**Acceptance Scenarios**:

1. **Given** client requests "FAQ bot with web search", **When** code-generation skill activates, **Then** Context7 is queried for "Agent class constructor" AND "WebSearchTool syntax" BEFORE template selection
2. **Given** Context7 returns new parameter for WebSearchTool, **When** comparison runs, **Then** template variables are updated to include new parameter
3. **Given** Context7 is unavailable (network error), **When** generation requested, **Then** system falls back to cached patterns with warning
4. **Given** Context7 query completes, **When** patterns match templates, **Then** generation proceeds without modification

---

### User Story 2 - Skill References Auto-Update (Priority: P1)

When Context7 returns updated patterns, the system must also update the corresponding skill reference files in `.claude/skills/*/references/`.

**Why this priority**: Agent reads skill references BEFORE code generation. Outdated references = outdated guidance = wrong code patterns.

**Independent Test**: Can be tested by checking if reference files are updated when Context7 returns new patterns.

**Acceptance Scenarios**:

1. **Given** Context7 returns new Agent constructor signature, **When** update runs, **Then** `references/openai-agents-sdk-tools.md` is updated with new pattern
2. **Given** Context7 returns new ChatKit Store interface, **When** update runs, **Then** `references/code-templates.md` is updated with correct import path
3. **Given** reference file is updated, **When** next generation runs, **Then** agent uses updated documentation
4. **Given** no changes detected, **When** comparison runs, **Then** reference files remain unchanged

---

### User Story 3 - Query Points Coverage (Priority: P1)

System must query Context7 for ALL critical SDK components before generation, not just the ones mentioned in client request.

**Why this priority**: Even if client asks for "simple chatbot", we need to verify Agent class, FastAPI integration, and ChatKit patterns are all current.

**Independent Test**: Can be tested by verifying all mandatory query points are hit regardless of request type.

**Acceptance Scenarios**:

1. **Given** any code generation request, **When** Context7 verification runs, **Then** ALL of these are queried:
   - Agent class constructor parameters
   - Tool syntax (WebSearchTool, CodeInterpreterTool, FileSearchTool)
   - ChatKit Store interface methods
   - FastAPI + ChatKit integration pattern
   - Next.js App Router patterns (if frontend)

2. **Given** client requests backend-only agent, **When** verification runs, **Then** frontend queries are skipped
3. **Given** client requests frontend with chat, **When** verification runs, **Then** Next.js + ChatKit CDN patterns are queried

---

### User Story 4 - Template Pattern Comparison (Priority: P2)

System must intelligently compare Context7 responses with existing template patterns, detecting meaningful differences.

**Why this priority**: Not every difference matters. System should detect structural changes (new parameters, changed signatures) vs cosmetic changes (whitespace, comments).

**Independent Test**: Can be tested by providing mock Context7 responses and verifying correct diff detection.

**Acceptance Scenarios**:

1. **Given** Context7 returns `Agent(name, instructions, tools, handoffs)`, **When** template has `Agent(name, instructions)`, **Then** difference detected: missing `tools, handoffs` parameters
2. **Given** Context7 returns same pattern with different formatting, **When** comparison runs, **Then** no meaningful difference detected
3. **Given** Context7 returns new required parameter, **When** comparison runs, **Then** parameter marked as REQUIRED_UPDATE
4. **Given** Context7 returns deprecated pattern, **When** comparison runs, **Then** warning logged but no update forced

---

### User Story 5 - Caching and Performance (Priority: P2)

Context7 queries should be cached to avoid repeated API calls for the same patterns within a session.

**Why this priority**: Multiple code generations in same session shouldn't query Context7 repeatedly for same patterns.

**Independent Test**: Can be tested by generating multiple projects and verifying cache hits.

**Acceptance Scenarios**:

1. **Given** Context7 was queried for "Agent class" 5 minutes ago, **When** new generation requested, **Then** cached response is used
2. **Given** cache is 30+ minutes old, **When** generation requested, **Then** fresh Context7 query is made
3. **Given** user explicitly requests "refresh patterns", **When** generation runs, **Then** cache is bypassed
4. **Given** Context7 returns error, **When** cache has valid data, **Then** cached patterns are used with warning

---

### User Story 6 - IPC Tool Enhancement (Priority: P2)

The `generate_from_template` IPC tool must be enhanced to REQUIRE Context7 verification step.

**Why this priority**: This is the enforcement mechanism. Without modifying IPC tool, Context7 verification remains optional.

**Independent Test**: Can be tested by calling IPC tool and verifying Context7 queries are logged.

**Acceptance Scenarios**:

1. **Given** `generate_from_template` is called, **When** IPC processes request, **Then** Context7 verification runs FIRST
2. **Given** Context7 verification fails (network error), **When** fallback is available, **Then** generation continues with warning
3. **Given** Context7 verification detects mismatch, **When** update succeeds, **Then** generation uses updated patterns
4. **Given** IPC returns result, **When** Context7 was queried, **Then** result includes `context7_verified: true` flag

---

### Edge Cases

- What happens when Context7 API is down? (Use cached patterns with warning, never block generation)
- What if Context7 returns invalid/malformed response? (Log error, use existing patterns)
- What if template has patterns Context7 doesn't know about? (Keep template patterns, log for review)
- How to handle rate limiting from Context7 API? (Exponential backoff, use cache)
- What if skill reference file is read-only? (Log warning, continue with in-memory update)
- What if multiple agents generate simultaneously? (Cache is shared, locking for updates)

---

## Requirements *(mandatory)*

### Functional Requirements

#### Core Context7 Integration

- **FR-001**: System MUST query Context7 BEFORE every code generation (templates AND manual code)
- **FR-002**: System MUST query ALL mandatory SDK components regardless of client request type
- **FR-003**: System MUST compare Context7 responses with existing template patterns
- **FR-004**: System MUST update templates when meaningful differences detected
- **FR-005**: System MUST update skill reference files when SDK patterns change

#### Query Points (Mandatory)

- **FR-006**: System MUST query "Agent class constructor parameters and signature"
- **FR-007**: System MUST query "WebSearchTool initialization syntax"
- **FR-008**: System MUST query "CodeInterpreterTool with tool_config parameter"
- **FR-009**: System MUST query "FileSearchTool with vector_store_ids parameter"
- **FR-010**: System MUST query "ChatKit Store interface methods and signatures"
- **FR-011**: System MUST query "FastAPI ChatKit server integration pattern"
- **FR-012**: System MUST query "Next.js ChatKit CDN integration" (if frontend requested)

#### Pattern Comparison

- **FR-013**: System MUST detect new required parameters in SDK classes
- **FR-014**: System MUST detect changed method signatures
- **FR-015**: System MUST detect new import paths
- **FR-016**: System MUST ignore whitespace/formatting differences
- **FR-017**: System MUST log all detected differences with severity (CRITICAL, WARNING, INFO)

#### Reference Updates

- **FR-018**: System MUST update `references/openai-agents-sdk-tools.md` when tool syntax changes
- **FR-019**: System MUST update `references/openai-agents-sdk-memory.md` when session patterns change
- **FR-020**: System MUST update `references/code-templates.md` when code patterns change
- **FR-021**: System MUST update `references/import-mappings.md` when import paths change
- **FR-022**: System MUST preserve custom notes/comments in reference files during update

#### Caching

- **FR-023**: System MUST cache Context7 responses for 30 minutes
- **FR-024**: System MUST provide cache bypass option for explicit refresh
- **FR-025**: System MUST use cached patterns when Context7 is unavailable
- **FR-026**: System MUST log cache hits/misses for debugging

#### Error Handling

- **FR-027**: System MUST NOT block generation if Context7 is unavailable
- **FR-028**: System MUST fall back to existing patterns with warning on Context7 error
- **FR-029**: System MUST log all Context7 queries and responses for audit
- **FR-030**: System MUST provide clear error messages when pattern mismatch cannot be resolved

#### IPC Integration

- **FR-031**: System MUST modify `generate_from_template` to include Context7 verification step
- **FR-032**: System MUST modify `generate_frontend_from_template` to include Context7 verification
- **FR-033**: System MUST add `context7_verified` flag to IPC response
- **FR-034**: System MUST add `patterns_updated` list to IPC response when updates made

### Key Entities

- **QueryPoint**: SDK component to query (agent_class, websearch_tool, chatkit_store, etc.)
- **PatternComparison**: Result of comparing Context7 response with template (match, mismatch, severity)
- **CacheEntry**: Cached Context7 response with timestamp and library ID
- **ReferenceUpdate**: Changes to apply to skill reference file
- **VerificationResult**: Overall result of Context7 verification step

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of code generations are preceded by Context7 verification
- **SC-002**: Context7 queries cover ALL mandatory query points (FR-006 to FR-012)
- **SC-003**: Template updates happen within same generation cycle (no manual intervention)
- **SC-004**: Reference file updates happen within same generation cycle
- **SC-005**: Context7 verification adds < 5 seconds to generation time (with caching)
- **SC-006**: Zero SDK signature errors reach clients after Context7 verification
- **SC-007**: Cache hit rate > 80% for consecutive generations in same session
- **SC-008**: Fallback to cached patterns works 100% when Context7 unavailable

---

## Technical Constraints

- Context7 MCP tools already exist in `ipc-mcp-stdio.ts` (lines 1097-1319)
- Context7 API endpoint: `https://api.context7.com/v1/`
- Must work with existing IPC file-based communication pattern
- Must not break existing `generate_from_template` interface
- Cache should be in-memory (no additional database)
- Reference file updates must preserve existing structure/formatting

---

## Dependencies

- Existing Context7 IPC tools (`context7_resolve_library`, `context7_query_docs`)
- Existing template generation IPC tools
- Skill reference files in `.claude/skills/*/references/`
- Templates in `nanoclaw/container/templates/`
- Phase 5 TDD validation (Context7 updates should pass TDD)

---

## Out of Scope

- Auto-fixing code errors (Phase 3 - Verification Sandbox)
- Feedback loop and error learning (Phase 4)
- Template health scoring (Phase 4)
- Smart decision engine (Phase 5)
- Automatic daily template updates (Phase 6)

---

## File Structure After Implementation

```
nanoclaw/container/agent-runner/src/
├── ipc-mcp-stdio.ts              # MODIFIED: Add Context7 verification step
├── context7-verifier.ts          # NEW: Context7 verification logic
├── pattern-comparator.ts         # NEW: Pattern comparison logic
├── reference-updater.ts          # NEW: Skill reference update logic
└── context7-cache.ts             # NEW: In-memory caching

.claude/skills/
├── agent-builder/
│   ├── SKILL.md                  # MODIFIED: Add Context7 MANDATORY section
│   └── references/               # AUTO-UPDATED by Context7
│       ├── openai-agents-sdk-tools.md
│       └── ...
├── code-generation/
│   ├── skill.md                  # MODIFIED: Add Context7 pre-generation step
│   └── references/               # AUTO-UPDATED by Context7
│       ├── code-templates.md
│       └── import-mappings.md
```

---

## Query Points Reference

| Query Point | Context7 Library ID | Query |
|-------------|---------------------|-------|
| Agent Class | `/openai/openai-agents-python` | "Agent class constructor parameters and signature" |
| WebSearchTool | `/openai/openai-agents-python` | "WebSearchTool initialization and parameters" |
| CodeInterpreterTool | `/openai/openai-agents-python` | "CodeInterpreterTool with tool_config container" |
| FileSearchTool | `/openai/openai-agents-python` | "FileSearchTool vector_store_ids parameter" |
| ChatKit Store | `/openai/chatkit-python` | "Store interface methods context parameter" |
| FastAPI Integration | `/openai/chatkit-python` | "ChatKitServer FastAPI integration pattern" |
| Next.js ChatKit | `/openai/chatkit-js` | "ChatKit CDN web component integration" |
