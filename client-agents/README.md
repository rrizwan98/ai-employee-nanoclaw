# Client Agents Storage

This directory stores generated agent code for each client.

## Structure

```
client-agents/
├── {client_jid}/                    # Client WhatsApp JID
│   ├── {project-slug}/              # Project folder (URL-safe name)
│   │   ├── current/                 # Latest working version
│   │   │   ├── main.py
│   │   │   ├── agents.py
│   │   │   ├── tools.py
│   │   │   ├── requirements.txt
│   │   │   ├── Dockerfile
│   │   │   └── README.md
│   │   ├── versions/
│   │   │   ├── v1/                  # First version
│   │   │   └── v2/                  # After update
│   │   └── metadata.json            # Project info
│   │
│   └── another-project/
│       └── ...
```

## metadata.json Example

```json
{
  "project_id": "uuid-here",
  "name": "FAQ Bot",
  "slug": "faq-bot",
  "client_jid": "923032206662@s.whatsapp.net",
  "agent_type": "standard",
  "current_version": 1,
  "created_at": "2026-02-20T10:00:00Z",
  "updated_at": "2026-02-20T10:00:00Z",
  "requirements_history": [
    {
      "version": 1,
      "date": "2026-02-20T10:00:00Z",
      "requirements": {
        "name": "FAQ Bot",
        "description": "Customer FAQ chatbot",
        "tools": ["web_search"],
        "memory": "sqlite"
      }
    }
  ]
}
```

## Usage

When code-generation skill runs:
1. Creates `{jid}/{slug}/current/` with generated files
2. Copies to `versions/v1/`
3. Creates `metadata.json`
4. Sends ZIP to WhatsApp

On update:
1. Reads existing `current/` code
2. Modifies based on new requirements
3. Increments version
4. Saves to `versions/v{n}/`
5. Updates `current/`
6. Updates `metadata.json`
7. Sends updated ZIP to WhatsApp
