import crypto from "crypto";
import axios from "axios";
import xml2js from "xml2js";

/**
 * 微信支付模块
 * 支持 H5 支付、APP 支付、小程序支付、Native 支付
 */

export interface WechatPayConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  apiSecret?: string;
  certPath?: string;
  keyPath?: string;
  notifyUrl: string;
  gatewayUrl: string; // 微信支付网关
}

export interface WechatOrder {
  outTradeNo: string;
  totalFee: number; // 金额，单位为分
  body: string;
  detail?: string;
  attach?: string;
  tradeType: "JSAPI" | "NATIVE" | "APP" | "MWEB" | "H5"; // 交易类型
  openId?: string; // JSAPI 需要
  sceneInfo?: Record<string, any>; // H5 需要
}

export interface WechatPaymentResult {
  success: boolean;
  prepayId?: string;
  codeUrl?: string; // Native 支付二维码
  mwebUrl?: string; // H5 支付链接
  transactionId?: string; // 微信交易号
  outTradeNo?: string;
  totalFee?: number;
  error?: string;
}

export class WechatPaymentProvider {
  private config: WechatPayConfig;
  private xmlBuilder = new xml2js.Builder({ rootName: "xml" });
  private xmlParser = new xml2js.Parser();

  constructor(config: WechatPayConfig) {
    this.config = config;
  }

  /**
   * 生成随机字符串
   */
  private generateNonce(length: number = 32): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成签名
   */
  private sign(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const signParts: string[] = [];

    for (const key of sortedKeys) {
      if (data[key] && key !== "sign" && key !== "sign_type") {
        signParts.push(`${key}=${data[key]}`);
      }
    }

    const signString = signParts.join("&") + `&key=${this.config.apiKey}`;
    return crypto.createHash("md5").update(signString, "utf8").digest("hex").toUpperCase();
  }

  /**
   * 创建订单
   */
  async createOrder(order: WechatOrder): Promise<WechatPaymentResult> {
    const nonce = this.generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, any> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      nonce_str: nonce,
      body: order.body,
      out_trade_no: order.outTradeNo,
      total_fee: order.totalFee,
      spbill_create_ip: "127.0.0.1",
      notify_url: this.config.notifyUrl,
      trade_type: order.tradeType,
    };

    if (order.detail) {
      params.detail = order.detail;
    }

    if (order.attach) {
      params.attach = order.attach;
    }

    if (order.tradeType === "JSAPI" && order.openId) {
      params.openid = order.openId;
    }

    if (order.tradeType === "MWEB" || order.tradeType === "H5") {
      params.scene_info = JSON.stringify(order.sceneInfo || { h5_info: { type: "Wap" } });
    }

    params.sign = this.sign(params);

    try {
      const xmlData = this.xmlBuilder.buildObject(params);
      const response = await axios.post(this.config.gatewayUrl, xmlData, {
        headers: { "Content-Type": "application/xml" },
      });

      const result = await this.xmlParser.parseStringPromise(response.data);
      const data = result.xml;

      if (data.return_code[0] === "SUCCESS" && data.result_code[0] === "SUCCESS") {
        const prepayId = data.prepay_id[0];
        const codeUrl = data.code_url?.[0];
        const mwebUrl = data.mweb_url?.[0];

        return {
          success: true,
          prepayId,
          codeUrl,
          mwebUrl,
          outTradeNo: order.outTradeNo,
        };
      }

      return {
        success: false,
        error: data.err_code_des?.[0] || "创建订单失败",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "创建订单异常",
      };
    }
  }

  /**
   * 生成 JSAPI 支付参数
   */
  generateJsapiParams(prepayId: string): Record<string, any> {
    const nonce = this.generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, any> = {
      appId: this.config.appId,
      timeStamp: timestamp.toString(),
      nonceStr: nonce,
      package: `prepay_id=${prepayId}`,
      signType: "MD5",
    };

    params.paySign = this.sign(params);
    return params;
  }

  /**
   * 查询订单
   */
  async queryOrder(outTradeNo: string): Promise<WechatPaymentResult> {
    const nonce = this.generateNonce();

    const params: Record<string, any> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      out_trade_no: outTradeNo,
      nonce_str: nonce,
    };

    params.sign = this.sign(params);

    try {
      const xmlData = this.xmlBuilder.buildObject(params);
      const response = await axios.post(`${this.config.gatewayUrl}/pay/orderquery`, xmlData);

      const result = await this.xmlParser.parseStringPromise(response.data);
      const data = result.xml;

      if (data.return_code[0] === "SUCCESS" && data.result_code[0] === "SUCCESS") {
        return {
          success: true,
          transactionId: data.transaction_id?.[0],
          outTradeNo: data.out_trade_no?.[0],
          totalFee: parseInt(data.total_fee?.[0] || "0"),
        };
      }

      return {
        success: false,
        error: data.err_code_des?.[0] || "查询失败",
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
  async verifyNotify(xmlData: string): Promise<{ valid: boolean; data?: Record<string, any> }> {
    try {
      const result = await this.xmlParser.parseStringPromise(xmlData);
      const data = result.xml;

      // 提取签名
      const sign = data.sign?.[0];
      const signData = { ...data };
      delete signData.sign;

      // 重新计算签名
      const flatData = Object.fromEntries(
        Object.entries(signData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      );
      const calculatedSign = this.sign(flatData);

      if (sign === calculatedSign) {
        return {
          valid: true,
          data: flatData,
        };
      }

      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * 处理异步通知
   */
  async handleNotify(xmlData: string): Promise<WechatPaymentResult> {
    const { valid, data } = await this.verifyNotify(xmlData);

    if (!valid) {
      return {
        success: false,
        error: "签名验证失败",
      };
    }

    if (data?.return_code === "SUCCESS" && data?.result_code === "SUCCESS") {
      return {
        success: true,
        transactionId: data.transaction_id,
        outTradeNo: data.out_trade_no,
        totalFee: parseInt(data.total_fee || "0"),
      };
    }

    return {
      success: false,
      error: `交易异常: ${data?.err_code_des}`,
    };
  }

  /**
   * 申请退款
   */
  async refund(
    outTradeNo: string,
    outRefundNo: string,
    totalFee: number,
    refundFee: number
  ): Promise<WechatPaymentResult> {
    const nonce = this.generateNonce();

    const params: Record<string, any> = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      nonce_str: nonce,
      out_trade_no: outTradeNo,
      out_refund_no: outRefundNo,
      total_fee: totalFee,
      refund_fee: refundFee,
    };

    params.sign = this.sign(params);

    try {
      const xmlData = this.xmlBuilder.buildObject(params);
      // 注：实际生产环境需要使用 HTTPS 双向认证
      // 这里简化处理，实际应使用 https.Agent 配置证书
      const response = await axios.post(`${this.config.gatewayUrl}/secapi/pay/refund`, xmlData, {
        headers: { "Content-Type": "application/xml" },
      });

      const result = await this.xmlParser.parseStringPromise(response.data);
      const data = result.xml;

      if (data.return_code[0] === "SUCCESS" && data.result_code[0] === "SUCCESS") {
        return {
          success: true,
          transactionId: data.transaction_id?.[0],
          outTradeNo: data.out_trade_no?.[0],
        };
      }

      return {
        success: false,
        error: data.err_code_des?.[0] || "退款失败",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "退款异常",
      };
    }
  }
}
