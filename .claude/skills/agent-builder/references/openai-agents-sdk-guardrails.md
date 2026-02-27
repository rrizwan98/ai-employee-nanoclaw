# OpenAI Agents SDK - Guardrails Reference

Complete reference for input, output, and tool guardrails in OpenAI Agents SDK v0.7.0+.

---

## Overview

Guardrails protect your agent by validating inputs, outputs, and tool operations:

| Guardrail Type | When Runs | Use Case |
|---------------|-----------|----------|
| Input Guardrail | Before agent processes input | Block inappropriate requests |
| Output Guardrail | After agent generates response | Filter sensitive information |
| Tool Input Guardrail | Before tool executes | Validate tool parameters |
| Tool Output Guardrail | After tool executes | Redact sensitive tool output |

---

## Input Guardrails

Validate user input before the agent processes it.

### Basic Input Guardrail

```python
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner

@InputGuardrail
def validate_input_length(context):
    """Block inputs that are too long."""
    if len(context.input) > 10000:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info="Input too long. Maximum 10000 characters allowed.",
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)

agent = Agent(
    name="Assistant",
    instructions="Help users with their questions.",
    input_guardrails=[validate_input_length],
)
```

### Using Agent as Guardrail

```python
from pydantic import BaseModel
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner

class ContentCheck(BaseModel):
    is_appropriate: bool
    reasoning: str

guardrail_agent = Agent(
    name="Content Checker",
    instructions="Check if the input is appropriate for a homework helper.",
    output_type=ContentCheck,
)

async def content_guardrail(ctx, agent, input_data):
    """Use another agent to validate content."""
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    output = result.final_output_as(ContentCheck)
    return GuardrailFunctionOutput(
        output_info=output,
        tripwire_triggered=not output.is_appropriate,
    )

main_agent = Agent(
    name="Homework Helper",
    instructions="Help students with homework questions.",
    input_guardrails=[
        InputGuardrail(guardrail_function=content_guardrail),
    ],
)
```

### Handling Guardrail Triggers

```python
from agents.exceptions import InputGuardrailTripwireTriggered

try:
    result = await Runner.run(agent, user_input)
    print(result.final_output)
except InputGuardrailTripwireTriggered as e:
    print(f"Input blocked: {e}")
    # Handle blocked input gracefully
```

---

## Output Guardrails

Filter or block agent responses after generation.

### Basic Output Guardrail

```python
from agents import Agent, OutputGuardrail, GuardrailFunctionOutput

@OutputGuardrail
def filter_sensitive_output(context):
    """Block responses containing sensitive information."""
    output = context.output.lower()
    sensitive_keywords = ["password", "secret", "api_key", "token"]

    for keyword in sensitive_keywords:
        if keyword in output:
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                output_info=f"Response contained sensitive keyword: {keyword}",
            )

    return GuardrailFunctionOutput(tripwire_triggered=False)

agent = Agent(
    name="Assistant",
    output_guardrails=[filter_sensitive_output],
)
```

### PII Redaction Output Guardrail

```python
import re
from agents import OutputGuardrail, GuardrailFunctionOutput

@OutputGuardrail
def redact_pii(context):
    """Redact personal identifiable information."""
    output = context.output

    # Redact email addresses
    output = re.sub(r'\b[\w.-]+@[\w.-]+\.\w+\b', '[EMAIL REDACTED]', output)

    # Redact phone numbers
    output = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE REDACTED]', output)

    # Redact SSN
    output = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN REDACTED]', output)

    # If content was modified, replace the output
    if output != context.output:
        return GuardrailFunctionOutput(
            tripwire_triggered=False,
            modified_output=output,  # Return modified output
        )

    return GuardrailFunctionOutput(tripwire_triggered=False)
```

---

## Tool Guardrails

Validate tool inputs and outputs at execution time.

### Tool Input Guardrail

```python
import json
from agents import (
    function_tool,
    tool_input_guardrail,
    ToolGuardrailFunctionOutput,
)

@tool_input_guardrail
def block_secrets_in_tool(data):
    """Block tools from receiving API keys or secrets."""
    args = json.loads(data.context.tool_arguments or "{}")
    args_str = json.dumps(args)

    # Check for API keys
    if "sk-" in args_str or "api_key" in args_str.lower():
        return ToolGuardrailFunctionOutput.reject_content(
            "Remove secrets before calling this tool."
        )

    return ToolGuardrailFunctionOutput.allow()

@function_tool(tool_input_guardrails=[block_secrets_in_tool])
def process_text(text: str) -> str:
    """Process text content."""
    return f"Processed: {text}"
```

### Tool Output Guardrail

```python
from agents import (
    function_tool,
    tool_output_guardrail,
    ToolGuardrailFunctionOutput,
)

@tool_output_guardrail
def redact_tool_secrets(data):
    """Redact secrets from tool output."""
    output = str(data.output or "")

    if "sk-" in output or "secret" in output.lower():
        return ToolGuardrailFunctionOutput.reject_content(
            "Output contained sensitive data and was redacted."
        )

    return ToolGuardrailFunctionOutput.allow()

@function_tool(tool_output_guardrails=[redact_tool_secrets])
def fetch_config() -> str:
    """Fetch configuration data."""
    return '{"api_key": "sk-xxx", "database": "production"}'
```

### Combined Tool Guardrails

```python
from agents import (
    Agent,
    function_tool,
    tool_input_guardrail,
    tool_output_guardrail,
    ToolGuardrailFunctionOutput,
)

@tool_input_guardrail
def validate_query(data):
    """Validate SQL-like queries."""
    args = data.context.tool_arguments or ""
    dangerous_patterns = ["DROP", "DELETE", "TRUNCATE", "UPDATE"]

    for pattern in dangerous_patterns:
        if pattern in args.upper():
            return ToolGuardrailFunctionOutput.reject_content(
                f"Dangerous operation '{pattern}' not allowed."
            )

    return ToolGuardrailFunctionOutput.allow()

@tool_output_guardrail
def limit_results(data):
    """Limit large result sets."""
    output = str(data.output or "")

    if len(output) > 50000:
        return ToolGuardrailFunctionOutput.reject_content(
            "Result too large. Please refine your query."
        )

    return ToolGuardrailFunctionOutput.allow()

@function_tool(
    tool_input_guardrails=[validate_query],
    tool_output_guardrails=[limit_results],
)
def query_database(query: str) -> str:
    """Execute a database query."""
    return f"Results for: {query}"

agent = Agent(
    name="Database Assistant",
    tools=[query_database],
)
```

---

## Complete Guardrails Example

```python
import asyncio
from pydantic import BaseModel
from agents import (
    Agent,
    Runner,
    InputGuardrail,
    OutputGuardrail,
    GuardrailFunctionOutput,
    function_tool,
    tool_input_guardrail,
    tool_output_guardrail,
    ToolGuardrailFunctionOutput,
)
from agents.exceptions import InputGuardrailTripwireTriggered

# Input guardrail: Block non-work questions
class WorkRelevance(BaseModel):
    is_work_related: bool
    category: str

guardrail_agent = Agent(
    name="Work Checker",
    instructions="Determine if a question is work-related.",
    output_type=WorkRelevance,
)

async def work_only_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    output = result.final_output_as(WorkRelevance)
    return GuardrailFunctionOutput(
        output_info=output,
        tripwire_triggered=not output.is_work_related,
    )

# Output guardrail: No competitor mentions
@OutputGuardrail
def no_competitors(context):
    competitors = ["competitor_a", "competitor_b", "competitor_c"]
    output_lower = context.output.lower()

    for comp in competitors:
        if comp in output_lower:
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                output_info=f"Response mentioned competitor: {comp}",
            )

    return GuardrailFunctionOutput(tripwire_triggered=False)

# Tool guardrails
@tool_input_guardrail
def safe_inputs(data):
    if "rm -rf" in str(data.context.tool_arguments):
        return ToolGuardrailFunctionOutput.reject_content("Dangerous command blocked.")
    return ToolGuardrailFunctionOutput.allow()

@function_tool(tool_input_guardrails=[safe_inputs])
def execute_command(command: str) -> str:
    """Execute a safe command."""
    return f"Executed: {command}"

# Main agent with all guardrails
main_agent = Agent(
    name="Work Assistant",
    instructions="Help employees with work-related tasks.",
    input_guardrails=[InputGuardrail(guardrail_function=work_only_guardrail)],
    output_guardrails=[no_competitors],
    tools=[execute_command],
)

async def main():
    try:
        result = await Runner.run(main_agent, "How do I submit an expense report?")
        print(result.final_output)
    except InputGuardrailTripwireTriggered:
        print("This question is not work-related.")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Guardrail Best Practices

1. **Layer guardrails**: Use multiple guardrails for defense in depth
2. **Be specific**: Clear error messages help users understand rejections
3. **Test edge cases**: Guardrails should handle unexpected inputs
4. **Log triggers**: Track when guardrails activate for monitoring
5. **Fail safe**: When in doubt, reject rather than allow
