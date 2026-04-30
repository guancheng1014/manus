// 在 server/routers.ts 中添加以下代码到 appRouter

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getUserUsageRecords } from "./db";

export const historyRouter = router({
  // 获取用户使用历史记录
  getRecords: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }

      const records = await getUserUsageRecords(ctx.user.id, input.limit + input.offset);

      return {
        records: records.slice(input.offset, input.offset + input.limit),
        total: records.length,
        hasMore: records.length > input.offset + input.limit,
      };
    }),

  // 获取用户统计摘要
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const records = await getUserUsageRecords(ctx.user.id, 1000);

    const summary = {
      totalActions: records.length,
      registrations: records.filter((r) => r.action === "register_single").length,
      batchTasks: records.filter((r) => r.action === "create_batch_task").length,
      cardActivations: records.filter((r) => r.action === "activate_card").length,
      exports: records.filter((r) => r.action === "export").length,
      lastAction: records[0]?.createdAt || null,
    };

    return summary;
  }),
});
