import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { paymentRouter } from "./paymentRouters";
import { prometheusCollector } from "./monitoring/prometheus";
import { aiOptimizer } from "./ai/aiOptimizer";

/**
 * 高级功能路由集合
 * 包括支付、监控、AI 优化等功能
 */

export const advancedRouter = router({
  // 支付路由
  payment: paymentRouter,

  // 监控路由
  monitoring: router({
    /**
     * 获取 Prometheus 指标
     */
    getMetrics: protectedProcedure.query(async () => {
      return {
        success: true,
        metrics: prometheusCollector.getMetrics(),
      };
    }),

    /**
     * 获取 Prometheus 格式的指标文本
     */
    getPrometheusText: protectedProcedure.query(async () => {
      return {
        success: true,
        text: prometheusCollector.getPrometheusText(),
      };
    }),

    /**
     * 记录注册事件
     */
    recordRegistration: protectedProcedure
      .input(
        z.object({
          success: z.boolean(),
          duration: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        prometheusCollector.recordRegistration(input.success, input.duration);
        return { success: true };
      }),

    /**
     * 记录代理使用
     */
    recordProxyUsage: protectedProcedure
      .input(
        z.object({
          success: z.boolean(),
          responseTime: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        prometheusCollector.recordProxyUsage(input.success, input.responseTime);
        return { success: true };
      }),

    /**
     * 更新代理健康状态
     */
    updateProxyHealth: protectedProcedure
      .input(
        z.object({
          healthy: z.number(),
          unhealthy: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        prometheusCollector.updateProxyHealth(input.healthy, input.unhealthy);
        return { success: true };
      }),

    /**
     * 记录任务事件
     */
    recordTask: protectedProcedure
      .input(
        z.object({
          active: z.number(),
          completed: z.number(),
          failed: z.number(),
          duration: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        prometheusCollector.recordTask(input.active, input.completed, input.failed, input.duration);
        return { success: true };
      }),

    /**
     * 更新用户指标
     */
    updateUserMetrics: protectedProcedure
      .input(
        z.object({
          active: z.number(),
          total: z.number(),
          withValidKeys: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        prometheusCollector.updateUserMetrics(input.active, input.total, input.withValidKeys);
        return { success: true };
      }),

    /**
     * 记录错误
     */
    recordError: protectedProcedure
      .input(z.object({ error: z.string() }))
      .mutation(async ({ input }) => {
        prometheusCollector.recordError(input.error);
        return { success: true };
      }),
  }),

  // AI 优化路由
  aiOptimization: router({
    /**
     * 分析注册失败原因
     */
    analyzeFailure: protectedProcedure
      .input(
        z.object({
          email: z.string(),
          error: z.string(),
          context: z.record(z.any()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const analysis = await aiOptimizer.analyzeFailure(
            input.email,
            input.error,
            (input.context as Record<string, any>) || {}
          );
          return {
            success: true,
            analysis,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "分析失败",
          };
        }
      }),

    /**
     * 优化并发数
     */
    optimizeConcurrency: protectedProcedure
      .input(
        z.object({
          totalAttempts: z.number(),
          successCount: z.number(),
          failureCount: z.number(),
          successRate: z.number(),
          averageTime: z.number(),
          recentErrors: z.array(z.string()),
          concurrency: z.number(),
          rotationStrategy: z.string(),
          proxySuccessRate: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const suggestion = await aiOptimizer.optimizeConcurrency(input as any);
          return {
            success: true,
            suggestion,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "优化失败",
          };
        }
      }),

    /**
     * 优化轮换策略
     */
    optimizeRotationStrategy: protectedProcedure
      .input(
        z.object({
          totalAttempts: z.number(),
          successCount: z.number(),
          failureCount: z.number(),
          successRate: z.number(),
          averageTime: z.number(),
          recentErrors: z.array(z.string()),
          concurrency: z.number(),
          rotationStrategy: z.string(),
          proxySuccessRate: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const suggestion = await aiOptimizer.optimizeRotationStrategy(input as any);
          return {
            success: true,
            suggestion,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "优化失败",
          };
        }
      }),

    /**
     * 生成优化报告
     */
    generateReport: protectedProcedure
      .input(
        z.object({
          totalAttempts: z.number(),
          successCount: z.number(),
          failureCount: z.number(),
          successRate: z.number(),
          averageTime: z.number(),
          recentErrors: z.array(z.string()),
          concurrency: z.number(),
          rotationStrategy: z.string(),
          proxySuccessRate: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const report = await aiOptimizer.generateOptimizationReport(input as any);
          return {
            success: true,
            report,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "报告生成失败",
          };
        }
      }),
  }),
});
