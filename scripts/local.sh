#!/usr/bin/env bash

################################################################################
# Amina Discord Bot Deployment Script
#
# Usage:
#   ./local.sh [deployment_path]
#
# Example:
#   ./local.sh
#   ./local.sh ~/custom-path
#
# Description:
#   Deploys Amina Discord bot with Lavalink and Uptime Kuma.
#   - Installs Git and Docker if missing (Debian/Ubuntu only).
#   - Sets up directory structure and configuration.
#   - Deploys using Docker Compose.
################################################################################

set -e  # Exit immediately on error
set -u  # Exit on undefined variables
set -o pipefail  # Exit on pipe failures

################################################################################
# Configuration
################################################################################

REPO_URL="https://github.com/iamvikshan/amina.git"
TEMP_DIR="aminaxd"
DEFAULT_DEPLOY_PATH="${HOME}/amina"

# Required files to copy from repo
REQUIRED_FILES=(
    "docker-compose.prod.yml"
    "lavalink/application.yml"
    "lavalink-entrypoint.sh"
)

################################################################################
# Color codes for output
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_usage() {
    cat << EOF
Usage: $0 [deployment_path]

Arguments:
  deployment_path   Optional. Deployment directory (default: ~/amina)

Examples:
  $0
  $0 ~/custom-path

EOF
}

################################################################################
# Validation & Installation Functions
################################################################################

check_command() {
    command -v "$1" &> /dev/null
}

ensure_prerequisites() {
    log_info "Step 1/8: Checking and installing prerequisites..."
    
    # Check if we are on a Debian/Ubuntu based system for auto-install
    local CAN_INSTALL=false
    if check_command apt-get; then
        CAN_INSTALL=true
    fi

    # 1. Check/Install Git
    if ! check_command git; then
        if [ "$CAN_INSTALL" = true ]; then
            log_warning "Git not found. Installing..."
            sudo apt-get update && sudo apt-get install -y git
            log_success "Git installed successfully."
        else
            log_error "Git is missing and this is not a Debian/Ubuntu system. Please install Git manually."
            exit 1
        fi
    else
        log_success "Git is already installed."
    fi
    
    # 2. Check/Install Docker
    if ! check_command docker; then
        if [ "$CAN_INSTALL" = true ]; then
            log_warning "Docker not found. Installing..."
            # Use the official convenience script
            curl -fsSL https://get.docker.com | sh
            log_success "Docker installed successfully."
        else
            log_error "Docker is missing and this is not a Debian/Ubuntu system. Please install Docker manually."
            exit 1
        fi
    else
        log_success "Docker is already installed."
    fi

    # 3. Check Docker Permissions
    if ! docker ps &> /dev/null; then
        log_warning "Cannot run docker commands without sudo."
        
        # Check if user is in docker group
        if groups "$USER" | grep &>/dev/null '\bdocker\b'; then
            log_warning "User is in docker group but session not updated."
            log_error "Please log out and log back in to apply docker group permissions."
            exit 1
        else
            log_warning "Adding user $USER to docker group..."
            sudo usermod -aG docker "$USER"
            log_success "User added to docker group."
            log_error "Please log out and log back in to apply docker group permissions, then run this script again."
            exit 1
        fi
    else
        log_success "Docker permissions are correct."
    fi
    
    echo ""
}

################################################################################
# Main Deployment Function
################################################################################

deploy() {
    local DEPLOY_PATH="${1:-$DEFAULT_DEPLOY_PATH}"
    
    log_info "Starting local deployment"
    log_info "Deployment path: ${DEPLOY_PATH}"
    echo ""
    
    ensure_prerequisites
    
    # Step 2/8: Cleanup old temporary directory
    log_info "Step 2/8: Cleaning up old temporary directory if exists..."
    if [ -d "${TEMP_DIR}" ]; then
        rm -rf "${TEMP_DIR}"
        log_success "Removed old temporary directory"
    fi
    echo ""
    
    # Step 3/8: Clone repository
    log_info "Step 3/8: Cloning repository into temporary directory..."
    git clone "$REPO_URL" "${TEMP_DIR}"
    log_success "Repository cloned to ./${TEMP_DIR}"
    echo ""
    
    # Step 4/8: Check for required files
    log_info "Step 4/8: Checking for required files..."
    cd "${TEMP_DIR}"
    
    # Check for .env or .env.example
    local ENV_FILE=""
    if [ -f ".env" ]; then
        ENV_FILE=".env"
        log_success "Found .env file"
    elif [ -f ".env.example" ]; then
        ENV_FILE=".env.example"
        log_success "Found .env.example file"
    else
        log_error "Neither .env nor .env.example found in repository"
        cd ..
        rm -rf "${TEMP_DIR}"
        exit 1
    fi
    
    # Verify other required files exist
    if [ ! -f "docker-compose.prod.yml" ]; then
        log_error "docker-compose.prod.yml not found in repository"
        cd ..
        rm -rf "${TEMP_DIR}"
        exit 1
    fi
    
    if [ ! -f "lavalink/application.yml" ]; then
        log_error "lavalink/application.yml not found in repository"
        cd ..
        rm -rf "${TEMP_DIR}"
        exit 1
    fi
    
    if [ ! -f "lavalink-entrypoint.sh" ]; then
        log_error "lavalink-entrypoint.sh not found in repository"
        cd ..
        rm -rf "${TEMP_DIR}"
        exit 1
    fi
    
    log_success "All required files found"
    echo ""
    
    # Step 5/8: Check deployment directory
    log_info "Step 5/8: Checking deployment directory..."
    local ENV_BACKUP=""
    if [ -d "${DEPLOY_PATH}" ]; then
        log_warning "Deployment directory already exists: ${DEPLOY_PATH}"
        
        # Check if .env exists in deployment directory
        if [ -f "${DEPLOY_PATH}/.env" ]; then
            ENV_BACKUP="${DEPLOY_PATH}/.env"
            log_success "Found existing .env file - will preserve it"
        else
            log_warning "No existing .env file found in deployment directory"
        fi
        
        log_info "Removing existing files (except .env)..."
        # Remove everything except .env
        find "${DEPLOY_PATH}" -not -name ".env" -type f -delete 2>/dev/null || true
        find "${DEPLOY_PATH}" -type d -empty -delete 2>/dev/null || true
    else
        log_info "Creating new deployment directory..."
    fi
    
    mkdir -p "${DEPLOY_PATH}/lavalink"
    log_success "Deployment directory ready: ${DEPLOY_PATH}"
    echo ""
    
    # Step 6/8: Copy configuration files
    log_info "Step 6/8: Copying configuration files..."
    
    # Copy and rename docker-compose file
    cp docker-compose.prod.yml "${DEPLOY_PATH}/docker-compose.yml"
    log_success "Copied docker-compose.prod.yml → docker-compose.yml"
    
    # Copy .env file - only if it doesn't exist
    if [ -z "$ENV_BACKUP" ]; then
        cp "$ENV_FILE" "${DEPLOY_PATH}/.env"
        log_success "Copied $ENV_FILE → .env"
    else
        log_success "Preserved existing .env file (no overwrite)"
    fi
    
    # Copy lavalink/application.yml for Lavalink
    cp lavalink/application.yml "${DEPLOY_PATH}/lavalink/application.yml"
    log_success "Copied lavalink/application.yml → lavalink/application.yml"
    
    # Copy lavalink-entrypoint.sh for Lavalink permission fix
    cp lavalink-entrypoint.sh "${DEPLOY_PATH}/lavalink-entrypoint.sh"
    chmod +x "${DEPLOY_PATH}/lavalink-entrypoint.sh"
    log_success "Copied lavalink-entrypoint.sh → lavalink-entrypoint.sh (executable)"
    echo ""
    
    # Step 7/8: Set file permissions
    log_info "Step 7/8: Setting .env file permissions (600)..."
    chmod 600 "${DEPLOY_PATH}/.env"
    log_success "Set .env permissions to 600 (user read/write only)"
    echo ""
    
    # Step 8/8: Cleanup temporary directory
    log_info "Step 8/8: Cleaning up temporary directory..."
    cd ..
    rm -rf "${TEMP_DIR}"
    log_success "Removed temporary directory: ./${TEMP_DIR}"
    echo ""
    
    # Success summary
    echo "======================================================================"
    echo "                     DEPLOYMENT SUCCESSFUL!                           "
    echo "======================================================================"
    echo ""
    echo "Files deployed to: ${DEPLOY_PATH}"
    echo ""
    echo "Directory structure:"
    echo "  ${DEPLOY_PATH}/"
    echo "    ├── docker-compose.yml"
    echo "    ├── .env"
    echo "    ├── lavalink-entrypoint.sh"
    echo "    └── lavalink/"
    echo "        └── application.yml"
    echo ""
    echo "======================================================================"
    echo "                        NEXT STEPS                                    "
    echo "======================================================================"
    echo ""
    echo "1. Review and verify docker-compose.yml configuration:"
    echo "   cat ${DEPLOY_PATH}/docker-compose.yml"
    echo ""
    echo "2. IMPORTANT: Verify Lavalink password in lavalink/application.yml:"
    echo "   cat ${DEPLOY_PATH}/lavalink/application.yml"
    echo "   (Make sure 'server.password' is set securely)"
    echo ""
    echo "3. Verify .env configuration:"
    echo "   cat ${DEPLOY_PATH}/.env"
    echo ""
    echo "4. Start the services:"
    echo "   cd ${DEPLOY_PATH}"
    echo "   docker compose up -d"
    echo ""
    echo "5. Check container status:"
    echo "   docker compose ps"
    echo ""
    echo "6. View logs:"
    echo "   docker compose logs -f"
    echo ""
    echo "7. Access Uptime Kuma:"
    echo "   http://localhost:3001"
    echo ""
    echo "======================================================================"
}

################################################################################
# Main Script Entry Point
################################################################################

main() {
    # Show usage if --help or -h is passed
    if [ $# -gt 0 ] && [[ "$1" =~ ^(-h|--help)$ ]]; then
        print_usage
        exit 0
    fi
    
    # Extract deployment path argument (optional)
    local DEPLOY_PATH="${1:-$DEFAULT_DEPLOY_PATH}"
    
    # Run deployment
    deploy "$DEPLOY_PATH"
}

# Run main function with all script arguments
main "$@"
