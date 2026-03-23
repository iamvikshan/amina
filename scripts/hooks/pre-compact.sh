#!/bin/bash
# PreCompact hook: Captures session state before context compaction.
# Extracts file paths and message counts from the transcript to build
# a state snapshot, injecting it as additionalContext so the agent can
# preserve critical information before context is lost.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# If transcript is available and readable, build a state snapshot
if [[ -n "$TRANSCRIPT_PATH" && -f "$TRANSCRIPT_PATH" && -r "$TRANSCRIPT_PATH" ]]; then
  MSG_COUNT=$(jq 'length' "$TRANSCRIPT_PATH" 2>/dev/null || echo "unknown")

  # Extract file paths from structured transcript JSON via jq
  FILE_PATHS=$(jq -r '.. | strings' "$TRANSCRIPT_PATH" 2>/dev/null \
    | grep -oE '/[a-zA-Z0-9_./ -]+\.[a-zA-Z0-9]+' \
    | grep -v '//\|http\|https\|www' \
    | sort -u | head -20 || true)

  SNAPSHOT="Context compaction imminent. Session state snapshot:"
  SNAPSHOT="${SNAPSHOT}
- Messages in transcript: ${MSG_COUNT}"

  if [[ -n "$FILE_PATHS" ]]; then
    SNAPSHOT="${SNAPSHOT}
- Key files referenced in this session:"
    while IFS= read -r fp; do
      SNAPSHOT="${SNAPSHOT}
  ${fp}"
    done <<< "$FILE_PATHS"
  fi

  SNAPSHOT="${SNAPSHOT}
Save any critical state to /memories/session/ before it is lost."
else
  SNAPSHOT="Context compaction imminent. Save important session state to /memories/session/ now."
fi

SNAPSHOT_ESCAPED=$(printf '%s' "$SNAPSHOT" | jq -Rs '.')

cat <<EOF
{
  "systemMessage": ${SNAPSHOT_ESCAPED}
}
EOF

exit 0
