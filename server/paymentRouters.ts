import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { AlipayPaymentProvider } from "./paymentProviders/alipay";
import { WechatPaymentProvider } from "./paymentProviders/wechat";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

/**
 * 支付管理路由
 */

export const paymentRouter = router({
  /**
   * 创建支付宝订单
   */
  createAlipayOrder: protectedProcedure
    .input(
      z.object({
        cardKeyId: z.number(),
        quantity: z.number().min(1),
        totalAmount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 创建订单记录
      const orderId = `ALI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // TODO: 根据实际的数据库 schema 添加 orders 表
        // 保存订单到数据库

        // 初始化支付宝提供商
        const alipay = new AlipayPaymentProvider({
          appId: process.env.ALIPAY_APP_ID || "",
          privateKey: process.env.ALIPAY_PRIVATE_KEY || "",
          publicKey: process.env.ALIPAY_PUBLIC_KEY || "",
          gatewayUrl: "https://openapi.alipay.com/gateway.do",
          notifyUrl: `${process.env.APP_URL}/api/payment/alipay/notify`,
          returnUrl: `${process.env.APP_URL}/dashboard/payment/result`,
        });

        // 创建支付链接
        const paymentUrl = await alipay.createPagePayment({
          outTradeNo: orderId,
          totalAmount: input.totalAmount,
          subject: `购买 ${input.quantity} 张卡密`,
          body: `用户 ${ctx.user.id} 购买卡密`,
        });

        return {
          success: true,
          orderId,
          paymentUrl,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "创建订单失败",
        };
      }
    }),

  /**
   * 创建微信支付订单
   */
  createWechatOrder: protectedProcedure
    .input(
      z.object({
        cardKeyId: z.number(),
        quantity: z.number().min(1),
        totalAmount: z.number().positive(),
        tradeType: z.enum(["JSAPI", "NATIVE", "APP", "MWEB", "H5"]).default("H5"),
        openId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orderId = `WX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // 初始化微信支付提供商
        const wechat = new WechatPaymentProvider({
          appId: process.env.WECHAT_APP_ID || "",
          mchId: process.env.WECHAT_MCH_ID || "",
          apiKey: process.env.WECHAT_API_KEY || "",
          notifyUrl: `${process.env.APP_URL}/api/payment/wechat/notify`,
          gatewayUrl: "https://api.mch.weixin.qq.com",
        });

        // 创建订单
        const result = await wechat.createOrder({
          outTradeNo: orderId,
          totalFee: Math.floor(input.totalAmount * 100), // 转换为分
          body: `购买 ${input.quantity} 张卡密`,
          tradeType: input.tradeType,
          openId: input.openId,
          sceneInfo:
            input.tradeType === "H5" || input.tradeType === "MWEB"
              ? {
                  h5_info: {
                    type: "Wap",
                    wap_url: `${process.env.APP_URL}/dashboard`,
                    wap_name: "Manus 自动注册工具",
                  },
                }
              : undefined,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        // 根据交易类型返回不同的结果
        if (input.tradeType === "NATIVE") {
          return {
            success: true,
            orderId,
            codeUrl: result.codeUrl, // 二维码 URL
          };
        } else if (input.tradeType === "MWEB" || input.tradeType === "H5") {
          return {
            success: true,
            orderId,
            mwebUrl: result.mwebUrl, // H5 支付链接
          };
        } else if (input.tradeType === "JSAPI") {
          // JSAPI 需要返回支付参数
          const jsapiParams = wechat.generateJsapiParams(result.prepayId || "");
          return {
            success: true,
            orderId,
            jsapiParams,
          };
        }

        return {
          success: true,
          orderId,
          prepayId: result.prepayId,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "创建订单失败",
        };
      }
    }),

  /**
   * 查询订单状态
   */
  queryOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        paymentMethod: z.enum(["alipay", "wechat"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (input.paymentMethod === "alipay") {
          const alipay = new AlipayPaymentProvider({
            appId: process.env.ALIPAY_APP_ID || "",
            privateKey: process.env.ALIPAY_PRIVATE_KEY || "",
            publicKey: process.env.ALIPAY_PUBLIC_KEY || "",
            gatewayUrl: "https://openapi.alipay.com/gateway.do",
            notifyUrl: "",
            returnUrl: "",
          });

          const result = await alipay.queryOrder(input.orderId);
          return result;
        } else {
          const wechat = new WechatPaymentProvider({
            appId: process.env.WECHAT_APP_ID || "",
            mchId: process.env.WECHAT_MCH_ID || "",
            apiKey: process.env.WECHAT_API_KEY || "",
            notifyUrl: "",
            gatewayUrl: "https://api.mch.weixin.qq.com",
          });

          const result = await wechat.queryOrder(input.orderId);
          return result;
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "查询失败",
        };
      }
    }),

  /**
   * 获取用户订单列表
   */
  getUserOrders: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // TODO: 根据实际的数据库 schema 添加 orders 表
        return {
          success: true,
          orders: [],
          total: 0,
          page: input.page,
          pageSize: input.pageSize,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "获取订单列表失败",
        };
      }
    }),

  /**
   * 申请退款
   */
  refund: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        paymentMethod: z.enum(["alipay", "wechat"]),
        refundReason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: 这里需要从数据库获取订单信息
        if (input.paymentMethod === "alipay") {
          const alipay = new AlipayPaymentProvider({
            appId: process.env.ALIPAY_APP_ID || "",
            privateKey: process.env.ALIPAY_PRIVATE_KEY || "",
            publicKey: process.env.ALIPAY_PUBLIC_KEY || "",
            gatewayUrl: "https://openapi.alipay.com/gateway.do",
            notifyUrl: "",
            returnUrl: "",
          });

          // 这里需要获取订单的实际金额
          const result = await alipay.refund(input.orderId, 0, input.refundReason);
          return result;
        } else {
          const wechat = new WechatPaymentProvider({
            appId: process.env.WECHAT_APP_ID || "",
            mchId: process.env.WECHAT_MCH_ID || "",
            apiKey: process.env.WECHAT_API_KEY || "",
            notifyUrl: "",
            gatewayUrl: "https://api.mch.weixin.qq.com",
          });

          // 这里需要获取订单的实际金额
          const result = await wechat.refund(input.orderId, `REFUND-${Date.now()}`, 0, 0);
          return result;
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "退款失败",
        };
      }
    }),
});
