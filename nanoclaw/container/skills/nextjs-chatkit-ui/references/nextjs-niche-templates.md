# Next.js ChatKit UI - Niche Templates Reference

Pre-built templates for specific industries and use cases.

---

## Template Selection

| Niche | Keywords | Pages | ChatKit Greeting |
|-------|----------|-------|------------------|
| Restaurant | restaurant, food, menu, dine | Home, Menu, Reservations, About, Contact | "Welcome! Looking to make a reservation?" |
| Clinic | clinic, doctor, medical, health | Home, Services, Doctors, Appointments, Contact | "How can we help with your health today?" |
| E-commerce | shop, store, products, sell | Home, Products, Cart, About, Contact | "Need help finding the perfect product?" |
| SaaS | saas, software, platform, pricing | Home, Features, Pricing, About, Contact | "Questions about our platform?" |
| Portfolio | portfolio, personal, freelance | Home, Projects, About, Contact | "Interested in working together?" |
| Agency | agency, services, consulting | Home, Services, Portfolio, Team, Contact | "Ready to discuss your project?" |
| Education | course, learning, teach | Home, Courses, Instructors, About, Contact | "Looking for the right course?" |

---

## Restaurant Template

### Pages

```
app/
├── page.tsx              # Home with hero, menu preview
├── menu/page.tsx         # Full menu
├── reservations/page.tsx # Booking form
├── about/page.tsx        # Story, team
└── contact/page.tsx      # Location, hours
```

### Home Page

```typescript
// app/page.tsx
import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { MenuPreview } from '@/components/sections/MenuPreview';
import { Testimonials } from '@/components/sections/Testimonials';
import { CTA } from '@/components/sections/CTA';

export default function HomePage() {
  return (
    <>
      <Hero
        title="Authentic Italian Cuisine"
        subtitle="Experience the taste of Italy in the heart of the city"
        ctaText="Reserve a Table"
        ctaHref="/reservations"
        secondaryCtaText="View Menu"
        secondaryCtaHref="/menu"
      />
      <MenuPreview
        title="Our Specialties"
        items={[
          { name: 'Margherita Pizza', price: '$14', category: 'Pizza' },
          { name: 'Pasta Carbonara', price: '$16', category: 'Pasta' },
          { name: 'Tiramisu', price: '$8', category: 'Dessert' },
        ]}
      />
      <Features
        title="Why Dine With Us"
        features={[
          { title: 'Fresh Ingredients', description: 'Locally sourced daily', icon: '🥬' },
          { title: 'Authentic Recipes', description: 'Traditional Italian cooking', icon: '👨‍🍳' },
          { title: 'Cozy Atmosphere', description: 'Perfect for any occasion', icon: '🍷' },
        ]}
      />
      <CTA
        title="Ready to Experience Great Food?"
        ctaText="Make a Reservation"
        ctaHref="/reservations"
        variant="primary"
      />
    </>
  );
}
```

### ChatKit Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  startScreen: {
    greeting: 'Welcome to Bella Italia! Looking to make a reservation or check our menu?',
    prompts: [
      { label: 'Reserve Table', prompt: 'I want to make a reservation', icon: 'calendar' },
      { label: 'View Menu', prompt: 'Show me the menu', icon: 'book' },
      { label: 'Hours & Location', prompt: 'What are your hours?', icon: 'mapPin' },
    ],
  },
});
```

---

## Clinic Template

### Pages

```
app/
├── page.tsx               # Home with services overview
├── services/page.tsx      # Medical services
├── doctors/page.tsx       # Doctor profiles
├── appointments/page.tsx  # Booking
├── about/page.tsx         # About the clinic
└── contact/page.tsx       # Location, emergency
```

### Home Page

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <>
      <Hero
        title="Your Health, Our Priority"
        subtitle="Compassionate care with modern medicine"
        ctaText="Book Appointment"
        ctaHref="/appointments"
        secondaryCtaText="Our Services"
        secondaryCtaHref="/services"
      />
      <Services
        services={[
          { name: 'General Medicine', icon: '🩺', href: '/services/general' },
          { name: 'Pediatrics', icon: '👶', href: '/services/pediatrics' },
          { name: 'Cardiology', icon: '❤️', href: '/services/cardiology' },
          { name: 'Dermatology', icon: '🧴', href: '/services/dermatology' },
        ]}
      />
      <DoctorHighlights doctors={featuredDoctors} />
      <Testimonials testimonials={patientReviews} />
      <CTA
        title="Need Medical Assistance?"
        description="Our team is here to help. Book an appointment today."
        ctaText="Schedule Now"
        ctaHref="/appointments"
      />
    </>
  );
}
```

### ChatKit Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  startScreen: {
    greeting: 'Hello! How can we help with your health today?',
    prompts: [
      { label: 'Book Appointment', prompt: 'I need to schedule an appointment', icon: 'calendar' },
      { label: 'Find a Doctor', prompt: 'Help me find the right doctor', icon: 'search' },
      { label: 'Emergency', prompt: 'I have an urgent medical concern', icon: 'alert' },
    ],
  },
});
```

---

## E-commerce Template

### Pages

```
app/
├── page.tsx            # Home with featured products
├── products/page.tsx   # Product catalog
├── products/[id]/      # Product detail
├── cart/page.tsx       # Shopping cart
├── checkout/page.tsx   # Checkout flow
├── about/page.tsx      # Brand story
└── contact/page.tsx    # Customer support
```

### Home Page

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <>
      <Hero
        title="Premium Quality Products"
        subtitle="Discover our collection of handcrafted goods"
        ctaText="Shop Now"
        ctaHref="/products"
      />
      <FeaturedProducts products={featuredProducts} />
      <Categories categories={productCategories} />
      <Features
        features={[
          { title: 'Free Shipping', description: 'On orders over $50', icon: '📦' },
          { title: 'Easy Returns', description: '30-day return policy', icon: '↩️' },
          { title: 'Secure Checkout', description: '256-bit SSL encryption', icon: '🔒' },
        ]}
      />
      <Testimonials testimonials={customerReviews} />
      <Newsletter />
    </>
  );
}
```

### ChatKit Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  startScreen: {
    greeting: 'Hi! Need help finding the perfect product?',
    prompts: [
      { label: 'Browse Products', prompt: 'Show me your bestsellers', icon: 'star' },
      { label: 'Track Order', prompt: 'Where is my order?', icon: 'package' },
      { label: 'Size Guide', prompt: 'Help me find my size', icon: 'ruler' },
    ],
  },
});
```

---

## SaaS Template

### Pages

```
app/
├── page.tsx           # Home with value prop
├── features/page.tsx  # Feature breakdown
├── pricing/page.tsx   # Pricing plans
├── about/page.tsx     # Company info
├── blog/page.tsx      # Blog/resources
├── contact/page.tsx   # Sales contact
└── demo/page.tsx      # Demo request
```

### Home Page

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <>
      <Hero
        title="Scale Your Business with AI"
        subtitle="The all-in-one platform that grows with you"
        ctaText="Start Free Trial"
        ctaHref="/signup"
        secondaryCtaText="Watch Demo"
        secondaryCtaHref="/demo"
      />
      <LogoCloud logos={customerLogos} />
      <Features
        title="Everything You Need"
        features={[
          { title: 'Analytics', description: 'Real-time insights', icon: '📊' },
          { title: 'Automation', description: 'Save hours daily', icon: '🤖' },
          { title: 'Integrations', description: '100+ apps', icon: '🔌' },
          { title: 'Security', description: 'SOC 2 compliant', icon: '🔒' },
        ]}
      />
      <HowItWorks steps={workflowSteps} />
      <Pricing plans={pricingPlans} />
      <Testimonials testimonials={customerStories} />
      <CTA
        title="Ready to Transform Your Workflow?"
        ctaText="Start Free Trial"
        secondaryCtaText="Talk to Sales"
        variant="primary"
      />
    </>
  );
}
```

### ChatKit Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  startScreen: {
    greeting: 'Hey! Questions about our platform? I can help.',
    prompts: [
      { label: 'See Pricing', prompt: 'What are your pricing options?', icon: 'dollar' },
      { label: 'Book Demo', prompt: 'I want to schedule a demo', icon: 'calendar' },
      { label: 'Features', prompt: 'What features do you offer?', icon: 'list' },
    ],
  },
});
```

---

## Portfolio Template

### Pages

```
app/
├── page.tsx           # Home with intro
├── projects/page.tsx  # Project gallery
├── projects/[id]/     # Project detail
├── about/page.tsx     # Bio, skills
└── contact/page.tsx   # Contact form
```

### Home Page

```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <>
      <Hero
        title="John Doe"
        subtitle="Full-Stack Developer & Designer"
        ctaText="View My Work"
        ctaHref="/projects"
        secondaryCtaText="Get in Touch"
        secondaryCtaHref="/contact"
        align="left"
      />
      <FeaturedProjects projects={topProjects.slice(0, 3)} />
      <Skills skills={technicalSkills} />
      <Testimonials testimonials={clientReviews} />
      <CTA
        title="Let's Work Together"
        description="Available for freelance projects and full-time opportunities"
        ctaText="Contact Me"
      />
    </>
  );
}
```

### ChatKit Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  startScreen: {
    greeting: "Hi! I'm John's AI assistant. Interested in working together?",
    prompts: [
      { label: 'View Projects', prompt: 'Show me your best work', icon: 'folder' },
      { label: 'Hire Me', prompt: 'I have a project to discuss', icon: 'briefcase' },
      { label: 'About', prompt: 'Tell me about yourself', icon: 'user' },
    ],
  },
});
```

---

## Template Variables

When generating from templates, replace these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{PROJECT_NAME}` | Project/business name | "Bella Italia" |
| `{DESCRIPTION}` | Site description | "Authentic Italian Restaurant" |
| `{HERO_TITLE}` | Main headline | "Taste of Italy" |
| `{HERO_SUBTITLE}` | Supporting text | "Fresh, authentic cuisine" |
| `{BRAND_COLOR}` | Primary color hex | "#DC2626" |
| `{BACKEND_URL}` | ChatKit API URL | "http://localhost:8000/chatkit" |
| `{GREETING}` | ChatKit welcome | "Welcome! How can I help?" |

---

## Niche Detection

Detect niche from user request:

```python
def detect_niche(request: str) -> str:
    request_lower = request.lower()

    niches = {
        'restaurant': ['restaurant', 'food', 'menu', 'dining', 'cafe', 'bistro'],
        'clinic': ['clinic', 'doctor', 'medical', 'health', 'hospital', 'dental'],
        'ecommerce': ['shop', 'store', 'product', 'sell', 'ecommerce', 'cart'],
        'saas': ['saas', 'software', 'platform', 'pricing', 'subscription'],
        'portfolio': ['portfolio', 'personal', 'freelance', 'designer', 'developer'],
        'agency': ['agency', 'services', 'consulting', 'studio'],
        'education': ['course', 'learn', 'teach', 'school', 'training'],
    }

    for niche, keywords in niches.items():
        if any(kw in request_lower for kw in keywords):
            return niche

    return 'saas'  # Default to SaaS template
```
