# Next.js ChatKit UI - ChatKit Loading Reference

Complete guide to loading ChatKit in Next.js applications.

---

## Loading Methods

| Method | Best For | Bundle Size |
|--------|----------|-------------|
| npm package | Production apps | Included in build |
| CDN | Quick prototypes | Loaded at runtime |

---

## NPM Package (Recommended)

### Installation

```bash
npm install @openai/chatkit-react
```

### Basic Usage

```typescript
// components/chat/ChatWidget.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function ChatWidget() {
  const { control } = useChatKit({
    api: {
      url: process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit',
      domainKey: 'local-dev',
    },
  });

  return <ChatKit control={control} className="h-[600px] w-[400px]" />;
}
```

### Client Component

**IMPORTANT**: ChatKit must be used in client components.

```typescript
// ✅ Correct - 'use client' directive
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function ChatWidget() {
  const { control } = useChatKit({ api: { url: '/chatkit' } });
  return <ChatKit control={control} />;
}

// ❌ Wrong - Server component (will fail)
import { ChatKit } from '@openai/chatkit-react';  // Error!
```

---

## Dynamic Import (Code Splitting)

Load ChatKit only when needed:

```typescript
// components/chat/ChatButton.tsx
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Lazy load ChatWidget
const ChatWidget = dynamic(
  () => import('./ChatWidget').then(mod => ({ default: mod.ChatWidget })),
  {
    loading: () => <div className="p-4">Loading chat...</div>,
    ssr: false,
  }
);

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg"
      >
        {isOpen ? 'X' : '💬'}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
          <ChatWidget />
        </div>
      )}
    </>
  );
}
```

---

## CDN Loading (Alternative)

For quick prototypes or when npm isn't available:

### Script Tag Method

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@openai/chatkit-react@1.5.0/dist/index.umd.min.js"
          strategy="afterInteractive"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@openai/chatkit-react@1.5.0/dist/style.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### CDN with Dynamic Component

```typescript
// components/chat/CDNChatWidget.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    ChatKitReact: {
      ChatKit: React.ComponentType<any>;
      useChatKit: (options: any) => { control: any };
    };
  }
}

export function CDNChatWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load ChatKit from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@openai/chatkit-react@1.5.0/dist/index.umd.min.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://cdn.jsdelivr.net/npm/@openai/chatkit-react@1.5.0/dist/style.css';
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.ChatKitReact) return;

    // Initialize ChatKit
    const { ChatKit, useChatKit } = window.ChatKitReact;
    // ... render ChatKit to container
  }, [isLoaded]);

  if (!isLoaded) {
    return <div className="p-4">Loading chat...</div>;
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
```

---

## SSR Considerations

ChatKit requires browser APIs and cannot be server-rendered.

### Disable SSR

```typescript
// Option 1: Dynamic import with ssr: false
import dynamic from 'next/dynamic';

const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
});
```

```typescript
// Option 2: Client-only rendering check
'use client';

import { useEffect, useState } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function ChatWidget() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { control } = useChatKit({
    api: { url: '/chatkit' },
  });

  if (!isMounted) {
    return <div className="h-[600px] w-[400px] bg-gray-100 animate-pulse" />;
  }

  return <ChatKit control={control} className="h-[600px] w-[400px]" />;
}
```

---

## Lazy Loading Pattern

Load ChatKit only when user shows intent to chat:

```typescript
// components/chat/LazyChatButton.tsx
'use client';

import { useState, useCallback } from 'react';

export function LazyChatButton() {
  const [ChatComponent, setChatComponent] = useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadChat = useCallback(async () => {
    if (ChatComponent) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    const { ChatWidget } = await import('./ChatWidget');
    setChatComponent(() => ChatWidget);
    setIsLoading(false);
    setIsOpen(true);
  }, [ChatComponent]);

  return (
    <>
      <button
        onClick={loadChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg"
        disabled={isLoading}
      >
        {isLoading ? '...' : isOpen ? 'X' : '💬'}
      </button>

      {isOpen && ChatComponent && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px]">
          <ChatComponent />
        </div>
      )}
    </>
  );
}
```

---

## Bundle Analysis

Check ChatKit's impact on bundle size:

```bash
# Install analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run analysis
ANALYZE=true npm run build
```

---

## Preloading

Preload ChatKit for faster interaction:

```typescript
// app/layout.tsx
import Link from 'next/link';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload ChatKit CSS */}
        <link
          rel="preload"
          href="/_next/static/css/chatkit.css"
          as="style"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```typescript
// Prefetch on hover
'use client';

import { useState } from 'react';

export function PrefetchChatButton() {
  const [isPrefetched, setIsPrefetched] = useState(false);

  const prefetch = () => {
    if (isPrefetched) return;
    import('./ChatWidget');
    setIsPrefetched(true);
  };

  return (
    <button
      onMouseEnter={prefetch}
      onClick={() => /* open chat */}
    >
      Chat
    </button>
  );
}
```

---

## Error Handling

Handle loading failures gracefully:

```typescript
'use client';

import { Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ChatErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 text-red-600 rounded">
      <p>Failed to load chat. <button onClick={resetErrorBoundary}>Retry</button></p>
    </div>
  );
}

function ChatLoadingFallback() {
  return (
    <div className="h-[600px] w-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
      <span>Loading chat...</span>
    </div>
  );
}

export function SafeChatWidget() {
  return (
    <ErrorBoundary FallbackComponent={ChatErrorFallback}>
      <Suspense fallback={<ChatLoadingFallback />}>
        <ChatWidget />
      </Suspense>
    </ErrorBoundary>
  );
}
```
