# Next.js ChatKit UI - Section Components Reference

Page section components (Hero, Features, Pricing, FAQ, CTA, Testimonials).

---

## Hero Section

```typescript
// components/sections/Hero.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  image?: string;
  align?: 'left' | 'center';
}

export function Hero({
  title,
  subtitle,
  ctaText = 'Get Started',
  ctaHref = '/contact',
  secondaryCtaText,
  secondaryCtaHref,
  image,
  align = 'center',
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-20 lg:py-32">
      <div className="container">
        <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              {subtitle}
            </p>
          )}
          <div className={`mt-10 flex gap-4 ${align === 'center' ? 'justify-center' : ''}`}>
            <Button size="lg" asChild>
              <Link href={ctaHref}>{ctaText}</Link>
            </Button>
            {secondaryCtaText && secondaryCtaHref && (
              <Button size="lg" variant="outline" asChild>
                <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
              </Button>
            )}
          </div>
        </div>
        {image && (
          <div className="mt-16">
            <img
              src={image}
              alt="Hero"
              className="mx-auto rounded-xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## Features Section

```typescript
// components/sections/Features.tsx
interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

export function Features({
  title = 'Features',
  subtitle,
  features,
  columns = 3,
}: FeaturesProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className={`mt-16 grid grid-cols-1 gap-8 ${gridCols[columns]}`}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Pricing Section

```typescript
// components/sections/Pricing.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaText?: string;
  ctaHref?: string;
  highlighted?: boolean;
}

interface PricingProps {
  title?: string;
  subtitle?: string;
  plans: PricingPlan[];
}

export function Pricing({
  title = 'Pricing',
  subtitle = 'Choose the plan that fits your needs',
  plans,
}: PricingProps) {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl bg-white p-8 shadow-sm ${
                plan.highlighted
                  ? 'ring-2 ring-primary-600 shadow-lg'
                  : 'border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="info">
                  Most Popular
                </Badge>
              )}

              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="ml-1 text-gray-600">/{plan.period}</span>
                )}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.highlighted ? 'primary' : 'outline'}
                asChild
              >
                <Link href={plan.ctaHref || '/contact'}>
                  {plan.ctaText || 'Get Started'}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## FAQ Section

```typescript
// components/sections/FAQ.tsx
'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
}

export function FAQ({
  title = 'Frequently Asked Questions',
  subtitle,
  items,
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="mx-auto mt-16 max-w-3xl divide-y divide-gray-200">
          {items.map((item, index) => (
            <div key={index} className="py-6">
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-medium text-gray-900">
                  {item.question}
                </span>
                <svg
                  className={`h-6 w-6 text-gray-400 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

---

## CTA Section

```typescript
// components/sections/CTA.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface CTAProps {
  title: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  variant?: 'default' | 'primary' | 'dark';
}

export function CTA({
  title,
  description,
  ctaText = 'Get Started',
  ctaHref = '/contact',
  secondaryCtaText,
  secondaryCtaHref,
  variant = 'default',
}: CTAProps) {
  const variants = {
    default: 'bg-gray-50',
    primary: 'bg-primary-600 text-white',
    dark: 'bg-gray-900 text-white',
  };

  const buttonVariant = variant === 'default' ? 'primary' : 'outline';

  return (
    <section className={`py-16 lg:py-24 ${variants[variant]}`}>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${
            variant === 'default' ? 'text-gray-900' : ''
          }`}>
            {title}
          </h2>
          {description && (
            <p className={`mt-4 text-lg ${
              variant === 'default' ? 'text-gray-600' : 'text-white/80'
            }`}>
              {description}
            </p>
          )}
          <div className="mt-10 flex justify-center gap-4">
            <Button
              size="lg"
              variant={variant === 'default' ? 'primary' : 'secondary'}
              asChild
            >
              <Link href={ctaHref}>{ctaText}</Link>
            </Button>
            {secondaryCtaText && secondaryCtaHref && (
              <Button size="lg" variant="ghost" className={variant !== 'default' ? 'text-white hover:bg-white/10' : ''} asChild>
                <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## Testimonials Section

```typescript
// components/sections/Testimonials.tsx
import { Avatar } from '@/components/ui/Avatar';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
}

interface TestimonialsProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

export function Testimonials({
  title = 'What Our Customers Say',
  subtitle,
  testimonials,
}: TestimonialsProps) {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white p-8 shadow-sm"
            >
              <div className="flex gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="mt-6 text-gray-600">{testimonial.quote}</p>

              <div className="mt-6 flex items-center gap-4">
                <Avatar
                  src={testimonial.avatar}
                  name={testimonial.author}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}
                    {testimonial.company && ` at ${testimonial.company}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Stats Section

```typescript
// components/sections/Stats.tsx
interface Stat {
  value: string;
  label: string;
}

interface StatsProps {
  stats: Stat[];
}

export function Stats({ stats }: StatsProps) {
  return (
    <section className="py-16 lg:py-24 bg-primary-600">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl font-bold text-white sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-primary-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Usage Example

```typescript
// app/page.tsx
import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { Testimonials } from '@/components/sections/Testimonials';
import { FAQ } from '@/components/sections/FAQ';
import { CTA } from '@/components/sections/CTA';

export default function HomePage() {
  return (
    <>
      <Hero
        title="Build Better Products Faster"
        subtitle="The all-in-one platform for modern teams."
        ctaText="Start Free Trial"
        ctaHref="/signup"
        secondaryCtaText="Watch Demo"
        secondaryCtaHref="/demo"
      />

      <Features
        title="Everything You Need"
        features={[
          { title: 'Fast', description: 'Lightning quick performance', icon: '⚡' },
          { title: 'Secure', description: 'Enterprise-grade security', icon: '🔒' },
          { title: 'Scalable', description: 'Grows with your business', icon: '📈' },
        ]}
      />

      <Pricing
        plans={[
          {
            name: 'Starter',
            price: '$9',
            period: 'month',
            description: 'Perfect for small teams',
            features: ['5 users', '10GB storage', 'Basic support'],
          },
          {
            name: 'Pro',
            price: '$29',
            period: 'month',
            description: 'For growing businesses',
            features: ['25 users', '100GB storage', 'Priority support'],
            highlighted: true,
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            description: 'For large organizations',
            features: ['Unlimited users', 'Unlimited storage', '24/7 support'],
          },
        ]}
      />

      <Testimonials
        testimonials={[
          {
            quote: 'This product changed how we work. Highly recommended!',
            author: 'Jane Doe',
            role: 'CEO',
            company: 'TechCorp',
          },
        ]}
      />

      <FAQ
        items={[
          { question: 'How do I get started?', answer: 'Sign up for a free trial...' },
          { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel...' },
        ]}
      />

      <CTA
        title="Ready to get started?"
        description="Join thousands of happy customers."
        ctaText="Start Free Trial"
        variant="primary"
      />
    </>
  );
}
```
