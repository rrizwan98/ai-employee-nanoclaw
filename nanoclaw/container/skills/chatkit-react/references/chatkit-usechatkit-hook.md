# ChatKit - useChatKit Hook Reference

Complete API reference for the `useChatKit` hook from `@openai/chatkit-react`.

---

## Basic Usage

```typescript
import { ChatKit, useChatKit } from '@openai/chatkit-react';

function ChatComponent() {
  const { control } = useChatKit({
    api: {
      url: 'http://localhost:8000/chatkit',
      domainKey: 'my-domain',
    },
  });

  return <ChatKit control={control} className="h-full w-full" />;
}
```

---

## Configuration Options

### api (Required)

```typescript
api: {
  url: string;                         // ChatKit backend endpoint
  domainKey?: string;                  // Domain identifier for multi-tenant
  headers?: Record<string, string>;    // Custom headers for requests
}
```

**Example:**

```typescript
api: {
  url: 'https://api.example.com/chatkit',
  domainKey: 'production',
  headers: {
    'X-Custom-Header': 'value',
  },
}
```

---

### theme

Control visual appearance:

```typescript
theme: {
  colorScheme: 'light' | 'dark' | 'system';  // Color mode
  radius: 'sharp' | 'soft' | 'round';        // Border radius style
  density: 'compact' | 'normal' | 'relaxed'; // Spacing density
  typography: {
    fontSize: 'small' | 'medium' | 'large';
  };
  color: {
    accent: {
      primary: string;   // Hex color (e.g., '#3B82F6')
      level: 1 | 2 | 3;  // Color intensity (1=light, 3=bold)
    };
  };
}
```

**Example - Dark Theme with Purple Accent:**

```typescript
theme: {
  colorScheme: 'dark',
  radius: 'round',
  density: 'normal',
  color: {
    accent: {
      primary: '#8B5CF6',  // Purple
      level: 2,
    },
  },
}
```

---

### header

Configure the chat header:

```typescript
header: {
  enabled: boolean;           // Show/hide header
  title?: string;             // Custom title text
  rightAction?: {
    icon: string;             // Icon name
    onClick: () => void;      // Click handler
  };
}
```

**Available Icons:**
- `menu`, `settings`, `light-mode`, `dark-mode`, `close`, `minimize`

**Example:**

```typescript
header: {
  enabled: true,
  title: 'Support Chat',
  rightAction: {
    icon: 'settings',
    onClick: () => openSettings(),
  },
}
```

---

### history

Configure conversation history panel:

```typescript
history: {
  enabled: boolean;      // Show history panel
  showDelete: boolean;   // Allow deleting threads
  showRename: boolean;   // Allow renaming threads
}
```

**Example:**

```typescript
history: {
  enabled: true,
  showDelete: true,
  showRename: true,
}
```

---

### startScreen

Configure the initial welcome screen:

```typescript
startScreen: {
  greeting?: string;    // Welcome message
  prompts?: Array<{
    label: string;      // Button label
    prompt: string;     // Message to send when clicked
    icon?: string;      // Optional icon
  }>;
}
```

**Available Icons:**
- `lifesaver`, `info`, `question`, `lightning`, `book`, `code`, `chart`

**Example:**

```typescript
startScreen: {
  greeting: 'Hello! How can I assist you today?',
  prompts: [
    {
      label: 'Get Support',
      prompt: 'I need help with a technical issue',
      icon: 'lifesaver',
    },
    {
      label: 'Learn More',
      prompt: 'Tell me about your features',
      icon: 'info',
    },
    {
      label: 'Quick Question',
      prompt: 'I have a quick question',
      icon: 'question',
    },
  ],
}
```

---

### composer

Configure the message input:

```typescript
composer: {
  placeholder?: string;       // Placeholder text
  allowAttachments?: boolean; // Enable file uploads
  disabled?: boolean;         // Disable input
}
```

**Example:**

```typescript
composer: {
  placeholder: 'Type your message here...',
  allowAttachments: true,
  disabled: false,
}
```

---

### threadItemActions

Configure actions on messages:

```typescript
threadItemActions: {
  feedback?: boolean;  // Show thumbs up/down
  retry?: boolean;     // Show retry button
}
```

**Example:**

```typescript
threadItemActions: {
  feedback: true,
  retry: true,
}
```

---

### initialThread

Start with a specific thread:

```typescript
initialThread?: {
  id: string;        // Thread ID
  title?: string;    // Thread title
}
```

**Example:**

```typescript
initialThread: {
  id: 'thread_abc123',
  title: 'Previous Conversation',
}
```

---

## Complete Configuration Example

```typescript
const { control } = useChatKit({
  // Required
  api: {
    url: process.env.NEXT_PUBLIC_CHATKIT_API_URL!,
    domainKey: 'production',
  },

  // Theme
  theme: {
    colorScheme: 'light',
    radius: 'round',
    density: 'normal',
    typography: {
      fontSize: 'medium',
    },
    color: {
      accent: {
        primary: '#3B82F6',
        level: 2,
      },
    },
  },

  // Header
  header: {
    enabled: true,
    title: 'AI Assistant',
    rightAction: {
      icon: 'menu',
      onClick: () => console.log('Menu clicked'),
    },
  },

  // History
  history: {
    enabled: true,
    showDelete: true,
    showRename: true,
  },

  // Start Screen
  startScreen: {
    greeting: 'Welcome! How can I help?',
    prompts: [
      { label: 'Get Help', prompt: 'I need assistance', icon: 'lifesaver' },
      { label: 'FAQ', prompt: 'Show me FAQs', icon: 'question' },
    ],
  },

  // Composer
  composer: {
    placeholder: 'Ask me anything...',
    allowAttachments: true,
  },

  // Message Actions
  threadItemActions: {
    feedback: true,
    retry: true,
  },
});
```

---

## Control Object Methods

The `control` object returned by `useChatKit` provides these methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `focusComposer` | `() => void` | Focus the message input |
| `setThreadId` | `(id: string \| null) => void` | Switch threads or create new |
| `sendUserMessage` | `(message: string) => void` | Send message programmatically |
| `fetchUpdates` | `() => Promise<void>` | Fetch updates from server |
| `sendCustomAction` | `(action: string, payload: object) => void` | Trigger custom action |

**Example Usage:**

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Switch to existing thread
control.setThreadId('thread_123');

// Create new thread
control.setThreadId(null);

// Send message automatically
control.sendUserMessage('Hello, I need help');

// Focus input
control.focusComposer();

// Trigger custom action (for widgets)
control.sendCustomAction('book_appointment', {
  date: '2026-02-26',
  time: '10:00',
});
```
