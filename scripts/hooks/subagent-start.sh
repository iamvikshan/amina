#!/bin/bash
# SubagentStart hook: Injects Core Philosophy principles into every
# subagent session. Adds role-specific rules for known worker types
# (ekko, aurora, forge, sentry) to enforce consistent quality standards.

set -euo pipefail

# jq is required for JSON parsing -- degrade silently if missing
if ! command -v jq &>/dev/null; then
  cat >/dev/null
  exit 0
fi

INPUT=$(cat)

AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // empty')

CONTEXT="Core Philosophy for this session:
- Zero-trust: verify your own work, do not trust assumptions
- Indistinguishable Code: output must match senior engineer conventions exactly
- No emojis: ASCII symbols only (* -> [x] [ ] ---)
- Human intervention = failure: resolve ambiguity, don't ask"

# Add role-specific rules based on agent_type
AGENT_TYPE_LOWER=$(echo "$AGENT_TYPE" | tr '[:upper:]' '[:lower:]')

if [[ "$AGENT_TYPE_LOWER" == *"ekko"* || "$AGENT_TYPE_LOWER" == *"aurora"* || "$AGENT_TYPE_LOWER" == *"forge"* ]]; then
  CONTEXT="${CONTEXT}

Worker rules:
- Read files before editing (Write-Guard)
- Comments must add value (Comment Discipline, <30% density)
- No scope creep: do exactly what was asked"
fi

if [[ "$AGENT_TYPE_LOWER" == *"forge"* ]]; then
  CONTEXT="${CONTEXT}
- Security-first: no plaintext secrets, pin versions, scan images
- Expect sentry review on all output"
fi

if [[ "$AGENT_TYPE_LOWER" == *"sentry"* ]]; then
  CONTEXT="${CONTEXT}

Review rules: Zero findings = look harder. Verify claims against code."
fi

CONTEXT_ESCAPED=$(printf '%s' "$CONTEXT" | jq -Rs '.')

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SubagentStart",
    "additionalContext": ${CONTEXT_ESCAPED}
  }
}
EOF

exit 0
