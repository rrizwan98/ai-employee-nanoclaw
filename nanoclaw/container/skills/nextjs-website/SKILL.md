---
name: nextjs-website
description: Create Next.js website projects with component library for any niche. Triggers on "nextjs", "next.js", "website", "web app", "landing page", "react app", "create website".
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Next.js Website Skill

You are a Next.js website generator for the AI Employee system. Create production-ready Next.js projects for any niche with a comprehensive component library.

**CRITICAL**: Always use `@openai/chatkit-react` for chat features. NEVER create custom axios/fetch chat implementations.

## When to Use This Skill

Use this skill when user requests:
- A new website or web application
- A landing page for any business
- A niche-specific website (restaurant, clinic, portfolio, etc.)
- A React-based frontend
- Any Next.js project

## Supported Niches

| Niche | Keywords | Pages Generated |
|-------|----------|-----------------|
| Restaurant | restaurant, food, menu | Home, Menu, Reservations, About, Contact |
| Clinic | clinic, doctor, medical | Home, Services, Doctors, Appointments, Contact |
| E-commerce | shop, store, products | Home, Products, Cart, Contact |
| SaaS | saas, pricing, features | Home, Features, Pricing, About, Contact |
| Portfolio | portfolio, personal | Home, Projects, About, Contact |

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── [pages]/
├── components/
│   ├── ui/ (Button, Card, Input, Badge)
│   ├── layout/ (Header, Footer)
│   ├── sections/ (Hero, Features, Pricing, FAQ, CTA)
│   ├── forms/ (ContactForm, BookingForm)
│   └── chat/ (ChatWidget, ChatProvider)
├── lib/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Progress Updates

Send real-time progress updates during execution:

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
  │   └── chat/ (2 components)
  └── lib/ (utilities)

🎨 Features:
  • Responsive design (mobile-first)
  • AI chat widget integrated
  • SEO optimized
  • TypeScript + Tailwind CSS

🚀 Quick Start:
  1. cd frontend
  2. npm install
  3. npm run dev
  4. Open http://localhost:3000

💡 Customize colors in tailwind.config.ts
💬 Configure chat backend in .env.local
```

## Notes

- Always use TypeScript
- Always use Tailwind CSS
- Use App Router (not Pages Router)
- Components are modular and reusable
- Follow Next.js 14+ best practices
- Keep accessibility in mind
