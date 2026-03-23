#!/bin/bash
# UserPromptSubmit hook: Detects Autopilot keywords (ULW, YOLO, AUTO)
# and anti-patterns (skip tests, skip review) in user prompts. Injects
# appropriate context to enable autonomous mode or enforce quality gates.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')
if [[ -z "$PROMPT" ]]; then
  exit 0
fi

MESSAGE=""

# Check for Autopilot keywords (whole words, case-insensitive)
# Only ULW and YOLO are specific enough -- AUTO excluded to prevent false positives
# from ordinary prompts like "add auto-save" or "auto format this"
if echo "$PROMPT" | grep -iqE '\b(ULW|YOLO)\b'; then
  MESSAGE="Autopilot mode detected. Proceed autonomously without user stops. Auto-commit after **sentry** approval. Present final summary when all work is done."
fi

# Check for anti-patterns (case-insensitive)
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')
if [[ "$PROMPT_LOWER" == *"without testing"* || \
      "$PROMPT_LOWER" == *"skip tests"* || \
      "$PROMPT_LOWER" == *"skip review"* || \
      "$PROMPT_LOWER" == *"don't test"* || \
      "$PROMPT_LOWER" == *"no tests"* || \
      "$PROMPT_LOWER" == *"just do it"* ]]; then
  ANTI_PATTERN_MSG="WARNING: The user's prompt suggests skipping quality gates. All tests and reviews are mandatory per Core Philosophy. Proceed with full quality enforcement."
  if [[ -n "$MESSAGE" ]]; then
    MESSAGE="${MESSAGE}
${ANTI_PATTERN_MSG}"
  else
    MESSAGE="$ANTI_PATTERN_MSG"
  fi
fi

# If nothing detected, exit silently
if [[ -z "$MESSAGE" ]]; then
  exit 0
fi

MESSAGE_ESCAPED=$(printf '%s' "$MESSAGE" | jq -Rs '.')

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": ${MESSAGE_ESCAPED}
  }
}
EOF

exit 0
