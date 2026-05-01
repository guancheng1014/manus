# GitHub 推送配置指南

## 概述

本项目已配置为自动推送到 GitHub 仓库：`guancheng1014/manus`

## 配置信息

- **GitHub 用户名**: guancheng1014
- **仓库地址**: https://github.com/guancheng1014/manus
- **认证方式**: Personal Access Token (PAT)
- **推送分支**: main

## 自动推送流程

### 1. 每次保存检查点后自动推送

当使用 `webdev_save_checkpoint` 保存项目检查点时，系统会自动：
1. 提交所有代码更改到本地 Git
2. 推送到 GitHub 的 main 分支

### 2. 手动推送

如需手动推送，运行以下命令：

```bash
cd /home/ubuntu/manus_register_tool_gui
./scripts/push-to-github.sh
```

## 数据库备份

### 数据库架构文件

数据库的 SQL 迁移文件已包含在 Git 中：

```
drizzle/
├── 0000_lethal_thor.sql          # 初始化表结构
├── 0001_gorgeous_thaddeus_ross.sql
├── 0002_secret_marrow.sql
├── 0003_neat_madrox.sql
├── 0004_silent_rachel_grey.sql
└── 0005_kind_expediter.sql
```

这些文件记录了数据库的所有架构变更，可用于：
- 版本控制
- 环境恢复
- 团队协作

### 数据库实例

**注意**：实际的数据库实例（.db、.sqlite 文件）不会被提交到 Git，因为：
1. `.gitignore` 中已配置排除这些文件
2. 数据库实例包含敏感数据
3. 数据库由 Manus 平台托管管理

## 环境变量

环境变量不会被提交到 Git（已在 `.gitignore` 中配置）：

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 推送历史

最近的推送记录：

```bash
# 查看最近 10 个提交
git log --oneline -10

# 查看推送状态
git status

# 查看远程仓库
git remote -v
```

## 常见问题

### Q: 如何验证推送成功？

A: 运行以下命令检查：

```bash
cd /home/ubuntu/manus_register_tool_gui
git log --oneline -3
# 查看是否显示 (HEAD -> main, origin/main)
```

### Q: 如何恢复特定版本？

A: 使用 Git 回滚：

```bash
# 查看所有提交
git log --oneline

# 回滚到特定提交
git reset --hard <commit-hash>

# 推送回滚
git push -f origin main
```

### Q: 数据库数据如何备份？

A: 数据库由 Manus 平台自动备份，您可以：
1. 导出数据到 CSV/JSON（通过应用界面）
2. 定期备份数据库快照
3. 使用数据库管理工具进行备份

## 推送工作流

```
┌─────────────────────────────────────┐
│  本地代码修改                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  webdev_save_checkpoint             │
│  (保存检查点)                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Git 自动提交                        │
│  (git add -A && git commit)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  推送到 GitHub                       │
│  (git push origin main)             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  GitHub 仓库更新完成                 │
│  https://github.com/guancheng1014/  │
│  manus                              │
└─────────────────────────────────────┘
```

## 后续更新

每次进行以下操作时，代码将自动推送到 GitHub：

1. ✅ 保存新的检查点（webdev_save_checkpoint）
2. ✅ 完成新功能开发
3. ✅ 修复 Bug
4. ✅ 优化性能

## 查看仓库

访问 GitHub 仓库查看完整的提交历史和代码：

🔗 https://github.com/guancheng1014/manus

## 支持

如有问题，请：
1. 检查 Git 配置：`git config --list`
2. 验证远程仓库：`git remote -v`
3. 查看推送日志：`git log --oneline -20`
