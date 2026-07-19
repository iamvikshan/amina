#!/bin/bash
# identity-guard.sh - Enforces expected git identity to prevent accidental commits

# Skip in CI or when HUSKY is disabled
if [ "${CI:-}" = "true" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${GITLAB_CI:-}" ] || [ "${HUSKY:-}" = "0" ]; then
  echo "Identity guard skipped in CI or HUSKY=0"
  exit 0
fi

# Codespaces (or general dev environment) identity check
if [ -n "${CODESPACES:-}" ]; then
  # Read from the local cache set by bootstrap.sh
  EXPECTED_NAME=$(git config --local atlas.expected-name 2>/dev/null || echo "")
  EXPECTED_EMAIL=$(git config --local atlas.expected-email 2>/dev/null || echo "")

  if [ -z "$EXPECTED_NAME" ] || [ -z "$EXPECTED_EMAIL" ]; then
    echo "❌ Error: Local expected identity not found."
    echo "   Please run your environment setup:"
    echo "   bash scripts/bootstrap.sh"
    exit 1
  fi

  CURRENT_USER=$(git config --global user.name 2>/dev/null || echo "")
  CURRENT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

  # Also check GIT_AUTHOR_* env vars which override git config at commit time
  EFFECTIVE_USER="${GIT_AUTHOR_NAME:-$CURRENT_USER}"
  EFFECTIVE_EMAIL="${GIT_AUTHOR_EMAIL:-$CURRENT_EMAIL}"

  if [ "$EFFECTIVE_USER" != "$EXPECTED_NAME" ] || [ "$EFFECTIVE_EMAIL" != "$EXPECTED_EMAIL" ]; then
    echo "❌ Git identity mismatch detected in Codespaces!"
    echo "   Expected:  $EXPECTED_NAME <$EXPECTED_EMAIL>"
    echo "   Effective: $EFFECTIVE_USER <$EFFECTIVE_EMAIL>"
    if [ -n "${GIT_AUTHOR_NAME:-}" ] || [ -n "${GIT_AUTHOR_EMAIL:-}" ]; then
      echo "   (GIT_AUTHOR_NAME/EMAIL env vars are overriding git config)"
    fi
    echo ""
    echo "To fix this attribution, please run:"
    echo "   bash scripts/bootstrap.sh"
    echo ""
    exit 1
  fi
fi

exit 0