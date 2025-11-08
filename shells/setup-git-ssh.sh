#!/bin/bash
# ==========================================
# 🔧 GitHub + Gitee SSH 自动配置脚本
# 自动生成密钥、配置 SSH、绑定仓库
# ==========================================

echo "===================================="
echo "🚀 Configuring GitHub and Gitee SSH login..."
echo "🚀 正在配置 GitHub 与 Gitee SSH 登录..."
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
    echo "👉 正在生成 $service SSH 密钥..."
    ssh-keygen -t ed25519 -C "$email" -f "$keyfile" -N ""
  else
    echo "✅ $service SSH key already exists:"
    echo "✅ $service SSH 密钥已存在：$keyfile"
  fi
}

read -p "Please enter your GitHub username: " GH_USER
read -p "Please enter your GitHub email: " GH_EMAIL
read -p "Please enter your Gitee username: " GITEE_USER
read -p "Please enter your Gitee email: " GITEE_EMAIL

GH_KEY="$SSH_DIR/id_github"
GITEE_KEY="$SSH_DIR/id_gitee"

generate_key "GitHub" "$GH_EMAIL" "$GH_KEY"
generate_key "Gitee" "$GITEE_EMAIL" "$GITEE_KEY"

# ------------------------------------------
# SSH config
# ------------------------------------------
CONFIG_FILE="$SSH_DIR/config"
echo "👉 Updating SSH configuration files: $CONFIG_FILE"
echo "👉 正在更新 SSH 配置文件"

# Delete the old configuration (if it exists)
sed -i '/Host github.com/,+3d' "$CONFIG_FILE" 2>/dev/null
sed -i '/Host gitee.com/,+3d' "$CONFIG_FILE" 2>/dev/null

cat <<EOF >> "$CONFIG_FILE"
Host github.com
  HostName github.com
  User git
  IdentityFile $GH_KEY

Host gitee.com
  HostName gitee.com
  User git
  IdentityFile $GITEE_KEY
EOF

chmod 600 "$CONFIG_FILE"
chmod 600 "$SSH_DIR"/*

echo
echo "===================================="
echo "📋 Please manually add the following public keys to the website:"
echo "📋 请手动将以下公钥添加到网站："
echo "------------------------------------"
echo "GitHub public key content:"
echo "GitHub 公钥内容："
echo
echo "👉 cat $GH_KEY.pub"
echo "🔗 Link: https://github.com/settings/keys"
echo
echo "Gitee public key content:"
echo "Gitee 公钥内容："
echo
echo "👉 cat $GITEE_KEY.pub"
echo "🔗 Link: https://gitee.com/profile/sshkeys"
echo "===================================="
echo

echo "⏳ Testing GitHub..."
ssh -T git@github.com 2>&1 | grep -q "successfully" && echo "✅ GitHub SSH connection successful!" || echo "⚠️ GitHub Connection failed (the public key may not have been added)"

echo "⏳ Testing Gitee..."
ssh -T git@gitee.com 2>&1 | grep -q "successfully" && echo "✅ Gitee SSH connection successful!" || echo "⚠️ Gitee Connection failed (the public key may not have been added)"

# ------------------------------------------
# 自动添加远程仓库（如果在 Git 项目中） / Automatically add remote repositories (if in a Git project)
# ------------------------------------------
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo
  echo "===================================="
  echo "🧩 Detected that the current directory is a Git repository"
  echo "🧩 检测到当前目录是 Git 仓库"
  echo
  echo "Starting to check remote configuration..."
  echo "开始检测远程配置..."
  echo "===================================="
  
  GH_REPO_SSH="git@github.com:${GH_USER}/eddie.git"
  GITEE_REPO_SSH="git@gitee.com:${GITEE_USER}/eddie.git"

  # Checked GitHub
  if git remote -v | grep -q github.com; then
    echo "✅ GitHub remote repository configured"
    echo "✅ 已配置 GitHub 远程仓库"
  else
    echo "👉 Add GitHub remote repository: $GH_REPO_SSH"
    echo "👉 添加 GitHub 远程仓库：$GH_REPO_SSH"
    git remote add origin "$GH_REPO_SSH" 2>/dev/null || echo "⚠️ 远程名 origin 已存在"
  fi

  # Checked Gitee
  if git remote -v | grep -q gitee.com; then
    echo "👉 Add Gitee remote repository: $GH_REPO_SSH"
    echo "👉 添加 GitHub 远程仓库：$GH_REPO_SSH"
    echo
    echo "✅ Gitee remote repository configured"
    echo "✅ 已配置 Gitee 远程仓库"
  else
    echo "👉 添加 Gitee 远程仓库：$GITEE_REPO_SSH"
    git remote add gitee "$GITEE_REPO_SSH" 2>/dev/null || echo "⚠️ Gitee 远程已存在"
  fi

  echo
  echo "🎯 Now you can push it by executing:"
  echo "🎯 现在你可以执行以下命令推送："
  echo "   git push origin main"
  echo "   git push gitee main"
else
  echo "⚠️ The current directory is not a Git project, skipping remote configuration."
  echo "⚠️ 当前目录不是 Git 项目，跳过远程配置。"
fi

echo
echo "===================================="
echo "🎉 SSH and repository configuration is complete!"
echo "🎉 SSH 与仓库配置完成！"
echo "===================================="
