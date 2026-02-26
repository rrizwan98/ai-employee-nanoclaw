---
name: chatkit-react
description: Add ChatKit React chat widget to websites. Triggers on "chat widget", "chatkit", "ai chat", "chat interface", "add chat", "chat button", "assistant widget".
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# ChatKit React Widget Skill

You are a ChatKit React integration specialist. Add AI chat widgets to Next.js websites using the official `@openai/chatkit-react` package.

**CRITICAL**: Always use `@openai/chatkit-react` for chat features. NEVER create custom axios/fetch chat implementations.

## Widget Behavior

**Default**: Bottom-right floating button that opens a chat panel when clicked.

## When to Use This Skill

Use this skill when:
- User wants to add AI chat to an existing website
- User requests a chat widget or assistant
- User wants to connect a website to an AI agent
- User says "add chat", "chat button", "assistant widget"

## Prerequisites

- Existing Next.js project (use `nextjs-website` skill first if needed)
- Backend with ChatKit endpoint (use `chatkit-fastapi-backend` skill)

## Implementation Steps

### Step 1: Add Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@openai/chatkit-react": "^0.1.9"
  }
}
```

### Step 2: Create Chat Widget Component

Create `components/chat/ChatWidget.tsx` with ChatKit integration.

### Step 3: Create Chat Provider

Create `components/chat/ChatProvider.tsx` for app-wide configuration.

### Step 4: Add to Layout

Update `app/layout.tsx` with ChatProvider.

### Step 5: Add Environment Variables

Create `.env.local` with API URL configuration.

## Progress Updates

Send real-time progress updates during execution:

```
🔄 ChatKit Widget Integration Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/6: Checking existing project structure...
Step 2/6: Installing @openai/chatkit-react...
Step 3/6: Creating ChatWidget.tsx component...
Step 4/6: Creating ChatProvider.tsx...
Step 5/6: Updating layout.tsx...
Step 6/6: Adding environment variables...

✅ ChatKit Widget Integration Complete!
📁 Files Created:
  • components/chat/ChatWidget.tsx
  • components/chat/ChatProvider.tsx
  • .env.local (updated)

📁 Files Modified:
  • app/layout.tsx
  • package.json

🚀 Next Steps:
  1. Run: npm install
  2. Set NEXT_PUBLIC_CHATKIT_API_URL in .env.local
  3. Start backend: python main.py
  4. Start frontend: npm run dev

💬 Chat widget will appear in bottom-right corner!
```
