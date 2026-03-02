# NanoClaw Container Tests
# 4-Level TDD Testing System

"""
Test Levels:
- Level 1: Syntax tests (template rendering, variable substitution)
- Level 2: Import tests (generated code imports without errors)
- Level 3: Runtime tests (agents initialize, servers start)
- Level 4: Integration tests (backend + frontend communication)

Run tests by level:
    pytest -m level1                    # Fast: ~5 seconds
    pytest -m level2                    # Medium: ~15 seconds
    pytest -m level3 --use-sandbox      # Slow: ~60 seconds
    pytest -m level4 --use-sandbox      # Slowest: ~120 seconds

Run all tests:
    pytest nanoclaw/container/tests/
"""
