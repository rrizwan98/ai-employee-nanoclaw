#!/bin/bash
#
# Sandbox Entrypoint Script
#
# Runs appropriate verification based on argument:
#   backend  - Run Python backend verification
#   frontend - Run Node.js frontend verification
#   both     - Run both verifications
#
# Usage:
#   docker run nanoclaw-test-sandbox backend
#   docker run nanoclaw-test-sandbox frontend
#   docker run nanoclaw-test-sandbox both

set -e

VERIFICATION_TYPE="${1:-backend}"
PROJECT_DIR="${2:-/workspace/generated}"

case "$VERIFICATION_TYPE" in
    backend)
        echo "Running backend verification..." >&2
        python /sandbox/verify_backend.py --project-dir "$PROJECT_DIR"
        ;;

    frontend)
        echo "Running frontend verification..." >&2
        bash /sandbox/verify_frontend.sh "$PROJECT_DIR"
        ;;

    both)
        echo "Running backend verification..." >&2
        BACKEND_RESULT=$(python /sandbox/verify_backend.py --project-dir "$PROJECT_DIR")

        echo "Running frontend verification..." >&2
        FRONTEND_RESULT=$(bash /sandbox/verify_frontend.sh "$PROJECT_DIR")

        # Combine results
        echo "{"
        echo "  \"backend\": $BACKEND_RESULT,"
        echo "  \"frontend\": $FRONTEND_RESULT"
        echo "}"
        ;;

    *)
        echo "Unknown verification type: $VERIFICATION_TYPE" >&2
        echo "Usage: entrypoint.sh [backend|frontend|both] [project-dir]" >&2
        exit 1
        ;;
esac
