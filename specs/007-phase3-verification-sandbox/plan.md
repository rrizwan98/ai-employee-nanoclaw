# Implementation Plan: Phase 3 Verification Sandbox

**Branch**: `feat/phase3-verification-sandbox` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-phase3-verification-sandbox/spec.md`

## Summary

Pre-delivery verification sandbox that runs 4-level tests on ALL generated code before WhatsApp delivery. Auto-fix loop using Skills, Templates, and Context7 for up to 3 attempts. Human alert on EVERY attempt with error details and fix explanation.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+) for IPC tools, Python 3.10+ for sandbox tests
**Primary Dependencies**: Existing 4-level TDD system, Context7 module, Docker sandbox
**Storage**: In-memory for verification state, optional logging to database
**Testing**: Jest for IPC tools, pytest for sandbox verification
**Target Platform**: NanoClaw container (Linux)
**Project Type**: Extension of existing IPC system
**Performance Goals**: Verification completes within 60 seconds per project
**Constraints**: Max 3 auto-fix attempts, human alert latency < 5 seconds
**Scale/Scope**: Single project verification at a time (sequential)

## Constitution Check

- [x] Code changes are minimal - extending existing IPC tools
- [x] Uses existing 4-level TDD system (Phase 1)
- [x] Uses existing Context7 module (Phase 2)
- [x] No new external dependencies required
- [x] Docker sandbox already exists in container

## Project Structure

### Documentation (this feature)

```text
specs/007-phase3-verification-sandbox/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Implementation tasks (next step)
```

### Source Code (repository root)

```text
nanoclaw/container/agent-runner/
├── src/
│   ├── ipc-mcp-stdio.ts           # MODIFY: Add verification orchestrator
│   ├── verification/              # NEW: Verification module
│   │   ├── index.ts               # Module exports
│   │   ├── orchestrator.ts        # Main verification flow
│   │   ├── sandbox-runner.ts      # Docker sandbox execution
│   │   ├── endpoint-extractor.ts  # Extract endpoints from code
│   │   ├── auto-fixer.ts          # Auto-fix logic
│   │   └── human-alert.ts         # Human notification system
│   └── context7/                  # EXISTING: Context7 module
│       └── ...
├── tests/
│   └── verification/              # NEW: Verification tests
│       ├── orchestrator.test.ts
│       ├── endpoint-extractor.test.ts
│       └── auto-fixer.test.ts
└── sandbox/                       # NEW: Sandbox scripts
    ├── verify-backend.py          # Backend verification script
    ├── verify-frontend.sh         # Frontend verification script
    └── requirements.txt           # Sandbox dependencies
```

**Structure Decision**: Extend existing agent-runner with new `verification/` module. Reuse existing Context7 and TDD infrastructure.

## Architecture Design

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERIFICATION SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐     ┌────────────────┐     ┌──────────────┐ │
│  │    IPC Tool    │ ──→ │  Orchestrator  │ ──→ │   Sandbox    │ │
│  │  (entry point) │     │ (verification  │     │   Runner     │ │
│  └────────────────┘     │    flow)       │     └──────────────┘ │
│                         └───────┬────────┘                      │
│                                 │                                │
│         ┌───────────────────────┼───────────────────────┐       │
│         ↓                       ↓                       ↓        │
│  ┌─────────────┐     ┌────────────────┐     ┌────────────────┐  │
│  │  Endpoint   │     │   Auto-Fixer   │     │  Human Alert   │  │
│  │  Extractor  │     │  (Skills/C7)   │     │   (WhatsApp)   │  │
│  └─────────────┘     └────────────────┘     └────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Orchestrator Flow

```typescript
class VerificationOrchestrator {
  async verify(projectPath: string, projectType: 'backend' | 'frontend'): Promise<VerificationResult> {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      // Run verification in sandbox
      const result = await this.sandboxRunner.runTests(projectPath, projectType);

      // Alert human on EVERY attempt
      await this.humanAlert.notify({
        attempt,
        maxAttempts,
        result,
        fixApplied: attempt > 1 ? lastFix : null
      });

      if (result.allPassed) {
        return { success: true, attempts: attempt };
      }

      if (attempt < maxAttempts) {
        // Attempt auto-fix
        const fix = await this.autoFixer.fix(result.errors, projectPath);
        if (!fix.applied) {
          break; // No fix available, escalate
        }
      }
    }

    // Escalate to human
    await this.humanAlert.escalate({ attempts: attempt, history: attemptHistory });
    return { success: false, attempts: attempt, requiresHuman: true };
  }
}
```

### Backend Verification Steps

```
Level 1: Syntax
├── ast.parse() on all .py files
└── No unresolved {{VARIABLES}}

Level 2: Imports
├── pip install -r requirements.txt
├── Import all modules
└── from agents import Agent, Runner

Level 3: Runtime
├── Initialize agent from agents_config.py
├── Verify tools instantiate
├── Start server on test port
└── Wait for startup (max 10 seconds)

Level 4: Integration
├── GET /health → 200 {"status": "healthy"}
├── POST /chatkit → 200 (mock request)
└── ALL custom endpoints (extracted from code)
```

### Frontend Verification Steps

```
Level 1: Syntax
├── Valid .tsx/.ts syntax
└── No unresolved {{VARIABLES}}

Level 2: Imports
├── npm install
└── npx tsc --noEmit

Level 3: Runtime
├── npm run build
└── Check build output exists

Level 4: Integration
├── "use client" on all client components
└── Component files match exports
```

### Endpoint Extraction

```typescript
class EndpointExtractor {
  // Extract from main.py or agents.py
  extract(code: string): Endpoint[] {
    const patterns = [
      /@app\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g,
      /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g
    ];

    // Always include standard endpoints
    const endpoints: Endpoint[] = [
      { method: 'GET', path: '/health', expectedStatus: 200 },
      { method: 'POST', path: '/chatkit', expectedStatus: 200 }
    ];

    // Extract custom endpoints
    for (const pattern of patterns) {
      // ... extract and add custom endpoints
    }

    return endpoints;
  }
}
```

### Auto-Fixer Logic

```typescript
class AutoFixer {
  async fix(errors: VerificationError[], projectPath: string): Promise<FixResult> {
    for (const error of errors) {
      // Step 1: Check Skills for pattern
      const skillFix = await this.checkSkills(error);
      if (skillFix) {
        return this.applyFix(skillFix, projectPath, 'Skills');
      }

      // Step 2: Check Templates for correct code
      const templateFix = await this.checkTemplates(error);
      if (templateFix) {
        return this.applyFix(templateFix, projectPath, 'Templates');
      }

      // Step 3: Query Context7 for latest pattern
      const context7Fix = await this.queryContext7(error);
      if (context7Fix) {
        return this.applyFix(context7Fix, projectPath, 'Context7');
      }
    }

    return { applied: false, reason: 'No fix available' };
  }

  private async checkSkills(error: VerificationError): Promise<Fix | null> {
    // Common patterns from Skills
    const skillPatterns = {
      'CodeInterpreterTool()': {
        correct: 'CodeInterpreterTool(tool_config={"type": "code_interpreter"})',
        source: 'agent-builder/references/openai-agents-sdk-tools.md'
      },
      'from chatkit.stores': {
        correct: 'from chatkit.store',
        source: 'code-generation/references/chatkit-backend.md'
      }
      // ... more patterns
    };

    for (const [wrong, fix] of Object.entries(skillPatterns)) {
      if (error.message.includes(wrong)) {
        return { ...fix, errorPattern: wrong };
      }
    }
    return null;
  }
}
```

### Human Alert Format

```typescript
interface HumanAlert {
  attempt: number;
  maxAttempts: number;
  status: 'error' | 'fixed' | 'escalated';
  error?: {
    type: string;       // ImportError, TypeError, etc.
    location: string;   // file:line
    message: string;    // Full error message
  };
  analysis?: string;    // Why this error occurred
  fix?: {
    applied: string;    // What was changed
    source: string;     // Skills | Templates | Context7
  };
}

// WhatsApp message format
function formatAlert(alert: HumanAlert): string {
  return `
🔔 VERIFICATION ALERT - Attempt ${alert.attempt}/${alert.maxAttempts}

ERROR: ${alert.error?.type}
LOCATION: ${alert.error?.location}
MESSAGE: ${alert.error?.message}

ANALYSIS: ${alert.analysis}

FIX APPLIED: ${alert.fix?.applied}
SOURCE: ${alert.fix?.source}
  `.trim();
}
```

## IPC Tool Interface

### New IPC Operation: verify_project

```typescript
// Request
{
  "operation": "verify_project",
  "params": {
    "project_path": "/workspace/client-agents/{jid}/{project}",
    "project_type": "backend" | "frontend",
    "auto_fix": true,
    "max_attempts": 3
  }
}

// Response (success)
{
  "success": true,
  "result": {
    "verification": {
      "passed": true,
      "attempts": 1,
      "levels": {
        "level1": { "passed": true },
        "level2": { "passed": true },
        "level3": { "passed": true },
        "level4": { "passed": true, "endpoints_tested": 5 }
      }
    },
    "delivery_ready": true
  }
}

// Response (failure after 3 attempts)
{
  "success": false,
  "error": "Verification failed after 3 attempts - human review required",
  "result": {
    "verification": {
      "passed": false,
      "attempts": 3,
      "history": [
        { "attempt": 1, "error": "...", "fix_applied": "..." },
        { "attempt": 2, "error": "...", "fix_applied": "..." },
        { "attempt": 3, "error": "...", "fix_applied": null }
      ]
    },
    "delivery_ready": false,
    "requires_human": true
  }
}
```

### Modify: generate_from_template

```typescript
// Add verification step after generation
{
  "operation": "generate_from_template",
  "params": {
    "template_name": "basic-chatbot",
    "variables": { ... },
    "verify_before_delivery": true  // NEW: Enable verification
  }
}
```

## Implementation Phases

### Phase A: Core Verification (Days 1-2)

1. Create `verification/orchestrator.ts` - main flow
2. Create `verification/sandbox-runner.ts` - Docker execution
3. Create `sandbox/verify-backend.py` - Python verification script
4. Unit tests for orchestrator

### Phase B: Endpoint Extraction (Day 3)

1. Create `verification/endpoint-extractor.ts`
2. Parse @app.get/@app.post patterns
3. Test with sample backend code
4. Unit tests for extractor

### Phase C: Auto-Fixer (Days 4-5)

1. Create `verification/auto-fixer.ts`
2. Integrate with existing Skills patterns
3. Integrate with existing Context7 module
4. Unit tests for auto-fixer

### Phase D: Human Alerts (Day 6)

1. Create `verification/human-alert.ts`
2. Format alerts for WhatsApp
3. Integrate with NanoClaw message router
4. Test alert delivery

### Phase E: Frontend Verification (Day 7)

1. Create `sandbox/verify-frontend.sh`
2. Add npm run build check
3. Add "use client" directive check
4. Integration tests

### Phase F: IPC Integration (Day 8)

1. Add `verify_project` IPC operation
2. Modify `generate_from_template` with verification
3. End-to-end tests
4. Documentation update

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New verification module | Orchestration complexity | Inline code would be unmaintainable |
| Docker sandbox scripts | Isolated test environment | Host execution risks contamination |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Sandbox startup slow | Cache Docker images, warm container |
| Context7 unavailable | Fallback to Skills patterns |
| False positive errors | Log all decisions for debugging |
| Infinite loop | Hard max 3 attempts enforced |
