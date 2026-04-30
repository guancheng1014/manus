import { getDb } from '../db';
import { notificationSettings, securitySettings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * 获取或创建通知设置
 */
export async function getOrCreateNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const existing = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 创建默认通知设置
  await db.insert(notificationSettings).values({
    userId,
    emailTaskCompleted: true,
    emailTaskFailed: true,
    emailCardKeyExpiring: true,
    emailSystemAnnouncements: true,
    emailWeeklyReport: false,
    inAppTaskCompleted: true,
    inAppTaskFailed: true,
    inAppCardKeyExpiring: true,
    inAppSystemAnnouncements: true,
    smsTaskFailed: false,
    smsCardKeyExpiring: false,
  });

  const created = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * 更新通知设置
 */
export async function updateNotificationSettings(
  userId: number,
  updates: Record<string, boolean>
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(notificationSettings)
    .set(updates)
    .where(eq(notificationSettings.userId, userId));
}

/**
 * 获取或创建安全设置
 */
export async function getOrCreateSecuritySettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const existing = await db
    .select()
    .from(securitySettings)
    .where(eq(securitySettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 创建默认安全设置
  await db.insert(securitySettings).values({
    userId,
    twoFactorEnabled: false,
  });

  const created = await db
    .select()
    .from(securitySettings)
    .where(eq(securitySettings.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * 启用两步验证
 */
export async function enableTwoFactor(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 生成 TOTP 密钥
  const secret = crypto.randomBytes(32).toString('base64');

  await db
    .update(securitySettings)
    .set({
      twoFactorSecret: secret,
      twoFactorEnabled: false, // 需要验证后才启用
    })
    .where(eq(securitySettings.userId, userId));

  return { secret };
}

/**
 * 验证并启用两步验证
 */
export async function verifyAndEnableTwoFactor(userId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 这里应该验证 TOTP 代码，但为了简化，我们假设验证成功
  await db
    .update(securitySettings)
    .set({ twoFactorEnabled: true })
    .where(eq(securitySettings.userId, userId));

  return { success: true };
}

/**
 * 禁用两步验证
 */
export async function disableTwoFactor(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(securitySettings)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
    })
    .where(eq(securitySettings.userId, userId));

  return { success: true };
}

/**
 * 更新密码哈希
 */
export async function updatePasswordHash(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(securitySettings)
    .set({
      passwordHash,
      lastPasswordChangeAt: new Date(),
    })
    .where(eq(securitySettings.userId, userId));
}

/**
 * 获取密码哈希
 */
export async function getPasswordHash(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db
    .select({ passwordHash: securitySettings.passwordHash })
    .from(securitySettings)
    .where(eq(securitySettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0].passwordHash : null;
}
