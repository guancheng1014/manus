import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { registrationOrders } from "../drizzle/schema";
import { eq, and, like, desc, asc } from "drizzle-orm";

/**
 * 订单管理 tRPC 路由
 */
export const orderRouter = router({
  /**
   * 获取用户的订单列表（分页）
   */
  getOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
        searchOrderId: z.string().optional(),
        sortBy: z.enum(["createdAt", "paidAt", "amount"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // 构建查询条件
        const conditions = [eq(registrationOrders.userId, ctx.user!.id)];

        if (input.status) {
          conditions.push(eq(registrationOrders.status, input.status));
        }

        if (input.searchOrderId) {
          conditions.push(
            like(registrationOrders.orderId, `%${input.searchOrderId}%`)
          );
        }

        // 排序
        const orderByColumn =
          input.sortBy === "createdAt"
            ? registrationOrders.createdAt
            : input.sortBy === "paidAt"
              ? registrationOrders.paidAt
              : registrationOrders.amount;

        const orderByDirection =
          input.sortOrder === "desc" ? desc(orderByColumn) : asc(orderByColumn);

        // 查询总数
        const countResult = await db
          .select({ count: registrationOrders.id })
          .from(registrationOrders)
          .where(and(...conditions));

        const total = countResult[0]?.count || 0;

        // 查询数据
        const orders = await db
          .select()
          .from(registrationOrders)
          .where(and(...conditions))
          .orderBy(orderByDirection)
          .limit(input.limit)
          .offset(input.offset);

        return {
          orders: orders.map((order) => ({
            id: order.id,
            orderId: order.orderId,
            amount: order.amount,
            paymentMethod: order.paymentMethod as "alipay" | "wechat",
            status: order.status as "pending" | "paid" | "failed" | "refunded",
            transactionId: order.transactionId || undefined,
            quantity: order.quantity,
            paidAt: order.paidAt?.toISOString() || undefined,
            createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
          })),
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error("[Order Query Error]", error);
        throw error;
      }
    }),

  /**
   * 获取订单详情
   */
  getOrderDetail: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const order = await db
          .select()
          .from(registrationOrders)
          .where(
            and(
              eq(registrationOrders.orderId, input.orderId),
              eq(registrationOrders.userId, ctx.user!.id)
            )
          )
          .limit(1);

        if (!order.length) {
          throw new Error("Order not found");
        }

        const o = order[0];
        return {
          id: o.id,
          orderId: o.orderId,
          amount: o.amount,
          paymentMethod: o.paymentMethod as "alipay" | "wechat",
          status: o.status as "pending" | "paid" | "failed" | "refunded",
          transactionId: o.transactionId || undefined,
          quantity: o.quantity,
          paidAt: o.paidAt?.toISOString() || undefined,
          createdAt: o.createdAt?.toISOString() || new Date().toISOString(),

        };
      } catch (error) {
        console.error("[Order Detail Error]", error);
        throw error;
      }
    }),

  /**
   * 获取订单统计信息
   */
  getOrderStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const orders = await db
        .select()
        .from(registrationOrders)
        .where(eq(registrationOrders.userId, ctx.user!.id));

      const stats = {
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum: number, o) => sum + parseFloat(o.amount), 0),
        paidOrders: orders.filter((o) => o.status === "paid").length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        failedOrders: orders.filter((o) => o.status === "failed").length,
        refundedOrders: orders.filter((o) => o.status === "refunded").length,
        totalQuantity: orders.reduce((sum: number, o) => sum + o.quantity, 0),
      };

      return stats;
    } catch (error) {
      console.error("[Order Stats Error]", error);
      throw error;
    }
  }),

  /**
   * 导出订单数据（CSV 格式）
   */
  exportOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
        searchOrderId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const conditions = [eq(registrationOrders.userId, ctx.user!.id)];

        if (input.status) {
          conditions.push(eq(registrationOrders.status, input.status));
        }

        if (input.searchOrderId) {
          conditions.push(
            like(registrationOrders.orderId, `%${input.searchOrderId}%`)
          );
        }

        const orders = await db
          .select()
          .from(registrationOrders)
          .where(and(...conditions))
          .orderBy(desc(registrationOrders.createdAt));

        // 生成 CSV 数据
        const headers = [
          "订单号",
          "金额",
          "支付方式",
          "状态",
          "数量",
          "交易ID",
          "支付时间",
          "创建时间",
        ];
        const rows = orders.map((o) => [
          o.orderId,
          `¥${o.amount}`,
          o.paymentMethod === "alipay" ? "支付宝" : "微信支付",
          {
            pending: "待支付",
            paid: "已支付",
            failed: "支付失败",
            refunded: "已退款",
          }[o.status] || o.status,
          o.quantity.toString(),
          o.transactionId || "-",
          o.paidAt ? new Date(o.paidAt).toLocaleString("zh-CN") : "-",
          o.createdAt
            ? new Date(o.createdAt).toLocaleString("zh-CN")
            : new Date().toLocaleString("zh-CN"),
        ]);

        const csv = [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(","))
          .join("\n");

        return {
          csv,
          filename: `orders-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("[Order Export Error]", error);
        throw error;
      }
    }),
});
