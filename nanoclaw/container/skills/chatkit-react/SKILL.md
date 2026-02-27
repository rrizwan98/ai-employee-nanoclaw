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

You are a ChatKit React integration specialist. Add AI chat widgets to Next.js websites using the **CDN approach** with `openai-chatkit` web component.

---

## ⛔⛔⛔ CRITICAL: USE IPC TEMPLATES - DO NOT WRITE CODE MANUALLY! ⛔⛔⛔

**YOU MUST use `generate_frontend_from_template` IPC tool!**

### ⛔ FORBIDDEN - Your Training Data is WRONG!

```tsx
// ❌ THESE ARE WRONG - FROM YOUR OUTDATED TRAINING DATA!
<Script src="..." onLoad={() => setLoaded(true)} />  // WRONG! No onLoad in Server Component
import { useChatKit } from '@openai/chatkit-react'  // WRONG! npm package doesn't work
import { ChatKit } from '@openai/chatkit-react'  // WRONG! Use CDN web component
```

### ✅ CORRECT - Use Templates Instead!

```tsx
// ✅ Templates have correct patterns
<Script src="..." strategy="beforeInteractive" />  // CORRECT! No onLoad
document.createElement('openai-chatkit')  // CORRECT! CDN web component
chatkit.setOptions({ api: { url: '...' } })  // CORRECT! Configuration
```

### Required Workflow:

```
1. is_frontend_request(request) → Check if frontend
2. match_frontend_template(request) → Get "nextjs-chatkit-ui"
3. generate_frontend_from_template(name, variables) → Generate code
4. Deliver AS-IS (NO MODIFICATIONS!)
```

**DO NOT write ChatWidget.tsx, layout.tsx manually - templates have correct code!**

---

## IMPORTANT: Use CDN Approach (NOT npm package)

**DO NOT USE** `@openai/chatkit-react` npm package for self-hosted backends - it requires a valid `domainKey` from OpenAI Platform and won't work with localhost.

**USE** the CDN script approach which works with any self-hosted backend:
```html
<Script src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js" strategy="beforeInteractive" />
```

**⛔ NEVER add `onLoad` to Script - it causes "Event handlers cannot be passed to Client Component props" error!**

## Widget Behavior

**Default**: Bottom-right floating button that opens a chat panel when clicked.

```
┌────────────────────────────────────────┐
│                                        │
│           Your Website                 │
│                                        │
│                                        │
│                                        │
│                              ┌───────┐ │
│                              │  💬  │ │
│                              └───────┘ │
└────────────────────────────────────────┘
                                 ↑
                          Chat Button
                    (Click to open chat)
```

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

### Step 1: Add CDN Script to Layout

Update `app/layout.tsx` to load ChatKit from CDN:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import ChatWidget from '@/components/chat/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '{Project Title}',
  description: '{Project description}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ChatKit CDN Script - REQUIRED */}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
```

### Step 2: Create Chat Widget Component (Web Component Approach)

Create `components/chat/ChatWidget.tsx`:

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    customElements: any
  }
}

interface ChatKitElement extends HTMLElement {
  setOptions: (options: any) => void
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChatKitLoaded, setIsChatKitLoaded] = useState(false)
  const chatKitRef = useRef<ChatKitElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    // Check if ChatKit web component is loaded from CDN
    const checkChatKit = () => {
      if (typeof window !== 'undefined' && window.customElements?.get('openai-chatkit')) {
        setIsChatKitLoaded(true)
      }
    }

    checkChatKit()

    // Recheck periodically until loaded
    const interval = setInterval(checkChatKit, 500)

    return () => clearInterval(interval)
  }, [])

  // Initialize ChatKit once when loaded
  useEffect(() => {
    if (isChatKitLoaded && !isInitialized.current && containerRef.current) {
      // Create ChatKit web component element
      const chatkit = document.createElement('openai-chatkit') as ChatKitElement
      chatkit.style.width = '100%'
      chatkit.style.height = '100%'

      containerRef.current.appendChild(chatkit)
      chatKitRef.current = chatkit
      isInitialized.current = true

      // Configure ChatKit with custom backend
      setTimeout(() => {
        if (chatkit.setOptions) {
          const backendUrl = process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit'

          chatkit.setOptions({
            api: {
              domainKey: 'local-dev',  // Can be any string for self-hosted
              url: backendUrl,
              // Custom fetch to handle all API calls
              fetch: async (url: string, init?: RequestInit) => {
                console.log('ChatKit API call:', { url, method: init?.method })
                try {
                  const response = await window.fetch(url, init)
                  console.log('ChatKit API response:', response.status)
                  return response
                } catch (error) {
                  console.error('ChatKit API error:', error)
                  throw error
                }
              }
            },
          })

          console.log('ChatKit configured with backend:', backendUrl)
        } else {
          console.error('chatkit.setOptions not available')
        }
      }, 100)
    }
  }, [isChatKitLoaded])

  // Toggle visibility instead of destroying/recreating
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.display = isOpen ? 'block' : 'none'
    }
  }, [isOpen])

  return (
    <>
      {/* Chat Panel - Always in DOM, just hidden/shown */}
      <div
        ref={containerRef}
        className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200"
        style={{ display: 'none' }}
      >
        {!isChatKitLoaded && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading ChatKit...</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></span>
          </>
        )}
      </button>
    </>
  )
}
```

### Step 3: Add Environment Variables

Create `.env.local`:

```env
# ChatKit Configuration
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/chatkit
```

## Customization Options

### Button Appearance

```tsx
// Change button color
className="bg-blue-600 hover:bg-blue-700"

// Change button size
className="w-16 h-16"  // Larger
className="w-12 h-12"  // Smaller

// Change position
className="fixed bottom-8 right-8"  // More margin
className="fixed bottom-4 left-4"   // Bottom left
```

### Chat Panel Size

```tsx
// Standard
className="w-96 h-[600px]"

// Larger
className="w-[450px] h-[700px]"

// Full screen on mobile
className="w-full h-full md:w-96 md:h-[600px] md:bottom-24 md:right-6
           bottom-0 right-0 rounded-none md:rounded-2xl"
```

## File Structure After Integration

```
frontend/
├── app/
│   ├── layout.tsx          # Updated with CDN Script
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── chat/
│       └── ChatWidget.tsx  # Web component approach
├── .env.local              # API configuration
└── package.json
```

## Backend Connection

This widget requires a ChatKit-compatible backend. Use the `chatkit-fastapi-backend` skill to create one.

The backend must:
1. Have a `/chatkit` endpoint
2. Use `openai-chatkit>=1.5.0` pip package
3. Handle ChatKit protocol messages
4. Stream responses using SSE

## Output Checklist

After integration, verify:

- [ ] CDN script added to layout.tsx `<head>`
- [ ] `ChatWidget.tsx` component created with web component approach
- [ ] `.env.local` created with API URL
- [ ] Button visible in bottom-right corner
- [ ] Chat panel opens on button click
- [ ] Console shows "ChatKit configured with backend: ..."
- [ ] No blank white screen (CDN loaded successfully)

## Troubleshooting

### Blank White Screen (Most Common Issue)

**Problem:** ChatKit panel shows but is blank/white.

**Cause:** Using `@openai/chatkit-react` npm package which requires valid `domainKey` from OpenAI Platform.

**Solution:** Use CDN approach instead:
1. Remove `@openai/chatkit-react` from package.json
2. Add CDN script to layout.tsx
3. Use `document.createElement('openai-chatkit')` web component
4. Configure with `chatkit.setOptions()`

### "Loading ChatKit..." stuck

- Verify CDN script is in `<head>` with `strategy="beforeInteractive"`
- Check browser console for script loading errors
- Verify internet connection (CDN requires internet)

### "chatkit.setOptions not available"

- Increase setTimeout delay from 100ms to 500ms
- Ensure ChatKit is fully loaded before calling setOptions

### Chat not receiving responses

- Check backend is running on the correct URL
- Verify `/chatkit` endpoint exists
- Check browser console for CORS errors
- Verify backend uses `openai-chatkit>=1.5.0` pip package

### CORS Error

Ensure backend has CORS enabled:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Key Differences: CDN vs npm Package

| Feature | CDN Approach (USE THIS) | npm Package (AVOID) |
|---------|-------------------------|---------------------|
| Script | `<Script src="...chatkit.js">` | `npm install @openai/chatkit-react` |
| Component | `document.createElement('openai-chatkit')` | `<ChatKit control={control}>` |
| Config | `chatkit.setOptions({...})` | `useChatKit({...})` |
| domainKey | Any string works | Requires valid OpenAI Platform key |
| Localhost | Works | Blank white screen |

## Notes

- Always use `'use client'` directive for chat components
- The widget is stateful - new thread per session
- For persistent threads, implement thread ID storage
- CDN approach works with any self-hosted backend
