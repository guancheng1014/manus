import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// 模拟公告数据存储
const announcements: Array<{
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  published: boolean;
  expiresAt?: Date;
}> = [
  {
    id: '1',
    title: '系统维护通知',
    content: '系统将于 2026-05-01 02:00-04:00 进行定期维护，期间服务可能不可用。',
    type: 'warning',
    createdAt: new Date('2026-04-28'),
    updatedAt: new Date('2026-04-28'),
    createdBy: 1,
    published: true,
    expiresAt: new Date('2026-05-02'),
  },
  {
    id: '2',
    title: '新功能发布',
    content: '我们很高兴宣布新的 AI 优化功能已上线，可以帮助您提高注册成功率。',
    type: 'success',
    createdAt: new Date('2026-04-27'),
    updatedAt: new Date('2026-04-27'),
    createdBy: 1,
    published: true,
  },
];

export const announcementRouter = router({
  /**
   * 获取所有公告
   */
  getAnnouncements: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // 过滤已发布且未过期的公告
      const now = new Date();
      const filtered = announcements.filter(
        (a) => a.published && (!a.expiresAt || a.expiresAt > now)
      );

      const total = filtered.length;
      const items = filtered
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(input.offset, input.offset + input.limit);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * 获取单个公告
   */
  getAnnouncement: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const announcement = announcements.find((a) => a.id === input.id);
      if (!announcement) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return announcement;
    }),

  /**
   * 创建公告（仅管理员）
   */
  createAnnouncement: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(100),
        content: z.string().min(1, "内容不能为空"),
        type: z.enum(['info', 'warning', 'success', 'error']),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const id = Math.random().toString(36).substring(7);
      const announcement = {
        id,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: ctx.user.id,
        published: false,
      };

      announcements.push(announcement);

      return {
        success: true,
        id,
        message: "公告已创建",
      };
    }),

  /**
   * 更新公告（仅管理员）
   */
  updateAnnouncement: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(['info', 'warning', 'success', 'error']).optional(),
        published: z.boolean().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const index = announcements.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const announcement = announcements[index];
      announcements[index] = {
        ...announcement,
        title: input.title ?? announcement.title,
        content: input.content ?? announcement.content,
        type: input.type ?? announcement.type,
        published: input.published ?? announcement.published,
        expiresAt: input.expiresAt ?? announcement.expiresAt,
        updatedAt: new Date(),
      };

      return {
        success: true,
        message: "公告已更新",
      };
    }),

  /**
   * 删除公告（仅管理员）
   */
  deleteAnnouncement: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const index = announcements.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      announcements.splice(index, 1);

      return {
        success: true,
        message: "公告已删除",
      };
    }),

  /**
   * 发布公告（仅管理员）
   */
  publishAnnouncement: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const index = announcements.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      announcements[index].published = true;
      announcements[index].updatedAt = new Date();

      return {
        success: true,
        message: "公告已发布",
      };
    }),

  /**
   * 获取管理员公告列表
   */
  getAdminAnnouncements: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const total = announcements.length;
      const items = announcements
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(input.offset, input.offset + input.limit);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});
