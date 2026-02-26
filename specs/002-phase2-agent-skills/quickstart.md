# Quickstart: Testing Phase 2 Agent Skills

**Feature**: 002-phase2-agent-skills
**Date**: 2026-02-20

## Prerequisites

- NanoClaw Phase 1 complete (WhatsApp connected)
- Docker running
- PostgreSQL (Neon) configured

## Testing Each Skill

### 1. Test client-communication Skill

**Trigger**: Send greeting message

```
You: "Hello"
Expected: Professional greeting in detected language (Urdu/English)

You: "Assalam o Alaikum"
Expected: Response in Urdu with professional tone
```

**Verify**:
- [ ] Language detection works
- [ ] Tone is friendly but professional
- [ ] Offers to help build an agent

---

### 2. Test requirements-gathering Skill

**Trigger**: Request to build an agent

```
You: "I need a customer support bot"

Expected Questions (5-7 max):
1. "What will your agent help with specifically?"
2. "Do you need voice/phone support or text-based?"
3. "Should it search the web or access documents?"
4. "Any custom actions like database or email?"
5. "Should it remember past conversations?"
6. "Need multiple specialist agents?"
7. "How will you deploy? (local/Docker/cloud)"
```

**Verify**:
- [ ] Asks maximum 5-7 questions
- [ ] Questions are clear and targeted
- [ ] Produces structured AgentConfig JSON

---

### 3. Test agent-builder Skill

**Trigger**: After requirements gathered

```
You: "Yes, that looks good. Build it."

Expected:
- Confirms architecture design
- Shows which SDK features will be used
- Lists files that will be generated
- Asks for confirmation before generating
```

**Verify**:
- [ ] Selects correct agent type (standard/realtime/multi-agent)
- [ ] Identifies appropriate tools
- [ ] Configures memory if requested
- [ ] Sets up handoffs for multi-agent

---

### 4. Test code-generation Skill

**Trigger**: Confirmation to generate

```
You: "Generate the code"

Expected:
- Progress updates during generation
- List of generated files:
  - main.py
  - agents.py (if needed)
  - tools.py (if custom tools)
  - requirements.txt
  - .env.example
  - Dockerfile
  - README.md
- Files delivered via WhatsApp
```

**Verify**:
- [ ] Python code is syntactically valid
- [ ] Uses correct OpenAI Agents SDK patterns
- [ ] requirements.txt has openai-agents>=0.7.0
- [ ] README has clear setup instructions
- [ ] .env.example has OPENAI_API_KEY

---

## End-to-End Test Scenarios

### Scenario A: Simple FAQ Bot

```
User: "I need an FAQ bot for my website"
→ Requirements (3-4 questions)
→ Design confirmation
→ Generate: standard agent with web search
→ Deliver files
```

**Expected Output**:
- main.py with Agent + WebSearchTool
- Simple Runner.run_sync() execution

### Scenario B: Voice Assistant

```
User: "I want a voice assistant for phone orders"
→ Requirements (5-6 questions)
→ Realtime agent design
→ Generate: RealtimeAgent + FastAPI WebSocket
→ Deliver files
```

**Expected Output**:
- main.py with RealtimeAgent + RealtimeRunner
- server.py with FastAPI WebSocket endpoint
- Voice configuration (voice selection, turn detection)

### Scenario C: Multi-Agent Support System

```
User: "I need a support system with billing and technical specialists"
→ Requirements (6-7 questions)
→ Multi-agent design with handoffs
→ Generate: orchestrator + specialists
→ Deliver files
```

**Expected Output**:
- orchestrator.py with triage agent
- specialists.py with billing + technical agents
- Proper handoff configuration

---

## Validation Checklist

### Code Quality

- [ ] No syntax errors (python -m py_compile *.py)
- [ ] Imports are correct
- [ ] Type hints present
- [ ] Error handling included
- [ ] Logging configured

### SDK Compliance

- [ ] Uses openai-agents v0.7.0+ patterns
- [ ] Correct Agent/RealtimeAgent usage
- [ ] Proper tool registration
- [ ] Handoffs configured correctly
- [ ] Sessions/memory if requested

### Documentation

- [ ] README explains setup steps
- [ ] Environment variables documented
- [ ] Usage examples included
- [ ] Troubleshooting section

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Skill not triggered | Check SKILL.md triggers in description |
| Wrong language | Ensure language detection in client-communication |
| Too many questions | Limit to 5-7 in requirements-gathering |
| Invalid code | Verify SDK patterns in code-generation templates |
| File too large | Zip files if > 64KB |

---

## Running Generated Agent

After receiving files:

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
cp .env.example .env
# Edit .env and add OPENAI_API_KEY

# 4. Run agent
python main.py

# For FastAPI server:
uvicorn main:app --reload
```
