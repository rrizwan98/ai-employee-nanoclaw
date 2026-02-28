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

3. CONTEXT7 (MCP Server)
   → USE context7_resolve_library to find library IDs
   → USE context7_query_docs for latest documentation
   → QUERY before generating any SDK code
```

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
✅ Run tests → Must ALL pass before delivery
✅ Deliver template output AS-IS
```

---

## ⛔⛔⛔ TDD (TEST DRIVEN DEVELOPMENT) - MANDATORY! ⛔⛔⛔

**YOU MUST FOLLOW TDD APPROACH FOR ALL DEVELOPMENT!**

TDD means: **Write Tests FIRST, Then Write Code**

### ⛔ FORBIDDEN - DO NOT DO THIS:

```
❌ Write feature code first
❌ Write tests after code
❌ Skip test file creation
❌ Deliver without tests
❌ Deliver with failing tests
```

### ✅ REQUIRED - TDD WORKFLOW:

```
Step 1: WRITE TEST FILE FIRST
        ↓
Step 2: RUN TESTS (they will FAIL - this is expected!)
        ↓
Step 3: WRITE FEATURE CODE to make tests pass
        ↓
Step 4: RUN TESTS AGAIN
        ↓
Step 5: If ANY test fails → FIX CODE → Go to Step 4
        ↓
Step 6: ALL TESTS PASS? → Only then DELIVER
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
9. Write feature code to make tests pass
10. Run tests: pytest -v
11. If tests FAIL → Fix code → Run tests again
12. Repeat until ALL tests PASS (Green)
```

### Phase 3: VERIFY (Final Check)

```
13. Run ALL tests one final time: pytest -v
14. Start server: python main.py
15. Test health: curl localhost:8000/health
16. If ANY error → Fix → Re-test from Step 13
17. Only after ALL pass → Deliver to client
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
9. Write component code to make tests pass
10. Run tests: npm test
11. If tests FAIL → Fix code → Run tests again
12. Repeat until ALL tests PASS (Green)
```

### Phase 3: VERIFY (Final Check)

```
13. Run ALL tests one final time: npm test
14. Build project: npm run build
15. If ANY error → Fix → Re-test from Step 13
16. Only after ALL pass → Deliver to client
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

## ⛔ DELIVERY BLOCKED UNTIL:

```
⛔ DO NOT DELIVER if:
- Test file does not exist
- Any test is failing
- pytest/npm test has errors
- Build has errors
- Health endpoint fails

✅ ONLY DELIVER when:
- Test file exists for every new feature
- ALL tests pass (pytest -v shows all green)
- Build succeeds (npm run build)
- Health endpoint returns {"status": "healthy"}
```

---

## Final Verification Loop (MANDATORY)

Before ANY delivery, run this loop:

```
┌─────────────────────────────────────────────────────────────┐
│                   FINAL VERIFICATION LOOP                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Run: pytest -v (backend) OR npm test (frontend)         │
│                          ↓                                   │
│  2. Check: ALL tests pass?                                  │
│         ↓ NO                    ↓ YES                       │
│  ┌──────────────┐        ┌──────────────┐                   │
│  │ READ ERROR   │        │ CONTINUE     │                   │
│  │ CHECK SKILLS │        │ TO STEP 3    │                   │
│  │ USE CONTEXT7 │        └──────────────┘                   │
│  │ FIX CODE     │               ↓                           │
│  │ GO TO STEP 1 │        3. Run: python main.py / npm build │
│  └──────────────┘               ↓                           │
│                          4. Check: Build successful?        │
│                               ↓ NO        ↓ YES             │
│                          ┌──────────┐  ┌──────────┐         │
│                          │ FIX CODE │  │ CONTINUE │         │
│                          │ GO TO 1  │  │ TO STEP 5│         │
│                          └──────────┘  └──────────┘         │
│                                              ↓              │
│                          5. Test: curl health endpoint      │
│                               ↓ FAIL      ↓ PASS            │
│                          ┌──────────┐  ┌──────────┐         │
│                          │ FIX CODE │  │ ✅ READY │         │
│                          │ GO TO 1  │  │ DELIVER! │         │
│                          └──────────┘  └──────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
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
