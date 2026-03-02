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

## FORBIDDEN - NEVER DO THIS (MANDATORY)

**These rules are ABSOLUTE and must NEVER be violated:**

### Frontend Code - FORBIDDEN Actions:

1. **NEVER** write `ChatWidget.tsx` manually - ALWAYS use template
2. **NEVER** use `useState`, `useEffect`, `useRef` for chat functionality
3. **NEVER** use `fetch()` or `axios` for chat API calls
4. **NEVER** import `lucide-react` icons (MessageCircle, Send, X) for chat
5. **NEVER** create custom message bubbles or chat UI components
6. **NEVER** write SSE/streaming code manually for chat
7. **NEVER** use any version other than `@openai/chatkit-react`

### What MUST Be Used Instead:

```typescript
// CORRECT - Only this pattern is allowed for chat:
import { ChatKit, useChatKit } from '@openai/chatkit-react';

const { control } = useChatKit({
  api: { url: apiUrl, domainKey: domainKey },
  theme: { colorScheme: 'light', radius: 'round' },
  startScreen: { greeting: 'Hello!' },
});

return <ChatKit control={control} className="h-full w-full" />;
```

---

## ⛔⛔⛔ MANDATORY TDD - 4 LEVELS (NO EXCEPTIONS!) ⛔⛔⛔

**ALL generated frontend code MUST pass 4-Level TDD testing before delivery!**

### TDD Commands for Frontend:

```bash
# LEVEL 1: TypeScript Syntax (MUST PASS - BLOCKS DELIVERY!)
npx tsc --noEmit

# LEVEL 2: Unit Tests (MUST PASS - BLOCKS DELIVERY!)
npm test

# LEVEL 3: Build (MUST PASS - BLOCKS DELIVERY!)
npm run build

# LEVEL 4: Dev Server (RECOMMENDED - NOTIFY ISSUES)
npm run dev &
sleep 5 && curl localhost:3000
```

### Quick Manual TDD Check:

```bash
# Level 1: TypeScript compiles?
npx tsc --noEmit && echo "PASS"

# Level 2: Tests pass?
npm test --passWithNoTests && echo "PASS"

# Level 3: Builds successfully?
npm run build && echo "PASS"

# Level 4: Runs?
npm run dev &
sleep 5 && curl localhost:3000
```

### Delivery Rules:

```
Level 1 FAIL → STOP! Fix TypeScript errors
Level 2 FAIL → STOP! Fix test failures
Level 3 FAIL → STOP! Fix build errors
Level 4 FAIL → NOTIFY client of known issues
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
    "react-dom": "^18.2.0",
    "@openai/chatkit-react": "^1.5.0"
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

### app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChatProvider } from '@/components/chat/ChatProvider';

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
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatProvider
          apiUrl={process.env.NEXT_PUBLIC_CHATKIT_API_URL}
          enabled={true}
        />
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

### components/chat/ChatWidget.tsx

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

interface ChatWidgetProps {
  apiUrl?: string;
  domainKey?: string;
  greeting?: string;
  brandColor?: string;
}

export function ChatWidget({
  apiUrl = process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/chatkit',
  domainKey = 'local-dev',
  greeting = 'How can I help you today?',
  brandColor = '#3B82F6',
}: ChatWidgetProps) {
  const { control } = useChatKit({
    api: {
      url: apiUrl,
      domainKey: domainKey,
    },
    theme: {
      colorScheme: 'light',
      radius: 'round',
      color: {
        accent: { primary: brandColor, level: 2 },
      },
    },
    header: {
      enabled: true,
    },
    history: {
      enabled: true,
      showDelete: true,
      showRename: true,
    },
    startScreen: {
      greeting: greeting,
      prompts: [
        {
          label: 'Get Help',
          prompt: 'I need help with something',
          icon: 'lifesaver',
        },
        {
          label: 'Learn More',
          prompt: 'Tell me more about your services',
          icon: 'info',
        },
      ],
    },
    composer: {
      placeholder: 'Type your message...',
      allowAttachments: true,
    },
    threadItemActions: {
      feedback: true,
      retry: true,
    },
  });

  return <ChatKit control={control} className="h-full w-full" />;
}
```

### components/chat/ChatButton.tsx

```typescript
'use client';

import { useState } from 'react';
import { ChatWidget } from './ChatWidget';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <ChatWidget />
        </div>
      )}
    </>
  );
}
```

### components/chat/ChatProvider.tsx

```typescript
'use client';

import { ChatButton } from './ChatButton';

interface ChatProviderProps {
  children?: React.ReactNode;
  apiUrl?: string;
  enabled?: boolean;
}

export function ChatProvider({
  children,
  apiUrl,
  enabled = true,
}: ChatProviderProps) {
  return (
    <>
      {children}
      {enabled && <ChatButton />}
    </>
  );
}
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
- Use server components by default, client components only when needed

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
