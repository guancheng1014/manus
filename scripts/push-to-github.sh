#!/bin/bash

# GitHub 推送脚本
# 用途：在每次保存检查点后自动推送代码到 GitHub

set -e

PROJECT_DIR="/home/ubuntu/manus_register_tool_gui"
GITHUB_REPO="https://github.com/guancheng1014/manus.git"
# 注意：GitHub Token 已在 Git 配置中设置，不需要在脚本中暴露
BRANCH="main"

cd "$PROJECT_DIR"

# 配置 Git 用户信息
git config user.name "guancheng1014"
git config user.email "guancheng1014@github.com"

# 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ 工作目录干净，无需推送"
    exit 0
fi

# 添加所有更改
echo "📝 添加文件到 Git..."
git add -A

# 创建提交
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MESSAGE="Auto commit: $TIMESTAMP - Checkpoint update"

echo "💾 创建提交: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE" || echo "⚠️  没有新的更改需要提交"

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
git push -u origin "$BRANCH"

echo "✅ 推送完成！"
echo "📊 查看仓库: https://github.com/guancheng1014/manus"
