# Manus 自动注册工具平台 - 部署指南

## 系统要求

- Node.js 18+
- MySQL 5.7+ 或 TiDB
- Redis（可选，用于缓存）

## 环境变量配置

```bash
# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/manus_register

# OAuth 配置
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_here

# 所有者信息
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# Manus 内置 API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key

# 前端 API
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key

# 应用配置
VITE_APP_TITLE=Manus 自动注册工具
VITE_APP_LOGO=https://your-logo-url.png
```

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd manus_register_tool_gui
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm db:push
```

### 4. 开发环境运行

```bash
pnpm dev
```

访问 `http://localhost:3000`

### 5. 生产环境构建

```bash
# 构建前端
pnpm build

# 启动生产服务器
pnpm start
```

## 功能配置

### 代理配置

1. 登录管理员账号
2. 进入 `代理配置` 页面
3. 选择代理提供商（Luminati、Oxylabs、SmartProxy 或 Custom）
4. 输入 API 凭据
5. 配置轮换策略和健康检查参数
6. 保存配置

### 卡密管理

1. 登录管理员账号
2. 进入 `管理后台` → `卡密管理`
3. 点击 `生成卡密` 按钮
4. 设置使用次数和过期日期
5. 生成并分发卡密

### 自动通知

系统会自动在以下情况发送通知：

- 新用户激活卡密
- 卡密即将到期（7 天内）
- 注册任务完成
- 检测到异常使用

## 性能优化

### 并发处理

- 批量注册支持 1-50 并发
- 推荐设置：10-20 并发（根据代理质量调整）

### 代理轮换策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| 轮询 | 按顺序轮换 | 代理质量均匀 |
| 随机 | 随机选择 | 避免模式识别 |
| 加权 | 基于成功率 | 优先使用高质量代理 |
| 自适应 | 综合评分 | 最佳平衡 |

### 健康检查

- 检查间隔：建议 5-10 分钟
- 超时时间：建议 10-15 秒
- 失败阈值：建议 3-5 次

## 监控和日志

### 日志位置

```
.manus-logs/
├── devserver.log        # 服务器日志
├── browserConsole.log   # 浏览器控制台
├── networkRequests.log  # 网络请求
└── sessionReplay.log    # 会话回放
```

### 关键指标

- 注册成功率
- 平均响应时间
- 代理可用率
- 卡密使用率

## 故障排除

### 问题：注册失败率高

**解决方案：**
1. 检查代理质量
2. 调整轮换策略为 `加权` 或 `自适应`
3. 增加健康检查频率
4. 检查 Turnstile 验证码配置

### 问题：代理连接超时

**解决方案：**
1. 检查代理 API 配置
2. 增加超时时间
3. 切换代理提供商
4. 检查网络连接

### 问题：卡密验证失败

**解决方案：**
1. 检查卡密是否已过期
2. 检查卡密使用次数是否已用尽
3. 查看数据库中的卡密状态
4. 重新生成卡密

## 安全建议

1. **定期更新依赖**
   ```bash
   pnpm update
   ```

2. **启用 HTTPS**
   - 在生产环境中强制使用 HTTPS
   - 配置 SSL 证书

3. **API 密钥管理**
   - 不要在代码中硬编码 API 密钥
   - 使用环境变量
   - 定期轮换密钥

4. **数据库安全**
   - 使用强密码
   - 启用 SSL 连接
   - 定期备份

5. **访问控制**
   - 限制管理员账号
   - 启用 IP 白名单（如适用）
   - 定期审计日志

## 备份和恢复

### 数据库备份

```bash
# 导出数据库
mysqldump -u user -p database_name > backup.sql

# 导入数据库
mysql -u user -p database_name < backup.sql
```

### 恢复步骤

1. 停止应用
2. 恢复数据库备份
3. 运行数据库迁移
4. 重启应用

## 扩展和定制

### 添加新的代理提供商

1. 在 `server/proxyProviders.ts` 中实现新的提供商类
2. 更新 `ProxyProviderFactory`
3. 在前端添加提供商选项

### 自定义注册流程

1. 修改 `server/registration.ts` 中的注册逻辑
2. 添加新的验证步骤
3. 更新前端表单

## 支持和反馈

如有问题或建议，请联系：
- 邮件：support@manus.im
- 文档：https://docs.manus.im
- 社区：https://community.manus.im
