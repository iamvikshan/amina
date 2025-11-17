#!/usr/bin/env bash


################################################################################
# Amina Discord Bot Deployment Script
# 
# Usage:
#   ./deploy-amina.sh user@host [deployment_path]
#
# Example:
#   ./deploy-amina.sh vik@13.245.239.175
#   ./deploy-amina.sh vik@13.245.239.175 ~/custom-path
#
# Description:
#   Deploys Amina Discord bot with Lavalink and Uptime Kuma to a VPS
#   using Docker Compose. Copies required configuration files and sets
#   up proper directory structure on the remote server.
################################################################################


set -e  # Exit immediately on error
set -u  # Exit on undefined variables
set -o pipefail  # Exit on pipe failures


################################################################################
# Configuration
################################################################################


REPO_URL="https://github.com/iamvikshan/amina.git"
TEMP_DIR="aminaxd"
DEFAULT_DEPLOY_PATH="amina"


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
Usage: $0 user@host [deployment_path]


Arguments:
  user@host         SSH connection string (e.g., vik@13.245.239.175)
  deployment_path   Optional. Deployment directory on VPS (default: ~/amina)


Examples:
  $0 vik@13.245.239.175
  $0 vik@13.245.239.175 ~/custom-path


EOF
}


################################################################################
# Validation Functions
################################################################################


validate_args() {
    if [ $# -lt 1 ]; then
        log_error "Missing required argument: user@host"
        print_usage
        exit 1
    fi


    if [[ ! "$1" =~ ^[^@]+@[^@]+$ ]]; then
        log_error "Invalid connection string format. Expected: user@host"
        print_usage
        exit 1
    fi
}


################################################################################
# Main Deployment Function
################################################################################


deploy() {
    local SSH_HOST="$1"
    local DEPLOY_PATH="${2:-$DEFAULT_DEPLOY_PATH}"


    log_info "Starting deployment to ${SSH_HOST}"
    log_info "Deployment path: ${DEPLOY_PATH}"
    echo ""


    # Build the remote deployment script
    local REMOTE_SCRIPT=$(cat << 'REMOTE_SCRIPT_EOF'
set -e
set -u
set -o pipefail


# Accept parameters
TEMP_DIR="$1"
DEPLOY_PATH="$2"
REPO_URL="$3"


echo "[INFO] Step 1/8: Checking prerequisites..."
if ! command -v git &> /dev/null; then
    echo "[ERROR] git is not installed. Please install git first."
    exit 1
fi


if ! command -v docker &> /dev/null; then
    echo "[ERROR] docker is not installed. Please install docker first."
    exit 1
fi


if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "[ERROR] docker-compose is not installed. Please install docker-compose first."
    exit 1
fi


echo "[SUCCESS] Prerequisites check passed"
echo ""


echo "[INFO] Step 2/8: Cleaning up old temporary directory if exists..."
if [ -d ~/"$TEMP_DIR" ]; then
    rm -rf ~/"$TEMP_DIR"
    echo "[SUCCESS] Removed old temporary directory"
fi
echo ""


echo "[INFO] Step 3/8: Cloning repository into temporary directory..."
git clone "$REPO_URL" ~/"$TEMP_DIR"
echo "[SUCCESS] Repository cloned to ~/$TEMP_DIR"
echo ""


echo "[INFO] Step 4/8: Checking for required files..."
cd ~/"$TEMP_DIR"


# Check for .env or .env.example
ENV_FILE=""
if [ -f ".env" ]; then
    ENV_FILE=".env"
    echo "[SUCCESS] Found .env file"
elif [ -f ".env.example" ]; then
    ENV_FILE=".env.example"
    echo "[SUCCESS] Found .env.example file"
else
    echo "[ERROR] Neither .env nor .env.example found in repository"
    exit 1
fi


# Verify other required files exist
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "[ERROR] docker-compose.prod.yml not found in repository"
    exit 1
fi


if [ ! -f "lavalink/application.yml" ]; then
    echo "[ERROR] lavalink/application.yml not found in repository"
    exit 1
fi


if [ ! -f "lavalink-entrypoint.sh" ]; then
    echo "[ERROR] lavalink-entrypoint.sh not found in repository"
    exit 1
fi


echo "[SUCCESS] All required files found"
echo ""


echo "[INFO] Step 5/8: Checking deployment directory..."
ENV_BACKUP=""
if [ -d ~/"$DEPLOY_PATH" ]; then
    echo "[WARNING] Deployment directory already exists: ~/$DEPLOY_PATH"
    
    # Check if .env exists in deployment directory
    if [ -f ~/"$DEPLOY_PATH"/.env ]; then
        ENV_BACKUP=~/"$DEPLOY_PATH"/.env
        echo "[SUCCESS] Found existing .env file - will preserve it"
    else
        echo "[WARNING] No existing .env file found in deployment directory"
    fi
    
    echo "[INFO] Removing existing files (except .env)..."
    # Remove everything except .env
    find ~/"$DEPLOY_PATH" -not -name ".env" -type f -delete
    find ~/"$DEPLOY_PATH" -type d -empty -delete
else
    echo "[INFO] Creating new deployment directory..."
fi


mkdir -p ~/"$DEPLOY_PATH"/lavalink
echo "[SUCCESS] Deployment directory ready: ~/$DEPLOY_PATH"
echo ""


echo "[INFO] Step 6/8: Copying configuration files..."


# Copy and rename docker-compose file
cp docker-compose.prod.yml ~/"$DEPLOY_PATH"/docker-compose.yml
echo "[SUCCESS] Copied docker-compose.prod.yml → docker-compose.yml"


# Copy .env file - only if it doesn't exist
if [ -z "$ENV_BACKUP" ]; then
    cp "$ENV_FILE" ~/"$DEPLOY_PATH"/.env
    echo "[SUCCESS] Copied $ENV_FILE → .env"
else
    echo "[SUCCESS] Preserved existing .env file (no overwrite)"
fi


# Copy lavalink/application.yml for Lavalink
cp lavalink/application.yml ~/"$DEPLOY_PATH"/lavalink/application.yml
echo "[SUCCESS] Copied lavalink/application.yml → lavalink/application.yml"


# Copy lavalink-entrypoint.sh for Lavalink permission fix
cp lavalink-entrypoint.sh ~/"$DEPLOY_PATH"/lavalink-entrypoint.sh
chmod +x ~/"$DEPLOY_PATH"/lavalink-entrypoint.sh
echo "[SUCCESS] Copied lavalink-entrypoint.sh → lavalink-entrypoint.sh (executable)"
echo ""


echo "[INFO] Step 7/8: Setting .env file permissions (600)..."
chmod 600 ~/"$DEPLOY_PATH"/.env
echo "[SUCCESS] Set .env permissions to 600 (user read/write only)"
echo ""


echo "[INFO] Step 8/8: Cleaning up temporary directory..."
cd ~
rm -rf "$TEMP_DIR"
echo "[SUCCESS] Removed temporary directory: ~/$TEMP_DIR"
echo ""


echo "======================================================================"
echo "                     DEPLOYMENT SUCCESSFUL!                           "
echo "======================================================================"
echo ""
echo "Files deployed to: ~/$DEPLOY_PATH"
echo ""
echo "Directory structure:"
echo "  ~/$DEPLOY_PATH/"
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
echo "   cat ~/$DEPLOY_PATH/docker-compose.yml"
echo ""
echo "2. IMPORTANT: Verify Lavalink password in lavalink/application.yml:"
echo "   cat ~/$DEPLOY_PATH/lavalink/application.yml"
echo "   (Make sure 'server.password' is set securely)"
echo ""
echo "3. Verify .env configuration:"
echo "   cat ~/$DEPLOY_PATH/.env"
echo ""
echo "4. Start the services:"
echo "   cd ~/$DEPLOY_PATH"
echo "   sudo docker-compose up -d"
echo ""
echo "5. Check container status:"
echo "   sudo docker-compose ps"
echo ""
echo "6. View logs:"
echo "   sudo docker-compose logs -f"
echo ""
echo "7. Access Uptime Kuma:"
echo "   http://your-vps-ip:3001"
echo ""
echo "======================================================================"
REMOTE_SCRIPT_EOF
)


    # Execute the deployment script on remote server
    log_info "Connecting to remote server and executing deployment..."
    echo ""
    
    ssh "$SSH_HOST" "bash -s -- '$TEMP_DIR' '$DEPLOY_PATH' '$REPO_URL'" <<< "$REMOTE_SCRIPT"


    local SSH_EXIT_CODE=$?
    
    echo ""
    if [ $SSH_EXIT_CODE -eq 0 ]; then
        log_success "Deployment completed successfully!"
        log_info "You can now SSH to ${SSH_HOST} and follow the next steps"
    else
        log_error "Deployment failed with exit code: $SSH_EXIT_CODE"
        exit $SSH_EXIT_CODE
    fi
}


################################################################################
# Main Script Entry Point
################################################################################


main() {
    # Validate arguments
    validate_args "$@"


    # Extract arguments
    local SSH_HOST="$1"
    local DEPLOY_PATH="${2:-$DEFAULT_DEPLOY_PATH}"


    # Run deployment
    deploy "$SSH_HOST" "$DEPLOY_PATH"
}


# Run main function with all script arguments
main "$@"
