#!/usr/bin/env bash

# ==============================================================================
# mina Interactive VPS Deployment Script
# Zero-dependency, idempotent installer & updater
# ==============================================================================

set -e

# --- Configuration ---
DEPLOY_PATH="${HOME}/mina"
BASE_URL="https://raw.githubusercontent.com/iamvikshan/amina/main"
OMZ_URL="https://raw.githubusercontent.com/iamvikshan/.github/refs/heads/main/scripts/omz.sh"

# --- Color Codes ---
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# --- Banner ---
echo -e "${CYAN}"
cat << "EOF"
             _                 
   _ __ ___ (_)_ __   __ _ 
  | '_ ` _ \| | '_ \ / _` |
  | | | | | | | | | | (_| |
  |_| |_| |_|_|_| |_|\__,_|
EOF
echo -e "  Interactive Deployment & Update Engine${NC}\n"

# --- Helper: TTY Input Bypass ---
# Reads input directly from the terminal keyboard, bypassing the curl pipe
prompt_user() {
    local prompt_text="$1"
    local var_name="$2"
    local is_secret="${3:-false}"
    
    if [ "$is_secret" = true ]; then
        read -rs -p "$(echo -e "${YELLOW}?${NC} $prompt_text: ")" "$var_name" </dev/tty
        echo "" </dev/tty
    else
        read -r -p "$(echo -e "${YELLOW}?${NC} $prompt_text: ")" "$var_name" </dev/tty
    fi
}

# --- Phase 1: Silent Prerequisites ---
echo -e "▶ ${CYAN}Checking system requirements...${NC}"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "ℹ Docker not found. Installing silently..."
    curl -fsSL https://get.docker.com | sudo sh >/dev/null 2>&1
    echo -e "${GREEN}✓ Docker installed.${NC}"
fi

# Handle Docker group permissions natively
DOCKER_CMD="docker compose"
D_BASE="docker"
if ! docker ps >/dev/null 2>&1; then
    if sudo docker ps >/dev/null 2>&1; then
        DOCKER_CMD="sudo docker compose"
        D_BASE="sudo docker"
    else
        echo -e "${RED}✗ Cannot communicate with Docker daemon. Please run as root or fix permissions.${NC}"
        exit 1
    fi
fi

# --- Phase 2: Zero-Clone Configuration Sync ---
echo -e "\n▶ ${CYAN}Syncing configuration...${NC}"
mkdir -p "${DEPLOY_PATH}/lavalink"

curl -sSL "${BASE_URL}/docker-compose.prod.yml" -o "${DEPLOY_PATH}/docker-compose.yml"
curl -sSL "${BASE_URL}/lavalink/application.yml" -o "${DEPLOY_PATH}/lavalink/application.yml"
echo -e "${GREEN}✓ Core files synced to ${DEPLOY_PATH}${NC}"

# --- Phase 3: Idempotent .env Setup ---
if [ ! -f "${DEPLOY_PATH}/.env" ]; then
    echo -e "\n▶ ${CYAN}First-time setup detected. How would you like to provide your secrets?${NC}\n"
    
    echo -e "  ${BOLD}1)${NC} Doppler (Fetch securely via Service Token)"
    echo -e "  ${BOLD}2)${NC} Paste .env (Opens a text editor with a template)"
    echo -e "  ${BOLD}3)${NC} Quick Start (Enter only required tokens manually)\n"
    
    prompt_user "Select an option (1-3)" SETUP_CHOICE false

    case "$SETUP_CHOICE" in
        1)
            echo ""
            prompt_user "Enter Doppler Service Token (dp.st.prd...)" DOPPLER_TOKEN true
            if [[ -z "$DOPPLER_TOKEN" ]]; then
                echo -e "${RED}✗ Error: Token cannot be empty.${NC}"
                exit 1
            fi
            echo "Fetching secrets from Doppler..."
            HTTP_STATUS=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $DOPPLER_TOKEN" "https://api.doppler.com/v3/configs/config/secrets/download?format=env" -o "${DEPLOY_PATH}/.env")
            
            if [ "$HTTP_STATUS" -ne 200 ]; then
                echo -e "${RED}✗ Error: Failed to fetch secrets from Doppler (HTTP $HTTP_STATUS). Check your token.${NC}"
                rm -f "${DEPLOY_PATH}/.env"
                exit 1
            fi
            ;;
            
        2)
            echo -e "\nFetching template..."
            curl -sSL "${BASE_URL}/.env.example" > "${DEPLOY_PATH}/.env"
            echo -e "${YELLOW}ℹ Opening editor. Paste your values, then press Ctrl+X, Y, Enter to save.${NC}"
            sleep 2
            # Connect nano directly to user's terminal to survive the pipe
            nano "${DEPLOY_PATH}/.env" </dev/tty >/dev/tty
            ;;
            
        3)
            echo ""
            prompt_user "Enter Discord Bot Token" BOT_TOKEN true
            prompt_user "Enter MongoDB Connection String" MONGO_CONNECTION true

            if [[ -z "$BOT_TOKEN" || -z "$MONGO_CONNECTION" ]]; then
                echo -e "${RED}✗ Error: Token and MongoDB connection string are mandatory.${NC}"
                exit 1
            fi

            # Auto-generate secure Lavalink password
            LAVALINK_PASS=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)

            cat << EOF > "${DEPLOY_PATH}/.env"
# ══ Required ══
BOT_TOKEN=${BOT_TOKEN}
MONGO_CONNECTION=${MONGO_CONNECTION}

# ══ Lavalink (Auto-configured) ══
LAVALINK_PASS=${LAVALINK_PASS}
LAVALINK_1_HOST=lavalink
LAVALINK_1_PORT=2333
LAVALINK_1_ID=Lavalink

# ══ Optional Features ══
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
WEBHOOK_SECRET=
LOGS_WEBHOOK=
GEMINI_KEY=
UPSTASH_VECTOR=
OPENAI=
WEATHERSTACK_KEY=
STRANGE_API_KEY=
GH_TOKEN=
HONEYBADGER_API_KEY=
EOF
            ;;
            
        *)
            echo -e "${RED}✗ Invalid option. Run the script again.${NC}"
            exit 1
            ;;
    esac

    chmod 600 "${DEPLOY_PATH}/.env"
    echo -e "${GREEN}✓ Configuration saved securely.${NC}"
else
    echo -e "\n▶ ${CYAN}Existing configuration found. Initiating update sequence...${NC}"
fi

# --- Phase 4: Deploy & Update ---
echo -e "\n▶ ${CYAN}Booting services...${NC}"
cd "${DEPLOY_PATH}" || exit 1

$DOCKER_CMD pull
$DOCKER_CMD up -d --remove-orphans

echo -e "\n▶ ${CYAN}Running cleanup...${NC}"
$D_BASE image prune -f >/dev/null 2>&1 || true

echo -e "\n${GREEN}🎉 mina is successfully deployed and active!${NC}"

# --- Phase 5: Zsh QoL Handoff ---
echo -e "\n▶ ${CYAN}Setting up optimal developer environment...${NC}"

# Pass </dev/tty to the bash subshell so that OMZ's final `exec zsh` connects to the keyboard
bash -c "$(curl -fsSL ${OMZ_URL})" </dev/tty