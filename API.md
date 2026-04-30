# Manus 自动注册工具 - API 文档

## 概述

本 API 文档描述了 Manus 自动注册工具平台的所有 tRPC 接口。所有请求都通过 `/api/trpc` 端点处理。

## 认证

所有受保护的接口都需要有效的会话 Cookie。通过 Manus OAuth 登录后会自动获得。

## 卡密管理 API

### 1. 激活卡密

**接口：** `cardKey.activate`

**方法：** `POST`

**参数：**
```typescript
{
  code: string;  // 卡密码
}
```

**响应：**
```typescript
{
  success: boolean;
  message: string;
  binding?: {
    id: number;
    userId: number;
    cardKeyId: number;
    activatedAt: Date;
  };
}
```

**示例：**
```javascript
const result = await trpc.cardKey.activate.mutate({ code: "ABC123XYZ" });
```

### 2. 生成卡密（管理员）

**接口：** `cardKey.generate`

**方法：** `POST`

**参数：**
```typescript
{
  count: number;        // 生成数量
  maxUses: number;      // 每张卡密的最大使用次数
  expiresAt: Date;      // 过期日期
}
```

**响应：**
```typescript
{
  success: boolean;
  keys: string[];  // 生成的卡密列表
}
```

### 3. 获取卡密列表（管理员）

**接口：** `cardKey.list`

**方法：** `GET`

**参数：**
```typescript
{
  status?: "active" | "used" | "expired" | "disabled";
  limit?: number;
  offset?: number;
}
```

**响应：**
```typescript
{
  keys: Array<{
    id: number;
    keyCode: string;
    maxUses: number;
    usedCount: number;
    expiresAt: Date | null;
    status: string;
    createdAt: Date;
  }>;
  total: number;
}
```

## 注册 API

### 1. 单账号注册

**接口：** `registration.registerSingle`

**方法：** `POST`

**参数：**
```typescript
{
  email: string;
  password: string;
  emailApiUrl: string;
  phone?: string;
  phoneApiUrl?: string;
  yesCaptchaKey: string;
  inviteCode?: string;
}
```

**响应：**
```typescript
{
  success: boolean;
  message: string;
  result?: {
    email: string;
    token: string;
    createdAt: Date;
  };
}
```

### 2. 创建批量任务

**接口：** `registration.createBatchTask`

**方法：** `POST`

**参数：**
```typescript
{
  name: string;
  emailList: string[];  // 格式: "email@example.com----https://api.example.com"
  concurrency: number;  // 1-50
  yesCaptchaKey: string;
  phoneApiUrl?: string;
}
```

**响应：**
```typescript
{
  success: boolean;
  taskId: number;
  message: string;
}
```

### 3. 获取任务列表

**接口：** `registration.getTasks`

**方法：** `GET`

**参数：**
```typescript
{
  status?: "pending" | "running" | "completed" | "failed" | "cancelled";
  limit?: number;
  offset?: number;
}
```

**响应：**
```typescript
{
  tasks: Array<{
    id: number;
    name: string;
    status: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    progress: number;
    createdAt: Date;
    completedAt?: Date;
  }>;
  total: number;
}
```

### 4. 取消任务

**接口：** `registration.cancelTask`

**方法：** `POST`

**参数：**
```typescript
{
  taskId: number;
}
```

**响应：**
```typescript
{
  success: boolean;
  message: string;
}
```

## 代理管理 API

### 1. 获取代理配置

**接口：** `proxy.getConfig`

**方法：** `GET`

**响应：**
```typescript
{
  provider: "luminati" | "oxylabs" | "smartproxy" | "custom";
  rotationStrategy: "round_robin" | "random" | "weighted" | "adaptive";
  rotationFrequency: number;
  enableAutoRotation: boolean;
  enableHealthCheck: boolean;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxFailureThreshold: number;
}
```

### 2. 保存代理配置

**接口：** `proxy.saveConfig`

**方法：** `POST`

**参数：**
```typescript
{
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  customProxyList?: string[];
  rotationStrategy: string;
  rotationFrequency: number;
  enableAutoRotation: boolean;
  enableHealthCheck: boolean;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxFailureThreshold: number;
}
```

**响应：**
```typescript
{
  success: boolean;
  message: string;
}
```

### 3. 获取代理池统计

**接口：** `proxy.getPoolStats`

**方法：** `GET`

**响应：**
```typescript
{
  totalProxies: number;
  healthyProxies: number;
  unhealthyProxies: number;
  averageSuccessRate: number;
  averageRiskScore: number;
}
```

### 4. 获取代理列表

**接口：** `proxy.getAllProxies`

**方法：** `GET`

**响应：**
```typescript
{
  proxies: Array<{
    id: string;
    provider: string;
    host: string;
    port: number;
    successCount: number;
    failureCount: number;
    riskScore: number;
    isHealthy: boolean;
    lastUsedAt?: Date;
  }>;
}
```

### 5. 测试代理连接

**接口：** `proxy.testConnection`

**方法：** `POST`

**参数：**
```typescript
{
  host: string;
  port: number;
  username?: string;
  password?: string;
}
```

**响应：**
```typescript
{
  success: boolean;
  message: string;
  latency?: number;
}
```

## 历史记录 API

### 1. 获取使用记录

**接口：** `history.getRecords`

**方法：** `GET`

**参数：**
```typescript
{
  limit?: number;
  offset?: number;
  action?: string;
}
```

**响应：**
```typescript
{
  records: Array<{
    id: number;
    userId: number;
    action: string;
    details?: string;
    createdAt: Date;
  }>;
  total: number;
}
```

### 2. 获取统计摘要

**接口：** `history.getSummary`

**方法：** `GET`

**响应：**
```typescript
{
  totalRegistrations: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalTasks: number;
  completedTasks: number;
  activatedCardKeys: number;
}
```

## 系统 API

### 1. 获取当前用户

**接口：** `auth.me`

**方法：** `GET`

**响应：**
```typescript
{
  id: number;
  openId: string;
  name?: string;
  email?: string;
  role: "user" | "admin";
  createdAt: Date;
}
```

### 2. 登出

**接口：** `auth.logout`

**方法：** `POST`

**响应：**
```typescript
{
  success: boolean;
}
```

### 3. 通知所有者

**接口：** `system.notifyOwner`

**方法：** `POST`

**参数：**
```typescript
{
  title: string;
  content: string;
}
```

**响应：**
```typescript
{
  success: boolean;
}
```

## SSE 实时推送

### 任务进度推送

**端点：** `/api/sse/task/{taskId}`

**事件类型：**

1. **progress** - 任务进度更新
```json
{
  "type": "progress",
  "data": {
    "taskId": 123,
    "progress": 50,
    "successCount": 25,
    "failureCount": 0,
    "totalCount": 50
  }
}
```

2. **log** - 任务日志
```json
{
  "type": "log",
  "data": "开始处理邮箱: user@example.com"
}
```

3. **complete** - 任务完成
```json
{
  "type": "complete",
  "data": {
    "taskId": 123,
    "successCount": 48,
    "failureCount": 2,
    "successRate": 0.96
  }
}
```

4. **error** - 错误信息
```json
{
  "type": "error",
  "data": "代理连接失败"
}
```

## 错误处理

所有 API 都遵循标准的错误响应格式：

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

**常见错误码：**

| 错误码 | 说明 |
|--------|------|
| UNAUTHORIZED | 未授权 |
| FORBIDDEN | 无权限 |
| NOT_FOUND | 资源不存在 |
| INVALID_INPUT | 输入无效 |
| CARD_KEY_INVALID | 卡密无效 |
| CARD_KEY_EXPIRED | 卡密已过期 |
| CARD_KEY_USED_UP | 卡密已用尽 |
| TASK_NOT_FOUND | 任务不存在 |
| PROXY_ERROR | 代理错误 |
| INTERNAL_ERROR | 服务器错误 |

## 速率限制

- 单个用户：100 请求/分钟
- 管理员：500 请求/分钟

## 版本信息

- API 版本：v1
- 最后更新：2026-05-01
