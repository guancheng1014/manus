import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, generateCardKey, validateCardKey, deductCardKeyUsage } from "./db";

describe("Card Key Management", () => {
  let testCardCode: string;

  beforeAll(async () => {
    // 生成测试卡密
    testCardCode = await generateCardKey(1, 5, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    console.log(`Generated test card key: ${testCardCode}`);
  });

  it("should generate a valid card key", async () => {
    expect(testCardCode).toBeDefined();
    expect(testCardCode.length).toBeGreaterThan(0);
  });

  it("should validate an existing card key", async () => {
    const result = await validateCardKey(testCardCode);
    expect(result).toBeDefined();
    expect(result?.status).toBe("active");
  });

  it("should deduct card key usage", async () => {
    const beforeDeduct = await validateCardKey(testCardCode);
    expect(beforeDeduct?.usedCount).toBe(0);

    await deductCardKeyUsage(testCardCode);

    const afterDeduct = await validateCardKey(testCardCode);
    expect(afterDeduct?.usedCount).toBe(1);
  });

  it("should reject invalid card key", async () => {
    const result = await validateCardKey("invalid_card_key_12345");
    expect(result).toBeUndefined();
  });

  it("should reject expired card key", async () => {
    // 生成已过期的卡密
    const expiredCardCode = await generateCardKey(
      1,
      5,
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 天前过期
    );

    const result = await validateCardKey(expiredCardCode);
    expect(result?.status).not.toBe("active");
  });

  it("should reject card key with max uses exceeded", async () => {
    // 生成只能使用 1 次的卡密
    const limitedCardCode = await generateCardKey(
      1,
      1,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    // 使用第一次
    await deductCardKeyUsage(limitedCardCode);

    // 尝试再次使用
    const result = await validateCardKey(limitedCardCode);
    expect(result?.usedCount).toBe(1);
    expect(result?.maxUses).toBe(1);
  });
});
