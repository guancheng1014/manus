import { describe, it, expect, beforeAll } from "vitest";
import { createCardKey, getCardKeyByCode, activateCardKey } from "./db";

describe("Card Key Management", () => {
  let testCardCode: string;

  beforeAll(async () => {
    // 生成测试卡密
    testCardCode = `TEST_CARD_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    await createCardKey(testCardCode, 5, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 1);
    console.log(`Generated test card key: ${testCardCode}`);
  });

  it("should generate a valid card key", async () => {
    expect(testCardCode).toBeDefined();
    expect(testCardCode.length).toBeGreaterThan(0);
  });

  it("should retrieve an existing card key", async () => {
    const result = await getCardKeyByCode(testCardCode);
    expect(result).toBeDefined();
    expect(result?.status).toBe("active");
  });

  it("should have correct max uses", async () => {
    const result = await getCardKeyByCode(testCardCode);
    expect(result?.maxUses).toBe(5);
  });

  it("should reject invalid card key", async () => {
    const result = await getCardKeyByCode("invalid_card_key_12345");
    expect(result).toBeUndefined();
  });

  it("should have correct initial used count", async () => {
    const result = await getCardKeyByCode(testCardCode);
    expect(result?.usedCount).toBe(0);
  });

  it("should activate card key for user", async () => {
    const result = await activateCardKey(testCardCode, 1);
    expect(result).toBeDefined();
    expect(result.keyCode).toBe(testCardCode);
  });
});
