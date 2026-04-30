import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========== 卡密表 ==========
export const cardKeys = mysqlTable("card_keys", {
  id: int("id").autoincrement().primaryKey(),
  keyCode: varchar("keyCode", { length: 64 }).notNull().unique(), // 卡密码
  maxUses: int("maxUses").notNull().default(1), // 最大使用次数
  usedCount: int("usedCount").notNull().default(0), // 已使用次数
  expiresAt: timestamp("expiresAt"), // 过期时间
  status: mysqlEnum("status", ["active", "used", "expired", "disabled"]).default("active").notNull(),
  createdBy: int("createdBy").notNull(), // 创建者 ID (管理员)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardKey = typeof cardKeys.$inferSelect;
export type InsertCardKey = typeof cardKeys.$inferInsert;

// ========== 用户卡密绑定表 ==========
export const userCardBindings = mysqlTable("user_card_bindings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardKeyId: int("cardKeyId").notNull(),
  activatedAt: timestamp("activatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCardBinding = typeof userCardBindings.$inferSelect;
export type InsertUserCardBinding = typeof userCardBindings.$inferInsert;

// ========== 注册任务表 ==========
export const registrationTasks = mysqlTable("registration_tasks", {
  id: varchar("id", { length: 32 }).primaryKey(), // 任务 ID
  userId: int("userId").notNull(),
  taskName: varchar("taskName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "running", "completed", "cancelled", "failed"]).default("pending").notNull(),
  totalAccounts: int("totalAccounts").notNull(),
  successCount: int("successCount").notNull().default(0),
  failCount: int("failCount").notNull().default(0),
  concurrency: int("concurrency").notNull().default(5),
  taskType: mysqlEnum("taskType", ["single", "batch"]).notNull(),
  proxyApiUrl: text("proxyApiUrl"),
  yesCaptchaKey: varchar("yesCaptchaKey", { length: 255 }),
  inviteCode: varchar("inviteCode", { length: 255 }),
  utmSource: varchar("utmSource", { length: 255 }).default("invitation"),
  utmMedium: varchar("utmMedium", { length: 255 }).default("social"),
  utmCampaign: varchar("utmCampaign", { length: 255 }).default("copy_link"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type RegistrationTask = typeof registrationTasks.$inferSelect;
export type InsertRegistrationTask = typeof registrationTasks.$inferInsert;

// ========== 注册结果表 ==========
export const registrationResults = mysqlTable("registration_results", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
  token: text("token"),
  success: boolean("success").notNull().default(false),
  errorMessage: text("errorMessage"),
  logs: text("logs"), // JSON 格式的详细日志
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RegistrationResult = typeof registrationResults.$inferSelect;
export type InsertRegistrationResult = typeof registrationResults.$inferInsert;

// ========== 用户使用记录表 ==========
export const usageRecords = mysqlTable("usage_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // 'register', 'task_create', 'export', etc.
  taskId: varchar("taskId", { length: 32 }),
  details: text("details"), // JSON 格式的详细信息
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageRecord = typeof usageRecords.$inferSelect;
export type InsertUsageRecord = typeof usageRecords.$inferInsert;

// ========== 代理配置表 ==========
export const proxyConfigs = mysqlTable("proxy_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["luminati", "oxylabs", "smartproxy", "custom"]).notNull(),
  apiKey: varchar("apiKey", { length: 512 }),
  apiSecret: varchar("apiSecret", { length: 512 }),
  customProxyList: text("customProxyList"),
  rotationStrategy: mysqlEnum("rotationStrategy", ["round_robin", "random", "weighted", "adaptive"]).default("round_robin").notNull(),
  rotationFrequency: int("rotationFrequency").notNull().default(10),
  healthCheckInterval: int("healthCheckInterval").notNull().default(5),
  healthCheckTimeout: int("healthCheckTimeout").notNull().default(10),
  enableAutoRotation: boolean("enableAutoRotation").notNull().default(true),
  enableHealthCheck: boolean("enableHealthCheck").notNull().default(true),
  maxFailureThreshold: int("maxFailureThreshold").notNull().default(3),
  proxyApiUrl: text("proxyApiUrl"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProxyConfig = typeof proxyConfigs.$inferSelect;
export type InsertProxyConfig = typeof proxyConfigs.$inferInsert;

// ========== 订单表 ==========
export const registrationOrders = mysqlTable("registration_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull().unique(), // 订单号
  userId: int("userId").notNull(),
  cardKeyId: int("cardKeyId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"), // 金额
  paymentMethod: mysqlEnum("paymentMethod", ["alipay", "wechat"]).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 128 }), // 第三方交易号
  quantity: int("quantity").notNull().default(1), // 购买数量
  paidAt: timestamp("paidAt"), // 支付时间
  refundedAt: timestamp("refundedAt"), // 退款时间
  refundReason: text("refundReason"), // 退款原因
  notes: text("notes"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RegistrationOrder = typeof registrationOrders.$inferSelect;
export type InsertRegistrationOrder = typeof registrationOrders.$inferInsert;

// ========== API 密钥表 ==========
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // 密钥名称
  keyHash: varchar("keyHash", { length: 255 }).notNull(), // 密钥哈希值
  keyPrefix: varchar("keyPrefix", { length: 20 }).notNull(), // 密钥前缀（用于显示）
  status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ========== 用户通知设置表 ==========
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailTaskCompleted: boolean("emailTaskCompleted").notNull().default(true),
  emailTaskFailed: boolean("emailTaskFailed").notNull().default(true),
  emailCardKeyExpiring: boolean("emailCardKeyExpiring").notNull().default(true),
  emailSystemAnnouncements: boolean("emailSystemAnnouncements").notNull().default(true),
  emailWeeklyReport: boolean("emailWeeklyReport").notNull().default(false),
  inAppTaskCompleted: boolean("inAppTaskCompleted").notNull().default(true),
  inAppTaskFailed: boolean("inAppTaskFailed").notNull().default(true),
  inAppCardKeyExpiring: boolean("inAppCardKeyExpiring").notNull().default(true),
  inAppSystemAnnouncements: boolean("inAppSystemAnnouncements").notNull().default(true),
  smsTaskFailed: boolean("smsTaskFailed").notNull().default(false),
  smsCardKeyExpiring: boolean("smsCardKeyExpiring").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

// ========== 用户安全设置表 ==========
export const securitySettings = mysqlTable("security_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }), // TOTP 密钥
  lastPasswordChangeAt: timestamp("lastPasswordChangeAt"),
  passwordHash: varchar("passwordHash", { length: 255 }), // 密码哈希
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecuritySetting = typeof securitySettings.$inferSelect;
export type InsertSecuritySetting = typeof securitySettings.$inferInsert;

// ========== 用户登录历史表 ==========
export const loginHistory = mysqlTable("login_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(), // 支持 IPv4 和 IPv6
  userAgent: text("userAgent"),
  deviceName: varchar("deviceName", { length: 255 }),
  location: varchar("location", { length: 255 }),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = typeof loginHistory.$inferInsert;

// ========== 用户活动日志表 ==========
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // 'login', 'profile_update', 'password_change', 'task_create', etc.
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  details: text("details"), // JSON 格式的详细信息
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ========== 用户账户统计表 ==========
export const accountStats = mysqlTable("account_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalTasks: int("totalTasks").notNull().default(0),
  successCount: int("successCount").notNull().default(0),
  failCount: int("failCount").notNull().default(0),
  totalAccounts: int("totalAccounts").notNull().default(0),
  cardKeysUsed: int("cardKeysUsed").notNull().default(0),
  creditsRemaining: decimal("creditsRemaining", { precision: 10, scale: 2 }).notNull().default("0"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow(),
});

export type AccountStat = typeof accountStats.$inferSelect;
export type InsertAccountStat = typeof accountStats.$inferInsert;


// ========== 支付参数配置表 ==========
export const paymentConfigs = mysqlTable("payment_configs", {
  id: int("id").autoincrement().primaryKey(),
  paymentMethod: mysqlEnum("paymentMethod", ["alipay", "wechat"]).notNull().unique(), // 支付方式
  appId: varchar("appId", { length: 256 }).notNull(), // 应用ID
  appSecret: varchar("appSecret", { length: 512 }).notNull(), // 应用密钥（加密存储）
  merchantId: varchar("merchantId", { length: 256 }), // 商户ID
  merchantKey: varchar("merchantKey", { length: 512 }), // 商户密钥（加密存储）
  publicKey: text("publicKey"), // 公钥
  privateKey: text("privateKey"), // 私钥（加密存储）
  notifyUrl: varchar("notifyUrl", { length: 512 }), // 回调URL
  returnUrl: varchar("returnUrl", { length: 512 }), // 返回URL
  isEnabled: boolean("isEnabled").default(false).notNull(), // 是否启用
  testMode: boolean("testMode").default(true).notNull(), // 是否测试模式
  config: text("config"), // 其他配置参数（JSON格式）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentConfig = typeof paymentConfigs.$inferSelect;
export type InsertPaymentConfig = typeof paymentConfigs.$inferInsert;
