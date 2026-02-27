# OpenAI Agents SDK - Structured Output Reference

Complete reference for structured outputs and Pydantic models in OpenAI Agents SDK v0.7.0+.

---

## Overview

Structured outputs ensure agents return data in a specific, validated format using Pydantic models:

| Feature | Description |
|---------|-------------|
| Type Safety | Responses match your schema |
| Validation | Pydantic validates output |
| IDE Support | Full autocomplete and type hints |
| Reliability | Consistent, parseable responses |

---

## Basic Structured Output

```python
from pydantic import BaseModel
from agents import Agent, Runner

class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

agent = Agent(
    name="Calendar Extractor",
    instructions="Extract calendar events from text.",
    output_type=CalendarEvent,  # Enforce structured output
)

result = await Runner.run(agent, "Meeting with John tomorrow at 3pm")

# Result is typed as CalendarEvent
event: CalendarEvent = result.final_output
print(f"Event: {event.name}")
print(f"Date: {event.date}")
print(f"Participants: {event.participants}")
```

---

## Complex Models

### Nested Models

```python
from pydantic import BaseModel
from typing import Optional

class Address(BaseModel):
    street: str
    city: str
    country: str
    postal_code: Optional[str] = None

class Contact(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Address

class ExtractedContacts(BaseModel):
    contacts: list[Contact]
    total_count: int

agent = Agent(
    name="Contact Extractor",
    instructions="Extract contact information from text.",
    output_type=ExtractedContacts,
)
```

### With Enums

```python
from pydantic import BaseModel
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskCategory(str, Enum):
    BUG = "bug"
    FEATURE = "feature"
    IMPROVEMENT = "improvement"

class Task(BaseModel):
    title: str
    description: str
    priority: Priority
    category: TaskCategory
    estimated_hours: float

agent = Agent(
    name="Task Extractor",
    instructions="Extract tasks from meeting notes.",
    output_type=Task,
)
```

### With Field Constraints

```python
from pydantic import BaseModel, Field
from typing import Annotated

class ProductReview(BaseModel):
    product_name: str
    rating: Annotated[int, Field(ge=1, le=5, description="Rating from 1 to 5")]
    pros: list[str] = Field(min_length=1, max_length=5)
    cons: list[str] = Field(default_factory=list, max_length=5)
    summary: str = Field(max_length=500)
    recommend: bool

agent = Agent(
    name="Review Analyzer",
    instructions="Analyze product reviews.",
    output_type=ProductReview,
)
```

---

## Multiple Output Types

### Union Types

```python
from pydantic import BaseModel
from typing import Union

class OrderQuery(BaseModel):
    order_id: str
    action: str = "check_status"

class ProductQuery(BaseModel):
    product_name: str
    query_type: str

class GeneralQuery(BaseModel):
    question: str

# Agent decides which output type to use
QueryType = Union[OrderQuery, ProductQuery, GeneralQuery]

agent = Agent(
    name="Query Classifier",
    instructions="""Classify user queries:
    - Order-related: Extract order_id
    - Product-related: Extract product_name
    - General: Capture the question""",
    output_type=QueryType,
)
```

### Lists

```python
from pydantic import BaseModel

class CalendarEvent(BaseModel):
    name: str
    date: str
    time: str
    participants: list[str]
    location: str | None = None

class ExtractedEvents(BaseModel):
    events: list[CalendarEvent]
    summary: str

agent = Agent(
    name="Calendar Extractor",
    instructions="""Extract all calendar events from text.
    Identify event names, dates, times, participants, and locations.
    Provide a brief summary of all events found.""",
    output_type=ExtractedEvents,
)

async def main():
    text = """
    Meeting with John and Sarah tomorrow at 2pm in Conference Room A.
    Project review on Friday at 10am with the whole team.
    Lunch with clients next Monday at noon at Chez Pierre.
    """

    result = await Runner.run(agent, text)
    output: ExtractedEvents = result.final_output

    print(f"Found {len(output.events)} events:")
    for event in output.events:
        print(f"  - {event.name} on {event.date} at {event.time}")
        print(f"    Participants: {', '.join(event.participants)}")
        if event.location:
            print(f"    Location: {event.location}")

    print(f"\nSummary: {output.summary}")
```

---

## Accessing Structured Output

### Type-Safe Access

```python
result = await Runner.run(agent, input_text)

# Direct access (already typed)
output = result.final_output
print(output.field_name)

# Explicit cast with validation
output = result.final_output_as(CalendarEvent)
```

### With Error Handling

```python
from pydantic import ValidationError

try:
    result = await Runner.run(agent, input_text)
    output = result.final_output_as(CalendarEvent)
    print(f"Event: {output.name}")
except ValidationError as e:
    print(f"Invalid output format: {e}")
except Exception as e:
    print(f"Agent error: {e}")
```

---

## Structured Output Patterns

### Data Extraction

```python
from pydantic import BaseModel
from typing import Optional

class Invoice(BaseModel):
    invoice_number: str
    date: str
    vendor: str
    total_amount: float
    currency: str = "USD"
    line_items: list[dict]

agent = Agent(
    name="Invoice Parser",
    instructions="""Parse invoice documents and extract:
    - Invoice number
    - Date
    - Vendor name
    - Total amount with currency
    - Individual line items""",
    output_type=Invoice,
)
```

### Classification

```python
from pydantic import BaseModel
from enum import Enum

class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class SentimentAnalysis(BaseModel):
    sentiment: Sentiment
    confidence: float
    key_phrases: list[str]
    reasoning: str

agent = Agent(
    name="Sentiment Analyzer",
    instructions="Analyze the sentiment of the given text.",
    output_type=SentimentAnalysis,
)
```

### Decision Making

```python
from pydantic import BaseModel
from typing import Optional

class Decision(BaseModel):
    action: str
    reason: str
    confidence: float
    alternatives: list[str] = []
    risks: list[str] = []

agent = Agent(
    name="Decision Helper",
    instructions="""Help users make decisions by:
    - Recommending an action
    - Explaining the reasoning
    - Providing confidence level (0-1)
    - Listing alternatives
    - Identifying risks""",
    output_type=Decision,
)
```

---

## Structured Output with Tools

```python
from pydantic import BaseModel
from agents import Agent, Runner, function_tool

class InventoryStatus(BaseModel):
    product_name: str
    in_stock: bool
    quantity: int
    reorder_needed: bool

@function_tool
def check_inventory(product_id: str) -> dict:
    """Check inventory for a product."""
    # Simulated inventory lookup
    return {
        "product_id": product_id,
        "quantity": 50,
        "reorder_threshold": 20
    }

agent = Agent(
    name="Inventory Checker",
    instructions="""Check inventory and determine status.
    Use the check_inventory tool to get data.
    Determine if reorder is needed based on quantity vs threshold.""",
    tools=[check_inventory],
    output_type=InventoryStatus,
)
```

---

## Structured Output in Multi-Agent

```python
from pydantic import BaseModel
from agents import Agent, Runner

# Specialist output types
class TechnicalIssue(BaseModel):
    category: str
    severity: str
    steps_to_resolve: list[str]

class BillingIssue(BaseModel):
    issue_type: str
    amount_affected: float | None
    resolution: str

# Specialist agents with structured output
technical_agent = Agent(
    name="Technical Support",
    instructions="Diagnose technical issues.",
    output_type=TechnicalIssue,
)

billing_agent = Agent(
    name="Billing Support",
    instructions="Handle billing issues.",
    output_type=BillingIssue,
)

# Triage agent routes to specialists
triage_agent = Agent(
    name="Triage",
    instructions="Route to appropriate specialist.",
    handoffs=[technical_agent, billing_agent],
)
```

---

## Best Practices

### 1. Keep Models Simple

```python
# Good: Focused model
class OrderStatus(BaseModel):
    order_id: str
    status: str
    estimated_delivery: str

# Avoid: Overloaded model
class Everything(BaseModel):
    order_id: str
    status: str
    customer_name: str
    customer_email: str
    all_items: list[dict]
    payment_info: dict
    shipping_info: dict
    # ... too many fields
```

### 2. Use Optional Fields Wisely

```python
from typing import Optional

class FlexibleOutput(BaseModel):
    required_field: str
    optional_field: Optional[str] = None
    with_default: str = "default_value"
```

### 3. Add Field Descriptions

```python
from pydantic import BaseModel, Field

class WellDocumented(BaseModel):
    name: str = Field(description="Full name of the person")
    age: int = Field(ge=0, le=150, description="Age in years")
    email: str = Field(description="Valid email address")
```

### 4. Validate at Runtime

```python
result = await Runner.run(agent, input_text)

# Always use final_output_as for type safety
try:
    output = result.final_output_as(MyModel)
except Exception:
    # Handle invalid output
    output = MyModel(field="default")
```
