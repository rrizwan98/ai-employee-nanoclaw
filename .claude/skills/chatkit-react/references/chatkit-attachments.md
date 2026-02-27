# ChatKit - Attachments Reference

Complete guide to file and image uploads in ChatKit.

---

## Overview

ChatKit supports file attachments including:
- Images (PNG, JPG, GIF, WebP)
- Documents (PDF, DOC, TXT)
- Code files
- Any file type (based on backend configuration)

---

## Enabling Attachments

### Frontend Configuration

```typescript
const { control } = useChatKit({
  api: { url: '/chatkit' },
  composer: {
    allowAttachments: true,  // Enable attachment button
  },
});
```

### Attachment UI

When `allowAttachments: true`:
- Paperclip icon appears in composer
- Click to open file picker
- Drag & drop supported
- Paste images from clipboard

---

## Image Attachments

### Supported Formats

| Format | Max Size | Notes |
|--------|----------|-------|
| PNG | 10MB | Recommended for screenshots |
| JPG/JPEG | 10MB | Best for photos |
| GIF | 5MB | Animated supported |
| WebP | 10MB | Modern compression |

### Image Preview

ChatKit displays image previews:
- Thumbnail in composer before sending
- Inline preview in message history
- Click to view full size

---

## Backend Attachment Handling

### Receiving Attachments

```python
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem
from typing import Any, AsyncIterator

class MyServer(ChatKitServer):
    async def respond(
        self,
        thread: ThreadMetadata,
        input: UserMessageItem | None,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:
        if input and input.attachments:
            for attachment in input.attachments:
                file_type = attachment.type      # 'image', 'file'
                mime_type = attachment.mime_type # 'image/png', 'application/pdf'
                filename = attachment.filename   # 'screenshot.png'
                content = attachment.content     # Base64 encoded data

                if file_type == 'image':
                    # Process image with vision model
                    yield from self.analyze_image(attachment)
                else:
                    # Process document
                    yield from self.process_document(attachment)
```

### Image Analysis with GPT-4 Vision

```python
import openai
import base64

class MyServer(ChatKitServer):
    async def analyze_image(self, attachment) -> AsyncIterator[ThreadStreamEvent]:
        """Analyze image using GPT-4 Vision."""

        # Decode base64 if needed
        image_data = attachment.content
        if isinstance(image_data, str):
            # Already base64
            image_url = f"data:{attachment.mime_type};base64,{image_data}"
        else:
            # Encode to base64
            image_url = f"data:{attachment.mime_type};base64,{base64.b64encode(image_data).decode()}"

        response = await openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this image in detail."},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield TextDeltaEvent(chunk.choices[0].delta.content)
```

### Document Processing

```python
import io
from PyPDF2 import PdfReader

class MyServer(ChatKitServer):
    async def process_document(self, attachment) -> AsyncIterator[ThreadStreamEvent]:
        """Process uploaded document."""

        mime_type = attachment.mime_type
        content = base64.b64decode(attachment.content)

        if mime_type == 'application/pdf':
            # Extract text from PDF
            pdf = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() for page in pdf.pages)

            yield TextDeltaEvent(f"I've read your PDF ({len(pdf.pages)} pages). ")
            yield TextDeltaEvent(f"Here's a summary:\n\n")

            # Summarize with agent
            summary = await self.summarize_text(text)
            yield TextDeltaEvent(summary)

        elif mime_type == 'text/plain':
            text = content.decode('utf-8')
            yield TextDeltaEvent(f"I've read your text file. Contents:\n\n{text}")

        else:
            yield TextDeltaEvent(f"Received file: {attachment.filename}")
```

---

## File Storage

### Local Storage

```python
import os
import uuid
from datetime import datetime

UPLOAD_DIR = "uploads"

class MyServer(ChatKitServer):
    async def save_attachment(self, attachment) -> str:
        """Save attachment to local storage."""

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Generate unique filename
        ext = attachment.filename.split('.')[-1]
        unique_name = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_name)

        # Save file
        content = base64.b64decode(attachment.content)
        with open(filepath, 'wb') as f:
            f.write(content)

        return filepath
```

### Cloud Storage (S3)

```python
import boto3
import uuid

s3 = boto3.client('s3')
BUCKET = 'my-chatkit-uploads'

class MyServer(ChatKitServer):
    async def save_to_s3(self, attachment) -> str:
        """Save attachment to S3."""

        ext = attachment.filename.split('.')[-1]
        key = f"uploads/{uuid.uuid4()}.{ext}"

        content = base64.b64decode(attachment.content)

        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=content,
            ContentType=attachment.mime_type,
        )

        return f"https://{BUCKET}.s3.amazonaws.com/{key}"
```

---

## Attachment Validation

### File Type Validation

```python
ALLOWED_TYPES = {
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
}

MAX_SIZE = 10 * 1024 * 1024  # 10MB

class MyServer(ChatKitServer):
    def validate_attachment(self, attachment) -> tuple[bool, str]:
        """Validate attachment before processing."""

        # Check type
        if attachment.mime_type not in ALLOWED_TYPES:
            return False, f"File type {attachment.mime_type} not allowed"

        # Check size
        content = base64.b64decode(attachment.content)
        if len(content) > MAX_SIZE:
            return False, f"File too large. Max size: {MAX_SIZE // (1024*1024)}MB"

        return True, ""

    async def respond(self, thread, input, context):
        if input and input.attachments:
            for attachment in input.attachments:
                valid, error = self.validate_attachment(attachment)
                if not valid:
                    yield TextDeltaEvent(f"Cannot process file: {error}")
                    return
```

---

## Multiple Attachments

ChatKit supports multiple attachments in a single message:

```python
class MyServer(ChatKitServer):
    async def respond(self, thread, input, context):
        if input and input.attachments:
            count = len(input.attachments)
            yield TextDeltaEvent(f"I received {count} file(s). Processing...\n\n")

            for i, attachment in enumerate(input.attachments, 1):
                yield TextDeltaEvent(f"**File {i}: {attachment.filename}**\n")

                if attachment.type == 'image':
                    yield from self.analyze_image(attachment)
                else:
                    yield from self.process_document(attachment)

                yield TextDeltaEvent("\n\n")
```

---

## Attachment with Agent Tools

Use CodeInterpreterTool to process files:

```python
from agents import Agent, CodeInterpreterTool

agent = Agent(
    name="Data Analyst",
    tools=[CodeInterpreterTool()],
    instructions="""
    You are a data analyst. When users upload files:
    - CSV files: Analyze data, create charts
    - Images: Describe and process
    - PDFs: Extract and summarize content
    """,
)
```

The agent can then:
- Read uploaded CSV files
- Create visualizations
- Process data with pandas
- Return charts to display

---

## Complete Attachment Example

```python
from chatkit.server import ChatKitServer, ThreadMetadata, UserMessageItem
from typing import Any, AsyncIterator
import base64
import openai

class AttachmentServer(ChatKitServer):
    ALLOWED_IMAGES = {'image/png', 'image/jpeg', 'image/gif', 'image/webp'}
    ALLOWED_DOCS = {'application/pdf', 'text/plain', 'text/csv'}
    MAX_SIZE = 10 * 1024 * 1024

    async def respond(
        self,
        thread: ThreadMetadata,
        input: UserMessageItem | None,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:

        # Handle text message
        if input and input.content:
            yield TextDeltaEvent(f"You said: {input.content}\n\n")

        # Handle attachments
        if input and input.attachments:
            for attachment in input.attachments:
                # Validate
                content = base64.b64decode(attachment.content)
                if len(content) > self.MAX_SIZE:
                    yield TextDeltaEvent(f"File too large: {attachment.filename}\n")
                    continue

                # Process by type
                if attachment.mime_type in self.ALLOWED_IMAGES:
                    yield TextDeltaEvent(f"Analyzing image: {attachment.filename}...\n")
                    async for event in self.analyze_image(attachment):
                        yield event

                elif attachment.mime_type in self.ALLOWED_DOCS:
                    yield TextDeltaEvent(f"Processing document: {attachment.filename}...\n")
                    async for event in self.process_document(attachment):
                        yield event

                else:
                    yield TextDeltaEvent(f"Unsupported file type: {attachment.mime_type}\n")

    async def analyze_image(self, attachment) -> AsyncIterator[ThreadStreamEvent]:
        image_url = f"data:{attachment.mime_type};base64,{attachment.content}"

        response = await openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this image."},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            stream=True,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield TextDeltaEvent(chunk.choices[0].delta.content)

    async def process_document(self, attachment) -> AsyncIterator[ThreadStreamEvent]:
        content = base64.b64decode(attachment.content)

        if attachment.mime_type == 'text/plain':
            text = content.decode('utf-8')
            yield TextDeltaEvent(f"Contents:\n```\n{text[:1000]}\n```\n")

        elif attachment.mime_type == 'application/pdf':
            from PyPDF2 import PdfReader
            import io

            pdf = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() for page in pdf.pages[:5])
            yield TextDeltaEvent(f"PDF has {len(pdf.pages)} pages. Preview:\n{text[:500]}...\n")

        elif attachment.mime_type == 'text/csv':
            import pandas as pd
            import io

            df = pd.read_csv(io.BytesIO(content))
            yield TextDeltaEvent(f"CSV has {len(df)} rows, {len(df.columns)} columns.\n")
            yield TextDeltaEvent(f"Columns: {', '.join(df.columns)}\n")
            yield TextDeltaEvent(f"Preview:\n```\n{df.head().to_string()}\n```\n")
```
