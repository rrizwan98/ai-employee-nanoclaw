# ChatKit - Widgets Reference

Complete guide to ChatKit interactive widgets (Button, Card, ListView).

---

## Overview

ChatKit widgets are interactive UI components that the AI can render in responses. They enable rich interactions like:

- Clickable buttons for actions
- Cards for displaying structured content
- List views for multiple options
- Forms for collecting user input

---

## Widget Types

| Widget | Use Case | Actions |
|--------|----------|---------|
| `Button` | Single action | Click triggers `onClickAction` |
| `Card` | Rich content display | Optional click action |
| `ListView` | Multiple items | Click on any item |

---

## Button Widget

### Basic Button

The AI returns this in its response:

```json
{
  "type": "button",
  "label": "Book Appointment",
  "onClickAction": "book_appointment"
}
```

### Button with Payload

```json
{
  "type": "button",
  "label": "View Product",
  "onClickAction": "view_product",
  "payload": {
    "productId": "prod_123",
    "name": "Premium Widget"
  }
}
```

### Button Styles

```json
{
  "type": "button",
  "label": "Confirm",
  "variant": "primary",  // primary, secondary, outline, ghost
  "onClickAction": "confirm_action"
}
```

---

## Card Widget

### Basic Card

```json
{
  "type": "card",
  "title": "Premium Plan",
  "description": "Best for growing businesses",
  "image": "https://example.com/image.png"
}
```

### Card with Action

```json
{
  "type": "card",
  "title": "Consultation Session",
  "description": "30-minute expert consultation",
  "price": "$99",
  "image": "https://example.com/consultation.png",
  "onClickAction": "select_service",
  "payload": {
    "serviceId": "consultation-30",
    "price": 99
  }
}
```

### Card with Multiple Actions

```json
{
  "type": "card",
  "title": "iPhone 15 Pro",
  "description": "Latest Apple smartphone",
  "price": "$999",
  "image": "https://example.com/iphone.png",
  "actions": [
    {
      "label": "Add to Cart",
      "onClickAction": "add_to_cart",
      "payload": { "productId": "iphone-15-pro" }
    },
    {
      "label": "Learn More",
      "onClickAction": "view_details",
      "payload": { "productId": "iphone-15-pro" }
    }
  ]
}
```

---

## ListView Widget

### Basic List

```json
{
  "type": "listView",
  "items": [
    {
      "title": "Morning Slot",
      "subtitle": "9:00 AM - 12:00 PM",
      "onClickAction": "select_slot",
      "payload": { "slot": "morning" }
    },
    {
      "title": "Afternoon Slot",
      "subtitle": "1:00 PM - 5:00 PM",
      "onClickAction": "select_slot",
      "payload": { "slot": "afternoon" }
    },
    {
      "title": "Evening Slot",
      "subtitle": "6:00 PM - 9:00 PM",
      "onClickAction": "select_slot",
      "payload": { "slot": "evening" }
    }
  ]
}
```

### List with Images

```json
{
  "type": "listView",
  "items": [
    {
      "title": "Dr. Smith",
      "subtitle": "Cardiologist",
      "image": "https://example.com/dr-smith.png",
      "onClickAction": "select_doctor",
      "payload": { "doctorId": "dr-smith" }
    },
    {
      "title": "Dr. Johnson",
      "subtitle": "General Practitioner",
      "image": "https://example.com/dr-johnson.png",
      "onClickAction": "select_doctor",
      "payload": { "doctorId": "dr-johnson" }
    }
  ]
}
```

---

## Handling Widget Actions (Frontend)

When a user clicks a widget, use `sendCustomAction`:

```typescript
const { control } = useChatKit({ api: { url: '/chatkit' } });

// The ChatKit component automatically calls sendCustomAction
// when users click widgets with onClickAction

// You can also trigger actions programmatically:
control.sendCustomAction('book_appointment', {
  date: '2026-02-26',
  time: '10:00 AM',
});
```

---

## Handling Widget Actions (Backend)

In your FastAPI ChatKit server:

```python
from chatkit.server import ChatKitServer, ThreadMetadata
from typing import Any, AsyncIterator

class MyChatKitServer(ChatKitServer):
    async def handle_custom_action(
        self,
        thread: ThreadMetadata,
        action: str,
        payload: dict,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """Handle widget click actions."""

        if action == "book_appointment":
            date = payload.get("date")
            time = payload.get("time")

            # Process the booking
            booking_id = await self.create_booking(date, time)

            # Respond to user
            yield TextDeltaEvent(
                f"Great! I've booked your appointment for {date} at {time}. "
                f"Your confirmation number is {booking_id}."
            )

        elif action == "add_to_cart":
            product_id = payload.get("productId")
            await self.add_to_cart(product_id)
            yield TextDeltaEvent("Added to your cart!")

        elif action == "select_doctor":
            doctor_id = payload.get("doctorId")
            # Show available slots for this doctor
            slots = await self.get_available_slots(doctor_id)
            yield WidgetEvent(create_slots_list(slots))
```

---

## Creating Widgets in Agent Tools

Use `function_tool` to return widgets:

```python
from agents import function_tool
import json

@function_tool
def show_available_products(category: str) -> str:
    """Show available products in a category.

    Args:
        category: Product category to display
    """
    products = get_products_by_category(category)

    widget = {
        "type": "listView",
        "items": [
            {
                "title": p["name"],
                "subtitle": f"${p['price']}",
                "image": p["image_url"],
                "onClickAction": "add_to_cart",
                "payload": {"productId": p["id"]}
            }
            for p in products
        ]
    }

    return f"Here are the products:\n\n```widget\n{json.dumps(widget)}\n```"
```

---

## Web Search URL Buttons

When using WebSearchTool, ChatKit automatically displays source URLs as buttons:

```python
from agents import Agent, WebSearchTool

agent = Agent(
    name="Research Assistant",
    tools=[WebSearchTool(search_context_size="medium")],
    instructions="Search the web and provide sources."
)

# When the agent uses web search, ChatKit will display:
# - Search results with clickable source buttons
# - Each button opens the source URL in a new tab
```

ChatKit renders search sources as:

```json
{
  "type": "button",
  "label": "View Source: Example.com",
  "url": "https://example.com/article",
  "variant": "outline",
  "openInNewTab": true
}
```

---

## Graph/Chart Display

ChatKit can display graphs generated by CodeInterpreterTool:

```python
from agents import Agent, CodeInterpreterTool

agent = Agent(
    name="Data Analyst",
    tools=[CodeInterpreterTool(tool_config={"type": "code_interpreter"})],
    instructions="Create charts using matplotlib."
)

# Agent can generate:
# - Bar charts
# - Line graphs
# - Pie charts
# - Scatter plots

# ChatKit displays them inline in the conversation
```

The agent's code:

```python
import matplotlib.pyplot as plt
import io
import base64

plt.figure(figsize=(10, 6))
plt.bar(['Q1', 'Q2', 'Q3', 'Q4'], [100, 150, 120, 180])
plt.title('Quarterly Sales')
plt.ylabel('Revenue ($K)')

# Save and return
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode()
```

---

## Complete Widget Example

### E-commerce Product Display

```python
def create_product_cards(products: list) -> dict:
    """Create product card widgets."""
    return {
        "type": "listView",
        "layout": "grid",
        "columns": 2,
        "items": [
            {
                "type": "card",
                "title": p["name"],
                "description": p["description"][:100] + "...",
                "price": f"${p['price']:.2f}",
                "image": p["image_url"],
                "badge": "Sale" if p.get("on_sale") else None,
                "actions": [
                    {
                        "label": "Add to Cart",
                        "onClickAction": "add_to_cart",
                        "payload": {
                            "productId": p["id"],
                            "name": p["name"],
                            "price": p["price"]
                        }
                    },
                    {
                        "label": "Details",
                        "onClickAction": "view_product",
                        "payload": {"productId": p["id"]}
                    }
                ]
            }
            for p in products
        ]
    }
```

### Appointment Booking Flow

```python
def create_time_slots(date: str, slots: list) -> dict:
    """Create time slot selection widget."""
    return {
        "type": "listView",
        "items": [
            {
                "title": slot["time"],
                "subtitle": f"with {slot['provider']}",
                "available": slot["available"],
                "onClickAction": "select_slot" if slot["available"] else None,
                "payload": {
                    "date": date,
                    "time": slot["time"],
                    "providerId": slot["provider_id"]
                } if slot["available"] else None
            }
            for slot in slots
        ]
    }
```

### Confirmation Card

```python
def create_confirmation_card(booking: dict) -> dict:
    """Create booking confirmation widget."""
    return {
        "type": "card",
        "title": "Booking Confirmed!",
        "description": f"Your appointment on {booking['date']} at {booking['time']}",
        "fields": [
            {"label": "Confirmation #", "value": booking["confirmation_id"]},
            {"label": "Provider", "value": booking["provider_name"]},
            {"label": "Location", "value": booking["location"]},
        ],
        "actions": [
            {
                "label": "Add to Calendar",
                "onClickAction": "add_to_calendar",
                "payload": booking
            },
            {
                "label": "Cancel Booking",
                "onClickAction": "cancel_booking",
                "payload": {"bookingId": booking["id"]}
            }
        ]
    }
```
