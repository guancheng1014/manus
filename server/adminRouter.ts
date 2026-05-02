/**
 * 管理员专用路由
 * 提供邮箱库管理、代理池监控和系统状态查看的 tRPC 接口
 */

import { z } from 'zod';
import { adminProcedure, router } from './_core/trpc';
import { db } from './db';
import { emailPool, users } from '../drizzle/schema';
import { desc, eq, sql } from 'drizzle-orm';
import axios from 'axios';

export const adminRouter = router({
  // ========== 邮箱库管理 ==========
  
  getEmailPool: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      status: z.enum(['available', 'assigned', 'invalid', 'registered']).optional(),
    }))
    .query(async ({ input }) => {
      const where = input.status ? eq(emailPool.status, input.status) : undefined;
      
      const items = await db.select()
        .from(emailPool)
        .where(where)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(emailPool.createdAt));
        
      const total = await db.select({ count: sql<number>`count(*)` })
        .from(emailPool)
        .where(where);
        
      return {
        items,
        total: total[0].count,
      };
    }),

  addEmailToPool: adminProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      source: z.string().default('manual'),
    }))
    .mutation(async ({ input }) => {
      await db.insert(emailPool).values({
        email: input.email,
        password: input.password,
        source: input.source,
        status: 'available',
      });
      return { success: true };
    }),

  deleteEmailFromPool: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(emailPool).where(eq(emailPool.id, input.id));
      return { success: true };
    }),

  // ========== 代理池监控 ==========

  getProxyStats: adminProcedure
    .query(async () => {
      try {
        const response = await axios.get('http://localhost:8080/stats', { timeout: 2000 });
        return {
          online: true,
          ...response.data
        };
      } catch (e) {
        return {
          online: false,
          proxy_count: 0,
          alive_count: 0,
          error: '无法连接到 Worldpool 服务'
        };
      }
    }),

  getProxyList: adminProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      try {
        const response = await axios.get(`http://localhost:8080/proxies?limit=${input.limit}`, { timeout: 2000 });
        return response.data;
      } catch (e) {
        return { proxy: [], proxy_count: 0 };
      }
    }),

  // ========== 系统状态与监控 ==========

  getSystemOverview: adminProcedure
    .query(async () => {
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      const emailCount = await db.select({ 
        status: emailPool.status, 
        count: sql<number>`count(*)` 
      }).from(emailPool).groupBy(emailPool.status);
      
      // 检查 EzSolver 状态
      let ezSolverStatus = 'offline';
      try {
        const ez = await axios.get('http://localhost:8191/health', { timeout: 1000 });
        if (ez.data.status === 'ok') ezSolverStatus = 'online';
      } catch (e) {}

      return {
        users: userCount[0].count,
        emails: emailCount,
        ezSolver: ezSolverStatus,
        timestamp: new Date().toISOString(),
      };
    }),
});
