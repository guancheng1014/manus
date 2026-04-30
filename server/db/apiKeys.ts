import { getDb } from '../db';
import { apiKeys } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * 生成 API 密钥
 */
export function generateApiKey(): { key: string; prefix: string } {
  const key = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = key.substring(0, 20); // sk_live_xxxx
  return { key, prefix };
}

/**
 * 创建 API 密钥
 */
export async function createApiKey(userId: number, name: string, expiresAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const { key, prefix } = generateApiKey();
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  await db.insert(apiKeys).values({
    userId,
    name,
    keyHash,
    keyPrefix: prefix,
    expiresAt,
  });

  return {
    key, // 只在创建时返回完整密钥
    prefix,
    name,
  };
}

/**
 * 获取用户的所有 API 密钥
 */
export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      status: apiKeys.status,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);

  return keys;
}

/**
 * 验证 API 密钥
 */
export async function verifyApiKey(key: string): Promise<{ userId: number; keyId: number } | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const result = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      status: apiKeys.status,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, 'active')))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const apiKey = result[0];

  // 检查过期时间
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return null;
  }

  return {
    userId: apiKey.userId,
    keyId: apiKey.id,
  };
}

/**
 * 撤销 API 密钥
 */
export async function revokeApiKey(userId: number, keyId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(apiKeys)
    .set({ status: 'revoked' })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

/**
 * 更新 API 密钥最后使用时间
 */
export async function updateApiKeyLastUsed(keyId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}
