# NanoClaw Test Sandbox
# Isolated environment for 4-Level TDD verification
#
# Includes:
# - Python 3.12 with OpenAI Agents SDK, ChatKit, FastAPI
# - Node.js 20 with Next.js, React
# - Verification scripts for backend and frontend
#
# Build: docker build -t nanoclaw-test-sandbox nanoclaw/container/sandbox/
# Run:   docker run --rm -v $(pwd)/generated:/workspace/generated nanoclaw-test-sandbox

FROM python:3.12-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -s /bin/bash sandbox
WORKDIR /home/sandbox

# =============================================================================
# Python Dependencies
# =============================================================================

# Copy and install Python requirements
COPY requirements.txt /sandbox/requirements.txt
RUN pip install --no-cache-dir -r /sandbox/requirements.txt

# =============================================================================
# Node.js Dependencies (for frontend verification)
# =============================================================================

COPY package.json /sandbox/package.json
WORKDIR /sandbox
RUN npm install --production

# =============================================================================
# Verification Scripts
# =============================================================================

COPY verify_backend.py /sandbox/verify_backend.py
COPY verify_frontend.sh /sandbox/verify_frontend.sh
COPY entrypoint.sh /sandbox/entrypoint.sh

# Fix Windows line endings and set executable permissions
RUN dos2unix /sandbox/verify_frontend.sh /sandbox/entrypoint.sh \
    && chmod +x /sandbox/verify_frontend.sh /sandbox/entrypoint.sh

# =============================================================================
# Workspace Setup
# =============================================================================

# Create workspace directories
RUN mkdir -p /workspace/generated /workspace/results \
    && chown -R sandbox:sandbox /workspace /sandbox

# Switch to non-root user
USER sandbox
WORKDIR /workspace

# =============================================================================
# Entrypoint
# =============================================================================

# Default: run backend verification
# Override with: docker run ... bash /sandbox/verify_frontend.sh
ENTRYPOINT ["/sandbox/entrypoint.sh"]
CMD ["backend"]
