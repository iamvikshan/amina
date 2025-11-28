#!/bin/bash
# Complete setup script to configure Git and GitHub CLI for iamvikshan
# This allows development as iamvikshan even though Codespace belongs to saintkim
#
# This script sets up:
# 1. Git global config (user.name and user.email)
# 2. GitHub CLI authentication as iamvikshan
# 3. SSH signing keys for commit verification
# 4. Updates ~/.bashrc to clear GITHUB_TOKEN and add verification function
# 5. Ensures all commits and pushes are attributed to iamvikshan
#
# Run this once to set up your development environment permanently.
# Safe to run multiple times (idempotent).

set -e

GIT_USER="iamvikshan"
GIT_EMAIL="103361575+iamvikshan@users.noreply.github.com"
BASHRC_FILE="$HOME/.bashrc"
MARKER_START="# iamvikshan development setup"
MARKER_END="# End iamvikshan development setup"

echo "=========================================="
echo "Complete Setup for iamvikshan"
echo "=========================================="
echo ""

# Step 1: Configure Git
echo "Step 1: Configuring Git..."
git config --global user.name "$GIT_USER"
git config --global user.email "$GIT_EMAIL"
echo "✓ Git user configured as $GIT_USER"
echo "  Name: $(git config --global user.name)"
echo "  Email: $(git config --global user.email)"
echo ""

# Step 2: Check GitHub CLI authentication
echo "Step 2: Checking GitHub CLI authentication..."
# Temporarily clear GITHUB_TOKEN to check actual authenticated user
OLD_TOKEN="$GITHUB_TOKEN"
export GITHUB_TOKEN=""
CURRENT_USER=$(gh api user --jq .login 2>/dev/null || echo "")
export GITHUB_TOKEN="$OLD_TOKEN"

if [ "$CURRENT_USER" = "$GIT_USER" ]; then
    echo "✓ GitHub CLI already authenticated as $GIT_USER"
    NEEDS_AUTH=false
else
    echo "⚠️  GitHub CLI needs to be authenticated as $GIT_USER"
    echo "   Current: ${CURRENT_USER:-Not authenticated}"
    NEEDS_AUTH=true
fi
echo ""

# Step 3: Authenticate GitHub CLI if needed
if [ "$NEEDS_AUTH" = true ]; then
    echo "Step 3: Authenticating GitHub CLI..."
    echo "The Codespace's GITHUB_TOKEN (for saintkim) will be temporarily disabled"
    echo ""
    echo "You have two options:"
    echo ""
    echo "Option 1: Interactive web login (recommended)"
    echo "  This will open a browser window for you to authenticate"
    echo ""
    echo "Option 2: Use a Personal Access Token"
    echo "  If you have a PAT for $GIT_USER, you can paste it here"
    echo ""
    read -p "Choose option (1 or 2, or 's' to skip): " choice

    case $choice in
        1)
            echo "Starting web-based authentication..."
            echo "  Requesting scopes: repo, workflow, write:packages, read:packages, admin:ssh_signing_key"
            unset GITHUB_TOKEN
            gh auth login --hostname github.com --web --git-protocol https --scopes "repo,workflow,write:packages,read:packages,admin:ssh_signing_key"
            echo "✓ Authentication complete"
            ;;
        2)
            echo "Please provide your Personal Access Token for $GIT_USER"
            echo "You can create one at: https://github.com/settings/tokens"
            echo "Required scopes: repo, workflow, write:packages, read:packages, admin:ssh_signing_key"
            read -sp "Enter token: " token
            echo ""
            unset GITHUB_TOKEN
            echo "$token" | gh auth login --with-token
            echo "✓ Authentication complete"
            ;;
        s|S)
            echo "⚠️  Skipping GitHub CLI authentication"
            echo "   You may need to authenticate manually later"
            ;;
        *)
            echo "⚠️  Invalid choice. Skipping authentication."
            ;;
    esac
    echo ""
else
    echo "Step 3: GitHub CLI authentication - skipped (already configured)"
    echo ""
fi

# Step 3.5: Setup SSH Signing Keys (mandatory for commit verification)
echo "Step 3.5: Setting up SSH signing keys for commit verification..."
export GITHUB_TOKEN=""

# Check if admin:ssh_signing_key scope is available
HAS_SIGNING_SCOPE=true
if ! gh api -X GET /user/ssh_signing_keys &>/dev/null; then
    HAS_SIGNING_SCOPE=false
fi

if [ "$HAS_SIGNING_SCOPE" != "true" ]; then
    echo "⚠️  Need 'admin:ssh_signing_key' scope for commit signing"
    echo "   This will open a browser for authorization..."
    read -p "Press Enter to continue (or Ctrl+C to cancel): " confirm
    gh auth refresh -h github.com -s admin:ssh_signing_key
    echo "✓ Scope granted"
fi

# Use consistent key name for reuse across environments
SIGNING_KEY_PATH="$HOME/.ssh/id_ed25519_signing"
SIGNING_KEY_PUB="$SIGNING_KEY_PATH.pub"

# Check if key already exists locally
if [ -f "$SIGNING_KEY_PATH" ] && [ -f "$SIGNING_KEY_PUB" ]; then
    echo "✓ Found existing SSH signing key: $SIGNING_KEY_PATH"
    KEY_EXISTS=true
else
    echo "Generating new SSH signing key..."
    mkdir -p "$HOME/.ssh"
    ssh-keygen -t ed25519 -C "$GIT_EMAIL" -f "$SIGNING_KEY_PATH" -N "" -q
    echo "✓ SSH signing key generated: $SIGNING_KEY_PATH"
    KEY_EXISTS=false
fi

# Get the public key content
PUBLIC_KEY=$(cat "$SIGNING_KEY_PUB")

# Check if this key is already on GitHub and add if needed
echo "Ensuring SSH signing key is added to GitHub..."
KEY_FINGERPRINT=$(ssh-keygen -lf "$SIGNING_KEY_PUB" 2>/dev/null | awk '{print $2}' || echo "")

# Try to add the key (will fail gracefully if already exists)
ADD_OUTPUT=$(gh ssh-key add "$SIGNING_KEY_PUB" --type signing --title "iamvikshan signing key" 2>&1)
ADD_EXIT_CODE=$?

if [ $ADD_EXIT_CODE -eq 0 ]; then
    echo "✓ SSH signing key added to GitHub"
elif echo "$ADD_OUTPUT" | grep -qi "already exists\|duplicate"; then
    echo "✓ SSH signing key already exists on GitHub"
else
    # Verify by checking the list
    if [ -n "$KEY_FINGERPRINT" ] && gh ssh-key list --type signing 2>/dev/null | grep -q "$KEY_FINGERPRINT"; then
        echo "✓ SSH signing key is on GitHub"
    else
        echo "⚠️  Failed to add SSH signing key to GitHub"
        echo "   Error: $ADD_OUTPUT"
        echo "   You may need to add it manually at: https://github.com/settings/keys"
        echo "   Public key location: $SIGNING_KEY_PUB"
    fi
fi

# Configure Git for SSH signing
git config --global gpg.format ssh
git config --global user.signingkey "$SIGNING_KEY_PUB"
git config --global commit.gpgsign true
echo "✓ Git configured for SSH signing"
echo ""

# Step 3.6: Configure Git Remote and Credentials
echo "Step 3.6: Configuring Git Remote and Credentials..."

# Configure git to use GitHub CLI as credential helper
echo "Configuring git credential helper to use gh CLI..."
gh auth setup-git

# Ensure remote is set correctly
echo "Ensuring git remote 'origin' is configured..."
# Check if we are in a git repo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    # Set remote to HTTPS URL for iamvikshan/amina
    # We use HTTPS because we just set up the credential helper
    TARGET_REPO="https://github.com/iamvikshan/amina.git"
    
    if git remote | grep -q "^origin$"; then
        CURRENT_URL=$(git remote get-url origin)
        if [ "$CURRENT_URL" != "$TARGET_REPO" ]; then
            echo "Updating existing 'origin' remote from $CURRENT_URL to $TARGET_REPO..."
            git remote set-url origin "$TARGET_REPO"
        else
            echo "Remote 'origin' is already set to $TARGET_REPO"
        fi
    else
        echo "Adding 'origin' remote..."
        git remote add origin "$TARGET_REPO"
    fi
    echo "✓ Remote 'origin' configured"
else
    echo "⚠️  Not inside a git repository. Skipping remote configuration."
fi
echo ""

# Step 3.7: Configure Wiki Repository
echo "Step 3.7: Configuring Wiki Repository..."
WIKI_DIR="docs/wiki"
WIKI_REPO="https://github.com/iamvikshan/amina.wiki.git"

# Clone if missing
if [ ! -d "$WIKI_DIR" ]; then
    echo "Wiki directory not found. Cloning wiki repository..."
    mkdir -p docs
    if git clone "$WIKI_REPO" "$WIKI_DIR"; then
        echo "✓ Wiki repository cloned to $WIKI_DIR"
    else
        echo "⚠️  Failed to clone wiki repository. It might not exist yet."
    fi
fi

# Configure if present
if [ -d "$WIKI_DIR/.git" ]; then
    # We need to run these commands inside the wiki directory
    (
        cd "$WIKI_DIR"
        echo "Configuring Wiki git user..."
        git config user.name "$GIT_USER"
        git config user.email "$GIT_EMAIL"
        git config user.signingkey "$SIGNING_KEY_PUB"
        git config commit.gpgsign true
        
        echo "Ensuring Wiki remote is correct..."
        if git remote | grep -q "^origin$"; then
            git remote set-url origin "$WIKI_REPO"
        else
            git remote add origin "$WIKI_REPO"
        fi
        echo "✓ Wiki repository configured"
    )
else
    echo "Wiki repository not found or not a git repo. Skipping configuration."
fi
echo ""

# Step 4: Update ~/.bashrc
echo "Step 4: Updating ~/.bashrc..."

# Check if the setup block already exists
if grep -q "$MARKER_START" "$BASHRC_FILE" 2>/dev/null; then
    echo "  Found existing setup block in ~/.bashrc"
    echo "  Removing old block to update..."
    
    # Remove the old block (from marker_start to marker_end)
    # Use a temporary file to avoid sed portability issues
    awk -v start="$MARKER_START" -v end="$MARKER_END" '
        /^'"$MARKER_START"'/ { skip=1; next }
        /^'"$MARKER_END"'/ { skip=0; next }
        skip==0 { print }
    ' "$BASHRC_FILE" > "$BASHRC_FILE.tmp" && mv "$BASHRC_FILE.tmp" "$BASHRC_FILE"
fi

# Find the line number where setup.sh is sourced (to insert after it)
SETUP_LINE=$(grep -n "source /usr/local/bin/setup.sh" "$BASHRC_FILE" | tail -1 | cut -d: -f1)

if [ -n "$SETUP_LINE" ]; then
    # Insert after setup.sh line
    {
        head -n "$SETUP_LINE" "$BASHRC_FILE"
        echo ""
        echo "$MARKER_START"
        echo "# Clear GITHUB_TOKEN to use stored gh CLI credentials ($GIT_USER) instead of Codespace token (saintkim)"
        echo "# This ensures all Git operations and GitHub CLI commands use $GIT_USER credentials"
        echo "# Must be after setup.sh is sourced, as Codespace may set GITHUB_TOKEN"
        echo "# Setting to empty string works better than unset for some environments"
        echo "export GITHUB_TOKEN=\"\""
        echo ""
        echo "# $GIT_USER development setup verification"
        echo "check_dev_setup() {"
        echo "    local git_user=\$(git config --global user.name 2>/dev/null)"
        echo "    local git_email=\$(git config --global user.email 2>/dev/null)"
        echo "    local gh_user=\"\""
        echo "    "
        echo "    if command -v gh &> /dev/null; then"
        echo "        gh_user=\$(gh api user --jq .login 2>/dev/null || echo \"\")"
        echo "    fi"
        echo "    "
        echo "    if [ \"\$git_user\" != \"$GIT_USER\" ] || [ \"\$git_email\" != \"$GIT_EMAIL\" ]; then"
        echo "        echo \"⚠️  Git is not configured for $GIT_USER\""
        echo "        echo \"   Run: git config --global user.name '$GIT_USER'\""
        echo "        echo \"   Run: git config --global user.email '$GIT_EMAIL'\""
        echo "        return 1"
        echo "    fi"
        echo "    "
        echo "    if [ -z \"\$gh_user\" ] || [ \"\$gh_user\" != \"$GIT_USER\" ]; then"
        echo "        if [ -n \"\$GITHUB_TOKEN\" ]; then"
        echo "            echo \"⚠️  GitHub CLI is using Codespace token (saintkim), not $GIT_USER\""
        echo "            echo \"   Run: ./setup-iamvikshan.sh to authenticate as $GIT_USER\""
        echo "        else"
        echo "            echo \"⚠️  GitHub CLI is not authenticated as $GIT_USER\""
        echo "            echo \"   Run: ./setup-iamvikshan.sh to authenticate\""
        echo "        fi"
        echo "        return 1"
        echo "    fi"
        echo "    "
        echo "    echo \"✓ Development setup verified: working as $GIT_USER\""
        echo "    return 0"
        echo "}"
        echo ""
        echo "# Uncomment the line below to auto-check on shell startup"
        echo "# check_dev_setup"
        echo "$MARKER_END"
        tail -n +$((SETUP_LINE + 1)) "$BASHRC_FILE"
    } > "$BASHRC_FILE.tmp" && mv "$BASHRC_FILE.tmp" "$BASHRC_FILE"
    echo "✓ Updated ~/.bashrc with GITHUB_TOKEN clearing and verification function"
else
    # If setup.sh line not found, append to end of file
    echo "" >> "$BASHRC_FILE"
    echo "$MARKER_START" >> "$BASHRC_FILE"
    echo "# Clear GITHUB_TOKEN to use stored gh CLI credentials ($GIT_USER) instead of Codespace token (saintkim)" >> "$BASHRC_FILE"
    echo "# This ensures all Git operations and GitHub CLI commands use $GIT_USER credentials" >> "$BASHRC_FILE"
    echo "export GITHUB_TOKEN=\"\"" >> "$BASHRC_FILE"
    echo "" >> "$BASHRC_FILE"
    echo "# $GIT_USER development setup verification" >> "$BASHRC_FILE"
    echo "check_dev_setup() {" >> "$BASHRC_FILE"
    echo "    local git_user=\$(git config --global user.name 2>/dev/null)" >> "$BASHRC_FILE"
    echo "    local git_email=\$(git config --global user.email 2>/dev/null)" >> "$BASHRC_FILE"
    echo "    local gh_user=\"\"" >> "$BASHRC_FILE"
    echo "    if command -v gh &> /dev/null; then" >> "$BASHRC_FILE"
    echo "        gh_user=\$(gh api user --jq .login 2>/dev/null || echo \"\")" >> "$BASHRC_FILE"
    echo "    fi" >> "$BASHRC_FILE"
    echo "    if [ \"\$git_user\" != \"$GIT_USER\" ] || [ \"\$git_email\" != \"$GIT_EMAIL\" ]; then" >> "$BASHRC_FILE"
    echo "        echo \"⚠️  Git is not configured for $GIT_USER\"" >> "$BASHRC_FILE"
    echo "        return 1" >> "$BASHRC_FILE"
    echo "    fi" >> "$BASHRC_FILE"
    echo "    if [ -z \"\$gh_user\" ] || [ \"\$gh_user\" != \"$GIT_USER\" ]; then" >> "$BASHRC_FILE"
    echo "        echo \"⚠️  GitHub CLI is not authenticated as $GIT_USER\"" >> "$BASHRC_FILE"
    echo "        return 1" >> "$BASHRC_FILE"
    echo "    fi" >> "$BASHRC_FILE"
    echo "    echo \"✓ Development setup verified: working as $GIT_USER\"" >> "$BASHRC_FILE"
    echo "    return 0" >> "$BASHRC_FILE"
    echo "}" >> "$BASHRC_FILE"
    echo "$MARKER_END" >> "$BASHRC_FILE"
    echo "✓ Appended setup to ~/.bashrc"
fi
echo ""

# Step 5: Verify final setup
echo "Step 5: Verifying final setup..."
echo ""

# Source bashrc to test the new configuration
export GITHUB_TOKEN=""
FINAL_GIT_USER=$(git config --global user.name)
FINAL_GIT_EMAIL=$(git config --global user.email)
FINAL_GH_USER=$(gh api user --jq .login 2>/dev/null || echo "")
FINAL_SIGNING_KEY=$(git config --global user.signingkey || echo "")
FINAL_GPGSIGN=$(git config --global commit.gpgsign || echo "false")

echo "Current configuration:"
echo "  ✓ Git user.name: $FINAL_GIT_USER"
echo "  ✓ Git user.email: $FINAL_GIT_EMAIL"
if [ -n "$FINAL_GH_USER" ]; then
    echo "  ✓ GitHub CLI user: $FINAL_GH_USER"
else
    echo "  ⚠️  GitHub CLI: Not authenticated"
fi
if [ -n "$FINAL_SIGNING_KEY" ] && [ "$FINAL_GPGSIGN" = "true" ]; then
    echo "  ✓ Commit signing: Enabled ($FINAL_SIGNING_KEY)"
else
    echo "  ⚠️  Commit signing: Not configured"
fi
echo ""

# Final status
SETUP_COMPLETE=true
if [ "$FINAL_GIT_USER" != "$GIT_USER" ] || [ "$FINAL_GIT_EMAIL" != "$GIT_EMAIL" ]; then
    SETUP_COMPLETE=false
fi
if [ "$FINAL_GH_USER" != "$GIT_USER" ]; then
    SETUP_COMPLETE=false
fi
if [ -z "$FINAL_SIGNING_KEY" ] || [ "$FINAL_GPGSIGN" != "true" ]; then
    SETUP_COMPLETE=false
fi

if [ "$SETUP_COMPLETE" = "true" ]; then
    echo "=========================================="
    echo "✓ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "All operations will be attributed to $GIT_USER"
    echo "All commits will be signed with SSH key: $FINAL_SIGNING_KEY"
    echo ""
    echo "To verify your setup in a new shell, run:"
    echo "  source ~/.bashrc"
    echo "  check_dev_setup"
    echo ""
    exit 0
else
    echo "=========================================="
    echo "⚠️  Setup Incomplete"
    echo "=========================================="
    echo ""
    if [ "$FINAL_GIT_USER" != "$GIT_USER" ] || [ "$FINAL_GIT_EMAIL" != "$GIT_EMAIL" ]; then
        echo "Git configuration needs attention"
    fi
    if [ "$FINAL_GH_USER" != "$GIT_USER" ]; then
        echo "GitHub CLI authentication needs attention"
        echo "Run this script again and choose option 1 or 2 for authentication"
    fi
    if [ -z "$FINAL_SIGNING_KEY" ] || [ "$FINAL_GPGSIGN" != "true" ]; then
        echo "SSH signing key setup needs attention"
        echo "Run this script again to complete SSH signing setup"
    fi
    echo ""
    exit 1
fi
