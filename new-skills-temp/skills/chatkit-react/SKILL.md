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

### Step 1: Add Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@openai/chatkit-react": "^0.1.9"
  }
}
```

Then run:
```bash
npm install @openai/chatkit-react
```

### Step 2: Create Chat Widget Component

Create `components/chat/ChatWidget.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';

interface ChatWidgetProps {
  apiUrl?: string;
  domainKey?: string;
}

export default function ChatWidget({
  apiUrl = 'http://localhost:8000/chatkit',
  domainKey = 'local-dev'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { control } = useChatKit({
    api: {
      url: apiUrl,
      domainKey: domainKey,
    },
  });

  return (
    <>
      {/* Chat Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700
                   text-white rounded-full shadow-lg flex items-center justify-center
                   transition-all duration-200 z-50 hover:scale-105"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white
                        rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-40
                        animate-in slide-in-from-bottom-4 duration-200">
          <ChatKit
            control={control}
            className="h-full w-full"
          />
        </div>
      )}
    </>
  );
}
```

### Step 3: Create Chat Provider (Optional)

For app-wide configuration, create `components/chat/ChatProvider.tsx`:

```tsx
'use client';

import { ReactNode } from 'react';
import ChatWidget from './ChatWidget';

interface ChatProviderProps {
  children: ReactNode;
  apiUrl?: string;
  domainKey?: string;
  enabled?: boolean;
}

export default function ChatProvider({
  children,
  apiUrl,
  domainKey,
  enabled = true
}: ChatProviderProps) {
  return (
    <>
      {children}
      {enabled && (
        <ChatWidget
          apiUrl={apiUrl || process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit'}
          domainKey={domainKey || process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'local-dev'}
        />
      )}
    </>
  );
}
```

### Step 4: Add to Layout

Update `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ChatProvider from '@/components/chat/ChatProvider';

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
      <body className={inter.className}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
```

### Step 5: Add Environment Variables

Create `.env.local`:

```env
# ChatKit Configuration
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/chatkit
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=local-dev
```

### Step 6: Add Animation Styles (Optional)

Add to `globals.css`:

```css
/* Chat Widget Animations */
@keyframes slide-in-from-bottom {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-in {
  animation: slide-in-from-bottom 0.2s ease-out;
}

.slide-in-from-bottom-4 {
  --tw-enter-translate-y: 1rem;
}
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
className="w-[380px] h-[600px]"

// Larger
className="w-[450px] h-[700px]"

// Full screen on mobile
className="w-full h-full md:w-[380px] md:h-[600px] md:bottom-24 md:right-6
           bottom-0 right-0 rounded-none md:rounded-2xl"
```

### Custom Button Icon

```tsx
// Use emoji
<button>{isOpen ? '✕' : '💬'}</button>

// Use custom SVG
<button>
  <img src="/chat-icon.svg" alt="Chat" className="w-6 h-6" />
</button>

// Use Heroicons or other icon libraries
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
<button><ChatBubbleLeftRightIcon className="w-6 h-6" /></button>
```

## Mobile Responsiveness

For full-screen chat on mobile:

```tsx
{isOpen && (
  <div className="fixed z-40
                  /* Mobile: Full screen */
                  inset-0
                  /* Desktop: Bottom right panel */
                  md:inset-auto md:bottom-24 md:right-6
                  md:w-[380px] md:h-[600px] md:rounded-2xl
                  bg-white shadow-2xl border border-gray-200 overflow-hidden">
    <ChatKit control={control} className="h-full w-full" />
  </div>
)}
```

## File Structure After Integration

```
frontend/
├── app/
│   ├── layout.tsx          # Updated with ChatProvider
│   ├── page.tsx
│   └── globals.css         # Updated with animations
├── components/
│   ├── chat/
│   │   ├── ChatWidget.tsx  # NEW: Chat button + panel
│   │   └── ChatProvider.tsx # NEW: App-wide provider
│   └── ...existing components
├── .env.local              # NEW: API configuration
└── package.json            # Updated with @openai/chatkit-react
```

## Backend Connection

This widget requires a ChatKit-compatible backend. Use the `chatkit-fastapi-backend` skill to create one.

The backend must:
1. Have a `/chatkit` endpoint
2. Handle ChatKit protocol messages
3. Stream responses using SSE

## Output Checklist

After integration, verify:

- [ ] `@openai/chatkit-react` added to package.json
- [ ] `ChatWidget.tsx` component created
- [ ] `ChatProvider.tsx` created (optional)
- [ ] `layout.tsx` updated with ChatProvider
- [ ] `.env.local` created with API URL
- [ ] Animation styles added to globals.css
- [ ] Button visible in bottom-right corner
- [ ] Chat panel opens on button click

## Troubleshooting

### "Connecting to server..." stuck

- Verify backend is running on the correct URL
- Check CORS is enabled on backend
- Verify `/chatkit` endpoint exists

### Button not visible

- Check z-index (should be 50+)
- Verify component is rendered (`'use client'` directive)
- Check for CSS conflicts

### Chat not receiving responses

- Check browser console for errors
- Verify backend `respond()` method is implemented
- Check streaming is working (`text/event-stream`)

## Notes

- Always use `'use client'` directive for chat components
- ChatKit requires React 18+
- The widget is stateful - new thread per session
- For persistent threads, implement thread ID storage
