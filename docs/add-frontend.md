acha mujy aik or functionality add krni hy is mai mujy btao k mujy yia skills k through krna chyia yia templete k through? mai chahata hon k 
ai-employee k pass frontend ki bhi power ho agr user boly k mujy is agent k lyia frontend design krwana h tu yia agent user ko frontend bna k day         
nextjs mai or sath hr is mai openai chatkit ka use kr k agent ko frontend k sath connect kr day ku k fast api allready build kr rhy hyn hum. bs ab is     
ko frontend k sath connect krna h. tu ab tum mujy btao k hum si ko kis tarans ay add kryn? srif btao kuch update nh krna h. 

● Analysis: Skill vs Template?

  Is case mein DONO chahiye:

  | Component           | Type           | Purpose                                      |
  |---------------------|----------------|----------------------------------------------|
  | frontend-generation | Skill (NEW)    | AI Employee ko frontend banane ki capability |
  | nextjs-chatkit-ui/  | Template (NEW) | Pre-built frontend code structure            |

  ---
  Why Both?

  Skill Needed:

  AI Employee ko SEEKHNA hai:
  - Next.js project structure
  - OpenAI ChatKit integration
  - FastAPI backend se connect karna
  - UI/UX best practices

  Template Needed:

  Pre-built code structure:
  - Next.js boilerplate
  - ChatKit components
  - API integration code
  - Styling (Tailwind/etc)

  ---
  Recommended Approach

  Step 1: New Skill - frontend-generation

  nanoclaw/container/skills/
  ├── agent-builder/
  ├── client-communication/
  ├── requirements-gathering/
  ├── code-generation/
  ├── agent-browser/
  └── frontend-generation/     ← NEW SKILL
      └── SKILL.md

  Skill will teach AI Employee:
  - Next.js project create karna
  - OpenAI ChatKit setup
  - FastAPI endpoint connect karna
  - Chat UI components
  - Responsive design

  Step 2: New Template - nextjs-chatkit-ui

  templates/
  ├── basic-chatbot/
  ├── customer-support/
  └── nextjs-chatkit-ui/       ← NEW TEMPLATE
      ├── app/
      ├── components/
      ├── lib/
      ├── package.json
      └── README.md

  ---
  Flow After Implementation

  Client: "Mujhe frontend bhi chahiye agent ke liye"

  AI Employee:
  1. code-generation skill → FastAPI backend ✅ (already doing)
  2. frontend-generation skill → Next.js + ChatKit
  3. nextjs-chatkit-ui template → Pre-built structure use
  4. Customize for client's agent
  5. GitHub push (both backend + frontend)
  6. Client ko complete full-stack solution

  ---
  What OpenAI ChatKit Provides

  - Pre-built chat components
  - Message bubbles
  - Input field
  - Streaming support
  - Agent integration hooks

  Integration Pattern:
  Next.js Frontend (ChatKit)
          ↓ API calls
  FastAPI Backend
          ↓ Agent SDK
  OpenAI Agents (already generated)

  ---
  Summary

  | Add Kya             | Type     | File Location                       |
  |---------------------|----------|-------------------------------------|
  | frontend-generation | Skill    | skills/frontend-generation/SKILL.md |
  | nextjs-chatkit-ui   | Template | templates/nextjs-chatkit-ui/        |

  Skill = Capability (AI Employee ko sikhana)
  Template = Code (Client ko dena)

  Dono saath mein kaam karenge - skill decide karega kaise banana hai, template base code provide karega.