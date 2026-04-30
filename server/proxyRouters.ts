import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { ProxyPoolManager, ProxyManagerFactory, ProxyConfiguration } from "./proxyManager";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { proxyConfigs } from "../drizzle/schema";

const proxyManagerFactory = new ProxyManagerFactory();

/**
 * 代理配置路由
 */
export const proxyRouter = router({
  /**
   * 获取代理配置
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    try {
      const result = await db
        .select()
        .from(proxyConfigs)
        .where(eq(proxyConfigs.userId, ctx.user.id))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("[ProxyRouter] Failed to get proxy config:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  /**
   * 保存代理配置
   */
  saveConfig: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["luminati", "oxylabs", "smartproxy", "custom"]),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        customProxyList: z.array(z.string()).optional(),
        rotationStrategy: z.enum(["round_robin", "random", "weighted", "adaptive"]),
        rotationFrequency: z.number().min(1),
        healthCheckInterval: z.number().min(1),
        healthCheckTimeout: z.number().min(1),
        enableAutoRotation: z.boolean(),
        enableHealthCheck: z.boolean(),
        maxFailureThreshold: z.number().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      try {
        const now = new Date();

        // 检查是否已存在配置
        const existing = await db
          .select()
          .from(proxyConfigs)
          .where(eq(proxyConfigs.userId, ctx.user.id))
          .limit(1);

        if (existing && existing.length > 0) {
          // 更新现有配置
          await db
            .update(proxyConfigs)
            .set({
              provider: input.provider,
              apiKey: input.apiKey || null,
              apiSecret: input.apiSecret || null,
              customProxyList: input.customProxyList ? JSON.stringify(input.customProxyList) : null,
              rotationStrategy: input.rotationStrategy,
              rotationFrequency: input.rotationFrequency,
              healthCheckInterval: input.healthCheckInterval,
              healthCheckTimeout: input.healthCheckTimeout,
              enableAutoRotation: input.enableAutoRotation,
              enableHealthCheck: input.enableHealthCheck,
              maxFailureThreshold: input.maxFailureThreshold,
              updatedAt: now,
            })
            .where(eq(proxyConfigs.userId, ctx.user.id));
        } else {
          // 创建新配置
          await db.insert(proxyConfigs).values({
            userId: ctx.user.id,
            provider: input.provider,
            apiKey: input.apiKey || null,
            apiSecret: input.apiSecret || null,
            customProxyList: input.customProxyList ? JSON.stringify(input.customProxyList) : null,
            rotationStrategy: input.rotationStrategy,
            rotationFrequency: input.rotationFrequency,
            healthCheckInterval: input.healthCheckInterval,
            healthCheckTimeout: input.healthCheckTimeout,
            enableAutoRotation: input.enableAutoRotation,
            enableHealthCheck: input.enableHealthCheck,
            maxFailureThreshold: input.maxFailureThreshold,
            createdAt: now,
            updatedAt: now,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("[ProxyRouter] Failed to save proxy config:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * 获取代理池统计
   */
  getPoolStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    try {
      const configResult = await db
        .select()
        .from(proxyConfigs)
        .where(eq(proxyConfigs.userId, ctx.user.id))
        .limit(1);

      if (!configResult || configResult.length === 0) {
        return null;
      }

      const config = configResult[0];

      // 创建代理管理器
      const manager = await proxyManagerFactory.getOrCreateManager(ctx.user.id.toString(), {
        userId: ctx.user.id.toString(),
        provider: config.provider as any,
        apiKey: config.apiKey || undefined,
        apiSecret: config.apiSecret || undefined,
        customProxyList: config.customProxyList ? JSON.parse(config.customProxyList) : undefined,
        rotationStrategy: config.rotationStrategy as any,
        rotationFrequency: config.rotationFrequency,
        healthCheckInterval: config.healthCheckInterval,
        healthCheckTimeout: config.healthCheckTimeout,
        enableAutoRotation: config.enableAutoRotation,
        enableHealthCheck: config.enableHealthCheck,
        maxFailureThreshold: config.maxFailureThreshold,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      } as unknown as ProxyConfiguration);

      return manager.getPoolStats();
    } catch (error) {
      console.error("[ProxyRouter] Failed to get pool stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  /**
   * 获取所有代理
   */
  getAllProxies: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    try {
      const configResult = await db
        .select()
        .from(proxyConfigs)
        .where(eq(proxyConfigs.userId, ctx.user.id))
        .limit(1);

      if (!configResult || configResult.length === 0) {
        return [];
      }

      const config = configResult[0];

      // 创建代理管理器
      const manager = await proxyManagerFactory.getOrCreateManager(ctx.user.id.toString(), {
        userId: ctx.user.id.toString(),
        provider: config.provider as any,
        apiKey: config.apiKey || undefined,
        apiSecret: config.apiSecret || undefined,
        customProxyList: config.customProxyList ? JSON.parse(config.customProxyList) : undefined,
        rotationStrategy: config.rotationStrategy as any,
        rotationFrequency: config.rotationFrequency,
        healthCheckInterval: config.healthCheckInterval,
        healthCheckTimeout: config.healthCheckTimeout,
        enableAutoRotation: config.enableAutoRotation,
        enableHealthCheck: config.enableHealthCheck,
        maxFailureThreshold: config.maxFailureThreshold,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      } as unknown as ProxyConfiguration);

      return manager.getAllProxies();
    } catch (error) {
      console.error("[ProxyRouter] Failed to get all proxies:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  /**
   * 获取健康的代理
   */
  getHealthyProxies: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    try {
      const configResult = await db
        .select()
        .from(proxyConfigs)
        .where(eq(proxyConfigs.userId, ctx.user.id))
        .limit(1);

      if (!configResult || configResult.length === 0) {
        return [];
      }

      const config = configResult[0];

      // 创建代理管理器
      const manager = await proxyManagerFactory.getOrCreateManager(ctx.user.id.toString(), {
        userId: ctx.user.id.toString(),
        provider: config.provider as any,
        apiKey: config.apiKey || undefined,
        apiSecret: config.apiSecret || undefined,
        customProxyList: config.customProxyList ? JSON.parse(config.customProxyList) : undefined,
        rotationStrategy: config.rotationStrategy as any,
        rotationFrequency: config.rotationFrequency,
        healthCheckInterval: config.healthCheckInterval,
        healthCheckTimeout: config.healthCheckTimeout,
        enableAutoRotation: config.enableAutoRotation,
        enableHealthCheck: config.enableHealthCheck,
        maxFailureThreshold: config.maxFailureThreshold,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      } as unknown as ProxyConfiguration);

      return manager.getHealthyProxies();
    } catch (error) {
      console.error("[ProxyRouter] Failed to get healthy proxies:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  /**
   * 测试代理连接
   */
  testConnection: protectedProcedure
    .input(
      z.object({
        host: z.string(),
        port: z.number(),
        username: z.string().optional(),
        password: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const axios = require("axios");
        const HttpProxyAgent = require("http-proxy-agent");
        const HttpsProxyAgent = require("https-proxy-agent");

        let proxyUrl = `http://${input.host}:${input.port}`;
        if (input.username && input.password) {
          proxyUrl = `http://${input.username}:${input.password}@${input.host}:${input.port}`;
        }

        const response = await axios.get("https://httpbin.org/ip", {
          httpAgent: HttpProxyAgent(proxyUrl),
          httpsAgent: HttpsProxyAgent(proxyUrl),
          timeout: 10000,
        });

        return {
          success: true,
          ip: response.data.origin,
        };
      } catch (error) {
        console.error("[ProxyRouter] Proxy test failed:", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * 刷新代理池
   */
  refreshProxyPool: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    try {
      const configResult = await db
        .select()
        .from(proxyConfigs)
        .where(eq(proxyConfigs.userId, ctx.user.id))
        .limit(1);

      if (!configResult || configResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Proxy config not found" });
      }

      const config = configResult[0];

      // 销毁旧的管理器并创建新的
      proxyManagerFactory.destroyAll();

      const manager = await proxyManagerFactory.getOrCreateManager(ctx.user.id.toString(), {
        userId: ctx.user.id.toString(),
        provider: config.provider as any,
        apiKey: config.apiKey || undefined,
        apiSecret: config.apiSecret || undefined,
        customProxyList: config.customProxyList ? JSON.parse(config.customProxyList) : undefined,
        rotationStrategy: config.rotationStrategy as any,
        rotationFrequency: config.rotationFrequency,
        healthCheckInterval: config.healthCheckInterval,
        healthCheckTimeout: config.healthCheckTimeout,
        enableAutoRotation: config.enableAutoRotation,
        enableHealthCheck: config.enableHealthCheck,
        maxFailureThreshold: config.maxFailureThreshold,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      } as unknown as ProxyConfiguration);

      const stats = manager.getPoolStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error("[ProxyRouter] Failed to refresh proxy pool:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),
});
