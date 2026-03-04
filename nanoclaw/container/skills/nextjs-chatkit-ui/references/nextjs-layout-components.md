# Next.js ChatKit UI - Layout Components Reference

Header and Footer components for Next.js websites.

---

## Header Component

```typescript
// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  siteName?: string;
  navItems?: NavItem[];
  ctaText?: string;
  ctaHref?: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

export function Header({
  siteName = 'Company',
  navItems = defaultNavItems,
  ctaText = 'Get Started',
  ctaHref = '/contact',
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-600">{siteName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Button asChild>
            <Link href={ctaHref}>{ctaText}</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="container py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-primary-600 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2">
              <Link href={ctaHref}>{ctaText}</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
```

---

## Footer Component

```typescript
// components/layout/Footer.tsx
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface FooterProps {
  siteName?: string;
  description?: string;
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  copyright?: string;
}

const defaultSections: FooterSection[] = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Consulting', href: '/services/consulting' },
      { label: 'Development', href: '/services/development' },
      { label: 'Support', href: '/services/support' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

const defaultSocialLinks: SocialLink[] = [
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export function Footer({
  siteName = 'Company',
  description = 'Making the world a better place.',
  sections = defaultSections,
  socialLinks = defaultSocialLinks,
  copyright,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const copyrightText = copyright || `${currentYear} ${siteName}. All rights reserved.`;

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-white">
              {siteName}
            </Link>
            <p className="mt-4 text-sm text-gray-400">{description}</p>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-400 text-center">
            &copy; {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

## Container Component

```typescript
// components/layout/Container.tsx
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({
  children,
  className = '',
  size = 'lg',
}: ContainerProps) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}
```

---

## Section Component

```typescript
// components/layout/Section.tsx
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'primary' | 'dark';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Section({
  children,
  className = '',
  background = 'white',
  padding = 'lg',
}: SectionProps) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50',
    dark: 'bg-gray-900 text-white',
  };

  const paddings = {
    sm: 'py-8 lg:py-12',
    md: 'py-12 lg:py-16',
    lg: 'py-16 lg:py-24',
    xl: 'py-24 lg:py-32',
  };

  return (
    <section className={`${backgrounds[background]} ${paddings[padding]} ${className}`}>
      {children}
    </section>
  );
}
```

---

## Usage Example

```typescript
// app/page.tsx
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';

export default function HomePage() {
  return (
    <>
      <Section background="white" padding="xl">
        <Container>
          <h1>Welcome</h1>
          <p>Content goes here</p>
        </Container>
      </Section>

      <Section background="gray" padding="lg">
        <Container size="md">
          <h2>Features</h2>
          {/* Feature cards */}
        </Container>
      </Section>

      <Section background="primary" padding="md">
        <Container>
          <h2>Call to Action</h2>
        </Container>
      </Section>
    </>
  );
}
```

```typescript
// app/layout.tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header
          siteName="MyCompany"
          navItems={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ]}
          ctaText="Book Demo"
          ctaHref="/demo"
        />
        <main>{children}</main>
        <Footer
          siteName="MyCompany"
          description="Building great products."
        />
      </body>
    </html>
  );
}
```
