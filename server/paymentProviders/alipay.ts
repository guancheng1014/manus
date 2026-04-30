import crypto from "crypto";
import axios from "axios";

/**
 * 支付宝支付模块
 * 支持支付宝 PC 支付、手机网页支付、APP 支付
 */

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  publicKey: string;
  gatewayUrl: string; // 支付宝网关地址
  notifyUrl: string; // 异步通知地址
  returnUrl: string; // 同步返回地址
}

export interface AlipayOrder {
  outTradeNo: string; // 商户订单号
  totalAmount: number; // 总金额
  subject: string; // 订单标题
  body?: string; // 订单描述
  productCode?: string; // 销售产品码
}

export interface AlipayPaymentResult {
  success: boolean;
  tradeNo?: string; // 支付宝交易号
  outTradeNo?: string; // 商户订单号
  buyerLogonId?: string; // 买家账户
  totalAmount?: number;
  receiptAmount?: number;
  error?: string;
}

export class AlipayPaymentProvider {
  private config: AlipayConfig;

  constructor(config: AlipayConfig) {
    this.config = config;
  }

  /**
   * 生成签名
   */
  private sign(data: string): string {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(data, "utf8");
    return sign.sign(this.config.privateKey, "base64");
  }

  /**
   * 验证签名
   */
  private verifySign(data: string, sign: string): boolean {
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(data, "utf8");
    return verify.verify(this.config.publicKey, sign, "base64");
  }

  /**
   * 生成订单参数
   */
  private buildOrderParams(order: AlipayOrder, bizContent: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {
      app_id: this.config.appId,
      method: "alipay.trade.page.pay",
      format: "JSON",
      return_url: this.config.returnUrl,
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      version: "1.0",
      notify_url: this.config.notifyUrl,
      biz_content: JSON.stringify(bizContent),
    };

    return params;
  }

  /**
   * 生成订单签名字符串
   */
  private buildSignString(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const signParts: string[] = [];

    for (const key of sortedKeys) {
      if (params[key] && key !== "sign") {
        signParts.push(`${key}=${params[key]}`);
      }
    }

    return signParts.join("&");
  }

  /**
   * 创建支付链接（PC 网页支付）
   */
  async createPagePayment(order: AlipayOrder): Promise<string> {
    const bizContent = {
      out_trade_no: order.outTradeNo,
      product_code: order.productCode || "FAST_INSTANT_TRADE_PAY",
      total_amount: order.totalAmount.toFixed(2),
      subject: order.subject,
      body: order.body || "",
    };

    const params = this.buildOrderParams(order, bizContent);
    const signString = this.buildSignString(params);
    const sign = this.sign(signString);
    params.sign = sign;

    // 构建支付链接
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    return `${this.config.gatewayUrl}?${queryString}`;
  }

  /**
   * 创建手机网页支付链接
   */
  async createWapPayment(order: AlipayOrder): Promise<string> {
    const bizContent = {
      out_trade_no: order.outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: order.totalAmount.toFixed(2),
      subject: order.subject,
      body: order.body || "",
      quit_url: this.config.returnUrl,
    };

    const params = this.buildOrderParams(order, bizContent);
    params.method = "alipay.trade.wap.pay";

    const signString = this.buildSignString(params);
    const sign = this.sign(signString);
    params.sign = sign;

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    return `${this.config.gatewayUrl}?${queryString}`;
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo: string): Promise<AlipayPaymentResult> {
    const params: Record<string, any> = {
      app_id: this.config.appId,
      method: "alipay.trade.query",
      format: "JSON",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      version: "1.0",
      biz_content: JSON.stringify({
        out_trade_no: outTradeNo,
      }),
    };

    const signString = this.buildSignString(params);
    const sign = this.sign(signString);
    params.sign = sign;

    try {
      const response = await axios.post(this.config.gatewayUrl, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const result = response.data?.alipay_trade_query_response;

      if (result?.code === "10000") {
        return {
          success: true,
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
          buyerLogonId: result.buyer_logon_id,
          totalAmount: parseFloat(result.total_amount),
          receiptAmount: parseFloat(result.receipt_amount),
        };
      }

      return {
        success: false,
        error: result?.sub_msg || "查询失败",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "查询异常",
      };
    }
  }

  /**
   * 验证异步通知
   */
  verifyNotify(params: Record<string, any>): boolean {
    const sign = params.sign;
    const signType = params.sign_type || "RSA2";

    // 移除 sign 和 sign_type
    const verifyParams = { ...params };
    delete verifyParams.sign;
    delete verifyParams.sign_type;

    const signString = this.buildSignString(verifyParams);
    return this.verifySign(signString, sign);
  }

  /**
   * 处理异步通知
   */
  async handleNotify(params: Record<string, any>): Promise<AlipayPaymentResult> {
    // 验证签名
    if (!this.verifyNotify(params)) {
      return {
        success: false,
        error: "签名验证失败",
      };
    }

    // 验证交易状态
    if (params.trade_status === "TRADE_SUCCESS" || params.trade_status === "TRADE_FINISHED") {
      return {
        success: true,
        tradeNo: params.trade_no,
        outTradeNo: params.out_trade_no,
        buyerLogonId: params.buyer_logon_id,
        totalAmount: parseFloat(params.total_amount),
        receiptAmount: parseFloat(params.receipt_amount),
      };
    }

    return {
      success: false,
      error: `交易状态异常: ${params.trade_status}`,
    };
  }

  /**
   * 申请退款
   */
  async refund(outTradeNo: string, refundAmount: number, refundReason: string): Promise<AlipayPaymentResult> {
    const params: Record<string, any> = {
      app_id: this.config.appId,
      method: "alipay.trade.refund",
      format: "JSON",
      charset: "utf-8",
      sign_type: "RSA2",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      version: "1.0",
      biz_content: JSON.stringify({
        out_trade_no: outTradeNo,
        refund_amount: refundAmount.toFixed(2),
        refund_reason: refundReason,
      }),
    };

    const signString = this.buildSignString(params);
    const sign = this.sign(signString);
    params.sign = sign;

    try {
      const response = await axios.post(this.config.gatewayUrl, params);
      const result = response.data?.alipay_trade_refund_response;

      if (result?.code === "10000") {
        return {
          success: true,
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
        };
      }

      return {
        success: false,
        error: result?.sub_msg || "退款失败",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "退款异常",
      };
    }
  }
}
