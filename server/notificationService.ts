import { getDb } from "./db";
import { cardKeys, users, usageRecords } from "../drizzle/schema";
import { eq, lte, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * 通知服务
 */
export class NotificationService {
  /**
   * 检查并发送卡密即将到期的通知
   */
  static async checkAndNotifyExpiringCardKeys(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[NotificationService] Database not available");
        return;
      }

      // 获取即将到期的卡密（7 天内）
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringKeys = await db
        .select()
        .from(cardKeys)
        .where(
          and(
            lte(cardKeys.expiresAt, sevenDaysFromNow),
            eq(cardKeys.status, "active")
          )
        );

      if (expiringKeys.length > 0) {
        const summary = expiringKeys
          .map(
            (key) =>
              `卡密: ${key.keyCode} - 过期日期: ${key.expiresAt?.toLocaleDateString()}`
          )
          .join("\n");

        await notifyOwner({
          title: `⚠️ ${expiringKeys.length} 张卡密即将到期`,
          content: `以下卡密将在 7 天内到期，请及时处理：\n\n${summary}`,
        }).catch((err) => console.error("Failed to notify owner:", err));

        console.log(
          `[NotificationService] Sent expiring card keys notification for ${expiringKeys.length} keys`
        );
      }
    } catch (error) {
      console.error("[NotificationService] Error checking expiring keys:", error);
    }
  }

  /**
   * 发送新用户激活卡密的通知
   */
  static async notifyNewUserActivation(userId: number, cardKeyCode: string): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[NotificationService] Database not available");
        return;
      }

      // 获取用户信息
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (user.length === 0) {
        console.warn(`[NotificationService] User ${userId} not found`);
        return;
      }

      const userData = user[0];

      await notifyOwner({
        title: "🎉 新用户激活卡密",
        content: `用户 ${userData.name || userData.email || `ID: ${userId}`} 已激活卡密 ${cardKeyCode}`,
      }).catch((err) => console.error("Failed to notify owner:", err));

      console.log(`[NotificationService] Sent new user activation notification for user ${userId}`);
    } catch (error) {
      console.error("[NotificationService] Error sending activation notification:", error);
    }
  }

  /**
   * 发送注册任务完成通知
   */
  static async notifyTaskCompletion(
    userId: number,
    taskId: number,
    successCount: number,
    failureCount: number,
    successRate: number
  ): Promise<void> {
    try {
      const totalCount = successCount + failureCount;

      await notifyOwner({
        title: `✅ 注册任务 #${taskId} 已完成`,
        content: `用户 ID: ${userId}\n总数: ${totalCount}\n成功: ${successCount}\n失败: ${failureCount}\n成功率: ${(successRate * 100).toFixed(2)}%`,
      }).catch((err) => console.error("Failed to notify owner:", err));

      console.log(
        `[NotificationService] Sent task completion notification for task ${taskId}`
      );
    } catch (error) {
      console.error("[NotificationService] Error sending task completion notification:", error);
    }
  }

  /**
   * 发送异常使用提醒
   */
  static async notifyAnomalousUsage(userId: number, reason: string): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[NotificationService] Database not available");
        return;
      }

      // 获取用户信息
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (user.length === 0) {
        console.warn(`[NotificationService] User ${userId} not found`);
        return;
      }

      const userData = user[0];

      await notifyOwner({
        title: "⚠️ 异常使用提醒",
        content: `用户 ${userData.name || userData.email || `ID: ${userId}`} 检测到异常使用：\n${reason}`,
      }).catch((err) => console.error("Failed to notify owner:", err));

      console.log(`[NotificationService] Sent anomalous usage notification for user ${userId}`);
    } catch (error) {
      console.error("[NotificationService] Error sending anomalous usage notification:", error);
    }
  }

  /**
   * 定时任务：每天检查即将到期的卡密
   */
  static startDailyExpiryCheck(): void {
    // 每天早上 8 点检查一次
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const timeUntilCheck = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.checkAndNotifyExpiringCardKeys();

      // 之后每天运行一次
      setInterval(() => {
        this.checkAndNotifyExpiringCardKeys();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilCheck);

    console.log(
      `[NotificationService] Daily expiry check scheduled for ${tomorrow.toLocaleString()}`
    );
  }
}
