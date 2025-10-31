#!/bin/bash
# Post-build script to set up dist directory for Node.js execution

echo "📦 Setting up dist directory for Node.js compatibility..."

# Create package.json for dist directory with updated module aliases
cat > dist/package.json << 'EOF'
{
  "name": "discord-js-bot",
  "version": "5.6.0",
  "description": "An open-source, multipurpose discord bot built using discord-js (Node.js compiled version)",
  "main": "index.js",
  "author": "vikshan",
  "license": "ISC",
  "type": "commonjs",
  "_moduleAliases": {
    "@root": "..",
    "@handlers": "./handlers/",
    "@helpers": "./helpers/",
    "@schemas": "./database/schemas/",
    "@src": "./",
    "@structures": "./structures/",
    "@commands": "./commands/"
  }
}
EOF

echo "✅ Dist directory is ready for Node.js execution!"
echo "🚀 Run 'npm run start:node' or 'node dist/index.js' to start the bot with Node.js"
