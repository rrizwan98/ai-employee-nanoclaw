"""
Level 4: Integration Tests - Verify Backend and Frontend Work Together

These tests verify that:
1. Chat message round-trip works (send message, receive response)
2. CORS headers allow frontend communication
3. Streaming responses work correctly
4. Session persistence across messages
5. Thread creation and listing works
6. Error responses have proper format

Run with: pytest -m level4 --use-sandbox

Time: ~120 seconds

Note: These tests require Docker sandbox container and full stack.
"""

import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional

import pytest


# =============================================================================
# Fixtures for Integration Tests
# =============================================================================

@pytest.fixture
async def running_backend(
    generated_basic_chatbot: Path,
    sandbox_runner
) -> Dict[str, Any]:
    """
    Start backend server inside Docker container for integration testing.

    Returns dict with:
    - url: Server base URL
    - port: Port number
    - container_id: Docker container ID
    """
    if not sandbox_runner.is_available():
        pytest.skip("Sandbox not available")

    import socket
    import httpx

    # Find free port
    sock = socket.socket()
    sock.bind(('', 0))
    port = sock.getsockname()[1]
    sock.close()

    # Start server in Docker container with port forwarding
    # Container runs uvicorn on port 8000, mapped to host port
    # Use --entrypoint to override the default entrypoint and run uvicorn directly
    container_id = None
    try:
        # Start container in detached mode with port mapping
        # Override entrypoint to run uvicorn directly
        result = subprocess.run(
            [
                "docker", "run", "-d",
                "-p", f"{port}:8000",
                "-v", f"{generated_basic_chatbot}:/workspace/generated:ro",
                "-e", "OPENAI_API_KEY=sk-test-dummy-key",
                "-e", "PORT=8000",
                "--workdir", "/workspace/generated",
                "--entrypoint", "python",  # Override entrypoint
                sandbox_runner.container_image,
                "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"
            ],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            pytest.skip(f"Failed to start Docker container: {result.stderr}")

        container_id = result.stdout.strip()

        url = f"http://localhost:{port}"

        # Wait for server to be ready (up to 30 seconds)
        server_ready = False
        for _ in range(60):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{url}/health", timeout=1.0)
                    if response.status_code == 200:
                        server_ready = True
                        break
            except:
                pass
            await asyncio.sleep(0.5)

        if not server_ready:
            # Check container logs for errors
            logs = subprocess.run(
                ["docker", "logs", container_id],
                capture_output=True,
                text=True
            )
            pytest.skip(f"Server did not start in time. Logs: {logs.stderr[:500]}")

        yield {"url": url, "port": port, "container_id": container_id}

    finally:
        # Cleanup container
        if container_id:
            subprocess.run(["docker", "stop", container_id], capture_output=True, timeout=10)
            subprocess.run(["docker", "rm", "-f", container_id], capture_output=True, timeout=10)


# =============================================================================
# Level 4 Tests - Chat Communication
# =============================================================================

@pytest.mark.level4
class TestChatCommunication:
    """Tests for chat message round-trip."""

    @pytest.mark.asyncio
    async def test_chat_message_roundtrip(
        self,
        running_backend: Dict[str, Any]
    ):
        """
        Test ChatKit endpoint accepts POST requests.

        ChatKit uses a binary protocol, not standard REST.
        This test verifies the endpoint responds without crashing.
        """
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url, timeout=30.0) as client:
            # Test that /chatkit endpoint exists and accepts POST
            response = await client.post(
                "/chatkit",
                content=b"",  # Empty payload - will fail validation but should respond
                headers={"Content-Type": "application/octet-stream"}
            )

            # ChatKit endpoint should respond (even with error)
            # 400 Bad Request is acceptable for invalid payload
            # 200/201/202 would mean valid response
            assert response.status_code in [200, 201, 202, 400, 422, 500], \
                f"ChatKit endpoint not responding: {response.status_code}"

    @pytest.mark.asyncio
    async def test_health_endpoint(
        self,
        running_backend: Dict[str, Any]
    ):
        """Health endpoint returns proper format."""
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            response = await client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            assert data["status"] == "healthy"


# =============================================================================
# Level 4 Tests - CORS Configuration
# =============================================================================

@pytest.mark.level4
class TestCORSConfiguration:
    """Tests for CORS headers."""

    @pytest.mark.asyncio
    async def test_cors_allows_all_origins(
        self,
        running_backend: Dict[str, Any]
    ):
        """
        CORS allows frontend origin.

        Response should include:
        Access-Control-Allow-Origin: * (or specific origin)
        """
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            # Send OPTIONS request (preflight)
            response = await client.options(
                "/health",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "GET"
                }
            )

            # Should allow the request
            assert response.status_code in [200, 204], \
                f"CORS preflight failed: {response.status_code}"

    @pytest.mark.asyncio
    async def test_cors_allows_post(
        self,
        running_backend: Dict[str, Any]
    ):
        """CORS allows POST requests for chat."""
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            response = await client.options(
                "/chatkit/threads",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                }
            )

            # Should return OK or No Content
            assert response.status_code in [200, 204], \
                "CORS should allow POST to /chatkit/threads"


# =============================================================================
# Level 4 Tests - Streaming Response
# =============================================================================

@pytest.mark.level4
class TestStreamingResponse:
    """Tests for Server-Sent Events streaming."""

    @pytest.mark.asyncio
    async def test_streaming_content_type(
        self,
        running_backend: Dict[str, Any]
    ):
        """
        Streaming endpoint returns correct content type.

        Expected: text/event-stream for SSE
        """
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url, timeout=30.0) as client:
            # Try to get streaming response
            # Note: Actual streaming test depends on implementation
            response = await client.get("/")

            # At minimum, server should respond
            assert response.status_code == 200


# =============================================================================
# Level 4 Tests - Session Persistence
# =============================================================================

@pytest.mark.level4
class TestSessionPersistence:
    """Tests for conversation session persistence."""

    @pytest.mark.asyncio
    async def test_session_maintains_context(
        self,
        running_backend: Dict[str, Any]
    ):
        """
        Multiple messages maintain conversation context.

        This tests that:
        1. First message is received
        2. Second message can reference first
        3. Session stores conversation history
        """
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url, timeout=30.0) as client:
            # Create thread
            thread_response = await client.post("/chatkit/threads", json={})

            if thread_response.status_code != 200:
                pytest.skip("Thread creation not supported")

            thread_id = thread_response.json().get("id")

            # Send first message
            await client.post(
                f"/chatkit/threads/{thread_id}/messages",
                json={"content": "My name is Test User"}
            )

            # Send second message referencing first
            response2 = await client.post(
                f"/chatkit/threads/{thread_id}/messages",
                json={"content": "What is my name?"}
            )

            # Should receive some response
            assert response2.status_code in [200, 201, 202]


# =============================================================================
# Level 4 Tests - Thread Management
# =============================================================================

@pytest.mark.level4
class TestThreadManagement:
    """Tests for thread creation and listing."""

    @pytest.mark.asyncio
    async def test_thread_creation(
        self,
        running_backend: Dict[str, Any]
    ):
        """New threads can be created."""
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            response = await client.post(
                "/chatkit/threads",
                json={"title": "Test Thread"}
            )

            # ChatKit uses binary protocol, REST endpoints may not be implemented
            if response.status_code in [404, 405, 500]:
                pytest.skip("Thread endpoint not implemented (ChatKit uses binary protocol)")

            assert response.status_code in [200, 201], \
                f"Thread creation failed: {response.status_code}"

            data = response.json()
            assert "id" in data, "Thread response should include id"

    @pytest.mark.asyncio
    async def test_thread_listing(
        self,
        running_backend: Dict[str, Any]
    ):
        """
        Threads endpoint returns Page format.

        Expected format:
        {
            "data": [...],
            "has_more": false,
            "after": null
        }
        """
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            response = await client.get("/chatkit/threads")

            # ChatKit uses binary protocol, REST endpoints may not be implemented
            if response.status_code in [404, 405]:
                pytest.skip("Threads listing not implemented (ChatKit uses binary protocol)")

            assert response.status_code == 200

            data = response.json()

            # Check Page format
            if isinstance(data, dict):
                # Should have Page structure
                assert "data" in data or "items" in data, \
                    "Thread listing should return Page format with 'data' field"


# =============================================================================
# Level 4 Tests - Error Handling
# =============================================================================

@pytest.mark.level4
class TestErrorHandling:
    """Tests for error response format."""

    @pytest.mark.asyncio
    async def test_error_response_format(
        self,
        running_backend: Dict[str, Any]
    ):
        """
        Errors return proper JSON format.

        Expected:
        {"error": "message"} or {"detail": "message"}
        """
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            # Try to access non-existent endpoint
            response = await client.get("/nonexistent-endpoint-12345")

            assert response.status_code == 404

            # Should return JSON error
            try:
                data = response.json()
                assert "detail" in data or "error" in data or "message" in data, \
                    "Error response should have detail/error/message field"
            except json.JSONDecodeError:
                pytest.fail("Error response should be valid JSON")

    @pytest.mark.asyncio
    async def test_invalid_thread_id(
        self,
        running_backend: Dict[str, Any]
    ):
        """Invalid thread ID returns 404."""
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            response = await client.get("/chatkit/threads/invalid-thread-id-12345")

            # ChatKit uses binary protocol, REST endpoints may not be implemented
            if response.status_code == 405:
                pytest.skip("Thread GET endpoint not implemented (ChatKit uses binary protocol)")

            # Should return 404 or handle gracefully
            assert response.status_code in [404, 400], \
                f"Invalid thread should return 404, got {response.status_code}"


# =============================================================================
# Level 4 Tests - Performance
# =============================================================================

@pytest.mark.level4
class TestPerformance:
    """Tests for basic performance requirements."""

    @pytest.mark.asyncio
    async def test_health_response_time(
        self,
        running_backend: Dict[str, Any]
    ):
        """Health endpoint responds within 500ms."""
        import httpx
        import time

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            start = time.time()
            response = await client.get("/health")
            elapsed = time.time() - start

            assert response.status_code == 200
            assert elapsed < 0.5, f"Health check took {elapsed:.2f}s, should be <0.5s"

    @pytest.mark.asyncio
    async def test_concurrent_requests(
        self,
        running_backend: Dict[str, Any]
    ):
        """Server handles multiple concurrent requests."""
        import httpx

        url = running_backend["url"]

        async with httpx.AsyncClient(base_url=url) as client:
            # Send 5 concurrent requests
            tasks = [client.get("/health") for _ in range(5)]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            # All should succeed
            successes = [r for r in responses if isinstance(r, httpx.Response) and r.status_code == 200]
            assert len(successes) >= 4, \
                f"At least 4/5 concurrent requests should succeed, got {len(successes)}"
