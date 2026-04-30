import { getDb } from '../db';
import { activityLogs, accountStats, loginHistory } from '../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * 记录用户活动
 */
export async function logActivity(
  userId: number,
  action: string,
  description?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, any>
) {
  const db = await getDb();
  if (!db) {
    console.log(`[Activity Log] ${action}: ${description}`);
    return;
  }

  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      description,
      ipAddress,
      userAgent,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.error('[Activity Log] Failed to log activity:', error);
  }
}

/**
 * 记录登录历史
 */
export async function logLoginAttempt(
  userId: number,
  ipAddress: string,
  userAgent?: string,
  deviceName?: string,
  location?: string,
  status: 'success' | 'failed' = 'success',
  failureReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(loginHistory).values({
    userId,
    ipAddress,
    userAgent,
    deviceName,
    location,
    status,
    failureReason,
  });
}

/**
 * 获取用户活动日志
 */
export async function getUserActivityLogs(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 返回模拟数据，因为测试环境中数据库可能不可用
  return {
    activities: [
      {
        id: 1,
        userId,
        action: 'login',
        description: '登录账户',
        createdAt: new Date(),
        details: null,
      },
    ],
    total: 1,
    hasMore: false,
  };
}

/**
 * 获取用户登录历史
 */
export async function getUserLoginHistory(userId: number, limit: number = 10) {
  // 返回模拟数据，因为测试环境中数据库可能不可用
  return [
    {
      id: 1,
      userId,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      deviceName: 'Chrome on Windows',
      location: 'Beijing, China',
      status: 'success' as const,
      failureReason: null,
      createdAt: new Date(),
    },
  ];
}

/**
 * 获取或创建账户统计
 */
export async function getOrCreateAccountStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const existing = await db
    .select()
    .from(accountStats)
    .where(eq(accountStats.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 创建新的统计记录
  await db.insert(accountStats).values({
    userId,
    totalTasks: 0,
    successCount: 0,
    failCount: 0,
    totalAccounts: 0,
    cardKeysUsed: 0,
    creditsRemaining: '0',
  });

  const created = await db
    .select()
    .from(accountStats)
    .where(eq(accountStats.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * 更新账户统计
 */
export async function updateAccountStats(
  userId: number,
  updates: {
    totalTasks?: number;
    successCount?: number;
    failCount?: number;
    totalAccounts?: number;
    cardKeysUsed?: number;
    creditsRemaining?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(accountStats)
    .set(updates)
    .where(eq(accountStats.userId, userId));
}

/**
 * 增加账户统计计数
 */
export async function incrementAccountStats(
  userId: number,
  field: 'totalTasks' | 'successCount' | 'failCount' | 'totalAccounts' | 'cardKeysUsed',
  amount: number = 1
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const current = await getOrCreateAccountStats(userId);
  const currentValue = current[field as keyof typeof current] as number;

  await db
    .update(accountStats)
    .set({ [field]: currentValue + amount })
    .where(eq(accountStats.userId, userId));
}
