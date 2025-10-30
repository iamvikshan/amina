#!/bin/bash
# VPS Deployment Script for Amina
# Usage: bash deploy-vps.sh user@your-vps-ip

set -e

if [ -z "$1" ]; then
    echo "❌ Error: VPS SSH connection string required"
    echo "Usage: bash deploy-vps.sh user@your-vps-ip"
    exit 1
fi

VPS="$1"
DEPLOY_DIR="/opt/amina"

echo "🚀 Deploying Amina to VPS: $VPS"
echo ""

# Check if .env exists locally
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in current directory"
    echo "Please create a production .env file first"
    exit 1
fi

# Check if lavalink config exists
if [ ! -f "lavalink/application.yml" ]; then
    echo "❌ Error: lavalink/application.yml not found"
    exit 1
fi

echo "📋 Pre-deployment checks..."
echo "✅ .env file found"
echo "✅ lavalink/application.yml found"
echo ""

# Create directory on VPS
echo "📁 Creating deployment directory on VPS..."
ssh "$VPS" "mkdir -p $DEPLOY_DIR/lavalink"

# Copy files
echo "📤 Copying files to VPS..."
scp docker-compose.prod.yml "$VPS:$DEPLOY_DIR/docker-compose.yml"
echo "  ✅ docker-compose.yml"

scp .env "$VPS:$DEPLOY_DIR/.env"
echo "  ✅ .env"

scp lavalink/application.yml "$VPS:$DEPLOY_DIR/lavalink/application.yml"
echo "  ✅ lavalink/application.yml"

echo ""
echo "📦 Note: Lavalink plugins will be automatically downloaded from application.yml"

echo ""
echo "🔐 Setting file permissions..."
ssh "$VPS" "chmod 600 $DEPLOY_DIR/.env"

echo ""
echo "⚠️  IMPORTANT: Update Lavalink password on VPS!"
echo "Run these commands on your VPS:"
echo ""
echo "  ssh $VPS"
echo "  nano $DEPLOY_DIR/lavalink/application.yml"
echo "  # Change password: 'youshallnotpass' to your production password"
echo "  # Must match LAVALINK_PASSWORD_1 in .env"
echo ""
read -p "Press Enter once you've updated the password, or Ctrl+C to abort..."

echo ""
echo "🐳 Starting Docker services..."
ssh "$VPS" "cd $DEPLOY_DIR && docker-compose pull && docker-compose up -d"

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Service Status:"
ssh "$VPS" "cd $DEPLOY_DIR && docker-compose ps"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Next steps:"
echo "  1. Check logs: ssh $VPS 'cd $DEPLOY_DIR && docker-compose logs -f'"
echo "  2. Access Uptime Kuma: http://$(echo $VPS | cut -d'@' -f2):3001"
echo "  3. Verify bot is online in Discord"
echo ""
echo "📚 Full guide: See DEPLOYMENT.md"
