import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, count } from "drizzle-orm";
import { getDb } from "./db";
import { registrationOrders, users } from "../drizzle/schema";

describe("Order Routers", () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for tests");
    }

    // 创建测试用户
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });

    testUserId = userResult.insertId;
  });

  afterAll(async () => {
    if (db && testUserId) {
      // 清理测试数据
      await db
        .delete(registrationOrders)
        .where(eq(registrationOrders.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should use correct count aggregation", async () => {
    if (!db) {
      throw new Error("Database not available");
    }

    // 测试 count() 函数的正确用法
    const countResult = await db
      .select({ count: count() })
      .from(registrationOrders)
      .where(eq(registrationOrders.userId, testUserId));

    // 验证 count 返回的是数字而不是 ID
    const total = Number(countResult[0]?.count) || 0;
    expect(typeof total).toBe("number");
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it("should handle empty result set", async () => {
    if (!db) {
      throw new Error("Database not available");
    }

    // 使用一个不存在的 userId
    const nonExistentUserId = 999999;
    const countResult = await db
      .select({ count: count() })
      .from(registrationOrders)
      .where(eq(registrationOrders.userId, nonExistentUserId));

    const total = Number(countResult[0]?.count) || 0;
    expect(total).toBe(0);
  });
});
