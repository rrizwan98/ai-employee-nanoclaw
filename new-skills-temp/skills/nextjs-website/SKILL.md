---
name: nextjs-website
description: Create Next.js website projects with component library for any niche. Triggers on "nextjs", "next.js", "website", "web app", "landing page", "react app", "create website", "restaurant website", "clinic website", "portfolio", "ecommerce".
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Next.js Website Skill

You are a Next.js website generator for the AI Employee system. Create production-ready Next.js projects for any niche with a comprehensive component library.

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
| Restaurant | restaurant, food, menu, cafe, dining | Home, Menu, Reservations, About, Contact |
| Clinic/Medical | clinic, doctor, hospital, medical, health | Home, Services, Doctors, Appointments, Contact |
| E-commerce | shop, store, products, ecommerce, buy | Home, Products, Product Detail, Cart, Contact |
| SaaS | saas, pricing, features, software, app | Home, Features, Pricing, About, Contact |
| Portfolio | portfolio, personal, freelancer, designer | Home, Projects, About, Contact |
| Blog | blog, articles, posts, writing | Home, Posts, Post Detail, About, Contact |
| Agency | agency, studio, creative, marketing | Home, Services, Work, Team, Contact |
| Real Estate | property, real estate, listings, homes | Home, Listings, Listing Detail, Contact |

---

## Project Structure (Full)

```
{project-name}/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with navigation
│   │   ├── page.tsx                # Home page with sections
│   │   ├── globals.css             # Global styles + Tailwind
│   │   ├── about/page.tsx          # About page
│   │   ├── contact/page.tsx        # Contact page with form
│   │   ├── [niche-pages]/          # Niche-specific pages
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── sections/               # Page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── CTA.tsx
│   │   │   ├── FAQ.tsx
│   │   │   ├── Team.tsx
│   │   │   └── Contact.tsx
│   │   ├── forms/                  # Form components
│   │   │   ├── ContactForm.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   └── NewsletterForm.tsx
│   │   └── niche/                  # Niche-specific components
│   │       ├── MenuCard.tsx        # Restaurant
│   │       ├── DoctorCard.tsx      # Clinic
│   │       ├── ProductCard.tsx     # E-commerce
│   │       ├── ProjectCard.tsx     # Portfolio
│   │       └── ListingCard.tsx     # Real Estate
│   ├── lib/
│   │   ├── utils.ts                # Utility functions
│   │   └── constants.ts            # Site constants
│   ├── public/
│   │   └── images/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.local.example
└── README.md
```

---

## Component Library

### 1. UI Components (Base)

#### Button.tsx
```tsx
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
            'bg-transparent hover:bg-gray-100': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
```

#### Card.tsx
```tsx
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export default function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white p-6',
        {
          'shadow-sm': variant === 'default',
          'border border-gray-200': variant === 'bordered',
          'shadow-lg': variant === 'elevated',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xl font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-gray-500', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}
```

#### Input.tsx
```tsx
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm',
            'placeholder:text-gray-400',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:bg-gray-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
```

#### Badge.tsx
```tsx
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export default function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'error',
          'bg-blue-100 text-blue-800': variant === 'info',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
```

---

### 2. Layout Components

#### Header.tsx
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logo: string;
  navItems: NavItem[];
  ctaText?: string;
  ctaHref?: string;
}

export default function Header({ logo, navItems, ctaText, ctaHref }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary-600">
            {logo}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
              >
                {item.label}
              </Link>
            ))}
            {ctaText && ctaHref && (
              <Button asChild size="sm">
                <Link href={ctaHref}>{ctaText}</Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {ctaText && ctaHref && (
                <Button asChild size="sm" className="w-full">
                  <Link href={ctaHref}>{ctaText}</Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
```

#### Footer.tsx
```tsx
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  logo: string;
  description?: string;
  columns: FooterColumn[];
  copyright: string;
  socialLinks?: { icon: string; href: string }[];
}

export default function Footer({ logo, description, columns, copyright, socialLinks }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-primary-600">
              {logo}
            </Link>
            {description && (
              <p className="mt-4 text-sm text-gray-600">{description}</p>
            )}
            {socialLinks && (
              <div className="mt-4 flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-primary-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-500">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
```

---

### 3. Section Components

#### Hero.tsx (Multiple Variants)
```tsx
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  variant?: 'centered' | 'split' | 'background';
  title: string;
  subtitle?: string;
  description: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  image?: string;
  backgroundImage?: string;
}

export default function Hero({
  variant = 'centered',
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  image,
  backgroundImage,
}: HeroProps) {
  if (variant === 'centered') {
    return (
      <section className="relative py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {subtitle && (
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
                {subtitle}
              </p>
            )}
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-lg text-gray-600">{description}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {primaryCTA && (
                <Button size="lg" asChild>
                  <Link href={primaryCTA.href}>{primaryCTA.text}</Link>
                </Button>
              )}
              {secondaryCTA && (
                <Button variant="outline" size="lg" asChild>
                  <Link href={secondaryCTA.href}>{secondaryCTA.text}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'split') {
    return (
      <section className="relative py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              {subtitle && (
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
                  {subtitle}
                </p>
              )}
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-6 text-lg text-gray-600">{description}</p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {primaryCTA && (
                  <Button size="lg" asChild>
                    <Link href={primaryCTA.href}>{primaryCTA.text}</Link>
                  </Button>
                )}
                {secondaryCTA && (
                  <Button variant="outline" size="lg" asChild>
                    <Link href={secondaryCTA.href}>{secondaryCTA.text}</Link>
                  </Button>
                )}
              </div>
            </div>
            {image && (
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src={image} alt={title} fill className="object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Background variant
  return (
    <section
      className="relative py-32 lg:py-48"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {subtitle && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-400">
              {subtitle}
            </p>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg text-gray-200">{description}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {primaryCTA && (
              <Button size="lg" asChild>
                <Link href={primaryCTA.href}>{primaryCTA.text}</Link>
              </Button>
            )}
            {secondaryCTA && (
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
                <Link href={secondaryCTA.href}>{secondaryCTA.text}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### Features.tsx
```tsx
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeaturesProps {
  title: string;
  subtitle?: string;
  description?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

export default function Features({
  title,
  subtitle,
  description,
  features,
  columns = 3,
}: FeaturesProps) {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {subtitle && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
              {subtitle}
            </p>
          )}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-lg text-gray-600">{description}</p>
          )}
        </div>

        <div
          className={`mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-${columns}`}
        >
          {features.map((feature, index) => (
            <Card key={index} variant="bordered">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### Pricing.tsx
```tsx
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Link from 'next/link';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  cta: { text: string; href: string };
  popular?: boolean;
}

interface PricingProps {
  title: string;
  subtitle?: string;
  description?: string;
  plans: PricingPlan[];
}

export default function Pricing({ title, subtitle, description, plans }: PricingProps) {
  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {subtitle && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
              {subtitle}
            </p>
          )}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-lg text-gray-600">{description}</p>
          )}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Card
              key={index}
              variant={plan.popular ? 'elevated' : 'bordered'}
              className={plan.popular ? 'relative border-2 border-primary-500' : ''}
            >
              {plan.popular && (
                <Badge variant="info" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500">/{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                  asChild
                >
                  <Link href={plan.cta.href}>{plan.cta.text}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### Testimonials.tsx
```tsx
import Image from 'next/image';
import Card, { CardContent } from '@/components/ui/Card';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialsProps {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

export default function Testimonials({ title, subtitle, testimonials }: TestimonialsProps) {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {subtitle && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
              {subtitle}
            </p>
          )}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} variant="bordered">
              <CardContent className="pt-6">
                {testimonial.rating && (
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${i < testimonial.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
                <blockquote className="text-gray-600">"{testimonial.quote}"</blockquote>
                <div className="mt-6 flex items-center gap-3">
                  {testimonial.avatar && (
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">
                      {testimonial.role}
                      {testimonial.company && `, ${testimonial.company}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### CTA.tsx
```tsx
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface CTAProps {
  title: string;
  description: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  variant?: 'default' | 'dark' | 'gradient';
}

export default function CTA({
  title,
  description,
  primaryCTA,
  secondaryCTA,
  variant = 'default',
}: CTAProps) {
  const bgClasses = {
    default: 'bg-gray-50',
    dark: 'bg-gray-900',
    gradient: 'bg-gradient-to-r from-primary-600 to-primary-700',
  };

  const textClasses = {
    default: 'text-gray-900',
    dark: 'text-white',
    gradient: 'text-white',
  };

  const descClasses = {
    default: 'text-gray-600',
    dark: 'text-gray-300',
    gradient: 'text-primary-100',
  };

  return (
    <section className={`py-20 lg:py-32 ${bgClasses[variant]}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${textClasses[variant]}`}>
            {title}
          </h2>
          <p className={`mt-4 text-lg ${descClasses[variant]}`}>{description}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant={variant === 'default' ? 'primary' : 'secondary'}
              asChild
            >
              <Link href={primaryCTA.href}>{primaryCTA.text}</Link>
            </Button>
            {secondaryCTA && (
              <Button
                size="lg"
                variant="outline"
                className={variant !== 'default' ? 'border-white text-white hover:bg-white/10' : ''}
                asChild
              >
                <Link href={secondaryCTA.href}>{secondaryCTA.text}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### FAQ.tsx
```tsx
'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title: string;
  subtitle?: string;
  items: FAQItem[];
}

export default function FAQ({ title, subtitle, items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {subtitle && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
              {subtitle}
            </p>
          )}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mt-12 divide-y divide-gray-200">
          {items.map((item, index) => (
            <div key={index} className="py-6">
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{item.question}</span>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <p className="mt-4 text-gray-600">{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### ContactSection.tsx
```tsx
import ContactForm from '@/components/forms/ContactForm';

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}

interface ContactSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  contactInfo: ContactInfo[];
}

export default function ContactSection({
  title,
  subtitle,
  description,
  contactInfo,
}: ContactSectionProps) {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            {subtitle && (
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary-600">
                {subtitle}
              </p>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </h2>
            {description && (
              <p className="mt-4 text-lg text-gray-600">{description}</p>
            )}
            <div className="mt-8 space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    {info.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{info.title}</p>
                    {info.href ? (
                      <a href={info.href} className="text-gray-600 hover:text-primary-600">
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-gray-600">{info.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

### 4. Form Components

#### ContactForm.tsx
```tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-green-50 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Message Sent!</h3>
        <p className="mt-2 text-gray-600">We'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="First Name" name="firstName" required placeholder="John" />
        <Input label="Last Name" name="lastName" required placeholder="Doe" />
      </div>
      <Input label="Email" name="email" type="email" required placeholder="john@example.com" />
      <Input label="Phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
        <textarea
          name="message"
          rows={4}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="How can we help you?"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
```

#### BookingForm.tsx
```tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface BookingFormProps {
  services?: string[];
}

export default function BookingForm({ services }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert('Booking submitted!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input label="Full Name" name="name" required placeholder="John Doe" />
      <Input label="Email" name="email" type="email" required placeholder="john@example.com" />
      <Input label="Phone" name="phone" type="tel" required placeholder="+1 (555) 000-0000" />

      {services && services.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Service</label>
          <select
            name="service"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="Date" name="date" type="date" required />
        <Input label="Time" name="time" type="time" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="Any special requests?"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
}
```

---

### 5. Niche-Specific Components

#### MenuCard.tsx (Restaurant)
```tsx
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image?: string;
  tags?: string[];
  popular?: boolean;
}

export default function MenuCard({ name, description, price, image, tags, popular }: MenuItem) {
  return (
    <Card variant="bordered" className="overflow-hidden">
      {image && (
        <div className="relative aspect-video">
          <Image src={image} alt={name} fill className="object-cover" />
          {popular && (
            <Badge variant="warning" className="absolute right-2 top-2">
              Popular
            </Badge>
          )}
        </div>
      )}
      <CardContent className={image ? 'pt-4' : 'pt-6'}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
          <span className="font-bold text-primary-600">{price}</span>
        </div>
        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### DoctorCard.tsx (Clinic)
```tsx
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Link from 'next/link';

interface Doctor {
  name: string;
  specialty: string;
  image: string;
  experience?: string;
  education?: string;
  href: string;
}

export default function DoctorCard({ name, specialty, image, experience, education, href }: Doctor) {
  return (
    <Card variant="bordered" className="text-center">
      <CardContent className="pt-6">
        <Image
          src={image}
          alt={name}
          width={120}
          height={120}
          className="mx-auto rounded-full object-cover"
        />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-primary-600">{specialty}</p>
        {experience && (
          <p className="mt-2 text-sm text-gray-500">{experience} experience</p>
        )}
        {education && (
          <p className="text-sm text-gray-500">{education}</p>
        )}
        <Button variant="outline" className="mt-4 w-full" asChild>
          <Link href={href}>Book Appointment</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### ProductCard.tsx (E-commerce)
```tsx
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Link from 'next/link';

interface Product {
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  category?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  href: string;
}

export default function ProductCard({
  name,
  price,
  originalPrice,
  image,
  category,
  rating,
  reviews,
  inStock = true,
  href,
}: Product) {
  const discount = originalPrice
    ? Math.round((1 - parseFloat(price.replace(/[^0-9.]/g, '')) / parseFloat(originalPrice.replace(/[^0-9.]/g, ''))) * 100)
    : null;

  return (
    <Card variant="bordered" className="group overflow-hidden">
      <Link href={href}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {discount && (
            <Badge variant="error" className="absolute left-2 top-2">
              -{discount}%
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="default" className="bg-white text-gray-900">Out of Stock</Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="pt-4">
        {category && <p className="text-xs text-gray-500">{category}</p>}
        <Link href={href}>
          <h3 className="mt-1 font-semibold text-gray-900 hover:text-primary-600">{name}</h3>
        </Link>
        {rating && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-sm text-yellow-500">★</span>
            <span className="text-sm text-gray-600">{rating}</span>
            {reviews && <span className="text-sm text-gray-400">({reviews})</span>}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">{price}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">{originalPrice}</span>
          )}
        </div>
        <Button className="mt-4 w-full" disabled={!inStock}>
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### ProjectCard.tsx (Portfolio)
```tsx
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Link from 'next/link';

interface Project {
  title: string;
  description: string;
  image: string;
  tags: string[];
  href: string;
}

export default function ProjectCard({ title, description, image, tags, href }: Project) {
  return (
    <Link href={href}>
      <Card variant="bordered" className="group overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

---

## Niche Presets

### Restaurant Preset
```
Pages: Home, Menu, Reservations, About, Contact
Components: MenuCard, BookingForm, Hero (background), Features
Sections: Hero with food image, Menu categories, Testimonials, Location map, CTA
```

### Clinic Preset
```
Pages: Home, Services, Doctors, Appointments, Contact
Components: DoctorCard, BookingForm, Hero (split), Features
Sections: Hero, Services grid, Doctor profiles, Testimonials, FAQ, Contact
```

### E-commerce Preset
```
Pages: Home, Products, Product/[id], Cart, Contact
Components: ProductCard, Hero (centered), Features, Pricing
Sections: Hero, Featured products, Categories, Testimonials, CTA
```

### SaaS Preset
```
Pages: Home, Features, Pricing, About, Contact
Components: Hero (centered), Features, Pricing, Testimonials, FAQ
Sections: Hero, Features grid, Pricing table, Testimonials, FAQ, CTA
```

### Portfolio Preset
```
Pages: Home, Projects, About, Contact
Components: ProjectCard, Hero (split), ContactForm
Sections: Hero, Project grid, About, Skills, Contact
```

---

## Implementation Steps

1. **Detect Niche**: Match client request to niche preset
2. **Generate Structure**: Create folders and base files
3. **Apply Components**: Use appropriate components for niche
4. **Customize Theme**: Apply brand colors, fonts
5. **Add Content**: Placeholder content for each section
6. **Integration**: Add ChatKit widget if frontend.enabled

---

## Output Checklist

After generation, verify:

- [ ] All pages created for selected niche
- [ ] Header with navigation links
- [ ] Footer with relevant links
- [ ] Hero section with CTAs
- [ ] Niche-specific components used
- [ ] Contact form working
- [ ] Mobile responsive
- [ ] Theme applied correctly
- [ ] ChatKit widget integrated (if enabled)

## Notes

- Always use TypeScript
- Always use Tailwind CSS
- Use App Router (not Pages Router)
- Components are modular and reusable
- Follow Next.js 14+ best practices
- Keep accessibility in mind (aria labels, semantic HTML)
