#!/bin/bash
# Stop hook: Checks for uncommitted changes and temp artifacts before
# session ends. Warns via additionalContext but never blocks -- stopping
# must always succeed to prevent runaway sessions.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

# Safety: if stop_hook_active is true, exit immediately to prevent infinite loops
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // "false"')
if [[ "$STOP_HOOK_ACTIVE" == "true" ]]; then
  exit 0
fi

CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$CWD" ]]; then
  exit 0
fi

WARNINGS=()

# Check for uncommitted changes
if command -v git &>/dev/null && [[ -d "${CWD}/.git" ]]; then
  DIRTY=$(git -C "$CWD" status --porcelain 2>/dev/null || true)
  if [[ -n "$DIRTY" ]]; then
    CHANGE_COUNT=$(echo "$DIRTY" | wc -l | tr -d ' ')
    WARNINGS+=("Uncommitted changes detected (${CHANGE_COUNT} files). Consider committing or stashing before ending session.")
  fi
fi

# Check for temp/debug artifacts
TEMP_FILES=""
if [[ -d "$CWD" ]]; then
  TEMP_FILES=$(find "$CWD" -maxdepth 3 \( -name '*.tmp' -o -name '*.bak' -o -name 'debug-*' \) -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | head -10 || true)
fi
if [[ -n "$TEMP_FILES" ]]; then
  TEMP_COUNT=$(echo "$TEMP_FILES" | wc -l | tr -d ' ')
  WARNINGS+=("Found ${TEMP_COUNT} temp/debug artifact(s) in workspace. Clean up: *.tmp, *.bak, debug-* files.")
fi

# If nothing to warn about, exit silently
if [[ ${#WARNINGS[@]} -eq 0 ]]; then
  exit 0
fi

COMPILED=""
for w in "${WARNINGS[@]}"; do
  COMPILED="${COMPILED}- ${w}
"
done

COMPILED_ESCAPED=$(printf '%s' "$COMPILED" | jq -Rs '.')

cat <<EOF
{
  "systemMessage": ${COMPILED_ESCAPED}
}
EOF

exit 0
