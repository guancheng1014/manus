import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { paymentRouter } from "./paymentRouters";
import { prometheusCollector } from "./monitoring/prometheus";
import { aiOptimizer } from "./ai/aiOptimizer";

export const advancedRouter = router({
  payment: paymentRouter,

  monitoring: router({
    getMetrics: protectedProcedure.query(async () => ({
      success: true,
      metrics: prometheusCollector.getMetrics(),
    })),

    getPrometheusText: protectedProcedure.query(async () => ({
      success: true,
      text: prometheusCollector.getPrometheusText(),
    })),

    recordRegistration: protectedProcedure
      .input(z.object({ success: z.boolean(), duration: z.number() }))
      .mutation(async ({ input }) => {
        prometheusCollector.recordRegistration(input.success, input.duration);
        return { success: true };
      }),

    recordProxyUsage: protectedProcedure
      .input(z.object({ success: z.boolean(), responseTime: z.number() }))
      .mutation(async ({ input }) => {
        prometheusCollector.recordProxyUsage(input.success, input.responseTime);
        return { success: true };
      }),

    updateProxyHealth: protectedProcedure
      .input(z.object({ healthy: z.number(), unhealthy: z.number() }))
      .mutation(async ({ input }) => {
        prometheusCollector.updateProxyHealth(input.healthy, input.unhealthy);
        return { success: true };
      }),

    recordTask: protectedProcedure
      .input(z.object({ active: z.number(), completed: z.number(), failed: z.number(), duration: z.number() }))
      .mutation(async ({ input }) => {
        prometheusCollector.recordTask(input.active, input.completed, input.failed, input.duration);
        return { success: true };
      }),

    updateUserMetrics: protectedProcedure
      .input(z.object({ active: z.number(), total: z.number(), withValidKeys: z.number() }))
      .mutation(async ({ input }) => {
        prometheusCollector.updateUserMetrics(input.active, input.total, input.withValidKeys);
        return { success: true };
      }),

    recordError: protectedProcedure
      .input(z.object({ error: z.string() }))
      .mutation(async ({ input }) => {
        prometheusCollector.recordError(input.error);
        return { success: true };
      }),
  }),

  aiOptimization: router({
    analyzeFailure: protectedProcedure
      .input(z.object({ email: z.string(), error: z.string(), context: z.any().optional() }))
      .mutation(async ({ input }) => {
        try {
          const analysis = await aiOptimizer.analyzeFailure(input.email, input.error, (input.context as any) || {});
          return { success: true, analysis };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "分析失败" };
        }
      }),

    optimizeConcurrency: protectedProcedure
      .input(z.object({
        totalAttempts: z.number(), successCount: z.number(), failureCount: z.number(),
        successRate: z.number(), averageTime: z.number(), recentErrors: z.array(z.string()),
        concurrency: z.number(), rotationStrategy: z.string(), proxySuccessRate: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const suggestion = await aiOptimizer.optimizeConcurrency(input as any);
          return { success: true, suggestion };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "优化失败" };
        }
      }),

    optimizeRotationStrategy: protectedProcedure
      .input(z.object({
        totalAttempts: z.number(), successCount: z.number(), failureCount: z.number(),
        successRate: z.number(), averageTime: z.number(), recentErrors: z.array(z.string()),
        concurrency: z.number(), rotationStrategy: z.string(), proxySuccessRate: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const suggestion = await aiOptimizer.optimizeRotationStrategy(input as any);
          return { success: true, suggestion };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "优化失败" };
        }
      }),

    generateReport: protectedProcedure
      .input(z.object({
        totalAttempts: z.number(), successCount: z.number(), failureCount: z.number(),
        successRate: z.number(), averageTime: z.number(), recentErrors: z.array(z.string()),
        concurrency: z.number(), rotationStrategy: z.string(), proxySuccessRate: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const report = await aiOptimizer.generateOptimizationReport(input as any);
          return { success: true, report };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "报告生成失败" };
        }
      }),
  }),
});
