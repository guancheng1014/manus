/**
 * 邮箱和短信验证路由
 * 提供 Outlook 创建、邮箱验证码和短信验证码的 tRPC 接口
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import * as outlookCreator from './services/outlookCreator';
import * as emailVerification from './services/emailVerification';
import * as smsVerification from './services/smsVerification';

export const verificationRouter = router({
  // ========== Outlook 创建接口 ==========
  
  createOutlookAccount: publicProcedure
    .input(z.object({
      proxyUrl: z.string().optional(),
      captchaKey: z.string().optional(),
    }))
    .mutation(async ({ input }: { input: { proxyUrl?: string; captchaKey?: string } }) => {
      const account = await outlookCreator.createOutlookAccount({
        proxyUrl: input.proxyUrl,
        captchaKey: input.captchaKey,
      });
      
      return {
        success: account.status === 'success',
        email: account.email,
        password: account.password,
        error: account.error,
        createdAt: account.createdAt,
      };
    }),

  createOutlookAccountsBatch: publicProcedure
    .input(z.object({
      count: z.number().min(1).max(100),
      proxyUrl: z.string().optional(),
      captchaKey: z.string().optional(),
    }))
    .mutation(async ({ input }: { input: { count: number; proxyUrl?: string; captchaKey?: string } }) => {
      const accounts = await outlookCreator.createOutlookAccountsBatch(
        input.count,
        {
          proxyUrl: input.proxyUrl,
          captchaKey: input.captchaKey,
        }
      );
      
      return {
        total: accounts.length,
        success: accounts.filter(a => a.status === 'success').length,
        failed: accounts.filter(a => a.status === 'failed').length,
        accounts: accounts.map(a => ({
          email: a.email,
          password: a.password,
          status: a.status,
          error: a.error,
        })),
      };
    }),

  verifyOutlookAccount: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }: { input: { email: string; password: string } }) => {
      const isValid = await outlookCreator.verifyOutlookAccount(
        input.email,
        input.password
      );
      
      return { valid: isValid };
    }),

  getOutlookAccountInfo: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .query(async ({ input }: { input: { email: string; password: string } }) => {
      const info = await outlookCreator.getOutlookAccountInfo(
        input.email,
        input.password
      );
      
      return info;
    }),

  // ========== 邮箱验证码接口 ==========

  generateTempMail: publicProcedure
    .mutation(async () => {
      const tempMail = await emailVerification.generateTempMailAddress();
      
      return {
        address: tempMail.address,
        id: tempMail.id,
        expiresAt: tempMail.expiresAt,
      };
    }),

  getTempMailMessages: publicProcedure
    .input(z.object({
      tempMailId: z.string(),
    }))
    .query(async ({ input }: { input: { tempMailId: string } }) => {
      const messages = await emailVerification.getTempMailMessages(input.tempMailId);
      
      return messages.map(m => ({
        id: m.id,
        from: m.from,
        subject: m.subject,
        body: m.body,
        receivedAt: m.receivedAt,
      }));
    }),

  waitForEmailVerificationCode: publicProcedure
    .input(z.object({
      tempMailId: z.string(),
      timeout: z.number().optional(),
    }))
    .mutation(async ({ input }: { input: { tempMailId: string; timeout?: number } }) => {
      const code = await emailVerification.waitForVerificationCode(
        input.tempMailId,
        input.timeout
      );
      
      if (!code) {
        return { success: false, error: '未收到验证码' };
      }
      
      return {
        success: true,
        code: code.code,
        email: code.email,
        source: code.source,
      };
    }),

  getVerificationCodeFromOutlook: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      timeout: z.number().optional(),
    }))
    .mutation(async ({ input }: { input: { email: string; password: string; timeout?: number } }) => {
      const code = await emailVerification.getVerificationCodeFromOutlook(
        input.email,
        input.password,
        input.timeout
      );
      
      if (!code) {
        return { success: false, error: '未收到验证码' };
      }
      
      return {
        success: true,
        code: code.code,
        email: code.email,
        source: code.source,
      };
    }),

  completeEmailVerification: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }: { input: { email: string; password?: string } }) => {
      const code = await emailVerification.completeEmailVerificationFlow(
        input.email,
        input.password
      );
      
      if (!code) {
        return { success: false, error: '邮箱验证失败' };
      }
      
      return {
        success: true,
        code: code.code,
        email: code.email,
        source: code.source,
      };
    }),

  // ========== 短信验证码接口 ==========

  generateVirtualPhoneNumber: publicProcedure
    .mutation(async () => {
      const phone = await smsVerification.generateVirtualPhoneNumber();
      
      return {
        number: phone.number,
        id: phone.id,
        provider: phone.provider,
        expiresAt: phone.expiresAt,
      };
    }),

  getVirtualPhoneMessages: publicProcedure
    .input(z.object({
      phoneId: z.string(),
    }))
    .query(async ({ input }: { input: { phoneId: string } }) => {
      const messages = await smsVerification.getVirtualPhoneMessages(input.phoneId);
      
      return messages.map(m => ({
        id: m.id,
        from: m.from,
        body: m.body,
        receivedAt: m.receivedAt,
      }));
    }),

  waitForSMSVerificationCode: publicProcedure
    .input(z.object({
      phoneId: z.string(),
      timeout: z.number().optional(),
    }))
    .mutation(async ({ input }: { input: { phoneId: string; timeout?: number } }) => {
      const code = await smsVerification.waitForSMSVerificationCode(
        input.phoneId,
        input.timeout
      );
      
      if (!code) {
        return { success: false, error: '未收到验证码' };
      }
      
      return {
        success: true,
        code: code.code,
        phoneNumber: code.phoneNumber,
        source: code.source,
      };
    }),

  completeSMSVerification: publicProcedure
    .input(z.object({
      timeout: z.number().optional(),
    }))
    .mutation(async ({ input }: { input: { timeout?: number } }) => {
      const code = await smsVerification.completeSMSVerificationFlow(input.timeout);
      
      if (!code) {
        return { success: false, error: '短信验证失败' };
      }
      
      return {
        success: true,
        code: code.code,
        phoneNumber: code.phoneNumber,
        source: code.source,
      };
    }),

  generateVirtualPhoneNumbersBatch: publicProcedure
    .input(z.object({
      count: z.number().min(1).max(100),
    }))
    .mutation(async ({ input }: { input: { count: number } }) => {
      const phones = await smsVerification.generateVirtualPhoneNumbersBatch(input.count);
      
      return {
        total: phones.length,
        phones: phones.map(p => ({
          number: p.number,
          id: p.id,
          provider: p.provider,
          expiresAt: p.expiresAt,
        })),
      };
    }),

  getVirtualPhoneInfo: publicProcedure
    .input(z.object({
      phoneId: z.string(),
    }))
    .query(async ({ input }: { input: { phoneId: string } }) => {
      const info = await smsVerification.getVirtualPhoneInfo(input.phoneId);
      return info;
    }),
});
