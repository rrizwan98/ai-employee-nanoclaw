# ChatKit Server - Authentication Reference

Complete guide to user authentication and session management.

---

## Overview

ChatKit authentication enables:
- User identification
- Personalized threads
- Access control
- Session persistence

---

## Authentication Flow

```
1. Frontend sends auth headers with ChatKit request
2. Backend validates token/session
3. User ID extracted and associated with thread
4. Personalized response generated
```

---

## Frontend: Sending Auth Headers

```typescript
const { control } = useChatKit({
  api: {
    url: '/chatkit',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-User-ID': userId,
    },
  },
});
```

### With Dynamic Token

```typescript
import { useChatKit } from '@openai/chatkit-react';
import { useAuth } from './auth-context';

function AuthenticatedChat() {
  const { accessToken, userId } = useAuth();

  const { control } = useChatKit({
    api: {
      url: '/chatkit',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-User-ID': userId,
      },
    },
  });

  return <ChatKit control={control} />;
}
```

---

## Backend: Extracting User

### Basic Header Extraction

```python
from fastapi import Request

class MyChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context):
        request: Request = context.get("request")

        # Get user from headers
        user_id = request.headers.get("X-User-ID")
        auth_header = request.headers.get("Authorization")

        if not user_id:
            yield TextDeltaEvent("Please log in to continue.")
            return

        # Personalized response
        yield TextDeltaEvent(f"Hello, user {user_id}! ")
```

### JWT Validation

```python
import jwt
from fastapi import Request, HTTPException

SECRET_KEY = os.getenv("JWT_SECRET")

class AuthenticatedChatKitServer(ChatKitServer):
    def _extract_user(self, request: Request) -> dict | None:
        """Extract and validate user from JWT."""
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.replace("Bearer ", "")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
            }
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    async def respond(self, thread, input, context):
        request = context.get("request")
        user = self._extract_user(request)

        if not user:
            yield TextDeltaEvent("Your session has expired. Please log in again.")
            return

        # Use user info
        yield TextDeltaEvent(f"Hello, {user['name']}! ")
```

### OAuth/Session Validation

```python
import httpx

class OAuthChatKitServer(ChatKitServer):
    async def _validate_token(self, token: str) -> dict | None:
        """Validate token with OAuth provider."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://oauth.provider.com/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 200:
                return response.json()
            return None

    async def respond(self, thread, input, context):
        request = context.get("request")
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            yield TextDeltaEvent("Please log in.")
            return

        token = auth_header.replace("Bearer ", "")
        user = await self._validate_token(token)

        if not user:
            yield TextDeltaEvent("Invalid or expired token.")
            return

        # Continue with authenticated user
        yield TextDeltaEvent(f"Welcome back, {user['name']}!")
```

---

## User-Scoped Threads

Associate threads with users:

```python
class UserScopedChatKitServer(ChatKitServer):
    store = PostgresThreadStore(os.getenv("DATABASE_URL"))

    async def respond(self, thread, input, context):
        request = context.get("request")
        user_id = self._get_user_id(request)

        if user_id:
            # Associate thread with user
            thread.metadata["user_id"] = user_id
            await self.store.save_thread(thread)

        # Continue response
        yield from self._generate_response(input)

    async def list_threads(self, domain_key: str, context: Any) -> list:
        """Only list threads for current user."""
        request = context.get("request")
        user_id = self._get_user_id(request)

        if not user_id:
            return []

        return await self.store.list_threads_for_user(user_id)
```

---

## API Key Authentication

For API/bot access:

```python
API_KEYS = {
    "api_key_1": {"name": "Bot 1", "permissions": ["read", "write"]},
    "api_key_2": {"name": "Bot 2", "permissions": ["read"]},
}

class APIKeyAuthServer(ChatKitServer):
    def _validate_api_key(self, request: Request) -> dict | None:
        api_key = request.headers.get("X-API-Key")

        if api_key and api_key in API_KEYS:
            return API_KEYS[api_key]
        return None

    async def respond(self, thread, input, context):
        request = context.get("request")
        client = self._validate_api_key(request)

        if not client:
            yield TextDeltaEvent("Invalid API key.")
            return

        if "write" not in client["permissions"]:
            yield TextDeltaEvent("Read-only access.")
            return

        # Process request
        yield from self._generate_response(input)
```

---

## Domain Key Authentication

Multi-tenant isolation:

```python
DOMAIN_CONFIGS = {
    "tenant-a": {"name": "Tenant A", "model": "gpt-4o"},
    "tenant-b": {"name": "Tenant B", "model": "gpt-4o-mini"},
}

class MultiTenantServer(ChatKitServer):
    async def respond(self, thread, input, context):
        request = context.get("request")

        # Domain key from ChatKit request
        domain_key = request.headers.get("X-Domain-Key")

        if domain_key not in DOMAIN_CONFIGS:
            yield TextDeltaEvent("Invalid domain.")
            return

        config = DOMAIN_CONFIGS[domain_key]

        # Use tenant-specific config
        agent = Agent(
            name=f"{config['name']} Assistant",
            model=config["model"],
        )

        result = Runner.run_streamed(agent, input.content)
        async for event in result.stream_events():
            # ... handle events
            pass
```

---

## Session Management

### FastAPI Session

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.sessions import SessionMiddleware

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET"))

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    # Access session
    session = request.session

    # Get or create user session
    if "user_id" not in session:
        session["user_id"] = generate_anonymous_id()

    payload = await request.body()
    result = await server.process(payload, {
        "request": request,
        "session": session,
    })
    # ...
```

### Redis Session

```python
import redis
import json

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"))

class SessionServer(ChatKitServer):
    def _get_session(self, session_id: str) -> dict:
        data = redis_client.get(f"session:{session_id}")
        if data:
            return json.loads(data)
        return {}

    def _save_session(self, session_id: str, data: dict):
        redis_client.setex(
            f"session:{session_id}",
            86400,  # 24 hours
            json.dumps(data)
        )

    async def respond(self, thread, input, context):
        session_id = context.get("session_id")
        session = self._get_session(session_id)

        # Track conversation state
        session["message_count"] = session.get("message_count", 0) + 1

        # ... generate response

        self._save_session(session_id, session)
```

---

## Anonymous Users

Support both authenticated and anonymous:

```python
class HybridAuthServer(ChatKitServer):
    async def respond(self, thread, input, context):
        request = context.get("request")

        # Try authenticated user first
        user = self._extract_jwt_user(request)

        if user:
            # Authenticated user
            yield TextDeltaEvent(f"Hi {user['name']}! ")
            yield from self._personalized_response(user, input)
        else:
            # Anonymous user
            yield TextDeltaEvent("Hello! ")
            yield from self._generic_response(input)

    async def _personalized_response(self, user, input):
        # Access user data
        orders = await self.get_user_orders(user["id"])
        preferences = await self.get_preferences(user["id"])

        # Personalized agent context
        agent_context = {
            "user_name": user["name"],
            "recent_orders": orders[-5:],
            "preferences": preferences,
        }

        # ... generate response

    async def _generic_response(self, input):
        # Generic response for anonymous
        # ...
        pass
```

---

## Rate Limiting by User

```python
from datetime import datetime, timedelta
from collections import defaultdict

class RateLimitedServer(ChatKitServer):
    user_requests: dict = defaultdict(list)
    RATE_LIMIT = 50  # requests per hour

    async def respond(self, thread, input, context):
        request = context.get("request")
        user_id = self._get_user_id(request) or request.client.host

        # Check rate limit
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)

        self.user_requests[user_id] = [
            t for t in self.user_requests[user_id]
            if t > hour_ago
        ]

        if len(self.user_requests[user_id]) >= self.RATE_LIMIT:
            yield TextDeltaEvent("Rate limit exceeded. Please try again later.")
            return

        self.user_requests[user_id].append(now)

        # Process request
        yield from self._generate_response(input)
```

---

## Complete Auth Example

```python
import os
import jwt
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from chatkit.server import ChatKitServer, ThreadMetadata, SQLiteThreadStore
from chatkit.server.events import TextDeltaEvent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthenticatedServer(ChatKitServer):
    store = SQLiteThreadStore("data/threads.db")
    SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret")

    def _validate_token(self, request: Request) -> dict | None:
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None

        try:
            token = auth.replace("Bearer ", "")
            return jwt.decode(token, self.SECRET_KEY, algorithms=["HS256"])
        except:
            return None

    async def respond(self, thread, input, context):
        request = context.get("request")
        user = self._validate_token(request)

        if not user:
            yield TextDeltaEvent(
                "Please log in to continue. "
                "[Login](https://example.com/login)"
            )
            return

        # Associate thread with user
        thread.metadata["user_id"] = user["sub"]
        await self.store.save_thread(thread)

        # Personalized greeting
        yield TextDeltaEvent(f"Hello, {user.get('name', 'there')}! ")

        # Generate response
        yield from self._generate_response(input, user)

    async def list_threads(self, domain_key: str, context) -> list:
        request = context.get("request")
        user = self._validate_token(request)

        if not user:
            return []

        return await self.store.list_threads_for_user(user["sub"])

server = AuthenticatedServer()

@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    payload = await request.body()
    result = await server.process(payload, {"request": request})

    if hasattr(result, '__aiter__'):
        return StreamingResponse(result, media_type="text/event-stream")
    return Response(content=result.json, media_type="application/json")
```
