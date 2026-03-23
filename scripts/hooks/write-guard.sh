#!/bin/bash
# PreToolUse hook: Warns when editing a file that hasn't been read in
# the current session. Prevents blind modifications by checking the
# conversation transcript for prior read_file calls on the target path.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

case "$TOOL_NAME" in
  editFiles|replace_string_in_file|multi_replace_string_in_file) ;;
  # create_file is excluded -- new files have nothing to read first
  *) exit 0 ;;
esac

FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"
if [[ -z "$FILE_PATH" ]]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.filePath // .tool_input.files[0] // empty')
fi

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')
if [[ -z "$TRANSCRIPT_PATH" || ! -f "$TRANSCRIPT_PATH" ]]; then
  # No transcript available -- cannot verify, allow silently
  exit 0
fi

# Check if the file path appears in the transcript (evidence it was read)
if grep -qF "$FILE_PATH" "$TRANSCRIPT_PATH" 2>/dev/null; then
  exit 0
fi

# Also check the basename in case paths differ by prefix
BASENAME="${FILE_PATH##*/}"
if grep -qF "$BASENAME" "$TRANSCRIPT_PATH" 2>/dev/null; then
  exit 0
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "WARNING: You are editing ${BASENAME} but there is no evidence you read it in this session. Read files before editing to understand existing code and avoid blind modifications."
  }
}
EOF

exit 0
