import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getPaymentConfig,
  getAllPaymentConfigs,
  upsertPaymentConfig,
  testPaymentConfig,
  togglePaymentConfig,
  deletePaymentConfig,
} from "./db/paymentConfig";
import { TRPCError } from "@trpc/server";

export const paymentConfigRouter = router({
  // 获取所有支付配置（管理员）
  getAll: adminProcedure.query(async () => {
    try {
      const configs = await getAllPaymentConfigs();
      return configs;
    } catch (error) {
      console.error("Failed to get payment configs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "获取支付配置失败",
      });
    }
  }),

  // 获取特定支付方式的配置（管理员）
  getByMethod: adminProcedure
    .input(z.object({ paymentMethod: z.enum(["alipay", "wechat"]) }))
    .query(async ({ input }) => {
      try {
        const config = await getPaymentConfig(input.paymentMethod);
        if (!config) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "支付配置不存在",
          });
        }
        return config;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to get payment config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "获取支付配置失败",
        });
      }
    }),

  // 创建或更新支付配置（管理员）
  upsert: adminProcedure
    .input(
      z.object({
        paymentMethod: z.enum(["alipay", "wechat"]),
        appId: z.string().min(1, "应用ID不能为空"),
        appSecret: z.string().min(1, "应用密钥不能为空"),
        merchantId: z.string().optional(),
        merchantKey: z.string().optional(),
        publicKey: z.string().optional(),
        privateKey: z.string().optional(),
        notifyUrl: z.string().url("回调URL格式不正确").optional(),
        returnUrl: z.string().url("返回URL格式不正确").optional(),
        isEnabled: z.boolean().optional(),
        testMode: z.boolean().optional(),
        config: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await upsertPaymentConfig(input.paymentMethod, {
          appId: input.appId,
          appSecret: input.appSecret,
          merchantId: input.merchantId || null,
          merchantKey: input.merchantKey || null,
          publicKey: input.publicKey || null,
          privateKey: input.privateKey || null,
          notifyUrl: input.notifyUrl || null,
          returnUrl: input.returnUrl || null,
          isEnabled: input.isEnabled,
          testMode: input.testMode,
          config: input.config || null,
        });

        return {
          success: true,
          message: `${input.paymentMethod === "alipay" ? "支付宝" : "微信"}支付配置已保存`,
        };
      } catch (error) {
        console.error("Failed to upsert payment config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "保存支付配置失败",
        });
      }
    }),

  // 测试支付配置（管理员）
  test: adminProcedure
    .input(z.object({ paymentMethod: z.enum(["alipay", "wechat"]) }))
    .mutation(async ({ input }) => {
      try {
        const result = await testPaymentConfig(input.paymentMethod);
        return result;
      } catch (error) {
        console.error("Failed to test payment config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "测试支付配置失败",
        });
      }
    }),

  // 启用/禁用支付配置（管理员）
  toggle: adminProcedure
    .input(
      z.object({
        paymentMethod: z.enum(["alipay", "wechat"]),
        isEnabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await togglePaymentConfig(input.paymentMethod, input.isEnabled);
        return {
          success: true,
          message: `${input.paymentMethod === "alipay" ? "支付宝" : "微信"}支付已${input.isEnabled ? "启用" : "禁用"}`,
        };
      } catch (error) {
        console.error("Failed to toggle payment config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "切换支付配置状态失败",
        });
      }
    }),

  // 删除支付配置（管理员）
  delete: adminProcedure
    .input(z.object({ paymentMethod: z.enum(["alipay", "wechat"]) }))
    .mutation(async ({ input }) => {
      try {
        await deletePaymentConfig(input.paymentMethod);
        return {
          success: true,
          message: `${input.paymentMethod === "alipay" ? "支付宝" : "微信"}支付配置已删除`,
        };
      } catch (error) {
        console.error("Failed to delete payment config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "删除支付配置失败",
        });
      }
    }),
});
