#!/bin/bash
#
# Frontend Verification Script for NanoClaw TDD Sandbox
#
# This script verifies generated frontend code by:
# 1. Installing npm dependencies
# 2. Running npm run build
# 3. Checking for "use client" directive errors
# 4. Checking for TypeScript errors
#
# Output: JSON result to stdout
#
# Usage:
#     bash verify_frontend.sh [--project-dir /path/to/generated]
#
# Exit codes:
#     0: All verifications passed
#     1: One or more verifications failed

set -e

# Default project directory
PROJECT_DIR="${1:-/workspace/generated}"
FRONTEND_DIR="$PROJECT_DIR"

# Check if frontend is in subdirectory
if [ -d "$PROJECT_DIR/frontend" ]; then
    FRONTEND_DIR="$PROJECT_DIR/frontend"
fi

# Result variables
SUCCESS=true
ERRORS=()
WARNINGS=()
BUILD_OUTPUT=""
START_TIME=$(date +%s)

# Helper function to add error
add_error() {
    ERRORS+=("$1")
    SUCCESS=false
}

# Helper function to add warning
add_warning() {
    WARNINGS+=("$1")
}

# Check if project exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo '{"success": false, "errors": ["Project directory not found"], "build_success": false}'
    exit 1
fi

# Change to frontend directory
cd "$FRONTEND_DIR"

# Check for package.json
if [ ! -f "package.json" ]; then
    echo '{"success": false, "errors": ["No package.json found"], "build_success": false}'
    exit 1
fi

# Step 1: Install dependencies
echo "Installing dependencies..." >&2
if ! npm install --legacy-peer-deps 2>&1; then
    add_error "npm install failed"
fi

# Step 2: Run build
echo "Running build..." >&2
BUILD_OUTPUT=$(npm run build 2>&1) || {
    add_error "npm run build failed"

    # Check for specific errors
    if echo "$BUILD_OUTPUT" | grep -q "Event handlers cannot be passed to Client Component"; then
        add_error "Missing 'use client' directive in component with event handlers"
    fi

    if echo "$BUILD_OUTPUT" | grep -q "Module not found"; then
        add_error "Module import error in frontend code"
    fi
}

# Step 3: Check for "use client" issues in source files
echo "Checking for 'use client' issues..." >&2
for file in $(find . -name "*.tsx" -o -name "*.jsx" 2>/dev/null | grep -v node_modules); do
    if [ -f "$file" ]; then
        # Check if file has event handlers
        if grep -q "onClick\|onChange\|onSubmit\|useState\|useEffect" "$file"; then
            # Check if "use client" is present
            if ! head -5 "$file" | grep -q '"use client"\|'"'"'use client'"'"''; then
                add_warning "File $file may need 'use client' directive"
            fi
        fi
    fi
done

# Step 4: Check for TypeScript errors
if [ -f "tsconfig.json" ]; then
    echo "Checking TypeScript..." >&2
    if command -v npx &> /dev/null; then
        TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || {
            if echo "$TSC_OUTPUT" | grep -q "error TS"; then
                add_warning "TypeScript errors found (non-blocking)"
            fi
        }
    fi
fi

# Calculate timing
END_TIME=$(date +%s)
TIMING=$((END_TIME - START_TIME))

# Build JSON output
build_json_array() {
    local arr=("$@")
    local json="["
    local first=true
    for item in "${arr[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            json+=","
        fi
        # Escape quotes in item
        item=$(echo "$item" | sed 's/"/\\"/g')
        json+="\"$item\""
    done
    json+="]"
    echo "$json"
}

ERRORS_JSON=$(build_json_array "${ERRORS[@]}")
WARNINGS_JSON=$(build_json_array "${WARNINGS[@]}")

# Determine build_success
BUILD_SUCCESS=true
if [ ${#ERRORS[@]} -gt 0 ]; then
    BUILD_SUCCESS=false
fi

# Output JSON result
cat << EOF
{
    "success": $SUCCESS,
    "build_success": $BUILD_SUCCESS,
    "errors": $ERRORS_JSON,
    "warnings": $WARNINGS_JSON,
    "timing": $TIMING
}
EOF

# Exit with appropriate code
if [ "$SUCCESS" = true ]; then
    exit 0
else
    exit 1
fi
