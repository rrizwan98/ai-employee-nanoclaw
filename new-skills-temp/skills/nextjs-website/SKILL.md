---
name: nextjs-website
description: Create Next.js website projects. Triggers on "nextjs", "next.js", "website", "web app", "landing page", "react app", "create website".
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Next.js Website Skill

You are a Next.js website generator for the AI Employee system. Create production-ready Next.js projects for any niche or purpose.

## When to Use This Skill

Use this skill when user requests:
- A new website or web application
- A landing page
- A React-based frontend
- Any Next.js project

## Project Structure

Generate this standard structure:

```
{project-name}/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles + Tailwind
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/           # Feature-specific components
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── public/
│   │   └── images/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.local.example
└── README.md
```

## Implementation Steps

### Step 1: Create Project Base

```bash
# Create frontend directory
mkdir -p {project-name}/frontend

# Navigate to frontend
cd {project-name}/frontend
```

### Step 2: Create package.json

```json
{
  "name": "{project-name}-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0"
  }
}
```

### Step 3: Create next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
```

### Step 4: Create tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 5: Create tailwind.config.ts

```typescript
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
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 6: Create postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Step 7: Create App Layout (app/layout.tsx)

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
```

### Step 8: Create globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
```

### Step 9: Create Home Page (app/page.tsx)

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">
        {Project Title}
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl text-center">
        {Project description}
      </p>
    </main>
  );
}
```

### Step 10: Create Utility Functions (lib/utils.ts)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Niche-Specific Customization

When generating for a specific niche, customize:

| Element | Customization |
|---------|---------------|
| **Colors** | Update `tailwind.config.ts` primary colors |
| **Fonts** | Change font in `layout.tsx` |
| **Metadata** | Update title/description in `layout.tsx` |
| **Components** | Add niche-specific components to `components/features/` |
| **Pages** | Add niche-specific pages to `app/` |

## Running the Project

```bash
# Install dependencies
cd {project-name}/frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Integration Points

This skill creates a frontend that can integrate with:

1. **chatkit-react skill** - Add AI chat widget to the website
2. **chatkit-fastapi-backend skill** - Connect to AI backend

### Adding Chat Widget

After creating the base website, use the `chatkit-react` skill to add an AI chat widget. The widget will appear as a button in the bottom-right corner.

## Output Checklist

After generation, verify:

- [ ] `frontend/` directory created
- [ ] `package.json` with all dependencies
- [ ] `app/layout.tsx` with metadata
- [ ] `app/page.tsx` home page
- [ ] `tailwind.config.ts` configured
- [ ] `tsconfig.json` configured
- [ ] Basic components structure created

## Notes

- Always use TypeScript
- Always use Tailwind CSS for styling
- Use App Router (not Pages Router)
- Keep components modular and reusable
- Follow Next.js 14+ best practices
