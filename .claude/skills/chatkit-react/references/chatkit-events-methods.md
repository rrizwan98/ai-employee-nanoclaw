# ChatKit - Events and Methods Reference

Complete reference for ChatKit events and control methods.

---

## Events

ChatKit emits custom DOM events that you can listen to for tracking and integration.

### Event Types

```typescript
type ChatKitEvents = {
  "chatkit.response.start": CustomEvent<void>;
  "chatkit.response.end": CustomEvent<void>;
  "chatkit.thread.change": CustomEvent<{ threadId: string | null }>;
  "chatkit.thread.load.start": CustomEvent<{ threadId: string }>;
  "chatkit.thread.load.end": CustomEvent<{ threadId: string }>;
};
```

### Event Descriptions

| Event | Payload | When Fired |
|-------|---------|------------|
| `chatkit.response.start` | `void` | AI starts generating response |
| `chatkit.response.end` | `void` | AI finishes response |
| `chatkit.thread.change` | `{ threadId: string \| null }` | User switches threads |
| `chatkit.thread.load.start` | `{ threadId: string }` | Thread data loading begins |
| `chatkit.thread.load.end` | `{ threadId: string }` | Thread data loading completes |

---

## Listening to Events

### Using useRef

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useRef } from 'react';

function ChatWithEvents() {
  const chatKitRef = useRef<HTMLDivElement>(null);
  const { control } = useChatKit({
    api: { url: '/chatkit' },
  });

  useEffect(() => {
    const element = chatKitRef.current;
    if (!element) return;

    // Response events
    const onResponseStart = () => {
      console.log('AI is thinking...');
    };

    const onResponseEnd = () => {
      console.log('AI finished responding');
    };

    // Thread events
    const onThreadChange = (e: CustomEvent<{ threadId: string | null }>) => {
      console.log('Thread changed to:', e.detail.threadId);
      // Save to localStorage for persistence
      if (e.detail.threadId) {
        localStorage.setItem('lastThreadId', e.detail.threadId);
      }
    };

    const onThreadLoadStart = (e: CustomEvent<{ threadId: string }>) => {
      console.log('Loading thread:', e.detail.threadId);
    };

    const onThreadLoadEnd = (e: CustomEvent<{ threadId: string }>) => {
      console.log('Thread loaded:', e.detail.threadId);
    };

    // Add listeners
    element.addEventListener('chatkit.response.start', onResponseStart);
    element.addEventListener('chatkit.response.end', onResponseEnd);
    element.addEventListener('chatkit.thread.change', onThreadChange as EventListener);
    element.addEventListener('chatkit.thread.load.start', onThreadLoadStart as EventListener);
    element.addEventListener('chatkit.thread.load.end', onThreadLoadEnd as EventListener);

    // Cleanup
    return () => {
      element.removeEventListener('chatkit.response.start', onResponseStart);
      element.removeEventListener('chatkit.response.end', onResponseEnd);
      element.removeEventListener('chatkit.thread.change', onThreadChange as EventListener);
      element.removeEventListener('chatkit.thread.load.start', onThreadLoadStart as EventListener);
      element.removeEventListener('chatkit.thread.load.end', onThreadLoadEnd as EventListener);
    };
  }, []);

  return (
    <div ref={chatKitRef}>
      <ChatKit control={control} className="h-full w-full" />
    </div>
  );
}
```

---

## Control Methods

The `control` object provides methods to programmatically interact with ChatKit.

### Method Reference

| Method | Signature | Description |
|--------|-----------|-------------|
| `focusComposer` | `() => void` | Focus the message input |
| `setThreadId` | `(id: string \| null) => void` | Switch threads |
| `sendUserMessage` | `(message: string) => void` | Send a message |
| `fetchUpdates` | `() => Promise<void>` | Refresh from server |
| `sendCustomAction` | `(action: string, payload: object) => void` | Trigger widget action |

---

### focusComposer()

Focus the message input field.

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Focus on mount
useEffect(() => {
  control.focusComposer();
}, [control]);

// Focus on button click
<button onClick={() => control.focusComposer()}>
  Start Chatting
</button>
```

---

### setThreadId(id)

Switch to a specific thread or create a new one.

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Switch to existing thread
control.setThreadId('thread_abc123');

// Create new thread (pass null)
control.setThreadId(null);

// Restore from localStorage
useEffect(() => {
  const savedThreadId = localStorage.getItem('lastThreadId');
  if (savedThreadId) {
    control.setThreadId(savedThreadId);
  }
}, [control]);
```

---

### sendUserMessage(message)

Programmatically send a message as the user.

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Send greeting automatically
useEffect(() => {
  const timer = setTimeout(() => {
    control.sendUserMessage('Hello, I need help getting started');
  }, 2000);
  return () => clearTimeout(timer);
}, [control]);

// Quick action buttons
<button onClick={() => control.sendUserMessage('Show me pricing')}>
  View Pricing
</button>
<button onClick={() => control.sendUserMessage('Contact support')}>
  Contact Support
</button>
```

---

### fetchUpdates()

Refresh the current thread with latest server data.

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Manual refresh button
<button onClick={async () => {
  await control.fetchUpdates();
  console.log('Thread refreshed');
}}>
  Refresh
</button>

// Periodic refresh (polling)
useEffect(() => {
  const interval = setInterval(async () => {
    await control.fetchUpdates();
  }, 30000); // Every 30 seconds
  return () => clearInterval(interval);
}, [control]);
```

---

### sendCustomAction(action, payload)

Trigger a custom action (used with ChatKit widgets).

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// Book appointment from external button
control.sendCustomAction('book_appointment', {
  date: '2026-02-26',
  time: '10:00 AM',
  service: 'Consultation',
});

// Add to cart
control.sendCustomAction('add_to_cart', {
  productId: 'prod_123',
  quantity: 2,
});

// Submit form data
control.sendCustomAction('submit_form', {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'I have a question',
});
```

---

## Complete Example: Analytics Integration

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useRef } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

function trackEvent(event: AnalyticsEvent) {
  // Send to your analytics service
  console.log('Analytics:', event);
  // gtag('event', event.event, event.properties);
  // mixpanel.track(event.event, event.properties);
}

export function AnalyticsChat() {
  const chatKitRef = useRef<HTMLDivElement>(null);
  const responseStartTime = useRef<number>(0);

  const { control } = useChatKit({
    api: { url: '/chatkit' },
  });

  useEffect(() => {
    const element = chatKitRef.current;
    if (!element) return;

    const onResponseStart = () => {
      responseStartTime.current = Date.now();
      trackEvent({ event: 'chat_response_started' });
    };

    const onResponseEnd = () => {
      const duration = Date.now() - responseStartTime.current;
      trackEvent({
        event: 'chat_response_completed',
        properties: { duration_ms: duration },
      });
    };

    const onThreadChange = (e: CustomEvent<{ threadId: string | null }>) => {
      trackEvent({
        event: e.detail.threadId ? 'chat_thread_switched' : 'chat_thread_created',
        properties: { thread_id: e.detail.threadId },
      });
    };

    element.addEventListener('chatkit.response.start', onResponseStart);
    element.addEventListener('chatkit.response.end', onResponseEnd);
    element.addEventListener('chatkit.thread.change', onThreadChange as EventListener);

    return () => {
      element.removeEventListener('chatkit.response.start', onResponseStart);
      element.removeEventListener('chatkit.response.end', onResponseEnd);
      element.removeEventListener('chatkit.thread.change', onThreadChange as EventListener);
    };
  }, []);

  return (
    <div ref={chatKitRef}>
      <ChatKit control={control} className="h-full w-full" />
    </div>
  );
}
```

---

## Thread Persistence Pattern

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useRef } from 'react';

const THREAD_STORAGE_KEY = 'chatkit_thread_id';

export function PersistentChat() {
  const chatKitRef = useRef<HTMLDivElement>(null);

  // Load saved thread ID
  const savedThreadId = typeof window !== 'undefined'
    ? localStorage.getItem(THREAD_STORAGE_KEY)
    : null;

  const { control } = useChatKit({
    api: { url: '/chatkit' },
    initialThread: savedThreadId ? { id: savedThreadId } : undefined,
  });

  useEffect(() => {
    const element = chatKitRef.current;
    if (!element) return;

    const onThreadChange = (e: CustomEvent<{ threadId: string | null }>) => {
      if (e.detail.threadId) {
        localStorage.setItem(THREAD_STORAGE_KEY, e.detail.threadId);
      } else {
        localStorage.removeItem(THREAD_STORAGE_KEY);
      }
    };

    element.addEventListener('chatkit.thread.change', onThreadChange as EventListener);
    return () => {
      element.removeEventListener('chatkit.thread.change', onThreadChange as EventListener);
    };
  }, []);

  return (
    <div ref={chatKitRef}>
      <ChatKit control={control} className="h-full w-full" />
    </div>
  );
}
```
