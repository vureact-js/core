#!/bin/bash
# ==========================================
# 🔧 GitHub SSH Auto Setup Script (English)
# Generates SSH keys, configures SSH, sets local Git user info,
# and automatically adds remote repositories if in a Git repo.
# ==========================================

echo "===================================="
echo "🚀 Configuring GitHub SSH login..."
echo "===================================="

SSH_DIR="$HOME/.ssh"
mkdir -p "$SSH_DIR"

# ------------------------------------------
# Function: Generate SSH keys
# ------------------------------------------
generate_key() {
  local service=$1
  local email=$2
  local keyfile=$3

  if [ ! -f "$keyfile" ]; then
    echo "👉 Generating $service SSH keys..."
    ssh-keygen -t ed25519 -C "$email" -f "$keyfile" -N ""
  else
    echo "✅ $service SSH key already exists: $keyfile"
  fi
}

read -p "Please enter your GitHub username: " GH_USER
read -p "Please enter your GitHub email: " GH_EMAIL

GH_KEY="$SSH_DIR/id_github"

generate_key "GitHub" "$GH_EMAIL" "$GH_KEY"

# ------------------------------------------
# Configure local Git user info (repo-level)
# ------------------------------------------
echo
echo "===================================="
echo "🧩 Configuring local Git user info (repo only)..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git config user.name "$GH_USER"
  git config user.email "$GH_EMAIL"
  echo "✅ Git user.name set to: $(git config user.name)"
  echo "✅ Git user.email set to: $(git config user.email)"
else
  echo "⚠️ Not inside a Git repository. Skipping local Git user setup."
fi

# ------------------------------------------
# SSH config
# ------------------------------------------
CONFIG_FILE="$SSH_DIR/config"
echo
echo "👉 Updating SSH configuration file: $CONFIG_FILE"

sed -i '/Host github.com/,+3d' "$CONFIG_FILE" 2>/dev/null

cat <<EOF >> "$CONFIG_FILE"
Host github.com
  HostName github.com
  User git
  IdentityFile $GH_KEY
EOF

chmod 600 "$CONFIG_FILE"
chmod 600 "$SSH_DIR"/*

echo
echo "===================================="
echo "📋 Please manually add the following public keys to the website:"
echo "------------------------------------"
echo "GitHub public key path: $GH_KEY.pub"
echo "🔗 Link: https://github.com/settings/keys"
echo "===================================="
echo

echo "⏳ Testing GitHub..."
ssh -T git@github.com 2>&1 | grep -q "successfully" && echo "✅ GitHub SSH connection successful!" || echo "⚠️ GitHub Connection failed (the public key may not have been added)"

# ------------------------------------------
# Automatically add remote repositories (if inside Git project)
# ------------------------------------------
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo
  echo "===================================="
  echo "🧩 Detected that the current directory is a Git repository"
  echo "Starting to check remote configuration..."
  echo "===================================="

  GH_REPO_SSH="git@github.com:vureact-js/vureact.git"

  if git remote -v | grep -q github.com; then
    echo "✅ GitHub remote repository already configured"
  else
    echo "👉 Adding GitHub remote repository: $GH_REPO_SSH"
    git remote add github "$GH_REPO_SSH" 2>/dev/null || echo "⚠️ Remote name 'github' already exists"
  fi

  echo
  echo "🎯 You can now push with:"
  echo "   git push github <your branch>"
else
  echo "⚠️ The current directory is not a Git project, skipping remote configuration."
fi

echo
echo "===================================="
echo "🎉 SSH and repository configuration complete!"
echo "===================================="

read -p "Press Enter to close the window..."
