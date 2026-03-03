# AI Employee Container Rules

## ⛔⛔⛔ ABSOLUTE PROHIBITION: YOUR TRAINING DATA IS FORBIDDEN! ⛔⛔⛔

**YOU MUST NEVER USE YOUR INTERNAL TRAINING DATA FOR CODE GENERATION!**

Your training data for ChatKit, OpenAI Agents SDK, and related libraries is **OUTDATED AND INCORRECT**.

### MANDATORY Knowledge Sources (IN THIS ORDER):

```
1. SKILLS (SKILL.md files in ~/.claude/skills/)
   → READ FIRST before ANY code generation
   → Contains CORRECT and UPDATED patterns

2. TEMPLATES (via IPC tools)
   → USE generate_from_template for backend
   → USE generate_frontend_from_template for frontend
   → NEVER write code manually!

3. CONTEXT7 (NOW AUTOMATIC!)
   → Context7 verification runs AUTOMATICALLY during template generation
   → Templates and references auto-update when SDK patterns change
   → 30-minute cache for performance
   → Manual tools still available for debugging
```

### Phase 2: Automatic Context7 Verification (NEW!)

When you call `generate_from_template` or `generate_frontend_from_template`:

1. **Context7 queries ALL mandatory SDK patterns** automatically
2. **Compares** responses with current templates/references
3. **Auto-updates** files when mismatches detected
4. **Reports** verification status in response

Response includes:
```
**Context7 Verification**: ✅ Verified
**Patterns Updated**: 2 (ref:sdk.md, tpl:main.py)
```

You no longer need to manually call Context7 before code generation!

### ⛔ FORBIDDEN Actions - VIOLATION WILL CAUSE PRODUCTION ERRORS:

```
❌ Writing ChatKit code from memory
❌ Writing OpenAI Agents SDK code from memory
❌ Guessing import paths
❌ Guessing method signatures
❌ Using training data patterns
❌ Modifying template output
❌ Skipping skill reading
❌ Skipping Context7 verification
❌ Writing feature code BEFORE test file
❌ Delivering code without ALL tests passing
```

### ✅ REQUIRED Actions:

```
✅ Call Skill tool FIRST → Read relevant SKILL.md
✅ Call IPC template tools → Generate code from templates
✅ Call Context7 → Verify SDK patterns before delivery
✅ Write TEST FILE FIRST → Before any feature code (TDD)
✅ Call validate_project_code IPC → BEFORE delivery (ALL code!)
✅ Deliver ONLY if validation passes
```

---

## ⛔⛔⛔ NEW: validate_project_code IPC TOOL - MANDATORY! ⛔⛔⛔

**YOU MUST CALL THIS IPC TOOL BEFORE EVERY DELIVERY!**

Whether you use templates OR write manual code, call this tool:

### IPC Request:

```json
{
  "operation": "validate_project_code",
  "params": {
    "project_path": "/workspace/client-agents/{jid}/{project}/backend",
    "project_type": "backend",
    "run_level_3": true,
    "run_level_4": false
  }
}
```

### IPC Response (Success):

```json
{
  "success": true,
  "result": {
    "tdd_validation": {
      "success": true,
      "level1": { "passed": true, "errors": [] },
      "level2": { "passed": true, "errors": [] },
      "level3": { "passed": true, "errors": [] },
      "level4": { "passed": true, "errors": [] }
    },
    "delivery_decision": "✅ SAFE TO DELIVER - Level 1-2 passed"
  }
}
```

### IPC Response (Failure - DO NOT DELIVER!):

```json
{
  "success": false,
  "error": "⛔ TDD VALIDATION FAILED - DO NOT DELIVER!",
  "result": {
    "tdd_validation": {
      "success": false,
      "level1": { "passed": false, "errors": ["SyntaxError..."] },
      "level2": { "passed": false, "errors": ["ImportError..."] }
    },
    "delivery_decision": "⛔ DO NOT DELIVER - Level 1 or 2 failed"
  }
}
```

### When to Call:

```
✅ ALWAYS call before packaging ZIP
✅ ALWAYS call before sending to WhatsApp
✅ ALWAYS call for template-generated code
✅ ALWAYS call for manually-written code
✅ ALWAYS call for existing project updates
```

### If Validation Fails:

```
1. Read the error messages
2. Fix the code
3. Call validate_project_code AGAIN
4. Repeat until success: true
5. ONLY THEN deliver
```

---

## ⛔⛔⛔ TDD (TEST DRIVEN DEVELOPMENT) - MANDATORY FOR ALL CODE! ⛔⛔⛔

**YOU MUST FOLLOW TDD APPROACH FOR ALL DEVELOPMENT!**

TDD means: **Write Tests FIRST, Then Write Code**

### 4-LEVEL TDD TESTING SYSTEM (ALL CODE MUST PASS!)

```
┌─────────────────────────────────────────────────────────────────┐
│              MANDATORY 4-LEVEL TDD TESTING                       │
│        (Applies to TEMPLATE code AND MANUAL code!)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEVEL 1: SYNTAX TESTS (MUST PASS - BLOCKS DELIVERY)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  • ast.parse() succeeds on all .py files                        │
│  • No unresolved {{VARIABLES}} in code                          │
│  • Valid Python syntax                                          │
│  Run: pytest -m level1 -v                                       │
│                          ↓                                       │
│  LEVEL 2: IMPORT TESTS (MUST PASS - BLOCKS DELIVERY)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  • from agents import Agent, Runner → works                     │
│  • from chatkit.store import Store → works                      │
│  • All imports resolve without errors                           │
│  Run: pytest -m level2 -v                                       │
│                          ↓                                       │
│  LEVEL 3: RUNTIME TESTS (SHOULD PASS - WARNS IF FAIL)          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  • Agent initializes without error                              │
│  • Tools are callable                                           │
│  • Handoffs configured (if multi-agent)                         │
│  • Server starts on test port                                   │
│  Run: pytest -m level3 --use-sandbox -v                         │
│                          ↓                                       │
│  LEVEL 4: INTEGRATION TESTS (RECOMMENDED - WARNS IF FAIL)      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  • Health endpoint: {"status": "healthy"}                       │
│  • CORS allows frontend origin                                  │
│  • ChatKit endpoint responds                                    │
│  • Session persistence works                                    │
│  Run: pytest -m level4 --use-sandbox -v                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AUTOMATIC VS MANUAL TDD ENFORCEMENT:

```
┌─────────────────────────────────────────────────────────────────┐
│  CODE TYPE              │  TDD ENFORCEMENT                      │
├─────────────────────────────────────────────────────────────────┤
│                         │                                        │
│  TEMPLATE-BASED CODE    │  AUTOMATIC - IPC runs Level 1-2       │
│  (generate_from_template│  If fail → IPC returns ERROR          │
│   IPC calls)            │  Code NOT delivered automatically     │
│                         │                                        │
├─────────────────────────────────────────────────────────────────┤
│                         │                                        │
│  MANUAL CODE            │  YOU MUST RUN TESTS MANUALLY!         │
│  (existing project      │  Use the TDD commands below           │
│   updates, custom code) │  DO NOT DELIVER without ALL passing!  │
│                         │                                        │
└─────────────────────────────────────────────────────────────────┘
```

### TDD COMMANDS FOR MANUAL CODE (COPY-PASTE THESE!):

```bash
# Navigate to project directory
cd /workspace/client-agents/{jid}/{project}/backend

# LEVEL 1: SYNTAX TESTS (MUST PASS!)
python -c "
import ast, glob, sys
for pyfile in glob.glob('*.py'):
    try:
        with open(pyfile) as f: ast.parse(f.read())
        print(f'[PASS] {pyfile}')
    except SyntaxError as e:
        print(f'[FAIL] {pyfile}: {e}')
        sys.exit(1)
print('Level 1: ALL SYNTAX TESTS PASSED')
"

# LEVEL 2: IMPORT TESTS (MUST PASS!)
python -c "
import sys, importlib.util, glob
try:
    from agents import Agent, Runner
    print('[PASS] OpenAI Agents SDK imports')
except ImportError as e:
    print(f'[FAIL] SDK imports: {e}'); sys.exit(1)

for pyfile in glob.glob('*.py'):
    module_name = pyfile[:-3]
    try:
        spec = importlib.util.spec_from_file_location(module_name, pyfile)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        print(f'[PASS] {pyfile}')
    except Exception as e:
        print(f'[FAIL] {pyfile}: {e}'); sys.exit(1)
print('Level 2: ALL IMPORT TESTS PASSED')
"

# LEVEL 3: RUNTIME TESTS (SHOULD PASS!)
python -c "
from agents_config import agent
print(f'[PASS] Agent: {agent.name}')
print(f'[PASS] Tools: {len(agent.tools)} configured')
if hasattr(agent, 'handoffs') and agent.handoffs:
    print(f'[PASS] Handoffs: {[h.name for h in agent.handoffs]}')
print('Level 3: RUNTIME TESTS PASSED')
"

# LEVEL 4: INTEGRATION TEST (Server starts + health check)
timeout 10 python main.py &
sleep 5
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### ⛔ FORBIDDEN - DO NOT DO THIS:

```
❌ Write feature code first
❌ Write tests after code
❌ Skip test file creation
❌ Deliver without tests
❌ Deliver with failing tests
❌ Skip Level 1-2 tests (these BLOCK delivery!)
❌ Ignore Level 3-4 warnings
```

### ✅ REQUIRED - TDD WORKFLOW:

```
Step 1: WRITE TEST FILE FIRST
        ↓
Step 2: RUN TESTS (they will FAIL - this is expected!)
        ↓
Step 3: WRITE FEATURE CODE to make tests pass
        ↓
Step 4: RUN ALL 4 LEVELS OF TDD TESTS
        ↓
Step 5: If Level 1-2 fails → FIX CODE IMMEDIATELY (BLOCKS DELIVERY!)
        ↓
Step 6: If Level 3-4 fails → FIX CODE OR WARN CLIENT
        ↓
Step 7: ALL LEVEL 1-2 PASS? → Safe to DELIVER
```

### ⛔ DELIVERY BLOCKED IF:

```
Level 1 FAIL → STOP! Fix syntax errors before delivery
Level 2 FAIL → STOP! Fix import errors before delivery
Level 3 FAIL → WARNING! Fix runtime issues if possible
Level 4 FAIL → WARNING! Notify client of known issues
```

### ✅ ONLY DELIVER WHEN:

```
Level 1 PASS (100% REQUIRED)
Level 2 PASS (100% REQUIRED)
Level 3 PASS (recommended)
Level 4 PASS (recommended)
```

---

## MANDATORY WORKFLOW: TDD Development Process

### Step 0: ALWAYS Read Skills First

Before doing ANYTHING, call the Skill tool to read relevant skills:

```
For backend/agent work:
→ Skill: agent-builder
→ Skill: code-generation
→ Skill: chatkit-fastapi-backend

For frontend work:
→ Skill: nextjs-chatkit-ui
→ Skill: chatkit-react

For client communication:
→ Skill: client-communication
→ Skill: requirements-gathering
```

### Step 1: Check If Frontend Request

```
Call: is_frontend_request(request)
If true → Go to Frontend TDD Workflow
If false → Go to Backend TDD Workflow
```

---

## Backend TDD Workflow (MANDATORY)

### Phase 1: TEST FIRST (Red Phase)

```
1. Understand the feature requirement
2. CREATE TEST FILE FIRST: test_<feature_name>.py
3. Write test functions that define expected behavior
4. Run tests: pytest -v
5. Tests will FAIL (Red) - This is CORRECT and EXPECTED!
```

### Phase 2: WRITE CODE (Green Phase)

```
6. match_template(request) → Get template name
7. load_template(name) → Get template files
8. generate_from_template(name, variables) → Generate code
   (Note: IPC auto-runs Level 1-2 tests!)
9. Write feature code to make tests pass
10. Run tests: pytest -v
11. If tests FAIL → Fix code → Run tests again
12. Repeat until ALL tests PASS (Green)
```

### Phase 3: 4-LEVEL TDD VERIFICATION (MANDATORY!)

```
13. LEVEL 1: pytest -m level1 -v
    → Must ALL pass! (Blocks delivery if fail)

14. LEVEL 2: pytest -m level2 -v
    → Must ALL pass! (Blocks delivery if fail)

15. LEVEL 3: pytest -m level3 --use-sandbox -v
    → Should pass (Warn client if fail)

16. LEVEL 4: pytest -m level4 --use-sandbox -v
    → Recommended (Notify if integration issues)

17. If Level 1-2 fail → FIX CODE → Go to Step 13
18. If Level 3-4 fail → FIX OR WARN CLIENT
19. Only after Level 1-2 100% PASS → Deliver to client
```

### FOR MANUAL CODE (No Template): RUN THESE COMMANDS!

```bash
# LEVEL 1: Syntax (MUST PASS)
python -c "import ast,glob,sys; [print(f'[PASS] {f}') if not exec(ast.parse(open(f).read())) else 0 for f in glob.glob('*.py')]"

# LEVEL 2: Imports (MUST PASS)
python -c "from agents import Agent,Runner; print('[PASS] SDK imports')"
python -c "import agents_config; print(f'[PASS] Agent: {agents_config.agent.name}')"

# LEVEL 3: Runtime (SHOULD PASS)
python -c "from agents_config import agent; print(f'Tools: {len(agent.tools)}'); print(f'Handoffs: {[h.name for h in agent.handoffs] if agent.handoffs else \"none\"}')"

# LEVEL 4: Integration (RECOMMENDED)
timeout 10 python main.py &
sleep 5 && curl localhost:8000/health
```

### Backend Test File Structure:

```python
# test_<feature_name>.py
"""
Tests for <Feature Name>
TDD: Write this file BEFORE writing feature code!
"""

import pytest

# Test 1: Feature exists
def test_feature_exists():
    """Verify feature function/class exists"""
    pass

# Test 2: Feature works correctly
def test_feature_correct_behavior():
    """Verify feature produces correct output"""
    pass

# Test 3: Feature handles edge cases
def test_feature_edge_cases():
    """Verify feature handles edge cases"""
    pass

# Test 4: Feature handles errors
def test_feature_error_handling():
    """Verify feature handles errors gracefully"""
    pass
```

---

## Frontend TDD Workflow (MANDATORY)

### Phase 1: TEST FIRST (Red Phase)

```
1. Understand the feature requirement
2. CREATE TEST FILE FIRST: __tests__/<feature_name>.test.tsx
3. Write test functions that define expected behavior
4. Run tests: npm test
5. Tests will FAIL (Red) - This is CORRECT and EXPECTED!
```

### Phase 2: WRITE CODE (Green Phase)

```
6. match_frontend_template(request) → Get template name
7. load_frontend_template(name) → Get template files
8. generate_frontend_from_template(name, variables) → Generate code
   (Note: IPC auto-runs Level 1-2 tests!)
9. Write component code to make tests pass
10. Run tests: npm test
11. If tests FAIL → Fix code → Run tests again
12. Repeat until ALL tests PASS (Green)
```

### Phase 3: 4-LEVEL TDD VERIFICATION (MANDATORY!)

```
13. LEVEL 1: Syntax Check
    npx tsc --noEmit
    → Must pass! (Blocks delivery if fail)

14. LEVEL 2: Import Check
    npm test --passWithNoTests
    → Must pass! (Blocks delivery if fail)

15. LEVEL 3: Build Check (CRITICAL!)
    npm run build
    → Must succeed! (Blocks delivery if fail)

16. LEVEL 4: Integration Check
    npm run dev & sleep 5 && curl localhost:3000
    → Should work (Notify if issues)

17. If Level 1-3 fail → FIX CODE → Go to Step 13
18. If Level 4 fails → FIX OR WARN CLIENT
19. Only after Level 1-3 100% PASS → Deliver to client
```

### FOR MANUAL FRONTEND CODE: RUN THESE COMMANDS!

```bash
# LEVEL 1: TypeScript Syntax (MUST PASS)
npx tsc --noEmit

# LEVEL 2: Unit Tests (MUST PASS)
npm test

# LEVEL 3: Build (MUST PASS!)
npm run build

# LEVEL 4: Dev Server (RECOMMENDED)
npm run dev &
sleep 5 && curl localhost:3000
```

### Frontend Test File Structure:

```typescript
// __tests__/<feature_name>.test.tsx
/**
 * Tests for <Feature Name>
 * TDD: Write this file BEFORE writing component code!
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Test 1: Component renders
describe('<FeatureName>', () => {
  it('renders without crashing', () => {
    // Test implementation
  })

  it('displays correct content', () => {
    // Test implementation
  })

  it('handles user interaction', () => {
    // Test implementation
  })

  it('handles edge cases', () => {
    // Test implementation
  })
})
```

---

## ⛔ DELIVERY BLOCKED UNTIL ALL 4 LEVELS VERIFIED:

> **🤖 AUTOMATIC ENFORCEMENT**: The IPC `generate_from_template` now runs Level 1-2 tests automatically. If tests fail, the operation BLOCKS and returns an error.
>
> **For MANUAL code (existing project updates), YOU must run ALL 4 levels manually!**

```
┌─────────────────────────────────────────────────────────────────┐
│         DELIVERY REQUIREMENTS BY TDD LEVEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEVEL 1: SYNTAX (MUST PASS - BLOCKS DELIVERY!)                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │
│  ⛔ DO NOT DELIVER if Level 1 fails                             │
│  Backend: pytest -m level1 -v                                   │
│  Frontend: npx tsc --noEmit                                     │
│                                                                  │
│  LEVEL 2: IMPORTS (MUST PASS - BLOCKS DELIVERY!)               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │
│  ⛔ DO NOT DELIVER if Level 2 fails                             │
│  Backend: pytest -m level2 -v                                   │
│  Frontend: npm test                                             │
│                                                                  │
│  LEVEL 3: RUNTIME (SHOULD PASS - WARN CLIENT IF FAIL)          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │
│  ⚠️  Can deliver with warning if Level 3 fails                  │
│  Backend: pytest -m level3 --use-sandbox -v                     │
│  Frontend: npm run build                                        │
│                                                                  │
│  LEVEL 4: INTEGRATION (RECOMMENDED - NOTIFY ISSUES)            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │
│  ℹ️  Can deliver but notify client of known issues              │
│  Backend: pytest -m level4 --use-sandbox -v                     │
│  Frontend: npm run dev (server accessible?)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```
⛔ DO NOT DELIVER if:
- Level 1 (Syntax) fails
- Level 2 (Import) fails
- Test file does not exist for new features

⚠️ CAN DELIVER WITH WARNING if:
- Level 3 (Runtime) fails → Document known issues
- Level 4 (Integration) fails → Notify client

✅ SAFE TO DELIVER when:
- Level 1 100% PASS (syntax valid)
- Level 2 100% PASS (imports work)
- Level 3 passes (or documented warning)
- Level 4 passes (or notified issues)

🤖 AUTOMATIC CHECKS (Level 1-2):
- Level 1 (Syntax): Template variables substituted, valid Python syntax
- Level 2 (Import): SDK imports work, no ModuleNotFoundError
- If either fails → IPC returns error, code NOT delivered
```

---

## Final 4-Level TDD Verification Loop (MANDATORY!)

Before ANY delivery, run this complete 4-Level verification loop:

```
┌─────────────────────────────────────────────────────────────────┐
│           FINAL 4-LEVEL TDD VERIFICATION LOOP                    │
│           (MANDATORY FOR ALL CODE - NO EXCEPTIONS!)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEVEL 1: SYNTAX TESTS (BLOCKS DELIVERY IF FAIL!)              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
│  Backend: pytest -m level1 -v                                   │
│  Frontend: npx tsc --noEmit                                     │
│                          ↓                                       │
│  ALL PASS?  ↓ NO → FIX CODE → RETRY                            │
│             ↓ YES                                               │
│                                                                  │
│  LEVEL 2: IMPORT TESTS (BLOCKS DELIVERY IF FAIL!)              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
│  Backend: pytest -m level2 -v                                   │
│  Frontend: npm test                                             │
│                          ↓                                       │
│  ALL PASS?  ↓ NO → CHECK SKILLS → USE CONTEXT7 → FIX → RETRY   │
│             ↓ YES                                               │
│                                                                  │
│  LEVEL 3: RUNTIME TESTS (FIX IF POSSIBLE)                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
│  Backend: pytest -m level3 --use-sandbox -v                     │
│           python main.py (server starts?)                       │
│  Frontend: npm run build                                        │
│                          ↓                                       │
│  ALL PASS?  ↓ NO → FIX IF POSSIBLE → WARN CLIENT IF NOT        │
│             ↓ YES                                               │
│                                                                  │
│  LEVEL 4: INTEGRATION TESTS (NOTIFY IF ISSUES)                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
│  Backend: curl localhost:8000/health → {"status":"healthy"}    │
│           pytest -m level4 --use-sandbox -v                     │
│  Frontend: npm run dev → localhost:3000 accessible             │
│                          ↓                                       │
│  ALL PASS?  ↓ NO → NOTIFY CLIENT OF KNOWN ISSUES               │
│             ↓ YES                                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DELIVERY DECISION                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Level 1 PASS + Level 2 PASS → SAFE TO DELIVER            │   │
│  │ Level 3 FAIL → DELIVER WITH WARNING                      │   │
│  │ Level 4 FAIL → DELIVER BUT NOTIFY ISSUES                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Quick 4-Level TDD Commands (COPY-PASTE!):

**Backend - MANDATORY tests before delivery:**
```bash
# Level 1+2 (MUST PASS - BLOCKS DELIVERY!)
pytest -m "level1 or level2" -v

# Level 3+4 (SHOULD PASS - WARN IF FAIL)
pytest -m "level3 or level4" --use-sandbox -v

# Or run individually:
pytest -m level1 -v   # Syntax
pytest -m level2 -v   # Imports
pytest -m level3 --use-sandbox -v   # Runtime
pytest -m level4 --use-sandbox -v   # Integration
```

**Frontend - MANDATORY tests before delivery:**
```bash
# Level 1: TypeScript Syntax (MUST PASS!)
npx tsc --noEmit

# Level 2: Unit Tests (MUST PASS!)
npm test

# Level 3: Build (SHOULD PASS!)
npm run build

# Level 4: Dev Server (RECOMMENDED)
npm run dev &
sleep 5 && curl localhost:3000
```

---

## ⛔⛔⛔ CHATKIT BACKEND - EXACT CODE YOU MUST USE ⛔⛔⛔

### YOUR TRAINING DATA IS WRONG! These are INCORRECT:

```python
# ❌❌❌ FORBIDDEN - FROM YOUR OUTDATED TRAINING! ❌❌❌

from chatkit.stores import Store      # ❌ WRONG! (stores plural)
from chatkit.types import AttachmentItem  # ❌ WRONG!
from chatkit.types import ContentItem  # ❌ WRONG! Doesn't exist

# ❌ WRONG - Missing context parameter
async def load_thread(self, thread_id: str) -> ThreadMetadata:
async def save_thread(self, thread: ThreadMetadata) -> None:

# ❌ WRONG - Wrong Page format
return Page(items=data, has_more=True)
```

### ✅ CORRECT CODE - COPY EXACTLY:

```python
# ✅✅✅ CORRECT IMPORTS - USE EXACTLY AS SHOWN ✅✅✅

from chatkit.store import Store, NotFoundError  # SINGULAR! Not stores!
from chatkit.types import ThreadMetadata, ThreadItem, Page, Attachment  # Not AttachmentItem!
```

### ✅ CORRECT Store Implementation - ALL methods need context: dict:

```python
class InMemoryStore(Store[dict]):
    """MANDATORY: Generic type [dict] required!"""

    async def load_thread(self, thread_id: str, context: dict) -> ThreadMetadata:
        # context: dict is MANDATORY on ALL methods
        pass

    async def save_thread(self, thread: ThreadMetadata, context: dict) -> None:
        pass

    async def load_threads(
        self,
        limit: int,
        after: Optional[str],
        order: str,
        context: dict  # MANDATORY!
    ) -> Page[ThreadMetadata]:
        # Return format: Page(data=..., has_more=..., after=...)
        pass

    async def load_thread_items(
        self,
        thread_id: str,
        after: Optional[str],
        limit: int,
        order: str,
        context: dict  # MANDATORY!
    ) -> Page[ThreadItem]:
        pass

    async def add_thread_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        pass

    async def delete_thread_item(self, thread_id: str, item_id: str, context: dict) -> None:
        pass

    async def load_attachment(self, attachment_id: str, context: dict) -> Attachment:
        pass

    async def save_attachment(self, attachment: Attachment, context: dict) -> None:
        pass

    async def delete_attachment(self, attachment_id: str, context: dict) -> None:
        pass

    async def delete_thread(self, thread_id: str, context: dict) -> None:
        pass

    async def load_item(self, thread_id: str, item_id: str, context: dict) -> ThreadItem:
        pass

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict) -> None:
        pass
```

### ✅ CORRECT ChatKitServer respond() signature:

```python
async def respond(
    self,
    thread: ThreadMetadata,
    input_user_message: UserMessageItem | None,
    context: dict,  # MANDATORY!
) -> AsyncIterator[ThreadStreamEvent]:
    pass
```

---

## ⛔⛔⛔ CHATKIT FRONTEND - EXACT CODE YOU MUST USE ⛔⛔⛔

### YOUR TRAINING DATA IS WRONG! These are INCORRECT:

```tsx
// ❌❌❌ FORBIDDEN - FROM YOUR OUTDATED TRAINING! ❌❌❌

import { ChatKit, useChatKit } from '@openai/chatkit-react'  // ❌ WRONG!
<Script src="..." onLoad={() => setLoaded(true)} />          // ❌ WRONG! Causes error!
window.ChatKit                                                // ❌ WRONG!
```

### ✅ CORRECT: CDN Web Component Approach

**layout.tsx - MUST have this EXACT structure:**

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* MANDATORY: ChatKit CDN Script */}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="beforeInteractive"
        />
        {/* NO onLoad! NO onReady! Just strategy="beforeInteractive" */}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**ChatWidget.tsx - MUST use web component:**

```tsx
'use client'  // MANDATORY for any component with useState/useEffect/onClick

import { useState, useEffect, useRef } from 'react'

interface ChatKitElement extends HTMLElement {
  setOptions: (options: any) => void
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChatKitLoaded, setIsChatKitLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  // Check for CDN web component
  useEffect(() => {
    const checkChatKit = () => {
      if (typeof window !== 'undefined' && window.customElements?.get('openai-chatkit')) {
        setIsChatKitLoaded(true)
      }
    }
    checkChatKit()
    const interval = setInterval(checkChatKit, 500)
    return () => clearInterval(interval)
  }, [])

  // Initialize ChatKit element
  useEffect(() => {
    if (isChatKitLoaded && !isInitialized.current && containerRef.current) {
      const chatkit = document.createElement('openai-chatkit') as ChatKitElement
      chatkit.style.width = '100%'
      chatkit.style.height = '100%'
      containerRef.current.appendChild(chatkit)
      isInitialized.current = true

      setTimeout(() => {
        if (chatkit.setOptions) {
          chatkit.setOptions({
            api: {
              domainKey: 'local-dev',
              url: process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit',
              fetch: async (url: string, init?: RequestInit) => window.fetch(url, init)
            }
          })
        }
      }, 100)
    }
  }, [isChatKitLoaded])

  // Toggle visibility
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.display = isOpen ? 'block' : 'none'
    }
  }, [isOpen])

  return (
    <>
      <div ref={containerRef} className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50" style={{ display: 'none' }} />
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full z-50">
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  )
}
```

**package.json - NO ChatKit npm package:**

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**NO `@openai/chatkit-react` in dependencies!**

---

## Context7: How to Use for Documentation

### Before ANY code generation, verify with Context7:

```
# Step 1: Resolve library ID
mcp__context7__resolve-library-id("openai-chatkit", "Store interface methods")
mcp__context7__resolve-library-id("openai-agents", "Agent class usage")

# Step 2: Query documentation
mcp__context7__query-docs("/openai/openai-agents-python", "how to create Agent with tools")
mcp__context7__query-docs("/websites/openai_github_io_chatkit-python", "Store interface methods")
```

### Common Library IDs:

| Library | Context7 ID |
|---------|-------------|
| OpenAI Agents SDK | `/openai/openai-agents-python` |
| ChatKit Python | `/websites/openai_github_io_chatkit-python` |
| FastAPI | `/tiangolo/fastapi` |
| Next.js | `/vercel/next.js` |

---

## Templates Available

### Backend Templates:

| Template | Use For | Keywords |
|----------|---------|----------|
| `basic-chatbot` | Simple FAQ, chatbot, assistant | chatbot, faq, assistant |
| `customer-support` | Multi-agent support system | support, customer, help |
| `data-processor` | ETL, validation pipelines | data, process, etl |
| `multi-agent-system` | Orchestrator + specialists | workflow, orchestrator |
| `rag-assistant` | Document search, knowledge base | rag, knowledge, document |
| `task-automation` | Scheduled tasks, batch processing | automate, task, schedule |

### Frontend Templates:

| Template | Use For | Keywords |
|----------|---------|----------|
| `nextjs-chatkit-ui` | Full website with chat widget | website, frontend, nextjs |

---

## Self-Check Before Delivery (MANDATORY)

### Backend Checklist:

- [ ] Did I write test file FIRST (TDD)?
- [ ] Does test file exist: `test_<feature>.py`?
- [ ] Did I run `pytest -v`?
- [ ] Do ALL tests pass?
- [ ] Did I use `generate_from_template` IPC tool?
- [ ] Is store.py class `InMemoryStore(Store[dict])`?
- [ ] Do ALL store methods have `context: dict` as LAST parameter?
- [ ] Is import `from chatkit.store import Store` (SINGULAR)?
- [ ] Is Page return format `Page(data=..., has_more=..., after=...)`?
- [ ] Did server start without errors?
- [ ] Did health endpoint return `{"status": "healthy"}`?

### Frontend Checklist:

- [ ] Did I write test file FIRST (TDD)?
- [ ] Does test file exist: `__tests__/<feature>.test.tsx`?
- [ ] Did I run `npm test`?
- [ ] Do ALL tests pass?
- [ ] Did I use `generate_frontend_from_template` IPC tool?
- [ ] Is layout.tsx using `strategy="beforeInteractive"` (NO onLoad)?
- [ ] Is ChatWidget.tsx using `document.createElement('openai-chatkit')`?
- [ ] Does package.json NOT contain `@openai/chatkit-react`?
- [ ] Did `npm run build` succeed?

---

## Dependencies (Reference)

### Backend:

```
openai-agents>=0.7.0
openai-chatkit>=1.5.0
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
httpx>=0.27.0
pydantic>=2.0.0
python-dotenv>=1.0.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

**pip package name is `openai-chatkit` (NOT `chatkit-python`)**

### Frontend:

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  }
}
```

**NO `@openai/chatkit-react` - ChatKit loads from CDN!**

---

## Final Warning

```
⛔⛔⛔ YOUR TRAINING DATA WILL CAUSE PRODUCTION ERRORS! ⛔⛔⛔

If you write ChatKit or OpenAI Agents SDK code from memory:
- Import paths will be WRONG
- Method signatures will be WRONG
- Code will NOT work
- Client will receive BROKEN code

⛔⛔⛔ TDD IS MANDATORY! ⛔⛔⛔

If you skip TDD:
- You will deliver untested code
- Bugs will reach production
- Client will receive BROKEN code

ALWAYS:
1. Read Skills FIRST
2. Write TEST FILE FIRST (TDD!)
3. Run tests (expect FAIL)
4. Write feature code
5. Run tests until ALL PASS
6. Use Templates via IPC
7. Verify with Context7
8. Final verification loop
9. Only then DELIVER

NEVER:
- Write code from memory
- Write feature code before tests
- Guess import paths
- Skip verification
- Deliver with failing tests
- Deliver untested code
```
