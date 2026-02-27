# OpenAI Agents SDK - Handoffs & Multi-Agent Reference

Complete reference for agent-to-agent handoffs and multi-agent systems in OpenAI Agents SDK v0.7.0+.

---

## Overview

Handoffs enable agents to delegate tasks to specialized sub-agents:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Simple Handoff | Direct delegation | Language routing |
| Triage Pattern | Central router to specialists | Customer support |
| Callback Handoff | Execute logic on handoff | Logging, validation |
| Data Handoff | Pass structured data | Context transfer |

---

## Simple Handoffs

### Basic Agent Routing

```python
from agents import Agent, Runner

# Specialist agents
spanish_agent = Agent(
    name="Spanish Agent",
    instructions="You only speak Spanish. Help users in Spanish.",
)

english_agent = Agent(
    name="English Agent",
    instructions="You only speak English. Help users in English.",
)

# Triage agent routes based on language
triage_agent = Agent(
    name="Triage Agent",
    instructions="Route to the appropriate agent based on the language of the request.",
    handoffs=[spanish_agent, english_agent],
)

# Usage
result = await Runner.run(triage_agent, "Hola, ¿cómo estás?")
print(result.final_output)  # Spanish response
print(result.last_agent.name)  # "Spanish Agent"
```

### With Handoff Description

```python
billing_agent = Agent(
    name="Billing Support",
    instructions="Handle billing inquiries.",
    handoff_description="Transfer for payment issues, invoices, and billing questions.",
)

technical_agent = Agent(
    name="Technical Support",
    instructions="Handle technical issues.",
    handoff_description="Transfer for software bugs, errors, and technical problems.",
)

triage_agent = Agent(
    name="Triage",
    instructions="Route to the appropriate specialist.",
    handoffs=[billing_agent, technical_agent],
)
```

---

## Advanced Handoffs

### Custom Tool Name and Description

```python
from agents import Agent, handoff

billing_agent = Agent(
    name="Billing",
    instructions="Handle billing.",
)

technical_agent = Agent(
    name="Technical",
    instructions="Handle technical issues.",
)

triage_agent = Agent(
    name="Triage",
    instructions="Route to appropriate specialist.",
    handoffs=[
        billing_agent,  # Simple handoff
        handoff(
            agent=technical_agent,
            tool_name_override="transfer_to_tech_support",
            tool_description_override="Transfer for software bugs and technical issues",
        ),
    ],
)
```

### With Callback Function

```python
from agents import Agent, handoff, RunContextWrapper

async def log_handoff(ctx: RunContextWrapper):
    """Log when a handoff occurs."""
    print(f"Handoff triggered at {ctx.context.get('timestamp')}")
    # Could also: send notification, update database, etc.

escalation_agent = Agent(
    name="Escalation Handler",
    instructions="Handle escalated issues.",
)

triage_agent = Agent(
    name="Triage",
    instructions="Route to escalation for urgent matters.",
    handoffs=[
        handoff(
            agent=escalation_agent,
            on_handoff=log_handoff,
        ),
    ],
)
```

### With Input Data

```python
from pydantic import BaseModel
from agents import Agent, handoff, RunContextWrapper

class EscalationData(BaseModel):
    reason: str
    priority: str
    customer_tier: str

async def process_escalation(ctx: RunContextWrapper, data: EscalationData):
    """Process escalation data before handoff."""
    print(f"Escalation: {data.reason}")
    print(f"Priority: {data.priority}")
    print(f"Customer Tier: {data.customer_tier}")

escalation_agent = Agent(
    name="Escalation Handler",
    instructions="Handle escalated issues with priority context.",
)

triage_agent = Agent(
    name="Triage",
    instructions="""Route to escalation for urgent matters.
    When escalating, provide reason, priority (low/medium/high/critical),
    and customer tier (free/pro/enterprise).""",
    handoffs=[
        handoff(
            agent=escalation_agent,
            on_handoff=process_escalation,
            input_type=EscalationData,
        ),
    ],
)
```

---

## Multi-Agent Patterns

### Customer Support System

```python
from agents import Agent
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Specialist agents
billing_agent = Agent(
    name="Billing Support",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle billing inquiries including:
    - Payment issues
    - Invoice questions
    - Subscription changes
    - Refund requests
    Be precise about amounts and dates.""",
    handoff_description="Handles billing, payments, and invoices",
)

technical_agent = Agent(
    name="Technical Support",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle technical issues including:
    - Software bugs
    - Error messages
    - Feature questions
    - Integration help
    Ask clarifying questions about the issue.""",
    handoff_description="Handles software issues and technical questions",
)

sales_agent = Agent(
    name="Sales",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle sales inquiries including:
    - Product information
    - Pricing
    - Demos
    - Enterprise solutions
    Be enthusiastic but not pushy.""",
    handoff_description="Handles sales, pricing, and product inquiries",
)

# Main triage agent
triage_agent = Agent(
    name="Customer Service",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are the first point of contact for customers.
    Determine the nature of the request and hand off to the appropriate specialist:

    - Billing issues → Billing Support
    - Technical problems → Technical Support
    - Product/pricing questions → Sales

    Ask clarifying questions if needed before routing.""",
    handoffs=[billing_agent, technical_agent, sales_agent],
)
```

### Hierarchical Multi-Agent

```python
from agents import Agent

# Level 3: Deep specialists
refund_agent = Agent(
    name="Refund Specialist",
    instructions="Process refund requests.",
)

payment_agent = Agent(
    name="Payment Specialist",
    instructions="Handle payment issues.",
)

# Level 2: Department leads
billing_lead = Agent(
    name="Billing Lead",
    instructions="Route billing issues to specialists.",
    handoffs=[refund_agent, payment_agent],
)

# Level 1: Main triage
main_agent = Agent(
    name="Reception",
    instructions="Route to appropriate department.",
    handoffs=[billing_lead],  # Can cascade through hierarchy
)
```

---

## Handoff with Input Guardrails

```python
from pydantic import BaseModel
from agents import (
    Agent,
    InputGuardrail,
    GuardrailFunctionOutput,
    Runner,
)

class HomeworkCheck(BaseModel):
    is_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Homework Checker",
    instructions="Check if the question is about homework.",
    output_type=HomeworkCheck,
)

async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    output = result.final_output_as(HomeworkCheck)
    return GuardrailFunctionOutput(
        output_info=output,
        tripwire_triggered=not output.is_homework,
    )

math_tutor = Agent(
    name="Math Tutor",
    instructions="Help with math homework.",
    handoff_description="For math questions",
)

history_tutor = Agent(
    name="History Tutor",
    instructions="Help with history homework.",
    handoff_description="For history questions",
)

triage_agent = Agent(
    name="Homework Helper",
    instructions="Route to the appropriate tutor.",
    handoffs=[math_tutor, history_tutor],
    input_guardrails=[
        InputGuardrail(guardrail_function=homework_guardrail),
    ],
)
```

---

## Tracking Handoffs

```python
from agents import Agent, Runner

async def main():
    result = await Runner.run(triage_agent, "I have a billing question")

    # Check final agent
    print(f"Final agent: {result.last_agent.name}")

    # Check if handoff occurred
    if result.last_agent.name != "Triage":
        print("Handoff occurred!")

    # Access all agents in the chain
    print(f"Response: {result.final_output}")
```

---

## Complete Multi-Agent Example

```python
import asyncio
from pydantic import BaseModel
from agents import Agent, Runner, handoff, RunContextWrapper
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Handoff data models
class BillingContext(BaseModel):
    issue_type: str
    urgency: str

class TechnicalContext(BaseModel):
    error_code: str | None
    product: str

# Handoff callbacks
async def log_billing_handoff(ctx: RunContextWrapper, data: BillingContext):
    print(f"[BILLING] Issue: {data.issue_type}, Urgency: {data.urgency}")

async def log_technical_handoff(ctx: RunContextWrapper, data: TechnicalContext):
    print(f"[TECH] Product: {data.product}, Error: {data.error_code}")

# Specialist agents
billing_agent = Agent(
    name="Billing Support",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle billing inquiries. You have context about the issue type and urgency.
    Be precise and professional.""",
)

technical_agent = Agent(
    name="Technical Support",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle technical issues. You may have error codes to investigate.
    Ask clarifying questions if needed.""",
)

general_agent = Agent(
    name="General Support",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You handle general inquiries that don't fit other categories.""",
)

# Main triage agent
triage_agent = Agent(
    name="Customer Service",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are the first point of contact. Analyze the request and route appropriately:

    For billing (payments, invoices, subscriptions):
    - Identify issue_type (payment, invoice, subscription, refund)
    - Assess urgency (low, medium, high)

    For technical (bugs, errors, features):
    - Note any error codes mentioned
    - Identify the product

    For general inquiries, route to general support.""",
    handoffs=[
        handoff(
            agent=billing_agent,
            tool_name_override="transfer_to_billing",
            on_handoff=log_billing_handoff,
            input_type=BillingContext,
        ),
        handoff(
            agent=technical_agent,
            tool_name_override="transfer_to_tech",
            on_handoff=log_technical_handoff,
            input_type=TechnicalContext,
        ),
        general_agent,
    ],
)

async def main():
    # Test scenarios
    scenarios = [
        "My payment failed and I need help urgently!",
        "I'm getting error code E-1234 in the mobile app.",
        "What are your business hours?",
    ]

    for scenario in scenarios:
        print(f"\n{'='*50}")
        print(f"User: {scenario}")
        print("="*50)

        result = await Runner.run(triage_agent, scenario)

        print(f"Final Agent: {result.last_agent.name}")
        print(f"Response: {result.final_output}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Handoff Best Practices

1. **Clear handoff descriptions**: Help the triage agent decide correctly
2. **Use RECOMMENDED_PROMPT_PREFIX**: Maintains context during handoffs
3. **Log handoffs**: Track routing for debugging and analytics
4. **Pass context data**: Use input_type for structured handoff data
5. **Test routing**: Verify handoffs work for edge cases
6. **Limit depth**: Avoid too many handoff levels (max 2-3)
