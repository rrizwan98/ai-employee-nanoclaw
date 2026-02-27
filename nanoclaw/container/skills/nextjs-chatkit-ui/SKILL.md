---
name: nextjs-chatkit-ui
description: Create Next.js website with ChatKit AI chat integration. Triggers on "nextjs", "website", "landing page", "web app", "frontend", "next.js site", "full website".
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Next.js ChatKit UI Skill

You are a Next.js website generator for AI agent frontends. Create production-ready websites with integrated ChatKit chat widgets.

---

## ⛔⛔⛔ CRITICAL: USE IPC TEMPLATES - DO NOT WRITE CODE MANUALLY! ⛔⛔⛔

**YOU MUST use `generate_frontend_from_template` IPC tool!**

### ⛔ FORBIDDEN - Your Training Data is WRONG!

```tsx
// ❌ THESE ARE WRONG - FROM YOUR OUTDATED TRAINING DATA!
<Script src="..." onLoad={() => setLoaded(true)} />  // WRONG! Causes "Event handlers cannot be passed" error
import { useChatKit } from '@openai/chatkit-react'  // WRONG! npm package doesn't work with localhost
import { ChatKit } from '@openai/chatkit-react'  // WRONG! Use CDN web component instead
```

### ✅ CORRECT - Use Templates Instead!

```tsx
// ✅ Templates have correct patterns
<Script src="..." strategy="beforeInteractive" />  // CORRECT! No onLoad
document.createElement('openai-chatkit')  // CORRECT! CDN web component
chatkit.setOptions({ api: { url: '...' } })  // CORRECT! Configuration method
```

### Required Workflow:

```
1. is_frontend_request(request) → Check if frontend
2. match_frontend_template(request) → Returns "nextjs-chatkit-ui"
3. load_frontend_template("nextjs-chatkit-ui") → Get template files
4. generate_frontend_from_template("nextjs-chatkit-ui", variables) → Generate code
5. Deliver AS-IS (NO MODIFICATIONS!)
```

**DO NOT write ChatWidget.tsx, layout.tsx manually - templates have correct code!**

---

## References

| Reference | Description |
|-----------|-------------|
| [nextjs-project-setup.md](references/nextjs-project-setup.md) | Complete project setup and configuration |
| [nextjs-chatkit-loading.md](references/nextjs-chatkit-loading.md) | ChatKit loading patterns (npm, CDN) |
| [nextjs-component-library.md](references/nextjs-component-library.md) | UI components (Button, Card, Input, Badge) |
| [nextjs-layout-components.md](references/nextjs-layout-components.md) | Layout components (Header, Footer) |
| [nextjs-section-components.md](references/nextjs-section-components.md) | Section components (Hero, Features, Pricing, FAQ, CTA) |
| [nextjs-niche-templates.md](references/nextjs-niche-templates.md) | Niche-specific templates (Restaurant, Clinic, SaaS) |

**See `../chatkit-react/references/` for ChatKit component details.**
**See `../chatkit-fastapi-backend/references/` for backend integration.**

---

## IMPORTANT: Use CDN Approach for ChatKit (NOT npm package)

**DO NOT USE** `@openai/chatkit-react` npm package for self-hosted backends - it requires a valid `domainKey` from OpenAI Platform and won't work with localhost.

**USE** the CDN script approach which works with any self-hosted backend.

### FORBIDDEN Actions:

1. **NEVER** use `@openai/chatkit-react` npm package
2. **NEVER** use `useChatKit` hook from npm package
3. **NEVER** add `@openai/chatkit-react` to package.json
4. **NEVER** create components without `'use client'` if they have onClick handlers

### What MUST Be Used Instead (CDN Approach):

**Step 1: Add CDN Script to layout.tsx:**

```typescript
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Step 2: Use Web Component in ChatWidget.tsx:**

```typescript
'use client'

// Use document.createElement('openai-chatkit')
// and chatkit.setOptions() for configuration
```

---

## When to Use This Skill

Use this skill when:
- User requests a new website or web application
- User wants a landing page for any business
- User needs a niche-specific website (restaurant, clinic, portfolio)
- User requests a React-based frontend with AI chat
- User says "create website", "landing page", "frontend"

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with ChatProvider
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── about/page.tsx       # About page
│   ├── contact/page.tsx     # Contact page
│   └── [niche-pages]/       # Niche-specific pages
├── components/
│   ├── ui/                  # UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── layout/              # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── sections/            # Page sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   ├── CTA.tsx
│   │   └── Testimonials.tsx
│   ├── forms/               # Form components
│   │   ├── ContactForm.tsx
│   │   └── BookingForm.tsx
│   └── chat/                # ChatKit components
│       ├── ChatWidget.tsx
│       ├── ChatButton.tsx
│       └── ChatProvider.tsx
├── lib/
│   └── utils.ts             # Utility functions
├── public/
│   └── images/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

---

## Quick Start Code

### package.json

```json
{
  "name": "{PROJECT_NAME}",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

**NOTE:** ChatKit is loaded via CDN, NOT npm package.

### app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '{PROJECT_NAME}',
  description: '{DESCRIPTION}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ChatKit CDN Script - REQUIRED for chat widget */}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
```

### app/page.tsx

```typescript
import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { CTA } from '@/components/sections/CTA';

export default function HomePage() {
  return (
    <>
      <Hero
        title="{HERO_TITLE}"
        subtitle="{HERO_SUBTITLE}"
        ctaText="Get Started"
        ctaHref="/contact"
      />
      <Features features={features} />
      <CTA
        title="Ready to get started?"
        description="Contact us today"
        ctaText="Contact Us"
        ctaHref="/contact"
      />
    </>
  );
}

const features = [
  {
    title: 'Feature 1',
    description: 'Description of feature 1',
    icon: '✨',
  },
  {
    title: 'Feature 2',
    description: 'Description of feature 2',
    icon: '🚀',
  },
  {
    title: 'Feature 3',
    description: 'Description of feature 3',
    icon: '💡',
  },
];
```

### components/chat/ChatWidget.tsx (CDN Web Component Approach)

```typescript
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
    const interval = setInterval(checkChatKit, 500)
    return () => clearInterval(interval)
  }, [])

  // Initialize ChatKit once when loaded
  useEffect(() => {
    if (isChatKitLoaded && !isInitialized.current && containerRef.current) {
      const chatkit = document.createElement('openai-chatkit') as ChatKitElement
      chatkit.style.width = '100%'
      chatkit.style.height = '100%'

      containerRef.current.appendChild(chatkit)
      chatKitRef.current = chatkit
      isInitialized.current = true

      setTimeout(() => {
        if (chatkit.setOptions) {
          const backendUrl = process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit'

          chatkit.setOptions({
            api: {
              domainKey: 'local-dev',
              url: backendUrl,
              fetch: async (url: string, init?: RequestInit) => {
                const response = await window.fetch(url, init)
                return response
              }
            },
          })

          console.log('ChatKit configured with backend:', backendUrl)
        }
      }, 100)
    }
  }, [isChatKitLoaded])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.display = isOpen ? 'block' : 'none'
    }
  }, [isOpen])

  return (
    <>
      {/* Chat Panel */}
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
            <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></span>
          </>
        )}
      </button>
    </>
  )
}
```

### Note: ChatButton and ChatProvider Not Needed

With the CDN approach, `ChatWidget.tsx` includes both the button and panel.
No separate ChatButton or ChatProvider components needed.

Just import and use `ChatWidget` directly in layout.tsx:

```typescript
import ChatWidget from '@/components/chat/ChatWidget';

// In layout.tsx body:
<ChatWidget />
```

---

## Supported Niches

| Niche | Keywords | Pages Generated |
|-------|----------|-----------------|
| Restaurant | restaurant, food, menu | Home, Menu, Reservations, About, Contact |
| Clinic | clinic, doctor, medical | Home, Services, Doctors, Appointments, Contact |
| E-commerce | shop, store, products | Home, Products, Cart, Contact |
| SaaS | saas, pricing, features | Home, Features, Pricing, About, Contact |
| Portfolio | portfolio, personal | Home, Projects, About, Contact |
| Agency | agency, services | Home, Services, Portfolio, About, Contact |
| Education | course, learning | Home, Courses, Instructors, About, Contact |

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/chatkit
NEXT_PUBLIC_CHATKIT_DOMAIN_KEY=local-dev
NEXT_PUBLIC_SITE_NAME={PROJECT_NAME}
```

---

## Notes

- Always use TypeScript
- Always use Tailwind CSS
- Use App Router (not Pages Router)
- Components are modular and reusable
- Follow Next.js 14+ best practices
- Keep accessibility in mind
- **CRITICAL**: Add `'use client'` to ALL components with onClick handlers or useState/useEffect
- **CRITICAL**: Use CDN approach for ChatKit, NOT npm package
- ChatKit CDN script MUST be in layout.tsx `<head>` with `strategy="beforeInteractive"`

---

## Progress Updates

```
🔄 Next.js Website Generation Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detected niche: {niche}
Project: {project_name}

Step 1/10: Setting up project structure...
Step 2/10: Creating UI components (Button, Card, Input, Badge)...
Step 3/10: Creating layout components (Header, Footer)...
Step 4/10: Creating section components (Hero, Features, Pricing, FAQ, CTA)...
Step 5/10: Creating form components (ContactForm, BookingForm)...
Step 6/10: Creating chat components (ChatWidget, ChatProvider)...
Step 7/10: Creating app pages (Home, About, Contact)...
Step 8/10: Setting up styling (Tailwind, globals.css)...
Step 9/10: Creating config files (package.json, next.config.js)...
Step 10/10: Saving and packaging...

✅ Next.js Website Generation Complete!

📁 Project Structure:
  frontend/
  ├── app/ (5 pages)
  ├── components/
  │   ├── ui/ (4 components)
  │   ├── layout/ (2 components)
  │   ├── sections/ (7 components)
  │   ├── forms/ (2 components)
  │   └── chat/ (3 components)
  └── lib/ (utilities)

🎨 Features:
  • Responsive design (mobile-first)
  • AI chat widget integrated (@openai/chatkit-react)
  • SEO optimized
  • TypeScript + Tailwind CSS
  • Dark mode support (optional)

🚀 Quick Start:
  1. cd frontend
  2. npm install
  3. cp .env.example .env.local
  4. Set NEXT_PUBLIC_CHATKIT_API_URL
  5. npm run dev
  6. Open http://localhost:3000

💡 Customize colors in tailwind.config.ts
💬 Chat widget appears in bottom-right corner
```
