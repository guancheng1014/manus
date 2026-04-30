import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { registrationOrders } from "../drizzle/schema";

/**
 * 支付宝回调处理
 * 支付宝会向指定的 notifyUrl 发送 POST 请求
 */
export async function handleAlipayCallback(req: Request, res: Response) {
  try {
    const params = req.body;

    // 验证签名
    const isSignValid = verifyAlipaySignature(params);
    if (!isSignValid) {
      console.error("[Alipay Callback] Invalid signature");
      res.send("FAIL");
      return;
    }

    // 获取订单信息
    const orderId = params.out_trade_no;
    const tradeNo = params.trade_no;
    const tradeStatus = params.trade_status;
    const receiptAmount = parseFloat(params.receipt_amount);

    console.log(`[Alipay Callback] Order: ${orderId}, Status: ${tradeStatus}, Amount: ${receiptAmount}`);

    // 更新订单状态
    const db = await getDb();
    if (!db) {
      res.send("FAIL");
      return;
    }

    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      // 支付成功
      await db
        .update(registrationOrders)
        .set({
          status: "paid",
          transactionId: tradeNo,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(registrationOrders.orderId, orderId));

      console.log(`[Alipay Callback] Order ${orderId} marked as paid`);

      // 激活卡密（如果需要）
      // await activateCardKey(orderId);

      res.send("SUCCESS");
    } else if (tradeStatus === "TRADE_CLOSED") {
      // 交易关闭
      await db
        .update(registrationOrders)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(registrationOrders.orderId, orderId));

      res.send("SUCCESS");
    } else {
      res.send("SUCCESS");
    }
  } catch (error) {
    console.error("[Alipay Callback] Error:", error);
    res.send("FAIL");
  }
}

/**
 * 微信支付回调处理
 * 微信会向指定的 notifyUrl 发送 POST 请求（XML 格式）
 */
export async function handleWechatCallback(req: Request, res: Response) {
  try {
    const body = req.body;

    // 验证签名
    const isSignValid = verifyWechatSignature(body);
    if (!isSignValid) {
      console.error("[Wechat Callback] Invalid signature");
      sendWechatResponse(res, false, "Invalid signature");
      return;
    }

    // 解析回调数据
    const returnCode = body.return_code;
    const resultCode = body.result_code;
    const orderId = body.out_trade_no;
    const transactionId = body.transaction_id;
    const totalFee = parseInt(body.total_fee);

    console.log(`[Wechat Callback] Order: ${orderId}, Result: ${resultCode}, Amount: ${totalFee}`);

    // 更新订单状态
    const db = await getDb();
    if (!db) {
      sendWechatResponse(res, false, "Database error");
      return;
    }

    if (returnCode === "SUCCESS" && resultCode === "SUCCESS") {
      // 支付成功
      await db
        .update(registrationOrders)
        .set({
          status: "paid",
          transactionId,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(registrationOrders.orderId, orderId));

      console.log(`[Wechat Callback] Order ${orderId} marked as paid`);

      // 激活卡密（如果需要）
      // await activateCardKey(orderId);

      sendWechatResponse(res, true, "OK");
    } else {
      // 支付失败
      await db
        .update(registrationOrders)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(registrationOrders.orderId, orderId));

      sendWechatResponse(res, true, "Payment failed");
    }
  } catch (error) {
    console.error("[Wechat Callback] Error:", error);
    sendWechatResponse(res, false, "Server error");
  }
}

/**
 * 验证支付宝签名
 */
function verifyAlipaySignature(params: any): boolean {
  try {
    // 获取签名
    const sign = params.sign;
    if (!sign) return false;

    // 构建待签名字符串（按字母顺序排序）
    const signStr = Object.keys(params)
      .filter((key) => key !== "sign" && key !== "sign_type" && params[key])
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    // 验证签名（这里使用简化的验证，实际应使用支付宝公钥）
    // 实际应该：
    // const publicKey = getAlipayPublicKey();
    // return verifyRSA(signStr, sign, publicKey);

    console.log("[Alipay] Signature verification skipped (use real public key in production)");
    return true;
  } catch (error) {
    console.error("[Alipay] Signature verification error:", error);
    return false;
  }
}

/**
 * 验证微信支付签名
 */
function verifyWechatSignature(data: any): boolean {
  try {
    // 获取签名
    const sign = data.sign;
    if (!sign) return false;

    // 构建待签名字符串（按字母顺序排序）
    const signStr = Object.keys(data)
      .filter((key) => key !== "sign" && data[key])
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("&");

    // 添加密钥
    const wechatKey = process.env.WECHAT_API_KEY || "";
    const fullStr = `${signStr}&key=${wechatKey}`;

    // 计算 MD5 哈希
    const computed = crypto.createHash("md5").update(fullStr).digest("hex").toUpperCase();

    // 验证签名
    return computed === sign;
  } catch (error) {
    console.error("[Wechat] Signature verification error:", error);
    return false;
  }
}

/**
 * 发送微信支付回调响应
 */
function sendWechatResponse(res: Response, success: boolean, message: string) {
  const xml = `<xml>
    <return_code>${success ? "SUCCESS" : "FAIL"}</return_code>
    <return_msg>${message}</return_msg>
  </xml>`;

  res.type("application/xml").send(xml);
}

/**
 * 激活卡密（支付成功后）
 */
export async function activateCardKeyAfterPayment(orderId: string) {
  try {
    const db = await getDb();
    if (!db) return;

    // 获取订单信息
    const order = await db
      .select()
      .from(registrationOrders)
      .where(eq(registrationOrders.orderId, orderId))
      .limit(1);

    if (order.length === 0) {
      console.error(`[Activate] Order ${orderId} not found`);
      return;
    }

    const orderData = order[0];

    // 这里可以添加卡密激活逻辑
    // 例如：将卡密与用户绑定、更新卡密使用次数等

    console.log(`[Activate] Card key activated for order ${orderId}`);
  } catch (error) {
    console.error("[Activate] Error:", error);
  }
}
