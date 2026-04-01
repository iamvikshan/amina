#!/bin/bash

# Exit immediately if a pipeline returns a non-zero status
set -e

echo "Starting environment setup..."

# 1. Update and upgrade system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Make author.sh executable if it exists
if [ -f scripts/author.sh ]; then
  echo "Making scripts/author.sh executable..."
  chmod +x scripts/author.sh
fi

# 3. Set the timezone
echo "Setting timezone to Africa/Nairobi..."
sudo ln -sf /usr/share/zoneinfo/Africa/Nairobi /etc/localtime

# 4. Install CodeRabbit CLI
echo "Installing CodeRabbit CLI..."
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# 5. Fetch hooks from the iamvikshan/.github repository if missing
if [ ! -d "scripts/hooks" ]; then
  echo "Directory scripts/hooks does not exist. Fetching from GitHub..."
  
  TMP_DIR=$(mktemp -d)
  git clone --depth 1 --filter=blob:none --sparse https://github.com/iamvikshan/.github.git "$TMP_DIR"
  git -C "$TMP_DIR" sparse-checkout set scripts/hooks
  
  mkdir -p scripts/hooks
  cp -R "$TMP_DIR/scripts/hooks/"* scripts/hooks/ 2>/dev/null || true
  cp -R "$TMP_DIR/scripts/hooks/".* scripts/hooks/ 2>/dev/null || true
  
  rm -rf "$TMP_DIR"
  echo "Hooks successfully fetched and copied!"
else
  echo "scripts/hooks already exists. Skipping fetch."
fi

echo "Setup complete!"