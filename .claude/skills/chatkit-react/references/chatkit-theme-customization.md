# ChatKit - Theme Customization Reference

Complete guide to customizing ChatKit appearance.

---

## Theme Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  theme: {
    colorScheme: 'light' | 'dark' | 'system',
    radius: 'sharp' | 'soft' | 'round',
    density: 'compact' | 'normal' | 'relaxed',
    typography: {
      fontSize: 'small' | 'medium' | 'large',
    },
    color: {
      accent: {
        primary: string,  // Hex color
        level: 1 | 2 | 3, // Intensity
      },
    },
  },
});
```

---

## Color Scheme

### Light Mode

```typescript
theme: {
  colorScheme: 'light',
}
```

- White background
- Dark text
- Light borders

### Dark Mode

```typescript
theme: {
  colorScheme: 'dark',
}
```

- Dark background
- Light text
- Subtle borders

### System Mode

```typescript
theme: {
  colorScheme: 'system',
}
```

- Follows user's OS preference
- Automatically switches with system theme

---

## Border Radius Styles

### Sharp (No radius)

```typescript
theme: {
  radius: 'sharp',
}
```

Square corners for modern, minimal look.

### Soft (Subtle radius)

```typescript
theme: {
  radius: 'soft',
}
```

Slightly rounded corners for balanced appearance.

### Round (Full radius)

```typescript
theme: {
  radius: 'round',
}
```

Fully rounded corners for friendly, approachable feel.

---

## Density Options

### Compact

```typescript
theme: {
  density: 'compact',
}
```

- Reduced padding and margins
- More content visible
- Best for desktop with limited space

### Normal

```typescript
theme: {
  density: 'normal',
}
```

- Standard spacing
- Balanced readability
- Default recommended setting

### Relaxed

```typescript
theme: {
  density: 'relaxed',
}
```

- Increased padding
- More breathing room
- Best for touch interfaces

---

## Typography

### Font Size Options

```typescript
theme: {
  typography: {
    fontSize: 'small' | 'medium' | 'large',
  },
}
```

| Size | Use Case |
|------|----------|
| `small` | Compact interfaces, power users |
| `medium` | Default, balanced readability |
| `large` | Accessibility, touch interfaces |

---

## Accent Colors

### Primary Color

```typescript
theme: {
  color: {
    accent: {
      primary: '#3B82F6',  // Blue
      level: 2,
    },
  },
}
```

### Color Level

| Level | Effect |
|-------|--------|
| `1` | Light, subtle accent |
| `2` | Balanced, default |
| `3` | Bold, prominent accent |

---

## Pre-Built Theme Presets

### Corporate Blue

```typescript
theme: {
  colorScheme: 'light',
  radius: 'soft',
  density: 'normal',
  color: {
    accent: {
      primary: '#2563EB',
      level: 2,
    },
  },
}
```

### Startup Purple

```typescript
theme: {
  colorScheme: 'dark',
  radius: 'round',
  density: 'relaxed',
  color: {
    accent: {
      primary: '#8B5CF6',
      level: 2,
    },
  },
}
```

### Healthcare Green

```typescript
theme: {
  colorScheme: 'light',
  radius: 'round',
  density: 'relaxed',
  color: {
    accent: {
      primary: '#059669',
      level: 1,
    },
  },
}
```

### E-commerce Orange

```typescript
theme: {
  colorScheme: 'light',
  radius: 'soft',
  density: 'compact',
  color: {
    accent: {
      primary: '#EA580C',
      level: 2,
    },
  },
}
```

### Fintech Dark

```typescript
theme: {
  colorScheme: 'dark',
  radius: 'sharp',
  density: 'compact',
  color: {
    accent: {
      primary: '#06B6D4',
      level: 3,
    },
  },
}
```

### Minimal Gray

```typescript
theme: {
  colorScheme: 'light',
  radius: 'sharp',
  density: 'normal',
  color: {
    accent: {
      primary: '#6B7280',
      level: 1,
    },
  },
}
```

---

## Dynamic Theme Switching

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useState } from 'react';

type ColorScheme = 'light' | 'dark' | 'system';

export function ThemeableChat() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');

  const { control } = useChatKit({
    api: { url: '/chatkit' },
    theme: {
      colorScheme: colorScheme,
      radius: 'round',
    },
    header: {
      enabled: true,
      rightAction: {
        icon: colorScheme === 'dark' ? 'light-mode' : 'dark-mode',
        onClick: () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark'),
      },
    },
  });

  return <ChatKit control={control} className="h-full w-full" />;
}
```

---

## Brand Colors by Industry

| Industry | Recommended Color | Hex |
|----------|-------------------|-----|
| Finance | Blue | `#2563EB` |
| Healthcare | Green | `#059669` |
| Technology | Purple | `#7C3AED` |
| E-commerce | Orange | `#EA580C` |
| Education | Teal | `#0D9488` |
| Legal | Navy | `#1E3A8A` |
| Creative | Pink | `#DB2777` |
| Hospitality | Gold | `#D97706` |

---

## CSS Custom Properties

ChatKit exposes CSS custom properties for advanced styling:

```css
/* Override in your global styles */
.chatkit-root {
  --chatkit-accent-primary: #3B82F6;
  --chatkit-bg-primary: #FFFFFF;
  --chatkit-bg-secondary: #F3F4F6;
  --chatkit-text-primary: #111827;
  --chatkit-text-secondary: #6B7280;
  --chatkit-border-color: #E5E7EB;
  --chatkit-border-radius: 8px;
}
```

---

## Responsive Theme Example

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useState } from 'react';

export function ResponsiveChat() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { control } = useChatKit({
    api: { url: '/chatkit' },
    theme: {
      colorScheme: 'system',
      radius: 'round',
      density: isMobile ? 'relaxed' : 'normal',
      typography: {
        fontSize: isMobile ? 'large' : 'medium',
      },
    },
  });

  return <ChatKit control={control} className="h-full w-full" />;
}
```

---

## Accessibility Considerations

### High Contrast

```typescript
theme: {
  colorScheme: 'light',
  color: {
    accent: {
      primary: '#1D4ED8',  // Darker blue for contrast
      level: 3,
    },
  },
}
```

### Large Text

```typescript
theme: {
  typography: {
    fontSize: 'large',
  },
  density: 'relaxed',
}
```

### Reduced Motion

ChatKit respects `prefers-reduced-motion` automatically.
