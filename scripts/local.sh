#!/usr/bin/env bash

################################################################################
# Amina Discord Bot - Interactive VPS Deployment Script
# Version: 2.0.0
# Phase: Complete - Core Framework, Prerequisites, Env Config & Deployment
#
# Description:
#   Interactive deployment script for Amina Discord bot with Lavalink.
#   Handles prerequisites, environment configuration, and Docker deployment.
#
# Usage:
#   ./local.sh [options] [deployment_path]
#
# Options:
#   --dry-run           Run through all steps without making changes
#   --force, -f, -y     Skip confirmation prompts
#   --uninstall         Remove deployment (Phase 3)
#   --help, -h          Show this help message
#
################################################################################

set -euo pipefail

################################################################################
# Configuration
################################################################################

REPO_URL="https://github.com/iamvikshan/amina.git"
TEMP_DIR="aminaxd"
DEFAULT_DEPLOY_PATH="${HOME}/amina"
VERSION="2.0.0"

# Flags
DRY_RUN=false
FORCE=false
UNINSTALL=false

# Required files to copy from repo
REQUIRED_FILES=(
    "docker-compose.prod.yml"
    "lavalink/application.yml"
)

################################################################################
# Color codes
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

log_step() {
    echo -e "\n${BOLD}${CYAN}▶ $1${NC}\n"
}

################################################################################
# Banner
################################################################################

print_banner() {
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
    _    __  __ ___ _   _    _    
   / \  |  \/  |_ _| \ | |  / \   
  / _ \ | |\/| || ||  \| | / _ \  
 / ___ \| |  | || || |\  |/ ___ \ 
/_/   \_\_|  |_|___|_| \_/_/   \_\
EOF
    echo -e "${NC}"
    
    # Rest of the banner info
    echo -e "  ${CYAN}Discord Bot Deployment Script${NC}"
    echo -e "  ${DIM}Version: ${VERSION}${NC}"
    echo -e "  ${DIM}Interactive VPS Deployment${NC}"
    echo ""
}

################################################################################
# Interactive Helpers
################################################################################

# confirm(prompt, default)
# Returns: 0 for yes, 1 for no
confirm() {
    local prompt="$1"
    local default="${2:-y}"
    local response
    
    if [[ "$FORCE" == true ]]; then
        log_info "${prompt} ${DIM}[auto-yes due to --force]${NC}"
        return 0
    fi
    
    if [[ "$default" =~ ^[Yy]$ ]]; then
        read -r -p "$(echo -e "${YELLOW}?${NC} ${prompt} [Y/n]: ")" response
        response=${response:-y}
    else
        read -r -p "$(echo -e "${YELLOW}?${NC} ${prompt} [y/N]: ")" response
        response=${response:-n}
    fi
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# read_input(prompt, default)
read_input() {
    local prompt="$1"
    local default="$2"
    local value
    
    if [[ -n "$default" ]]; then
        read -r -p "$(echo -e "${YELLOW}?${NC} ${prompt} [${DIM}${default}${NC}]: ")" value
        echo "${value:-$default}"
    else
        read -r -p "$(echo -e "${YELLOW}?${NC} ${prompt}: ")" value
        echo "$value"
    fi
}

# spinner(pid) - Show spinner while process runs
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local temp
    
    while kill -0 "$pid" 2>/dev/null; do
        temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# read_secret(prompt) - Read sensitive input without echoing
read_secret() {
    local prompt="$1"
    local value
    
    read -rs -p "$(echo -e "${YELLOW}?${NC} ${prompt}: ")" value
    echo "" >&2  # newline after hidden input
    echo "$value"
}

################################################################################
# Usage/Help
################################################################################

show_usage() {
    cat << EOF
Amina Discord Bot - Interactive VPS Deployment Script

USAGE:
    $0 [OPTIONS] [DEPLOYMENT_PATH]

ARGUMENTS:
    DEPLOYMENT_PATH    Directory to deploy Amina (default: ${DEFAULT_DEPLOY_PATH})

OPTIONS:
    --dry-run          Run through all steps without making actual changes
                       Shows what would be done without executing it

    --force, -f, -y    Skip all confirmation prompts and proceed automatically
                       Use with caution in production environments

    --uninstall        Stop and remove deployed services (Phase 3)
                       Removes containers and deployment directory

    --help, -h         Display this help message and exit

EXAMPLES:
    # Standard deployment (interactive)
    $0

    # Deploy to custom path
    $0 /opt/amina

    # Dry run to preview actions
    $0 --dry-run

    # Non-interactive deployment
    $0 --force

    # Combine flags
    $0 --force /opt/amina

DESCRIPTION:
    This script automates the deployment of the Amina Discord bot with Lavalink.
    It handles prerequisite installation, environment configuration, and Docker
    container deployment on a VPS or local machine.

PHASES:
    Phase 1: Core framework, prerequisites, and flags
    Phase 2: Environment configuration (.env setup)
    Phase 3: Deployment, startup, and health checks

REQUIREMENTS:
    - Linux-based system (Debian/Ubuntu recommended)
    - Internet connection
    - sudo privileges (for installing prerequisites)

For more information, visit: https://github.com/iamvikshan/amina

EOF
}

################################################################################
# CLI Argument Parsing
################################################################################

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force|-f|-y|--yes)
                FORCE=true
                shift
                ;;
            --uninstall)
                UNINSTALL=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                echo ""
                show_usage
                exit 1
                ;;
            *)
                DEPLOY_PATH="$1"
                shift
                ;;
        esac
    done
    
    # Set default deployment path if not provided
    DEPLOY_PATH="${DEPLOY_PATH:-$DEFAULT_DEPLOY_PATH}"
}

################################################################################
# Prerequisites Check and Installation
################################################################################

check_command() {
    command -v "$1" &> /dev/null
}

ensure_prerequisites() {
    log_step "Step 1/6: Checking prerequisites..."
    
    local missing=()
    local installed=()
    
    # Check what's installed and what's missing
    if check_command git; then
        installed+=("git")
    else
        missing+=("git")
    fi
    
    if check_command docker; then
        installed+=("docker")
    else
        missing+=("docker")
    fi
    
    if check_command curl; then
        installed+=("curl")
    else
        missing+=("curl")
    fi
    
    # Display summary table
    echo "Prerequisites status:"
    for cmd in "${installed[@]}"; do
        echo -e "  ${GREEN}✓${NC} ${cmd}     ${DIM}(installed)${NC}"
    done
    for cmd in "${missing[@]}"; do
        echo -e "  ${RED}✗${NC} ${cmd}     ${DIM}(not found — will be installed)${NC}"
    done
    echo ""
    
    # If nothing missing, we're done
    if [ ${#missing[@]} -eq 0 ]; then
        log_success "All prerequisites are already installed"
        
        # Still need to check Docker permissions
        if ! docker ps &> /dev/null; then
            handle_docker_permissions
        else
            log_success "Docker permissions are correct"
        fi
        return 0
    fi
    
    # Check if we're on Debian/Ubuntu
    if ! check_command apt-get; then
        log_error "Package manager 'apt-get' not found. This script requires Debian/Ubuntu."
        log_error "Please install the following manually: ${missing[*]}"
        exit 1
    fi
    
    # Handle dry-run mode
    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would install: ${missing[*]}"
        log_info "${DIM}[DRY-RUN]${NC} Would check Docker permissions"
        return 0
    fi
    
    # Prompt user (or skip if --force)
    if ! confirm "Install missing prerequisites?" "y"; then
        log_error "Cannot continue without required prerequisites"
        exit 1
    fi
    
    # Install missing tools
    log_info "Installing prerequisites..."
    
    local need_apt_update=false
    local apt_packages=()
    
    # Collect packages that need apt-get
    for cmd in "${missing[@]}"; do
        if [[ "$cmd" == "git" || "$cmd" == "curl" ]]; then
            apt_packages+=("$cmd")
            need_apt_update=true
        fi
    done
    
    # Install git and/or curl via apt
    if [ ${#apt_packages[@]} -gt 0 ]; then
        log_info "Updating apt cache..."
        if sudo apt-get update -qq; then
            log_success "apt cache updated"
        else
            log_error "Failed to update apt cache"
            exit 1
        fi
        
        log_info "Installing ${apt_packages[*]}..."
        if sudo apt-get install -y -qq "${apt_packages[@]}"; then
            log_success "Installed ${apt_packages[*]}"
        else
            log_error "Failed to install ${apt_packages[*]}"
            exit 1
        fi
    fi
    
    # Install Docker via convenience script if missing
    if [[ " ${missing[*]} " =~ " docker " ]]; then
        log_info "Installing Docker..."
        if curl -fsSL https://get.docker.com | sh > /dev/null 2>&1; then
            log_success "Docker installed successfully"
        else
            log_error "Failed to install Docker"
            exit 1
        fi
    fi
    
    # Verify installations
    log_info "Verifying installations..."
    for cmd in "${missing[@]}"; do
        if check_command "$cmd"; then
            log_success "${cmd} is now available"
        else
            log_error "${cmd} installation failed"
            exit 1
        fi
    done
    
    # Check Docker permissions
    if check_command docker; then
        if ! docker ps &> /dev/null; then
            handle_docker_permissions
        else
            log_success "Docker permissions are correct"
        fi

        # Check Docker Compose plugin
        if docker compose version &> /dev/null; then
            log_success "Docker Compose plugin is available"
        else
            log_error "Docker Compose plugin is not available"
            log_error "Install it with: sudo apt-get install -y docker-compose-plugin"
            exit 1
        fi
    fi
}

handle_docker_permissions() {
    log_warning "Cannot run Docker commands without sudo"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would add user to docker group"
        return 0
    fi
    
    # Check if user is already in docker group
    if id -nG "$USER" 2>/dev/null | grep -qw docker; then
        log_warning "User is in docker group but session not updated"
        log_error "Please log out and log back in to apply docker group permissions, then run this script again"
        exit 1
    else
        log_info "Adding user '$USER' to docker group..."
        if sudo usermod -aG docker "$USER"; then
            log_success "User added to docker group"
            log_error "Please log out and log back in to apply docker group permissions, then run this script again"
            exit 1
        else
            log_error "Failed to add user to docker group"
            exit 1
        fi
    fi
}

################################################################################
# Existing Deployment Check
################################################################################

check_existing_deployment() {
    log_step "Step 2/6: Checking deployment directory..."
    
    if [ -d "$DEPLOY_PATH" ]; then
        log_warning "Deployment directory already exists: ${DEPLOY_PATH}"
        
        if [[ "$DRY_RUN" == true ]]; then
            log_info "${DIM}[DRY-RUN]${NC} Would check for existing deployment"
            return 0
        fi
        
        if ! confirm "Overwrite existing deployment?" "n"; then
            log_error "Deployment cancelled by user"
            exit 1
        fi
        
        log_info "Existing deployment will be overwritten"
    else
        log_info "Deployment directory does not exist, will be created"
    fi
}

################################################################################
# Uninstall
################################################################################

uninstall() {
    log_step "Uninstalling Amina deployment..."

    if [[ ! -d "$DEPLOY_PATH" ]]; then
        log_error "Deployment directory not found: ${DEPLOY_PATH}"
        log_error "Nothing to uninstall."
        exit 1
    fi

    log_info "Deployment directory: ${BOLD}${DEPLOY_PATH}${NC}"
    echo ""

    # Show what will be removed
    echo -e "${BOLD}The following actions will be performed:${NC}"
    echo -e "  1. Stop and remove running containers"
    echo -e "  2. Optionally remove Docker volumes (persistent data)"
    echo -e "  3. Optionally remove deployment directory"
    echo ""

    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would stop containers in ${DEPLOY_PATH}"
        log_info "${DIM}[DRY-RUN]${NC} Would ask to remove Docker volumes"
        log_info "${DIM}[DRY-RUN]${NC} Would ask to remove deployment directory"
        return 0
    fi

    # Confirm
    if ! confirm "Proceed with uninstall?" "n"; then
        log_info "Uninstall cancelled"
        exit 0
    fi

    # Stop containers
    if [[ -f "${DEPLOY_PATH}/docker-compose.yml" ]]; then
        log_info "Stopping containers..."
        if (cd "${DEPLOY_PATH}" && docker compose down --remove-orphans) 2>&1; then
            log_success "Containers stopped and removed"
        else
            log_warning "Failed to stop some containers (they may not be running)"
        fi
    else
        log_warning "No docker-compose.yml found — skipping container shutdown"
    fi

    # Ask about volumes
    if confirm "Remove Docker volumes too? (this deletes persistent data like Lavalink plugins)" "n"; then
        log_info "Removing Docker volumes..."
        if (cd "${DEPLOY_PATH}" && docker compose down --volumes) 2>&1; then
            log_success "Docker volumes removed"
        else
            log_warning "Failed to remove some volumes"
        fi
    else
        log_info "Docker volumes preserved"
    fi

    # Ask about removing directory
    if confirm "Remove deployment directory (${DEPLOY_PATH})?" "y"; then
        rm -rf "${DEPLOY_PATH}"
        log_success "Deployment directory removed: ${DEPLOY_PATH}"
    else
        log_info "Deployment directory preserved: ${DEPLOY_PATH}"
    fi

    echo ""
    log_success "Uninstall complete!"
}

################################################################################
# Phase 2: Environment Configuration
################################################################################

clone_repository() {
    log_step "Step 3/6: Cloning repository..."

    # Clean up existing temp dir if present
    if [ -d "${TEMP_DIR}" ]; then
        log_info "Cleaning up existing temporary directory..."
        if [[ "$DRY_RUN" == true ]]; then
            log_info "${DIM}[DRY-RUN]${NC} Would remove existing ${TEMP_DIR}"
        else
            rm -rf "${TEMP_DIR}"
        fi
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would clone ${REPO_URL} into ${TEMP_DIR}"
        return 0
    fi

    log_info "Cloning Amina repository..."
    if git clone --depth 1 "${REPO_URL}" "${TEMP_DIR}" > /dev/null 2>&1; then
        log_success "Repository cloned successfully"
    else
        log_error "Failed to clone repository from ${REPO_URL}"
        exit 1
    fi
}

env_paste_mode() {
    echo ""
    log_info "Paste your .env file contents below."
    log_info "Type ${BOLD}END${NC} on a new line by itself when done."
    echo ""

    local env_content=""
    local line
    while IFS= read -r line; do
        if [[ "$line" == "END" ]]; then
            break
        fi
        env_content+="${line}"$'\n'
    done

    # Trim trailing blank lines
    env_content=$(echo "$env_content" | sed -e 's/[[:space:]]*$//')

    if [[ -z "$env_content" ]]; then
        log_error "No content was provided"
        return 1
    fi

    mkdir -p "${DEPLOY_PATH}"
    echo "$env_content" > "${DEPLOY_PATH}/.env"
    log_success ".env file created from pasted content"
}

env_guided_mode() {
    echo ""
    local env_content=""

    # ═══ Required ═══
    echo -e "${BOLD}${CYAN}═══ Required (bot will not start without these) ═══${NC}"
    echo ""
    local bot_token
    bot_token=$(read_secret "Discord Bot Token from Developer Portal")
    env_content+="BOT_TOKEN=${bot_token}"$'\n'

    local mongo_conn
    mongo_conn=$(read_secret "MongoDB connection string (e.g., mongodb+srv://...)")
    env_content+="MONGO_CONNECTION=${mongo_conn}"$'\n'
    echo ""

    # ═══ Lavalink ═══
    if confirm "Configure Lavalink (Music System)?" "y"; then
        echo -e "${BOLD}${CYAN}═══ Lavalink - Music System ═══${NC}"
        echo ""
        local lavalink_pass
        lavalink_pass=$(read_secret "Password for Lavalink nodes (leave empty to auto-generate)")
        if [[ -z "$lavalink_pass" ]]; then
            # Generate a random password if user presses Enter
            lavalink_pass=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
            log_info "Generated random password for Lavalink: ${lavalink_pass}"
        fi
        env_content+="LAVALINK_PASS=${lavalink_pass}"$'\n'

        local lava1_host
        lava1_host=$(read_input "Primary node host" "lavalink")
        env_content+="LAVALINK_1_HOST=${lava1_host}"$'\n'

        local lava1_port
        lava1_port=$(read_input "Primary node port" "2333")
        env_content+="LAVALINK_1_PORT=${lava1_port}"$'\n'

        local lava1_id
        lava1_id=$(read_input "Primary node identifier" "Lavalink")
        env_content+="LAVALINK_1_ID=${lava1_id}"$'\n'

        local lava2_host
        lava2_host=$(read_input "Secondary node host (leave empty to skip)" "")
        env_content+="LAVALINK_2_HOST=${lava2_host}"$'\n'

        if [[ -n "$lava2_host" ]]; then
            local lava2_port
            lava2_port=$(read_input "Secondary node port" "")
            env_content+="LAVALINK_2_PORT=${lava2_port}"$'\n'

            local lava2_id
            lava2_id=$(read_input "Secondary node identifier" "")
            env_content+="LAVALINK_2_ID=${lava2_id}"$'\n'
        else
            env_content+="LAVALINK_2_PORT="$'\n'
            env_content+="LAVALINK_2_ID="$'\n'
        fi
        echo ""
    else
        env_content+="LAVALINK_PASS=your-secure-password-here"$'\n'
        env_content+="LAVALINK_1_HOST=lavalink"$'\n'
        env_content+="LAVALINK_1_PORT=2333"$'\n'
        env_content+="LAVALINK_1_ID=Lavalink"$'\n'
        env_content+="LAVALINK_2_HOST="$'\n'
        env_content+="LAVALINK_2_PORT="$'\n'
        env_content+="LAVALINK_2_ID="$'\n'
    fi

    # ═══ Music Services ═══
    if confirm "Configure Music Services (Spotify, requires local Lavalink)?" "n"; then
        echo -e "${BOLD}${CYAN}═══ Music Services ═══${NC}"
        echo ""
        local spotify_id
        spotify_id=$(read_input "Spotify API client ID" "")
        env_content+="SPOTIFY_CLIENT_ID=${spotify_id}"$'\n'

        local spotify_secret
        spotify_secret=$(read_input "Spotify API client secret" "")
        env_content+="SPOTIFY_CLIENT_SECRET=${spotify_secret}"$'\n'
        echo ""
    else
        env_content+="SPOTIFY_CLIENT_ID="$'\n'
        env_content+="SPOTIFY_CLIENT_SECRET="$'\n'
    fi

    # ═══ Optional Features ═══
    if confirm "Configure Optional Features (webhooks, AI keys)?" "n"; then
        echo -e "${BOLD}${CYAN}═══ Optional Features ═══${NC}"
        echo ""
        local webhook_secret
        webhook_secret=$(read_input "Dashboard webhook auth secret" "")
        env_content+="WEBHOOK_SECRET=${webhook_secret}"$'\n'

        local logs_webhook
        logs_webhook=$(read_input "Discord webhook for bot logs (discord://TOKEN@ID)" "")
        env_content+="LOGS_WEBHOOK=${logs_webhook}"$'\n'

        local gemini_key
        gemini_key=$(read_input "Google Gemini AI API key" "")
        env_content+="GEMINI_KEY=${gemini_key}"$'\n'

        local upstash_vector
        upstash_vector=$(read_input "Upstash Vector Database token" "")
        env_content+="UPSTASH_VECTOR=${upstash_vector}"$'\n'

        local openai_key
        openai_key=$(read_input "OpenAI API key" "")
        env_content+="OPENAI=${openai_key}"$'\n'
        echo ""
    else
        env_content+="WEBHOOK_SECRET="$'\n'
        env_content+="LOGS_WEBHOOK="$'\n'
        env_content+="GEMINI_KEY="$'\n'
        env_content+="UPSTASH_VECTOR="$'\n'
        env_content+="OPENAI="$'\n'
    fi

    # ═══ Utility Commands ═══
    if confirm "Configure Utility Commands (weather, image, GitHub)?" "n"; then
        echo -e "${BOLD}${CYAN}═══ Utility Commands ═══${NC}"
        echo ""
        local weather_key
        weather_key=$(read_input "Weather command API key" "")
        env_content+="WEATHERSTACK_KEY=${weather_key}"$'\n'

        local strange_key
        strange_key=$(read_input "Image manipulation API key" "")
        env_content+="STRANGE_API_KEY=${strange_key}"$'\n'

        local gh_token
        gh_token=$(read_input "GitHub token for changelog command" "")
        env_content+="GH_TOKEN=${gh_token}"$'\n'
        echo ""
    else
        env_content+="WEATHERSTACK_KEY="$'\n'
        env_content+="STRANGE_API_KEY="$'\n'
        env_content+="GH_TOKEN="$'\n'
    fi

    # ═══ Monitoring ═══
    if confirm "Configure Monitoring (error tracking)?" "n"; then
        echo -e "${BOLD}${CYAN}═══ Monitoring ═══${NC}"
        echo ""
        local hb_key
        hb_key=$(read_input "Honeybadger error tracking API key" "")
        env_content+="HONEYBADGER_API_KEY=${hb_key}"$'\n'
        echo ""
    else
        env_content+="HONEYBADGER_API_KEY="$'\n'
    fi

    mkdir -p "${DEPLOY_PATH}"
    echo "$env_content" > "${DEPLOY_PATH}/.env"
    log_success ".env file created from guided setup"
}

env_import_mode() {
    echo ""
    local import_path
    import_path=$(read_input "Path to existing .env file" "")

    if [[ -z "$import_path" ]]; then
        log_error "No file path provided"
        return 1
    fi

    # Expand ~ if present
    import_path="${import_path/#\~/$HOME}"

    if [[ ! -f "$import_path" ]]; then
        log_error "File not found: ${import_path}"
        return 1
    fi

    if [[ ! -r "$import_path" ]]; then
        log_error "File is not readable: ${import_path}"
        return 1
    fi

    mkdir -p "${DEPLOY_PATH}"
    cp "$import_path" "${DEPLOY_PATH}/.env"
    log_success ".env file imported from ${import_path}"
}

validate_env() {
    log_step "Step 5/6: Validating .env configuration..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would validate .env file"
        return 0
    fi

    if [[ ! -f "${DEPLOY_PATH}/.env" ]]; then
        log_error ".env file not found at ${DEPLOY_PATH}/.env"
        return 1
    fi

    local errors=0
    local warnings=0

    # Check required variables
    local bot_token
    bot_token=$(grep -m1 -E '^BOT_TOKEN=' "${DEPLOY_PATH}/.env" | cut -d'=' -f2- | sed 's/^["'\'']*//;s/["'\'']*$//' || true)
    if [[ -z "$bot_token" ]]; then
        log_error "BOT_TOKEN is missing or empty"
        errors=$((errors + 1))
    else
        log_success "BOT_TOKEN is set"
    fi

    local mongo_conn
    mongo_conn=$(grep -m1 -E '^MONGO_CONNECTION=' "${DEPLOY_PATH}/.env" | cut -d'=' -f2- | sed 's/^["'\'']*//;s/["'\'']*$//' || true)
    if [[ -z "$mongo_conn" ]]; then
        log_error "MONGO_CONNECTION is missing or empty"
        errors=$((errors + 1))
    else
        log_success "MONGO_CONNECTION is set"
    fi

    # Check optional variables
    local optional_vars=(
        "LAVALINK_PASS"
        "WEBHOOK_SECRET"
        "LOGS_WEBHOOK"
        "GEMINI_KEY"
        "UPSTASH_VECTOR"
        "OPENAI"
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
        "WEATHERSTACK_KEY"
        "STRANGE_API_KEY"
        "GH_TOKEN"
        "HONEYBADGER_API_KEY"
    )

    local empty_optional=()
    for var in "${optional_vars[@]}"; do
        local val
        val=$(grep -E "^${var}=" "${DEPLOY_PATH}/.env" | cut -d'=' -f2- || true)
        if [[ -z "$val" ]]; then
            empty_optional+=("$var")
            warnings=$((warnings + 1))
        fi
    done

    echo ""

    # Show summary
    if [[ ${#empty_optional[@]} -gt 0 ]]; then
        log_warning "Optional variables not configured (${#empty_optional[@]}):"
        for var in "${empty_optional[@]}"; do
            echo -e "  ${DIM}- ${var}${NC}"
        done
        echo ""
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Validation failed: ${errors} required variable(s) missing"
        return 1
    fi

    log_success "Validation passed: all required variables are set"
    return 0
}

configure_env() {
    # Step 3/6: Clone repository
    clone_repository

    # Step 4/6: Configure .env
    log_step "Step 4/6: Configuring .env file..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would present .env configuration menu"
        log_info "${DIM}[DRY-RUN]${NC} Would create .env at ${DEPLOY_PATH}/.env"
        log_info "${DIM}[DRY-RUN]${NC} Would set permissions to 600"
        # Still run validation step in dry-run
        validate_env
        return 0
    fi

    # In --force mode, check for existing .env
    if [[ "$FORCE" == true ]]; then
        if [[ -f "${DEPLOY_PATH}/.env" ]]; then
            log_info "Using existing .env file at ${DEPLOY_PATH}/.env ${DIM}[--force mode]${NC}"
        else
            log_error "No existing .env file found at ${DEPLOY_PATH}/.env"
            log_error "In --force mode, an existing .env file is required."
            log_error "Please create one manually or run without --force for interactive setup."
            exit 1
        fi
    else
        # Check if there's already a .env and ask to keep it
        if [[ -f "${DEPLOY_PATH}/.env" ]]; then
            if confirm "Existing .env file found. Keep it?" "y"; then
                log_info "Keeping existing .env file"
            else
                configure_env_interactive
            fi
        else
            configure_env_interactive
        fi
    fi

    # Set secure permissions
    chmod 600 "${DEPLOY_PATH}/.env"
    log_success "File permissions set to 600"

    # Validate
    while true; do
        if validate_env; then
            break
        else
            if confirm "Re-configure .env file?" "y"; then
                configure_env_interactive
                chmod 600 "${DEPLOY_PATH}/.env"
            else
                log_error "Cannot proceed with invalid .env configuration"
                exit 1
            fi
        fi
    done
}

configure_env_interactive() {
    echo ""
    echo -e "${BOLD}How would you like to configure the .env file?${NC}"
    echo ""
    echo -e "  ${BOLD}1)${NC} Paste entire .env contents"
    echo -e "     ${DIM}Paste your complete .env file contents (type END on a new line when done)${NC}"
    echo ""
    echo -e "  ${BOLD}2)${NC} Guided setup (enter values one by one)"
    echo -e "     ${DIM}Walk through each variable with descriptions${NC}"
    echo ""
    echo -e "  ${BOLD}3)${NC} Import from existing .env file"
    echo -e "     ${DIM}Provide a path to an existing .env file to copy${NC}"
    echo ""

    local choice
    choice=$(read_input "Select an option (1-3)" "2")

    case "$choice" in
        1)
            if ! env_paste_mode; then
                log_error "Paste mode failed"
                return 1
            fi
            ;;
        2)
            env_guided_mode
            ;;
        3)
            if ! env_import_mode; then
                log_error "Import mode failed"
                return 1
            fi
            ;;
        *)
            log_error "Invalid option: ${choice}"
            return 1
            ;;
    esac
}

################################################################################
# Phase 3: Deployment, Startup, Health Checks & Warning Capture
################################################################################

deploy_services() {
    log_step "Step 6/6: Deploying services..."

    # ── a) Verify required files exist in cloned repo ──
    if [[ "$DRY_RUN" != true ]]; then
        log_info "Verifying required files in cloned repository..."
        local missing_files=()
        for file in "${REQUIRED_FILES[@]}"; do
            if [[ ! -f "${TEMP_DIR}/${file}" ]]; then
                missing_files+=("$file")
            fi
        done

        if [[ ${#missing_files[@]} -gt 0 ]]; then
            log_error "Required files missing from cloned repository:"
            for file in "${missing_files[@]}"; do
                echo -e "  ${RED}✗${NC} ${file}"
            done
            rm -rf "${TEMP_DIR}"
            exit 1
        fi
        log_success "All required files found"
    fi

    # ── b) Copy required files ──
    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would create directory: ${DEPLOY_PATH}/lavalink/"
        log_info "${DIM}[DRY-RUN]${NC} Would copy docker-compose.prod.yml → ${DEPLOY_PATH}/docker-compose.yml"
        log_info "${DIM}[DRY-RUN]${NC} Would copy lavalink/application.yml → ${DEPLOY_PATH}/lavalink/application.yml"
        log_info "${DIM}[DRY-RUN]${NC} Would set .env permissions to 600"
        log_info "${DIM}[DRY-RUN]${NC} Would remove temp directory ${TEMP_DIR}"
    else
        log_info "Copying deployment files..."
        mkdir -p "${DEPLOY_PATH}/lavalink"

        cp "${TEMP_DIR}/docker-compose.prod.yml" "${DEPLOY_PATH}/docker-compose.yml"
        log_success "docker-compose.yml copied"

        cp "${TEMP_DIR}/lavalink/application.yml" "${DEPLOY_PATH}/lavalink/application.yml"
        log_success "lavalink/application.yml copied"

        # ── c) Set file permissions ──
        chmod 600 "${DEPLOY_PATH}/.env"
        log_success "File permissions set"

        # ── d) Cleanup temp directory ──
        rm -rf "${TEMP_DIR}"
        log_success "Temporary directory cleaned up"
    fi

    # ── e) Display deployment summary ──
    echo ""
    echo -e "${BOLD}${CYAN}Directory structure:${NC}"
    echo -e "  ${DEPLOY_PATH}/"
    echo -e "  ├── docker-compose.yml"
    echo -e "  ├── .env"
    echo -e "  └── lavalink/"
    echo -e "      └── application.yml"
    echo ""

    # ── f) Confirm before starting services ──
    if [[ "$DRY_RUN" == true ]]; then
        log_info "${DIM}[DRY-RUN]${NC} Would ask to start services"
        log_info "${DIM}[DRY-RUN]${NC} Would run: cd ${DEPLOY_PATH} && docker compose up -d"
        log_info "${DIM}[DRY-RUN]${NC} Would poll health checks for up to 120 seconds"
        log_info "${DIM}[DRY-RUN]${NC} Would capture and display service warnings"
        log_info "${DIM}[DRY-RUN]${NC} Would display final deployment dashboard"
        return 0
    fi

    if ! confirm "Start services now?" "y"; then
        echo ""
        log_info "Services were not started. To start manually:"
        echo ""
        echo -e "  ${BOLD}cd ${DEPLOY_PATH} && docker compose up -d${NC}"
        echo ""
        log_success "Deployment files are ready at ${DEPLOY_PATH}"
        exit 0
    fi

    # ── g) Start Docker Compose ──
    echo ""
    log_info "Starting services..."
    cd "${DEPLOY_PATH}" || { log_error "Failed to enter deployment directory: ${DEPLOY_PATH}"; exit 1; }

    if ! docker compose up -d 2>&1; then
        log_error "Failed to start services"
        log_error "Check your configuration and try: cd ${DEPLOY_PATH} && docker compose up -d"
        exit 1
    fi
    log_success "Docker Compose started"

    # ── h) Health check polling ──
    echo ""
    log_info "Waiting for services to become healthy..."
    echo ""

    local timeout=120
    local interval=5
    local elapsed=0
    local amina_healthy=false
    local lavalink_healthy=false
    local amina_status="unknown"
    local lavalink_status="unknown"
    local watchtower_status="unknown"

    # Trap to restore terminal on interrupt during health polling
    cleanup_health_poll() {
        tput cnorm 2>/dev/null  # restore cursor
        echo ""  # ensure newline
        log_warning "Health check interrupted"
    }
    trap cleanup_health_poll INT TERM
    tput civis 2>/dev/null  # hide cursor during polling

    while [[ $elapsed -lt $timeout ]]; do
        # Get container health status
        amina_status=$(docker inspect --format='{{.State.Health.Status}}' amina 2>/dev/null || echo "not found")
        lavalink_status=$(docker inspect --format='{{.State.Health.Status}}' lavalink 2>/dev/null || echo "not found")
        watchtower_status=$(docker inspect --format='{{.State.Status}}' watchtower 2>/dev/null || echo "not found")

        # Clear previous lines and show progress
        tput el 2>/dev/null  # clear to end of line
        printf "  Waiting for services to become healthy... (%ds/%ds)\n" "$elapsed" "$timeout"
        tput el 2>/dev/null
        printf "    amina:    %s\n" "$amina_status"
        tput el 2>/dev/null
        printf "    lavalink: %s\n" "$lavalink_status"

        if [[ "$amina_status" == "healthy" ]]; then
            amina_healthy=true
        fi
        if [[ "$lavalink_status" == "healthy" ]]; then
            lavalink_healthy=true
        fi

        # Both healthy — done
        if [[ "$amina_healthy" == true && "$lavalink_healthy" == true ]]; then
            break
        fi

        # If unhealthy, stop waiting
        if [[ "$amina_status" == "unhealthy" || "$lavalink_status" == "unhealthy" ]]; then
            break
        fi

        sleep "$interval"
        elapsed=$((elapsed + interval))

        # Move cursor up 3 lines to overwrite
        tput cuu 3 2>/dev/null || printf "\033[3A"
    done

    tput cnorm 2>/dev/null  # restore cursor
    trap - INT TERM  # remove health poll trap
    echo ""

    # ── i) Capture and display warnings from container logs ──
    local warnings
    warnings=$(docker compose logs --tail=100 2>&1 | grep -iE 'warn|warning|version mismatch|outdated|deprecated' || true)

    if [[ -n "$warnings" ]]; then
        echo -e "${BOLD}${YELLOW}══ Service Warnings ══${NC}"
        echo ""
        while IFS= read -r line; do
            echo -e "  ${YELLOW}⚠${NC} ${DIM}${line}${NC}"
        done <<< "$warnings"
        echo ""
    fi

    # ── j) Display final dashboard ──
    # Refresh statuses one last time
    amina_status=$(docker inspect --format='{{.State.Health.Status}}' amina 2>/dev/null || echo "not found")
    lavalink_status=$(docker inspect --format='{{.State.Health.Status}}' lavalink 2>/dev/null || echo "not found")
    watchtower_status=$(docker inspect --format='{{.State.Status}}' watchtower 2>/dev/null || echo "not found")

    local all_healthy=true

    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  Amina Discord Bot - Deployment Complete!${NC}"
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BOLD}Service Status:${NC}"

    if [[ "$amina_status" == "healthy" ]]; then
        echo -e "    amina:      ${GREEN}✓ healthy${NC} (port 3000)"
    else
        echo -e "    amina:      ${RED}✗ ${amina_status}${NC} (port 3000)"
        all_healthy=false
    fi

    if [[ "$lavalink_status" == "healthy" ]]; then
        echo -e "    lavalink:   ${GREEN}✓ healthy${NC} (port 2333)"
    else
        echo -e "    lavalink:   ${RED}✗ ${lavalink_status}${NC} (port 2333)"
        all_healthy=false
    fi

    if [[ "$watchtower_status" == "running" ]]; then
        echo -e "    watchtower:  ${GREEN}✓ running${NC}"
    else
        echo -e "    watchtower:  ${RED}✗ ${watchtower_status}${NC}"
        all_healthy=false
    fi

    echo ""
    echo -e "  ${BOLD}Useful Commands:${NC}"
    echo -e "    View logs:       ${DIM}cd ${DEPLOY_PATH} && docker compose logs -f${NC}"
    echo -e "    Restart:         ${DIM}cd ${DEPLOY_PATH} && docker compose restart${NC}"
    echo -e "    Stop:            ${DIM}cd ${DEPLOY_PATH} && docker compose down${NC}"
    echo -e "    Update:          ${DIM}cd ${DEPLOY_PATH} && docker compose pull && docker compose up -d${NC}"
    echo -e "    Uninstall:       ${DIM}./local.sh --uninstall ${DEPLOY_PATH}${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"

    # If any service is not healthy, show troubleshooting
    if [[ "$all_healthy" != true ]]; then
        echo ""
        echo -e "  ${BOLD}${YELLOW}Troubleshooting:${NC}"
        echo -e "    - Check .env:             ${DIM}cat ${DEPLOY_PATH}/.env${NC}"
        echo -e "    - View amina logs:        ${DIM}docker logs amina --tail=50${NC}"
        echo -e "    - View lavalink logs:     ${DIM}docker logs lavalink --tail=50${NC}"
        echo -e "    - Check Lavalink password matches in .env and lavalink/application.yml"
        echo ""

        # Show recent error logs for failed services
        if [[ "$amina_status" != "healthy" ]]; then
            echo -e "  ${BOLD}${RED}Recent amina logs:${NC}"
            docker logs amina --tail=20 2>&1 | while IFS= read -r line; do
                echo -e "    ${DIM}${line}${NC}"
            done
            echo ""
        fi
        if [[ "$lavalink_status" != "healthy" ]]; then
            echo -e "  ${BOLD}${RED}Recent lavalink logs:${NC}"
            docker logs lavalink --tail=20 2>&1 | while IFS= read -r line; do
                echo -e "    ${DIM}${line}${NC}"
            done
            echo ""
        fi
    fi
}

################################################################################
# Main Function
################################################################################

main() {
    parse_args "$@"
    print_banner
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Running in DRY-RUN mode - no changes will be made"
        echo ""
    fi
    
    # Cleanup temp directory on unexpected exit
    trap 'rm -rf "${TEMP_DIR}" 2>/dev/null' EXIT

    if [[ "$UNINSTALL" == true ]]; then
        uninstall
        exit 0
    fi
    
    log_info "Deployment path: ${BOLD}${DEPLOY_PATH}${NC}"
    echo ""
    
    ensure_prerequisites
    check_existing_deployment
    configure_env
    deploy_services
}

################################################################################
# Entry Point
################################################################################

main "$@"
