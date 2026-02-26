# Data Model: Phase 1 Foundation Setup

**Feature**: 001-phase1-foundation
**Date**: 2026-02-19
**Database**: PostgreSQL (Neon)

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     clients     │       │    projects     │       │  conversations  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ whatsapp_number │   │   │ client_id (FK)  │◄──┤   │ client_id (FK)  │◄──┐
│ whatsapp_jid    │   │   │ name            │   │   │ project_id (FK) │◄──┤
│ name            │   │   │ status          │   │   │ messages (JSON) │   │
│ metadata (JSON) │   │   │ requirements    │   │   │ created_at      │   │
│ created_at      │   └──►│ created_at      │   │   │ updated_at      │   │
│ updated_at      │       │ updated_at      │   │   └─────────────────┘   │
└─────────────────┘       └─────────────────┘   │                         │
                                                └─────────────────────────┘
```

## Tables

### 1. clients

Stores information about WhatsApp users who interact with the Agent Builder.

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number VARCHAR(20) NOT NULL,
    whatsapp_jid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by WhatsApp JID
CREATE INDEX idx_clients_whatsapp_jid ON clients(whatsapp_jid);

-- Index for phone number searches
CREATE INDEX idx_clients_whatsapp_number ON clients(whatsapp_number);
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key, auto-generated |
| whatsapp_number | VARCHAR(20) | Phone number (e.g., "03492128287") |
| whatsapp_jid | VARCHAR(50) | WhatsApp JID (e.g., "923492128287@s.whatsapp.net") |
| name | VARCHAR(255) | Client's name (optional, from WhatsApp profile) |
| metadata | JSONB | Additional client data (preferences, etc.) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

---

### 2. projects

Stores agent building requests from clients.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    requirements JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for client's projects
CREATE INDEX idx_projects_client_id ON projects(client_id);

-- Index for status filtering
CREATE INDEX idx_projects_status ON projects(status);
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key, auto-generated |
| client_id | UUID | Foreign key to clients table |
| name | VARCHAR(255) | Project/agent name |
| status | VARCHAR(50) | Status: draft, gathering, designing, generating, completed, cancelled |
| requirements | JSONB | Gathered requirements (domain, features, integrations) |
| config | JSONB | Generated agent configuration |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Status Values**:
| Status | Description |
|--------|-------------|
| draft | Initial state, no requirements yet |
| gathering | Collecting requirements from client |
| designing | Architecture design in progress |
| generating | Code generation in progress |
| completed | Agent delivered to client |
| cancelled | Project cancelled |

---

### 3. conversations

Stores message history between client and Agent Builder.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    messages JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for client's conversations
CREATE INDEX idx_conversations_client_id ON conversations(client_id);

-- Index for project's conversations
CREATE INDEX idx_conversations_project_id ON conversations(project_id);

-- Index for recent conversations
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key, auto-generated |
| client_id | UUID | Foreign key to clients table |
| project_id | UUID | Foreign key to projects table (nullable) |
| messages | JSONB | Array of message objects |
| context | JSONB | Conversation context for AI |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Message Object Structure**:
```json
{
  "id": "msg_uuid",
  "role": "user|assistant",
  "content": "Message text",
  "timestamp": "2026-02-19T10:30:00Z",
  "metadata": {
    "whatsapp_id": "3EB0...",
    "media_type": null
  }
}
```

---

## Helper Functions

### Update timestamp trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Complete Migration Script

```sql
-- Migration: 001_create_initial_schema.sql
-- Date: 2026-02-19
-- Feature: Phase 1 Foundation Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number VARCHAR(20) NOT NULL,
    whatsapp_jid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_whatsapp_jid ON clients(whatsapp_jid);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp_number ON clients(whatsapp_number);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    requirements JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    messages JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('clients', 'projects', 'conversations');
```

---

## Validation Rules

| Entity | Rule | Enforcement |
|--------|------|-------------|
| clients | whatsapp_jid must be unique | UNIQUE constraint |
| clients | whatsapp_number required | NOT NULL constraint |
| projects | client_id must exist | FOREIGN KEY |
| projects | status must be valid | Application-level |
| conversations | client_id must exist | FOREIGN KEY |
| conversations | messages must be valid JSON array | JSONB type |

## Future Considerations (Out of Scope for Phase 1)

- Redis for session caching
- Vector storage for RAG (Qdrant/Weaviate)
- Audit logging table
- Billing/usage tracking
