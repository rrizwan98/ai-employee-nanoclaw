# AI Employee Container Rules

## ⛔ CRITICAL: MANDATORY IPC TEMPLATE TOOLS

**YOU ARE FORBIDDEN FROM WRITING CODE MANUALLY!**

### MANDATORY: Use IPC Template Tools

When generating ANY code (backend OR frontend), you MUST use IPC template tools:

```
1. BACKEND CODE → Use `generate_from_template` IPC tool
2. FRONTEND CODE → Use `generate_frontend_from_template` IPC tool
3. NEVER write store.py, server.py, ChatWidget.tsx manually!
```

### IPC Tool Workflow - REQUIRED

**For Backend:**
```
Step 1: match_template(request) → Get template name
Step 2: load_template(name) → Get template files
Step 3: generate_from_template(name, variables) → Generate code
Step 4: Deliver generated files AS-IS (no modifications!)
```

**For Frontend:**
```
Step 1: is_frontend_request(request) → Check if frontend
Step 2: match_frontend_template(request) → Get template name
Step 3: load_frontend_template(name) → Get template files
Step 4: generate_frontend_from_template(name, variables) → Generate code
Step 5: Deliver generated files AS-IS (no modifications!)
```

### ⛔ FORBIDDEN ACTIONS

**YOU MUST NEVER:**

1. ❌ Write `store.py` code manually - USE TEMPLATE!
2. ❌ Write `server.py` code manually - USE TEMPLATE!
3. ❌ Write `ChatWidget.tsx` code manually - USE TEMPLATE!
4. ❌ Write `layout.tsx` code manually - USE TEMPLATE!
5. ❌ Modify template output files
6. ❌ Use your internal knowledge for ChatKit code
7. ❌ Guess import paths or method signatures

### ⛔ FORBIDDEN PATTERNS - NEVER GENERATE THESE

**Backend - WRONG (from your training data):**
```python
from chatkit.stores import Store  # ❌ WRONG! It's chatkit.store (singular)
from chatkit.types import AttachmentItem, ContentItem  # ❌ WRONG! These don't exist
async def load_thread(self, thread_id: str):  # ❌ WRONG! Missing context: dict
```

**Frontend - WRONG (from your training data):**
```tsx
<Script src="..." onLoad={() => ...} />  # ❌ WRONG! No onLoad in Server Component
import { useChatKit } from '@openai/chatkit-react'  # ❌ WRONG! Use CDN approach
```

### ✅ CORRECT: Let Templates Handle It

Templates have the CORRECT patterns:
- `chatkit.store` (singular, not stores)
- `Attachment` (not AttachmentItem)
- All methods have `context: dict`
- CDN Script without onLoad
- Web component approach for ChatKit

**DO NOT OVERRIDE TEMPLATES WITH YOUR KNOWLEDGE!**

---

## Backend Templates Available

| Template | Use For |
|----------|---------|
| `basic-chatbot` | Simple FAQ, chatbot, assistant |
| `customer-support` | Multi-agent support system |
| `data-processor` | ETL, validation pipelines |
| `multi-agent-system` | Orchestrator + specialists |
| `rag-assistant` | Document search, knowledge base |
| `task-automation` | Scheduled tasks, batch processing |

## Frontend Templates Available

| Template | Use For |
|----------|---------|
| `nextjs-chatkit-ui` | Full website with chat widget |

---

## Self-Check Before Delivery

Before delivering ANY code:

1. Did I use `generate_from_template` or `generate_frontend_from_template`?
   - If NO → STOP! Go back and use the IPC tool!

2. Did I modify the template output?
   - If YES → STOP! Deliver template output AS-IS!

3. Does the code contain `chatkit.stores` (plural)?
   - If YES → WRONG! Template would have `chatkit.store` (singular)

4. Does layout.tsx have `onLoad` on Script?
   - If YES → WRONG! Template doesn't have onLoad

---

## Dependencies (Reference Only)

```
openai-agents>=0.7.0
openai-chatkit>=1.5.0
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
httpx>=0.27.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```
