# Data Model: Phase 2 Agent Skills

**Feature**: 002-phase2-agent-skills
**Date**: 2026-02-20

## Overview

This document defines the data structures used by the Agent Builder skills to capture client requirements and generate agent code.

---

## 1. AgentConfig

Primary configuration structure produced by `requirements-gathering` skill and consumed by `agent-builder` and `code-generation` skills.

```json
{
  "agent_type": "standard | realtime | multi-agent",
  "name": "string",
  "description": "string",
  "instructions": "string",

  "tools": {
    "hosted": ["web_search", "file_search", "code_interpreter", "image_generation", "computer"],
    "custom": [
      {
        "name": "string",
        "description": "string",
        "parameters": [
          {"name": "string", "type": "string", "required": true}
        ],
        "returns": "string"
      }
    ],
    "mcp_servers": [
      {
        "name": "string",
        "type": "stdio | hosted",
        "command": "string (for stdio)",
        "url": "string (for hosted)"
      }
    ]
  },

  "memory": {
    "type": "none | sqlite | redis",
    "config": {
      "db_path": "string (for sqlite)",
      "redis_url": "string (for redis)"
    }
  },

  "handoffs": [
    {
      "name": "string",
      "description": "string",
      "instructions": "string",
      "tools": ["string"]
    }
  ],

  "guardrails": {
    "input": ["max_length", "no_secrets", "custom"],
    "output": ["no_pii", "no_profanity", "custom"],
    "tool_input": ["validate_params"],
    "tool_output": ["redact_sensitive"]
  },

  "output": {
    "type": "text | structured",
    "schema": {
      "name": "string",
      "fields": [
        {"name": "string", "type": "string", "description": "string"}
      ]
    }
  },

  "realtime_config": {
    "voice": "alloy | echo | fable | onyx | nova | shimmer | ash",
    "modalities": ["text", "audio"],
    "turn_detection": "semantic_vad | server_vad",
    "audio_format": "pcm16"
  },

  "deployment": {
    "type": "local | docker | cloud",
    "server": "fastapi | none",
    "port": 8000,
    "websocket": true
  },

  "metadata": {
    "client_jid": "string",
    "project_id": "string",
    "created_at": "ISO datetime",
    "version": "1.0"
  }
}
```

---

## 2. ConversationState

Tracks the current phase of client interaction.

```json
{
  "phase": "greeting | requirements | design | generation | delivery | support",
  "client_jid": "string",
  "project_id": "string",
  "started_at": "ISO datetime",
  "current_question": 0,
  "total_questions": 7,
  "collected_requirements": {},
  "agent_config": null,
  "generated_files": [],
  "delivery_status": "pending | sent | confirmed"
}
```

---

## 3. GeneratedAgent

Output package structure.

```json
{
  "project_name": "string",
  "files": [
    {
      "path": "main.py",
      "content": "string",
      "type": "python"
    },
    {
      "path": "agents.py",
      "content": "string",
      "type": "python"
    },
    {
      "path": "tools.py",
      "content": "string",
      "type": "python"
    },
    {
      "path": "requirements.txt",
      "content": "string",
      "type": "text"
    },
    {
      "path": ".env.example",
      "content": "string",
      "type": "text"
    },
    {
      "path": "Dockerfile",
      "content": "string",
      "type": "docker"
    },
    {
      "path": "docker-compose.yml",
      "content": "string",
      "type": "yaml"
    },
    {
      "path": "README.md",
      "content": "string",
      "type": "markdown"
    }
  ],
  "zip_path": "string (if zipped)",
  "total_size_bytes": 0,
  "created_at": "ISO datetime"
}
```

---

## 4. Skill Triggers

Mapping of user intents to skills.

| User Says | Skill Triggered | Phase |
|-----------|-----------------|-------|
| "I need an agent" | requirements-gathering | requirements |
| "Build me a bot" | requirements-gathering | requirements |
| "Make an AI assistant" | requirements-gathering | requirements |
| "Hello", "Hi" | client-communication | greeting |
| "Yes", "Confirm" | agent-builder | design → generation |
| "Send files" | code-generation | delivery |
| "Help", "Issue" | client-communication | support |

---

## 5. Requirements Questions

Standard questions asked by `requirements-gathering` skill.

| # | Question | Maps To |
|---|----------|---------|
| 1 | What will your agent do? | `description`, `instructions` |
| 2 | What type? (chatbot/voice/multi-agent) | `agent_type` |
| 3 | Which tools? (web search/file search/code/images) | `tools.hosted` |
| 4 | Any custom actions? (database/email/API) | `tools.custom` |
| 5 | Remember conversations? (yes/no/scalable) | `memory.type` |
| 6 | Multiple specialists needed? | `handoffs` |
| 7 | How to deploy? (local/Docker/cloud) | `deployment` |

---

## 6. File Templates

Code templates used by `code-generation` skill.

### 6.1 Standard Agent Files

| File | Purpose |
|------|---------|
| `main.py` | Entry point, Runner execution |
| `agents.py` | Agent definitions |
| `tools.py` | Custom @function_tool functions |
| `config.py` | Environment configuration |
| `requirements.txt` | Python dependencies |
| `.env.example` | Environment variables template |
| `Dockerfile` | Container build |
| `README.md` | Setup and usage guide |

### 6.2 Realtime Agent Additional Files

| File | Purpose |
|------|---------|
| `server.py` | FastAPI + WebSocket server |
| `audio.py` | Audio streaming utilities |

### 6.3 Multi-Agent Additional Files

| File | Purpose |
|------|---------|
| `orchestrator.py` | Main routing agent |
| `specialists.py` | Specialist agent definitions |
| `handoffs.py` | Handoff configurations |

---

## 7. Validation Rules

### AgentConfig Validation

| Field | Rule |
|-------|------|
| `name` | Required, 3-50 characters, alphanumeric + underscore |
| `agent_type` | Required, enum: standard, realtime, multi-agent |
| `tools.hosted` | Array of valid tool names |
| `memory.type` | If redis, requires `redis_url` |
| `handoffs` | Required if `agent_type` is multi-agent |
| `realtime_config` | Required if `agent_type` is realtime |

### File Size Limits

| Constraint | Limit |
|------------|-------|
| Single file | < 64KB (WhatsApp limit) |
| Total package | < 16MB |
| If exceeded | Zip and provide download link |
