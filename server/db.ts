import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, cardKeys, userCardBindings, registrationTasks, registrationResults, usageRecords, proxyConfigs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
    }
  }
  return _db;
}

// 导出 Proxy 以支持延迟初始化
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop, receiver) {
    const database = initDb();
    if (!database) {
      throw new Error("Database not initialized. Check DATABASE_URL.");
    }
    return Reflect.get(database, prop, receiver);
  }
});

export async function getDb() {
  return initDb();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      ...user
    };
    
    // 如果没有 openId，我们假设使用 email 作为唯一标识
    const uniqueCondition = user.openId 
      ? eq(users.openId, user.openId) 
      : (user.email ? eq(users.email, user.email) : null);

    if (!uniqueCondition) {
      throw new Error("Either openId or email is required for upsertUser");
    }

    // 检查用户是否存在
    const existing = await db.select().from(users).where(uniqueCondition).limit(1);

    if (existing.length > 0) {
      // 更新
      const { id, ...updateData } = values;
      await db.update(users).set({
        ...updateData,
        updatedAt: new Date()
      }).where(uniqueCondition);
    } else {
      // 插入
      if (!values.openId) {
        // 为本地用户生成一个伪 openId
        values.openId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      if (!values.lastSignedIn) {
        values.lastSignedIn = new Date();
      }
      await db.insert(users).values(values as any);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== 卡密相关查询 ==========

export async function getCardKeyByCode(keyCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cardKeys).where(eq(cardKeys.keyCode, keyCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function validateCardKey(keyCode: string) {
  const key = await getCardKeyByCode(keyCode);
  if (!key) return { valid: false, error: "卡密不存在" };
  if (key.status !== "active") return { valid: false, error: "卡密已失效" };
  if (key.expiresAt && new Date() > key.expiresAt) return { valid: false, error: "卡密已过期" };
  if (key.usedCount >= key.maxUses) return { valid: false, error: "卡密使用次数已满" };
  return { valid: true, key };
}

export async function activateCardKey(keyCode: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const validation = await validateCardKey(keyCode);
  if (!validation.valid) throw new Error(validation.error);

  const key = validation.key!;

  // 绑定卡密到用户
  await db.insert(userCardBindings).values({
    userId,
    cardKeyId: key.id,
  });

  // 更新卡密使用次数
  await db.update(cardKeys).set({
    usedCount: key.usedCount + 1,
    status: key.usedCount + 1 >= key.maxUses ? "used" : "active",
  }).where(eq(cardKeys.id, key.id));

  return key;
}

export async function createCardKey(keyCode: string, maxUses: number, expiresAt: Date | null, createdBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cardKeys).values({
    keyCode,
    maxUses,
    expiresAt,
    createdBy,
  });

  return result;
}

export async function getAllCardKeys() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cardKeys).orderBy(desc(cardKeys.createdAt));
}

export async function getUserCardBindings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userCardBindings).where(eq(userCardBindings.userId, userId));
}

// ========== 注册任务相关查询 ==========

export async function createRegistrationTask(task: typeof registrationTasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(registrationTasks).values(task);
}

export async function getRegistrationTask(taskId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(registrationTasks).where(eq(registrationTasks.id, taskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserRegistrationTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(registrationTasks).where(eq(registrationTasks.userId, userId)).orderBy(desc(registrationTasks.createdAt));
}

export async function updateRegistrationTask(taskId: string, updates: Partial<typeof registrationTasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(registrationTasks).set(updates).where(eq(registrationTasks.id, taskId));
}

// ========== 注册结果相关查询 ==========

export async function createRegistrationResult(result: typeof registrationResults.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(registrationResults).values(result);
}

export async function getTaskResults(taskId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(registrationResults).where(eq(registrationResults.taskId, taskId));
}

export async function getSuccessfulResults(taskId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(registrationResults).where(
    and(eq(registrationResults.taskId, taskId), eq(registrationResults.success, true))
  );
}

// ========== 使用记录相关查询 ==========

export async function createUsageRecord(userId: number, action: string, taskId?: string, details?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(usageRecords).values({
    userId,
    action,
    taskId,
    details: details ? JSON.stringify(details) : null,
  });
}

export async function getUserUsageRecords(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(usageRecords).where(eq(usageRecords.userId, userId)).orderBy(desc(usageRecords.createdAt)).limit(limit);
}

// ========== 代理配置相关查询 ==========

export async function getUserProxyConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(proxyConfigs).where(
    and(eq(proxyConfigs.userId, userId), eq(proxyConfigs.isActive, true))
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateProxyConfig(userId: number, config: Partial<typeof proxyConfigs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(proxyConfigs).where(eq(proxyConfigs.userId, userId)).limit(1);
  
  if (existing && existing.length > 0) {
    await db.update(proxyConfigs).set(config).where(eq(proxyConfigs.userId, userId));
  } else {
    await db.insert(proxyConfigs).values({
      userId,
      provider: "custom",
      ...config,
    });
  }
}

// ========== 统计相关查询 ==========

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return null;

  const totalTasks = await db.select().from(registrationTasks);
  const totalResults = await db.select().from(registrationResults);
  const successResults = await db.select().from(registrationResults).where(eq(registrationResults.success, true));

  return {
    totalTasks: totalTasks.length,
    totalAccounts: totalResults.length,
    successAccounts: successResults.length,
    successRate: totalResults.length > 0 ? (successResults.length / totalResults.length * 100).toFixed(2) : "0.00",
  };
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userTasks = await db.select().from(registrationTasks).where(eq(registrationTasks.userId, userId));
  const userResults = await db.select().from(registrationResults).where(
    eq(registrationResults.taskId, userTasks[0]?.id || "")
  );

  return {
    totalTasks: userTasks.length,
    totalAccounts: userResults.length,
    successAccounts: userResults.filter(r => r.success).length,
  };
}
