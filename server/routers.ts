import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getCardKeyByCode,
  activateCardKey,
  createCardKey,
  getAllCardKeys,
  createRegistrationTask,
  getRegistrationTask,
  getUserRegistrationTasks,
  updateRegistrationTask,
  createRegistrationResult,
  getTaskResults,
  createUsageRecord,
  getUserUsageRecords,
  getUserProxyConfig,
  createOrUpdateProxyConfig,
  getSystemStats,
  getUserStats,
} from "./db";
import { proxyRouter } from "./proxyRouters";
import { orderRouter } from "./orderRouters";
import { ManusRegister } from "./registration";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { advancedRouter } from "./advancedRouters";
import { aiRouter } from "./aiRouter";
import { userRouter } from "./userRouter";
import { announcementRouter } from './announcementRouter';

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========== 卡密管理 ==========
  cardKey: router({
    // 用户激活卡密
    activate: publicProcedure
      .input(z.object({ keyCode: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        try {
          const key = await activateCardKey(input.keyCode, ctx.user.id);
          await createUsageRecord(ctx.user.id, "activate_card", undefined, { keyCode: input.keyCode });

          return { success: true, message: "卡密激活成功" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
      }),

    // 管理员生成卡密
    generate: protectedProcedure
      .input(
        z.object({
          count: z.number().min(1).max(100),
          maxUses: z.number().min(1).max(1000),
          expiresInDays: z.number().min(1).max(365),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const keys = [];
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        for (let i = 0; i < input.count; i++) {
          const keyCode = crypto.randomBytes(16).toString("hex").toUpperCase();
          await createCardKey(keyCode, input.maxUses, expiresAt, ctx.user.id);
          keys.push(keyCode);
        }

        await createUsageRecord(ctx.user.id, "generate_cards", undefined, { count: input.count });

        return { success: true, keys };
      }),

    // 获取所有卡密（管理员）
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await getAllCardKeys();
    }),
  }),

  // ========== 注册任务 ==========
  registration: router({
    // 创建单账号注册任务
    registerSingle: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
          emailApiUrl: z.string().url(),
          phone: z.string().optional(),
          smsApiUrl: z.string().optional(),
          yesCaptchaKey: z.string(),
          inviteCode: z.string().optional(),
          proxyApiUrl: z.string().optional(),
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const taskId = crypto.randomBytes(16).toString("hex").substring(0, 32);

        try {
          // 创建任务记录
          await createRegistrationTask({
            id: taskId,
            userId: ctx.user.id,
            taskName: `单账号注册-${input.email}`,
            status: "running",
            totalAccounts: 1,
            taskType: "single",
            yesCaptchaKey: input.yesCaptchaKey,
            inviteCode: input.inviteCode,
            proxyApiUrl: input.proxyApiUrl,
            utmSource: input.utmSource,
            utmMedium: input.utmMedium,
            utmCampaign: input.utmCampaign,
          });

          // 异步执行注册
          setImmediate(async () => {
            try {
              const reg = new ManusRegister(input);
              const result = await reg.run();

              await createRegistrationResult({
                taskId,
                email: input.email,
                phone: input.phone,
                password: input.password,
                token: result.token || null,
                success: result.ok,
                errorMessage: result.error || null,
                logs: JSON.stringify(result.logs || []),
              });

              await updateRegistrationTask(taskId, {
                status: result.ok ? "completed" : "failed",
                successCount: result.ok ? 1 : 0,
                failCount: result.ok ? 0 : 1,
                completedAt: new Date(),
              });
            } catch (error: any) {
              await updateRegistrationTask(taskId, {
                status: "failed",
                failCount: 1,
                completedAt: new Date(),
              });
            }
          });

          await createUsageRecord(ctx.user.id, "register_single", taskId, { email: input.email });

          return { success: true, taskId };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),

    // 创建批量注册任务
    createBatchTask: protectedProcedure
      .input(
        z.object({
          taskName: z.string().optional(),
          accounts: z.array(
            z.object({
              email: z.string().email(),
              emailApiUrl: z.string().url(),
              phone: z.string().optional(),
              smsApiUrl: z.string().optional(),
            })
          ),
          password: z.string(),
          yesCaptchaKey: z.string(),
          concurrency: z.number().min(1).max(50).default(5),
          inviteCode: z.string().optional(),
          proxyApiUrl: z.string().optional(),
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        if (input.accounts.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "账号列表不能为空",
          });
        }

        const taskId = crypto.randomBytes(16).toString("hex").substring(0, 32);

        try {
          await createRegistrationTask({
            id: taskId,
            userId: ctx.user.id,
            taskName: input.taskName || `批量任务-${taskId}`,
            status: "running",
            totalAccounts: input.accounts.length,
            concurrency: input.concurrency,
            taskType: "batch",
            yesCaptchaKey: input.yesCaptchaKey,
            inviteCode: input.inviteCode,
            proxyApiUrl: input.proxyApiUrl,
            utmSource: input.utmSource,
            utmMedium: input.utmMedium,
            utmCampaign: input.utmCampaign,
          });

          // 异步执行批量注册
          setImmediate(async () => {
            let successCount = 0;
            let failCount = 0;

            // 使用信号量控制并发
            const semaphore = new Array(input.concurrency).fill(null);
            const promises = input.accounts.map((account, idx) =>
              (async () => {
                // 等待信号量可用
                while (semaphore.every(s => s !== null)) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }

                const slotIdx = semaphore.findIndex(s => s === null);
                semaphore[slotIdx] = true;

                try {
                  const reg = new ManusRegister({
                    ...account,
                    password: input.password,
                    yesCaptchaKey: input.yesCaptchaKey,
                    inviteCode: input.inviteCode,
                    proxyApiUrl: input.proxyApiUrl,
                    utmSource: input.utmSource,
                    utmMedium: input.utmMedium,
                    utmCampaign: input.utmCampaign,
                  });

                  const result = await reg.run();

                  await createRegistrationResult({
                    taskId,
                    email: account.email,
                    phone: account.phone,
                    password: input.password,
                    token: result.token || null,
                    success: result.ok,
                    errorMessage: result.error || null,
                    logs: JSON.stringify(result.logs || []),
                  });

                  if (result.ok) successCount++;
                  else failCount++;
                } catch (error) {
                  failCount++;
                } finally {
                  semaphore[slotIdx] = null;
                }
              })()
            );

            await Promise.all(promises);

            await updateRegistrationTask(taskId, {
              status: "completed",
              successCount,
              failCount,
              completedAt: new Date(),
            });
          });

          await createUsageRecord(ctx.user.id, "create_batch_task", taskId, {
            accountCount: input.accounts.length,
          });

          return { success: true, taskId, total: input.accounts.length };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),

    // 获取任务列表
    listTasks: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return await getUserRegistrationTasks(ctx.user.id);
    }),

    // 获取任务详情
    getTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ input, ctx }) => {
        const task = await getRegistrationTask(input.taskId);
        if (!task || task.userId !== ctx.user?.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return task;
      }),

    // 获取任务结果
    getResults: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ input, ctx }) => {
        const task = await getRegistrationTask(input.taskId);
        if (!task || task.userId !== ctx.user?.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getTaskResults(input.taskId);
      }),

    // 取消任务
    cancelTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const task = await getRegistrationTask(input.taskId);
        if (!task || task.userId !== ctx.user?.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await updateRegistrationTask(input.taskId, { status: "cancelled" });
        return { success: true };
      }),
  }),

  // ========== 代理配置 ==========
  proxy: proxyRouter,

  // ========== 统计数据 ==========
  stats: router({
    getSystemStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await getSystemStats();
    }),

    getUserStats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return await getUserStats(ctx.user.id);
    }),
  }),

  // ========== 历史记录 ==========
  history: router({
    getRecords: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const records = await getUserUsageRecords(ctx.user.id, input.limit + input.offset);

        return {
          records: records.slice(input.offset, input.offset + input.limit),
          total: records.length,
          hasMore: records.length > input.offset + input.limit,
        };
      }),

    getSummary: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const records = await getUserUsageRecords(ctx.user.id, 1000);

      const summary = {
        totalActions: records.length,
        registrations: records.filter((r: any) => r.action === "register_single").length,
        batchTasks: records.filter((r: any) => r.action === "create_batch_task").length,
        cardActivations: records.filter((r: any) => r.action === "activate_card").length,
        exports: records.filter((r: any) => r.action === "export").length,
        lastAction: records[0]?.createdAt || null,
      };

      return summary;
    }),
   }),

  // ========== 高级功能 ==========
  advanced: advancedRouter,
  orders: orderRouter,

  // ========== AI 助手 ==========
  ai: aiRouter,

  // ========== 用户个人中心 ==========
  user: userRouter,
  // ========== 系统公告 ==========/
  announcements: announcementRouter,
});
export type AppRouter = typeof appRouter;
