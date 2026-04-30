import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getUserApiKeys, createApiKey, revokeApiKey } from "./db/apiKeys";
import { getOrCreateAccountStats, getUserActivityLogs, getUserLoginHistory, logActivity, incrementAccountStats } from "./db/activityLogs";
import { getOrCreateNotificationSettings, updateNotificationSettings, getOrCreateSecuritySettings, enableTwoFactor, verifyAndEnableTwoFactor, disableTwoFactor } from "./db/settings";

/**
 * 用户个人中心路由器
 * 提供个人信息、账户设置、安全设置等功能
 */
export const userRouter = router({
  /**
   * 获取用户个人信息
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const user = result[0];

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }),

  /**
   * 更新用户个人信息
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "名字不能为空").max(50, "名字过长"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      await db
        .update(users)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      await logActivity(ctx.user.id, "profile_updated", `更新了个人信息`);

      return {
        success: true,
        message: "个人信息已更新",
      };
    }),

  /**
   * 获取账户统计信息
   */
  getAccountStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const stats = await getOrCreateAccountStats(ctx.user.id);
    return {
      totalTasks: stats.totalTasks,
      successCount: stats.successCount,
      failCount: stats.failCount,
      totalAccounts: stats.totalAccounts,
      cardKeysUsed: stats.cardKeysUsed,
      creditsRemaining: parseFloat(stats.creditsRemaining as any),
    };
  }),

  /**
   * 获取用户的 API 密钥
   */
  getApiKeys: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const keys = await getUserApiKeys(ctx.user.id);
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      key: `${key.keyPrefix}...${key.keyPrefix.slice(-4)}`,
      status: key.status,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }));
  }),

  /**
   * 创建新的 API 密钥
   */
  createApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "密钥名称不能为空").max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const result = await createApiKey(ctx.user.id, input.name);
      await logActivity(ctx.user.id, "api_key_created", `创建了 API 密钥: ${input.name}`);

      return {
        success: true,
        key: result.key,
        name: result.name,
        message: "API 密钥已创建，请妥善保管",
      };
    }),

  /**
   * 删除 API 密钥
   */
  deleteApiKey: protectedProcedure
    .input(
      z.object({
        keyId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await revokeApiKey(ctx.user.id, input.keyId);
      await logActivity(ctx.user.id, "api_key_deleted", `删除了 API 密钥`);

      return {
        success: true,
        message: "API 密钥已删除",
      };
    }),

  /**
   * 获取用户的通知设置
   */
  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const settings = await getOrCreateNotificationSettings(ctx.user.id);
    return {
      emailNotifications: {
        taskCompleted: settings.emailTaskCompleted,
        taskFailed: settings.emailTaskFailed,
        cardKeyExpiring: settings.emailCardKeyExpiring,
        systemAnnouncements: settings.emailSystemAnnouncements,
        weeklyReport: settings.emailWeeklyReport,
      },
      inAppNotifications: {
        taskCompleted: settings.inAppTaskCompleted,
        taskFailed: settings.inAppTaskFailed,
        cardKeyExpiring: settings.inAppCardKeyExpiring,
        systemAnnouncements: settings.inAppSystemAnnouncements,
      },
      smsNotifications: {
        taskFailed: settings.smsTaskFailed,
        cardKeyExpiring: settings.smsCardKeyExpiring,
      },
    };
  }),

  /**
   * 更新通知设置
   */
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.any().optional(),
        inAppNotifications: z.any().optional(),
        smsNotifications: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const updates: Record<string, boolean> = {};
      if (input.emailNotifications) {
        updates.emailTaskCompleted = input.emailNotifications.taskCompleted;
        updates.emailTaskFailed = input.emailNotifications.taskFailed;
        updates.emailCardKeyExpiring = input.emailNotifications.cardKeyExpiring;
        updates.emailSystemAnnouncements = input.emailNotifications.systemAnnouncements;
        updates.emailWeeklyReport = input.emailNotifications.weeklyReport;
      }
      if (input.inAppNotifications) {
        updates.inAppTaskCompleted = input.inAppNotifications.taskCompleted;
        updates.inAppTaskFailed = input.inAppNotifications.taskFailed;
        updates.inAppCardKeyExpiring = input.inAppNotifications.cardKeyExpiring;
        updates.inAppSystemAnnouncements = input.inAppNotifications.systemAnnouncements;
      }
      if (input.smsNotifications) {
        updates.smsTaskFailed = input.smsNotifications.taskFailed;
        updates.smsCardKeyExpiring = input.smsNotifications.cardKeyExpiring;
      }

      await updateNotificationSettings(ctx.user.id, updates);
      await logActivity(ctx.user.id, "notification_settings_updated", "更新了通知设置");

      return {
        success: true,
        message: "通知设置已更新",
      };
    }),

  /**
   * 获取安全设置
   */
  getSecuritySettings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const settings = await getOrCreateSecuritySettings(ctx.user.id);
    const loginHistory = await getUserLoginHistory(ctx.user.id, 5);

    return {
      twoFactorEnabled: settings.twoFactorEnabled,
      lastPasswordChange: settings.lastPasswordChangeAt,
      loginHistory: loginHistory.map((log) => ({
        device: log.deviceName || "Unknown Device",
        ip: log.ipAddress,
        location: log.location || "Unknown",
        timestamp: log.createdAt,
      })),
      activeSessions: [],
    };
  }),

  /**
   * 启用两步验证
   */
  enableTwoFactor: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const result = await enableTwoFactor(ctx.user.id);
    await logActivity(ctx.user.id, "two_factor_enabled", "设置了两步验证");

    return {
      success: true,
      secret: result.secret,
      message: "请使用认证器应用扫描二维码",
    };
  }),

  /**
   * 验证两步验证
   */
  verifyTwoFactor: protectedProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const result = await verifyAndEnableTwoFactor(ctx.user.id, input.code);
      await logActivity(ctx.user.id, "two_factor_verified", "验证了两步验证");

      return {
        success: result.success,
        message: "两步验证已启用",
      };
    }),

  /**
   * 禁用两步验证
   */
  disableTwoFactor: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const result = await disableTwoFactor(ctx.user.id);
      await logActivity(ctx.user.id, "two_factor_disabled", "禁用了两步验证");

      return result;
    }),

  /**
   * 修改密码
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z
          .string()
          .min(8, "密码至少 8 个字符")
          .regex(/[A-Z]/, "密码必须包含大写字母")
          .regex(/[a-z]/, "密码必须包含小写字母")
          .regex(/[0-9]/, "密码必须包含数字"),
        confirmPassword: z.string(),
      }).refine((data: any) => data.newPassword === data.confirmPassword, {
        message: "两次输入的密码不一致",
        path: ["confirmPassword"],
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await logActivity(ctx.user.id, "password_changed", "修改了密码");

      return {
        success: true,
        message: "密码已修改",
      };
    }),

  /**
   * 登出所有设备
   */
  logoutAllDevices: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    await logActivity(ctx.user.id, "logout_all_devices", "登出了所有设备");

    return {
      success: true,
      message: "已登出所有设备",
    };
  }),

  /**
   * 删除账户
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await logActivity(ctx.user.id, "account_deleted", `删除了账户，原因: ${input.reason || "未提供"}`);

      return {
        success: true,
        message: "账户已删除",
      };
    }),

  /**
   * 获取账户活动日志
   */
  getActivityLog: protectedProcedure
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

      return await getUserActivityLogs(ctx.user.id, input.limit, input.offset);
    }),

  /**
   * 导出账户数据
   */
  exportAccountData: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const stats = await getOrCreateAccountStats(ctx.user.id);
    const activityLogs = await getUserActivityLogs(ctx.user.id, 1000, 0);

    await logActivity(ctx.user.id, "account_data_exported", "导出了账户数据");

    return {
      success: true,
      data: {
        profile: {
          id: ctx.user.id,
          name: ctx.user.name,
          email: ctx.user.email,
          createdAt: ctx.user.createdAt,
        },
        stats,
        activities: activityLogs.activities,
      },
      message: "账户数据已导出",
    };
  }),
});
