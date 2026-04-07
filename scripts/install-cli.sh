#!/usr/bin/env sh
set -e

REPO_OWNER='iamvikshan'
REPO_NAME='amina'
RELEASES_API_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases"
RELEASES_PAGE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases"
DOWNLOAD_BASE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download"
BINARY_NAME='amina'
SYSTEM_BIN_DIR='/usr/local/bin'
USER_BIN_DIR="${HOME}/.local/bin"
USED_FALLBACK_BIN='false'
TEMP_FILE=''
TARGET_PATH=''
OS=''
ARCH=''
VERSION=''
TAG_NAME=''

say() {
  printf '%s\n' "$1"
}

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

cleanup() {
  if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
  fi
}

trap cleanup 0 HUP INT TERM

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
  fi
}

select_os() {
  system_name=$(uname -s 2>/dev/null || printf 'unknown')

  case "$system_name" in
    Linux)
      OS='linux'
      ;;
    Darwin)
      OS='darwin'
      ;;
    CYGWIN* | MINGW* | MSYS*)
      fail "Windows users should download amina-windows-x64.exe manually from the latest cli-v* release at ${RELEASES_PAGE_URL}."
      ;;
    *)
      fail "Unsupported operating system: ${system_name}"
      ;;
  esac
}

select_arch() {
  machine_name=$(uname -m 2>/dev/null || printf 'unknown')

  case "$machine_name" in
    x86_64 | amd64)
      ARCH='x64'
      ;;
    aarch64 | arm64)
      ARCH='arm64'
      ;;
    *)
      fail "Unsupported architecture: ${machine_name}"
      ;;
  esac
}

find_latest_cli_tag() {
  page_number=1

  while :; do
    release_page=$(curl -fsSL "${RELEASES_API_URL}?per_page=100&page=${page_number}")
    tag_name=$(printf '%s' "$release_page" | grep -o '"tag_name":[[:space:]]*"[^"]*"' | sed -n 's/.*"tag_name":[[:space:]]*"\(cli-v[^"]*\)".*/\1/p' | sed -n '1p')

    if [ -n "$tag_name" ]; then
      printf '%s\n' "$tag_name"
      return 0
    fi

    if [ "$release_page" = '[]' ]; then
      break
    fi

    if ! printf '%s' "$release_page" | grep -q '"tag_name"'; then
      break
    fi

    page_number=$((page_number + 1))
  done

  return 1
}

select_target_path() {
  if [ -d "$SYSTEM_BIN_DIR" ]; then
    if [ -w "$SYSTEM_BIN_DIR" ]; then
      TARGET_PATH="${SYSTEM_BIN_DIR}/${BINARY_NAME}"
      return 0
    fi
  elif [ -d '/usr/local' ] && [ -w '/usr/local' ]; then
    mkdir -p "$SYSTEM_BIN_DIR"
    TARGET_PATH="${SYSTEM_BIN_DIR}/${BINARY_NAME}"
    return 0
  fi

  if [ -z "${HOME:-}" ]; then
    fail 'HOME must be set when falling back to ~/.local/bin'
  fi

  mkdir -p "$USER_BIN_DIR"
  TARGET_PATH="${USER_BIN_DIR}/${BINARY_NAME}"
  USED_FALLBACK_BIN='true'
}

require_command curl
require_command grep
require_command sed
require_command uname
require_command chmod
require_command mkdir
require_command mktemp
require_command mv

select_os
select_arch
TAG_NAME=$(find_latest_cli_tag) || fail "Could not find a cli-v* release at ${RELEASES_PAGE_URL}."
VERSION=${TAG_NAME#cli-v}
DOWNLOAD_URL="${DOWNLOAD_BASE_URL}/${TAG_NAME}/${BINARY_NAME}-${OS}-${ARCH}"

select_target_path

TEMP_FILE=$(mktemp "${TMPDIR:-/tmp}/amina.XXXXXX")
say "Downloading ${BINARY_NAME} ${VERSION} from ${DOWNLOAD_URL}"
curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_FILE"
chmod +x "$TEMP_FILE"
mv "$TEMP_FILE" "$TARGET_PATH"
TEMP_FILE=''
chmod +x "$TARGET_PATH"

say "Installed ${BINARY_NAME} ${VERSION} to ${TARGET_PATH}"

if [ "$USED_FALLBACK_BIN" = 'true' ]; then
  case ":${PATH}:" in
    *":${USER_BIN_DIR}:"*)
      ;;
    *)
      say "${USER_BIN_DIR} is not currently in PATH."
      say "Add it with: export PATH=\"${USER_BIN_DIR}:\$PATH\""
      ;;
  esac
fi
