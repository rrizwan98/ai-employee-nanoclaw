#!/bin/bash
#
# Frontend Verification Script
#
# Runs 4-level verification tests on generated frontend code.
# Output: JSON with verification results
#
# Usage:
#     ./verify-frontend.sh /path/to/frontend [--level=1-4]
#

set -e

PROJECT_PATH="${1:-.}"
MAX_LEVEL="${2:-4}"

# Remove --level= prefix if present
MAX_LEVEL="${MAX_LEVEL#--level=}"

# Initialize result
RESULT='{"success": true, "levels": {}}'

# Helper to add error to result
add_error() {
    local level="$1"
    local error_type="$2"
    local message="$3"
    local file="${4:-}"

    RESULT=$(echo "$RESULT" | jq --arg level "$level" --arg type "$error_type" --arg msg "$message" --arg file "$file" \
        '.levels[$level].errors += [{"type": $type, "message": $msg, "file": $file}]')
}

# Level 1: Syntax Tests
verify_level1() {
    echo "Level 1: Syntax Tests" >&2

    local errors=0
    local files_checked=0

    # Check for unresolved template variables
    while IFS= read -r -d '' file; do
        files_checked=$((files_checked + 1))

        if grep -q '{{' "$file" || grep -q '}}' "$file"; then
            add_error "level1" "syntax" "Unresolved template variable" "$file"
            errors=$((errors + 1))
        fi
    done < <(find "$PROJECT_PATH" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -print0)

    if [ $errors -eq 0 ]; then
        RESULT=$(echo "$RESULT" | jq '.levels.level1 = {"level": "level1", "passed": true, "errors": [], "files_checked": '"$files_checked"'}')
    else
        RESULT=$(echo "$RESULT" | jq '.levels.level1.passed = false | .levels.level1.level = "level1" | .success = false')
    fi
}

# Level 2: Import Tests
verify_level2() {
    echo "Level 2: Import Tests" >&2

    cd "$PROJECT_PATH" || exit 1

    # Initialize level2 result
    RESULT=$(echo "$RESULT" | jq '.levels.level2 = {"level": "level2", "passed": true, "errors": []}')

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        add_error "level2" "import" "package.json not found"
        RESULT=$(echo "$RESULT" | jq '.levels.level2.passed = false | .success = false')
        return
    fi

    # npm install
    echo "Running npm install..." >&2
    if ! npm install --silent 2>&1; then
        add_error "level2" "import" "npm install failed"
        RESULT=$(echo "$RESULT" | jq '.levels.level2.passed = false | .success = false')
        return
    fi

    # TypeScript check
    echo "Running TypeScript check..." >&2
    if command -v npx &> /dev/null; then
        if ! npx tsc --noEmit 2>&1; then
            add_error "level2" "type" "TypeScript errors found"
            RESULT=$(echo "$RESULT" | jq '.levels.level2.passed = false | .success = false')
            return
        fi
    fi

    cd - > /dev/null || exit 1
}

# Level 3: Build Tests
verify_level3() {
    echo "Level 3: Build Tests" >&2

    cd "$PROJECT_PATH" || exit 1

    # Initialize level3 result
    RESULT=$(echo "$RESULT" | jq '.levels.level3 = {"level": "level3", "passed": true, "errors": []}')

    # npm run build
    echo "Running npm run build..." >&2
    if ! npm run build 2>&1; then
        add_error "level3" "build" "npm run build failed"
        RESULT=$(echo "$RESULT" | jq '.levels.level3.passed = false | .success = false')
        return
    fi

    # Check if build output exists
    if [ ! -d ".next" ] && [ ! -d "build" ] && [ ! -d "dist" ]; then
        add_error "level3" "build" "No build output directory found"
        RESULT=$(echo "$RESULT" | jq '.levels.level3.passed = false | .success = false')
    fi

    cd - > /dev/null || exit 1
}

# Level 4: Directive Tests
verify_level4() {
    echo "Level 4: Directive Tests" >&2

    # Initialize level4 result
    RESULT=$(echo "$RESULT" | jq '.levels.level4 = {"level": "level4", "passed": true, "errors": [], "missing_directives": []}')

    local missing=()

    # Find files that need "use client"
    while IFS= read -r -d '' file; do
        # Check if file uses client-side features
        if grep -qE '(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer|onClick|onChange|onSubmit|onFocus|onBlur)' "$file"; then
            # Check if "use client" is present
            if ! head -n 1 "$file" | grep -qE "^['\"]use client['\"]"; then
                missing+=("$file")
                add_error "level4" "directive" "Missing 'use client' directive" "$file"
            fi
        fi
    done < <(find "$PROJECT_PATH" -type f \( -name "*.tsx" -o -name "*.jsx" \) -not -path "*/node_modules/*" -print0)

    if [ ${#missing[@]} -gt 0 ]; then
        RESULT=$(echo "$RESULT" | jq '.levels.level4.passed = false | .success = false')
        # Add missing files to result
        for f in "${missing[@]}"; do
            RESULT=$(echo "$RESULT" | jq --arg f "$f" '.levels.level4.missing_directives += [$f]')
        done
    fi
}

# Main
main() {
    echo "Frontend Verification: $PROJECT_PATH (max level: $MAX_LEVEL)" >&2

    if [ "$MAX_LEVEL" -ge 1 ]; then
        verify_level1
        # Check if level1 failed
        if [ "$(echo "$RESULT" | jq -r '.levels.level1.passed')" = "false" ]; then
            echo "$RESULT"
            exit 0
        fi
    fi

    if [ "$MAX_LEVEL" -ge 2 ]; then
        verify_level2
        # Check if level2 failed
        if [ "$(echo "$RESULT" | jq -r '.levels.level2.passed')" = "false" ]; then
            echo "$RESULT"
            exit 0
        fi
    fi

    if [ "$MAX_LEVEL" -ge 3 ]; then
        verify_level3
    fi

    if [ "$MAX_LEVEL" -ge 4 ]; then
        verify_level4
    fi

    echo "$RESULT"
}

main
