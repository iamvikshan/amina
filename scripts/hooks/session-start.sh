#!/bin/bash
# SessionStart hook: Compiles project context from repo memories, git state,
# and project metadata. Injects this as additionalContext so **atlas** begins
# every session with awareness of codebase conventions and environment.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
if [[ -z "$CWD" ]]; then
  exit 0
fi

CONTEXT_PARTS=()

# -- Repo memories: compile convention summaries --
MEMORIES_DIR="${CWD}/memories/repo"
if [[ -d "$MEMORIES_DIR" ]]; then
  MEMORY_SUMMARY=""
  for f in "$MEMORIES_DIR"/*.json; do
    [[ -f "$f" ]] || continue
    SUBJECT=$(jq -r '.subject // empty' "$f" 2>/dev/null)
    FACT=$(jq -r '.fact // empty' "$f" 2>/dev/null)
    if [[ -n "$SUBJECT" && -n "$FACT" ]]; then
      MEMORY_SUMMARY="${MEMORY_SUMMARY}- ${SUBJECT}: ${FACT}
"
    fi
  done
  if [[ -n "$MEMORY_SUMMARY" ]]; then
    CONTEXT_PARTS+=("Project conventions:
${MEMORY_SUMMARY}")
  fi
fi

# -- Git branch --
if command -v git &>/dev/null && [[ -d "${CWD}/.git" ]]; then
  BRANCH=$(git -C "$CWD" branch --show-current 2>/dev/null || true)
  if [[ -n "$BRANCH" ]]; then
    CONTEXT_PARTS+=("Git branch: ${BRANCH}")
  fi
fi

# -- Project name from package.json or pyproject.toml --
if [[ -f "${CWD}/package.json" ]]; then
  PROJECT_NAME=$(jq -r '.name // empty' "${CWD}/package.json" 2>/dev/null)
  if [[ -n "$PROJECT_NAME" ]]; then
    CONTEXT_PARTS+=("Project: ${PROJECT_NAME} (Node.js)")
  fi
elif [[ -f "${CWD}/pyproject.toml" ]]; then
  # Best-effort parse without toml library
  PROJECT_NAME=$(grep -m1 '^name' "${CWD}/pyproject.toml" 2>/dev/null | sed 's/.*=\s*"\(.*\)"/\1/' || true)
  if [[ -n "$PROJECT_NAME" ]]; then
    CONTEXT_PARTS+=("Project: ${PROJECT_NAME} (Python)")
  fi
fi

# -- Runtime versions --
if command -v node &>/dev/null; then
  NODE_VER=$(node --version 2>/dev/null || true)
  [[ -n "$NODE_VER" ]] && CONTEXT_PARTS+=("Node: ${NODE_VER}")
fi
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version 2>/dev/null | awk '{print $2}' || true)
  [[ -n "$PY_VER" ]] && CONTEXT_PARTS+=("Python: ${PY_VER}")
fi

# -- Compile and emit --
if [[ ${#CONTEXT_PARTS[@]} -eq 0 ]]; then
  exit 0
fi

COMPILED=""
for part in "${CONTEXT_PARTS[@]}"; do
  COMPILED="${COMPILED}${part}
"
done

# Escape for JSON embedding
COMPILED_ESCAPED=$(printf '%s' "$COMPILED" | jq -Rs '.')

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": ${COMPILED_ESCAPED}
  }
}
EOF

exit 0
