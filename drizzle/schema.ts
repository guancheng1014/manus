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
  proxyApiUrl: text("proxyApiUrl").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProxyConfig = typeof proxyConfigs.$inferSelect;
export type InsertProxyConfig = typeof proxyConfigs.$inferInsert;