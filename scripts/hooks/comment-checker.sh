#!/bin/bash
# PostToolUse hook: Flags files with excessive comment density (>30%).
# High comment ratios often indicate AI slop -- comments that restate what
# code obviously does. JSDoc/docstrings, directive comments, and shebangs
# are excluded from the count.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

case "$TOOL_NAME" in
  editFiles|create_file|replace_string_in_file|multi_replace_string_in_file) ;;
  *) exit 0 ;;
esac

FILE_PATH="${TOOL_INPUT_FILE_PATH:-}"
if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

TOTAL_LINES=0
COMMENT_LINES=0
IN_JSDOC=false
IN_BLOCK_COMMENT=false

while IFS= read -r line || [[ -n "$line" ]]; do
  trimmed="${line#"${line%%[![:space:]]*}"}"
  trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"
  [[ -z "$trimmed" ]] && continue

  TOTAL_LINES=$((TOTAL_LINES + 1))

  # Inside a JSDoc block -- skip entirely (public API docs are exempt)
  if $IN_JSDOC; then
    if [[ "$trimmed" == *"*/" ]]; then
      IN_JSDOC=false
    fi
    continue
  fi

  # Inside a regular block comment -- count
  if $IN_BLOCK_COMMENT; then
    COMMENT_LINES=$((COMMENT_LINES + 1))
    if [[ "$trimmed" == *"*/" ]]; then
      IN_BLOCK_COMMENT=false
    fi
    continue
  fi

  # JSDoc / docstring start (/** ... )
  if [[ "$trimmed" == "/**"* ]]; then
    [[ "$trimmed" != *"*/" ]] && IN_JSDOC=true
    continue
  fi

  # Regular block comment start (/* ... )
  if [[ "$trimmed" == "/*"* ]]; then
    COMMENT_LINES=$((COMMENT_LINES + 1))
    [[ "$trimmed" != *"*/" ]] && IN_BLOCK_COMMENT=true
    continue
  fi

  # Single-line comments by language family
  case "$EXT" in
    js|ts|tsx|jsx|go|java|c|cpp|rs|swift|kt|cs)
      if [[ "$trimmed" == "//"* ]]; then
        # Directive comments are exempt
        if [[ "$trimmed" =~ ^//[[:space:]]*(eslint-disable|@ts-|prettier-ignore|noinspection|NOLINT|nosec|nolint|istanbul) ]]; then
          continue
        fi
        COMMENT_LINES=$((COMMENT_LINES + 1))
      fi
      ;;
    py)
      if [[ "$trimmed" == "#"* ]]; then
        [[ "$trimmed" == "#!/"* ]] && continue
        if [[ "$trimmed" =~ ^#[[:space:]]*(type:|noqa|pylint:|fmt:|isort:|pragma:) ]]; then
          continue
        fi
        COMMENT_LINES=$((COMMENT_LINES + 1))
      fi
      ;;
    sh|bash|zsh|yml|yaml|toml|rb)
      if [[ "$trimmed" == "#"* ]]; then
        [[ "$trimmed" == "#!/"* ]] && continue
        if [[ "$trimmed" =~ ^#[[:space:]]*(shellcheck|rubocop) ]]; then
          continue
        fi
        COMMENT_LINES=$((COMMENT_LINES + 1))
      fi
      ;;
    html|xml|svg|vue)
      if [[ "$trimmed" == "<!--"* ]]; then
        COMMENT_LINES=$((COMMENT_LINES + 1))
      fi
      ;;
  esac
done < "$FILE_PATH"

# Files under 10 lines are too small for meaningful analysis
if [[ $TOTAL_LINES -lt 10 ]]; then
  exit 0
fi

RATIO=$((COMMENT_LINES * 100 / TOTAL_LINES))

if [[ $RATIO -gt 30 ]]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "WARNING: ${FILE_PATH##*/} has ${RATIO}% comment density (${COMMENT_LINES}/${TOTAL_LINES} non-blank lines). Comments exceeding 30% often indicate AI slop -- restating what code obviously does. Remove comments that add no value beyond what the code communicates. JSDoc/docstrings for public APIs and directive comments are already excluded from this count."
  }
}
EOF
fi

exit 0
