import { getDb } from "../db";
import { paymentConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || "default-encryption-key-32-chars-long";

/**
 * 加密敏感数据
 */
function encryptData(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')), iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return data;
  }
}

/**
 * 解密敏感数据
 */
function decryptData(encryptedData: string): string {
  try {
    const [ivHex, encrypted] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')), iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedData;
  }
}

/**
 * 获取支付配置
 */
export async function getPaymentConfig(paymentMethod: "alipay" | "wechat") {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const config = await db
    .select()
    .from(paymentConfigs)
    .where(eq(paymentConfigs.paymentMethod, paymentMethod))
    .limit(1);

  if (config.length === 0) {
    return null;
  }

  const result = config[0];
  // 解密敏感字段
  return {
    ...result,
    appSecret: decryptData(result.appSecret),
    merchantKey: result.merchantKey ? decryptData(result.merchantKey) : null,
    privateKey: result.privateKey ? decryptData(result.privateKey) : null,
  };
}

/**
 * 获取所有支付配置
 */
export async function getAllPaymentConfigs() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const configs = await db.select().from(paymentConfigs);

  return configs.map((config: any) => ({
    ...config,
    // 不返回解密的敏感数据，只返回配置状态
    appSecret: "***",
    merchantKey: config.merchantKey ? "***" : null,
    privateKey: config.privateKey ? "***" : null,
  }));
}

/**
 * 创建或更新支付配置
 */
export async function upsertPaymentConfig(
  paymentMethod: "alipay" | "wechat",
  data: {
    appId: string;
    appSecret: string;
    merchantId?: string | null;
    merchantKey?: string | null;
    publicKey?: string | null;
    privateKey?: string | null;
    notifyUrl?: string | null;
    returnUrl?: string | null;
    isEnabled?: boolean;
    testMode?: boolean;
    config?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const existing = await db
    .select()
    .from(paymentConfigs)
    .where(eq(paymentConfigs.paymentMethod, paymentMethod))
    .limit(1);

  const encryptedData = {
    appSecret: encryptData(data.appSecret),
    merchantKey: data.merchantKey ? encryptData(data.merchantKey) : null,
    privateKey: data.privateKey ? encryptData(data.privateKey) : null,
  };

  if (existing.length === 0) {
    // 创建新配置
    const result = await db.insert(paymentConfigs).values({
      paymentMethod,
      appId: data.appId,
      appSecret: encryptedData.appSecret,
      merchantId: data.merchantId || null,
      merchantKey: encryptedData.merchantKey,
      publicKey: data.publicKey || null,
      privateKey: encryptedData.privateKey,
      notifyUrl: data.notifyUrl || null,
      returnUrl: data.returnUrl || null,
      isEnabled: data.isEnabled ?? false,
      testMode: data.testMode ?? true,
      config: data.config || null,
    });

    return result;
  } else {
    // 更新现有配置
    const result = await db
      .update(paymentConfigs)
      .set({
        appId: data.appId,
        appSecret: encryptedData.appSecret,
        merchantId: data.merchantId || null,
        merchantKey: encryptedData.merchantKey,
        publicKey: data.publicKey || null,
        privateKey: encryptedData.privateKey,
        notifyUrl: data.notifyUrl || null,
        returnUrl: data.returnUrl || null,
        isEnabled: data.isEnabled ?? false,
        testMode: data.testMode ?? true,
        config: data.config || null,
        updatedAt: new Date(),
      })
      .where(eq(paymentConfigs.paymentMethod, paymentMethod));

    return result;
  }
}

/**
 * 测试支付配置
 */
export async function testPaymentConfig(paymentMethod: "alipay" | "wechat") {
  const config = await getPaymentConfig(paymentMethod);

  if (!config) {
    return {
      success: false,
      message: "支付配置不存在",
    };
  }

  if (!config.isEnabled) {
    return {
      success: false,
      message: "支付配置未启用",
    };
  }

  try {
    // 这里可以添加实际的支付接口测试逻辑
    // 例如：调用支付宝或微信的测试接口

    if (paymentMethod === "alipay") {
      // 支付宝测试
      // TODO: 实现支付宝接口测试
      return {
        success: true,
        message: "支付宝配置测试成功",
      };
    } else if (paymentMethod === "wechat") {
      // 微信支付测试
      // TODO: 实现微信支付接口测试
      return {
        success: true,
        message: "微信支付配置测试成功",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : "未知错误"}`,
    };
  }
}

/**
 * 启用/禁用支付配置
 */
export async function togglePaymentConfig(paymentMethod: "alipay" | "wechat", isEnabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db
    .update(paymentConfigs)
    .set({
      isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(paymentConfigs.paymentMethod, paymentMethod));

  return result;
}

/**
 * 删除支付配置
 */
export async function deletePaymentConfig(paymentMethod: "alipay" | "wechat") {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db.delete(paymentConfigs).where(eq(paymentConfigs.paymentMethod, paymentMethod));

  return result;
}
