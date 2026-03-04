# ChatKit Server - Custom Actions Reference

Complete guide to handling widget actions and custom interactions.

---

## Overview

Custom actions enable:
- Widget button clicks
- Form submissions
- Cart operations
- Booking confirmations
- Any custom interaction

---

## Action Flow

```
1. Agent yields WidgetEvent with onClickAction
2. User clicks widget button
3. ChatKit sends action to backend
4. handle_custom_action processes it
5. Server yields response events
```

---

## Implementing handle_custom_action

```python
from chatkit.server import ChatKitServer, ThreadMetadata
from chatkit.server.events import TextDeltaEvent, WidgetEvent
from typing import Any, AsyncIterator

class MyChatKitServer(ChatKitServer):
    async def handle_custom_action(
        self,
        thread: ThreadMetadata,
        action: str,
        payload: dict,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """
        Handle custom actions from widgets.

        Args:
            thread: Current thread
            action: Action name (e.g., "book_appointment")
            payload: Data from widget (e.g., {"date": "2026-02-26"})
            context: Request context

        Yields:
            Response events
        """

        if action == "book_appointment":
            yield from self._handle_booking(payload)

        elif action == "add_to_cart":
            yield from self._handle_cart(payload)

        else:
            yield TextDeltaEvent(f"Unknown action: {action}")

    async def _handle_booking(self, payload: dict):
        date = payload.get("date")
        time = payload.get("time")

        yield TextDeltaEvent(f"Booking your appointment for {date} at {time}...\n")

        # Process booking
        try:
            booking_id = await create_booking(date, time)
            yield TextDeltaEvent(f"Confirmed! Booking ID: {booking_id}")

            # Show confirmation card
            yield WidgetEvent({
                "type": "card",
                "title": "Appointment Confirmed",
                "fields": [
                    {"label": "Date", "value": date},
                    {"label": "Time", "value": time},
                    {"label": "ID", "value": booking_id},
                ],
                "actions": [
                    {
                        "label": "Add to Calendar",
                        "onClickAction": "add_to_calendar",
                        "payload": {"booking_id": booking_id},
                    },
                    {
                        "label": "Cancel",
                        "onClickAction": "cancel_booking",
                        "payload": {"booking_id": booking_id},
                    },
                ],
            })

        except Exception as e:
            yield TextDeltaEvent(f"Failed to book: {e}")

    async def _handle_cart(self, payload: dict):
        product_id = payload.get("productId")
        quantity = payload.get("quantity", 1)

        # Add to cart
        await add_to_cart(product_id, quantity)

        yield TextDeltaEvent(f"Added {quantity}x to your cart! ")

        # Show cart summary
        cart = await get_cart()
        yield WidgetEvent({
            "type": "button",
            "label": f"View Cart ({len(cart)} items)",
            "onClickAction": "view_cart",
        })
```

---

## Common Action Patterns

### E-commerce Actions

```python
async def handle_custom_action(self, thread, action, payload, context):
    # Add to cart
    if action == "add_to_cart":
        product_id = payload.get("productId")
        quantity = payload.get("quantity", 1)
        await self.cart_service.add(product_id, quantity)
        yield TextDeltaEvent("Added to cart!")

    # Remove from cart
    elif action == "remove_from_cart":
        product_id = payload.get("productId")
        await self.cart_service.remove(product_id)
        yield TextDeltaEvent("Removed from cart.")

    # View cart
    elif action == "view_cart":
        cart = await self.cart_service.get()
        yield TextDeltaEvent("Your cart:\n\n")

        for item in cart.items:
            yield TextDeltaEvent(f"• {item.name} x{item.quantity} - ${item.total:.2f}\n")

        yield TextDeltaEvent(f"\n**Total: ${cart.total:.2f}**\n\n")

        yield WidgetEvent({
            "type": "button",
            "label": "Checkout",
            "onClickAction": "checkout",
        })

    # Checkout
    elif action == "checkout":
        yield TextDeltaEvent("Proceeding to checkout...\n")
        checkout_url = await self.cart_service.create_checkout()
        yield WidgetEvent({
            "type": "button",
            "label": "Complete Payment",
            "url": checkout_url,
            "openInNewTab": True,
        })
```

### Booking Actions

```python
async def handle_custom_action(self, thread, action, payload, context):
    # Select date
    if action == "select_date":
        date = payload.get("date")
        slots = await self.booking_service.get_slots(date)

        yield TextDeltaEvent(f"Available times for {date}:\n\n")

        yield WidgetEvent({
            "type": "listView",
            "items": [
                {
                    "title": slot.time,
                    "subtitle": f"with {slot.provider}",
                    "onClickAction": "select_slot",
                    "payload": {"date": date, "time": slot.time, "slot_id": slot.id},
                }
                for slot in slots
                if slot.available
            ],
        })

    # Select time slot
    elif action == "select_slot":
        date = payload.get("date")
        time = payload.get("time")
        slot_id = payload.get("slot_id")

        yield TextDeltaEvent(f"Selected {date} at {time}.\n\n")
        yield TextDeltaEvent("Please confirm your booking:\n\n")

        yield WidgetEvent({
            "type": "card",
            "title": "Confirm Appointment",
            "fields": [
                {"label": "Date", "value": date},
                {"label": "Time", "value": time},
            ],
            "actions": [
                {
                    "label": "Confirm",
                    "onClickAction": "confirm_booking",
                    "payload": {"slot_id": slot_id},
                },
                {
                    "label": "Change",
                    "onClickAction": "change_slot",
                },
            ],
        })

    # Confirm booking
    elif action == "confirm_booking":
        slot_id = payload.get("slot_id")

        booking = await self.booking_service.confirm(slot_id)

        yield TextDeltaEvent("Your appointment is confirmed!\n\n")

        yield WidgetEvent({
            "type": "card",
            "title": "Booking Confirmed",
            "fields": [
                {"label": "Confirmation #", "value": booking.confirmation_id},
                {"label": "Date", "value": booking.date},
                {"label": "Time", "value": booking.time},
                {"label": "Location", "value": booking.location},
            ],
        })

    # Cancel booking
    elif action == "cancel_booking":
        booking_id = payload.get("booking_id")
        await self.booking_service.cancel(booking_id)
        yield TextDeltaEvent("Booking cancelled.")
```

### Form Actions

```python
async def handle_custom_action(self, thread, action, payload, context):
    # Contact form
    if action == "submit_contact_form":
        name = payload.get("name")
        email = payload.get("email")
        message = payload.get("message")

        # Validate
        if not all([name, email, message]):
            yield TextDeltaEvent("Please fill all fields.")
            return

        # Process
        ticket_id = await self.support_service.create_ticket(
            name=name,
            email=email,
            message=message,
        )

        yield TextDeltaEvent(f"Thank you, {name}! ")
        yield TextDeltaEvent(f"Your ticket #{ticket_id} has been created. ")
        yield TextDeltaEvent("We'll respond to you at {email}.")

    # Feedback
    elif action == "submit_feedback":
        rating = payload.get("rating")
        comment = payload.get("comment")

        await self.feedback_service.submit(
            thread_id=thread.id,
            rating=rating,
            comment=comment,
        )

        yield TextDeltaEvent("Thank you for your feedback!")
```

---

## Creating Widgets in respond()

Generate widgets that users can interact with:

```python
async def respond(self, thread, input, context):
    message = input.content.lower()

    if "book" in message or "appointment" in message:
        yield TextDeltaEvent("I can help you book an appointment!\n\n")
        yield TextDeltaEvent("Please select a date:\n\n")

        # Show date picker
        from datetime import date, timedelta

        dates = [date.today() + timedelta(days=i) for i in range(1, 8)]

        yield WidgetEvent({
            "type": "listView",
            "items": [
                {
                    "title": d.strftime("%A, %B %d"),
                    "onClickAction": "select_date",
                    "payload": {"date": d.isoformat()},
                }
                for d in dates
            ],
        })

    elif "products" in message or "shop" in message:
        products = await get_featured_products()

        yield TextDeltaEvent("Here are our featured products:\n\n")

        for product in products:
            yield WidgetEvent({
                "type": "card",
                "title": product.name,
                "description": product.description,
                "price": f"${product.price:.2f}",
                "image": product.image_url,
                "actions": [
                    {
                        "label": "Add to Cart",
                        "onClickAction": "add_to_cart",
                        "payload": {"productId": product.id},
                    },
                ],
            })

    else:
        # Normal agent response
        yield from self.agent_respond(input.content)
```

---

## Action Validation

Validate action payloads:

```python
from pydantic import BaseModel, ValidationError

class BookingPayload(BaseModel):
    date: str
    time: str
    slot_id: str

class CartPayload(BaseModel):
    productId: str
    quantity: int = 1

async def handle_custom_action(self, thread, action, payload, context):
    try:
        if action == "confirm_booking":
            validated = BookingPayload(**payload)
            yield from self._process_booking(validated)

        elif action == "add_to_cart":
            validated = CartPayload(**payload)
            yield from self._process_cart(validated)

    except ValidationError as e:
        yield TextDeltaEvent(f"Invalid data: {e}")
```

---

## Action Logging

Log actions for analytics:

```python
import logging

logger = logging.getLogger(__name__)

async def handle_custom_action(self, thread, action, payload, context):
    # Log action
    logger.info(
        "Custom action",
        extra={
            "thread_id": thread.id,
            "action": action,
            "payload": payload,
        }
    )

    # Track analytics
    await self.analytics.track(
        event="widget_action",
        properties={
            "action": action,
            "thread_id": thread.id,
        },
    )

    # Process action
    # ...
```

---

## Action Rate Limiting

Prevent abuse:

```python
from datetime import datetime, timedelta

class RateLimitedServer(ChatKitServer):
    action_timestamps: dict = {}
    RATE_LIMIT = 10  # actions per minute

    async def handle_custom_action(self, thread, action, payload, context):
        # Check rate limit
        key = f"{thread.id}:{action}"
        now = datetime.utcnow()

        timestamps = self.action_timestamps.get(key, [])
        timestamps = [t for t in timestamps if now - t < timedelta(minutes=1)]

        if len(timestamps) >= self.RATE_LIMIT:
            yield TextDeltaEvent("Too many requests. Please wait a moment.")
            return

        timestamps.append(now)
        self.action_timestamps[key] = timestamps

        # Process action
        # ...
```
