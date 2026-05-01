/**
 * 验证路由单元测试
 * 测试 Outlook 创建、邮箱验证、短信验证的 tRPC 接口
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verificationRouter } from './verificationRouter';
import * as outlookCreator from './services/outlookCreator';
import * as emailVerification from './services/emailVerification';
import * as smsVerification from './services/smsVerification';

// Mock 服务
vi.mock('./services/outlookCreator');
vi.mock('./services/emailVerification');
vi.mock('./services/smsVerification');

describe('verificationRouter', () => {
  const caller = verificationRouter.createCaller({});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Outlook 创建测试 ==========
  describe('Outlook 账户创建', () => {
    it('should create a single Outlook account', async () => {
      const mockAccount = {
        email: 'test@outlook.com',
        password: 'TestPassword123!',
        status: 'success' as const,
        error: null,
        createdAt: new Date(),
      };

      vi.mocked(outlookCreator.createOutlookAccount).mockResolvedValue(mockAccount);

      const result = await caller.createOutlookAccount({
        proxyUrl: 'http://proxy.example.com:8080',
        captchaKey: 'test-key',
      });

      expect(result).toEqual({
        success: true,
        email: 'test@outlook.com',
        password: 'TestPassword123!',
        error: null,
        createdAt: mockAccount.createdAt,
      });
    });

    it('should handle Outlook creation failure', async () => {
      const mockAccount = {
        email: null,
        password: null,
        status: 'failed' as const,
        error: 'Creation failed',
        createdAt: new Date(),
      };

      vi.mocked(outlookCreator.createOutlookAccount).mockResolvedValue(mockAccount);

      const result = await caller.createOutlookAccount({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Creation failed');
    });

    it('should create multiple Outlook accounts', async () => {
      const mockAccounts = [
        {
          email: 'test1@outlook.com',
          password: 'Pass1!',
          status: 'success' as const,
          error: null,
        },
        {
          email: 'test2@outlook.com',
          password: 'Pass2!',
          status: 'success' as const,
          error: null,
        },
      ];

      vi.mocked(outlookCreator.createOutlookAccountsBatch).mockResolvedValue(mockAccounts);

      const result = await caller.createOutlookAccountsBatch({
        count: 2,
        proxyUrl: 'http://proxy.example.com:8080',
      });

      expect(result.total).toBe(2);
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.accounts).toHaveLength(2);
    });

    it('should verify Outlook account', async () => {
      vi.mocked(outlookCreator.verifyOutlookAccount).mockResolvedValue(true);

      const result = await caller.verifyOutlookAccount({
        email: 'test@outlook.com',
        password: 'TestPassword123!',
      });

      expect(result.valid).toBe(true);
    });

    it('should get Outlook account info', async () => {
      const mockInfo = {
        email: 'test@outlook.com',
        displayName: 'Test User',
        createdDate: new Date(),
        lastLogin: new Date(),
      };

      vi.mocked(outlookCreator.getOutlookAccountInfo).mockResolvedValue(mockInfo);

      const result = await caller.getOutlookAccountInfo({
        email: 'test@outlook.com',
        password: 'TestPassword123!',
      });

      expect(result).toEqual(mockInfo);
    });
  });

  // ========== 邮箱验证测试 ==========
  describe('邮箱验证码接收', () => {
    it('should generate temporary mail address', async () => {
      const mockMail = {
        address: 'test123@temp-mail.org',
        id: 'temp-mail-123',
        expiresAt: new Date(),
      };

      vi.mocked(emailVerification.generateTempMailAddress).mockResolvedValue(mockMail);

      const result = await caller.generateTempMail();

      expect(result).toEqual({
        address: 'test123@temp-mail.org',
        id: 'temp-mail-123',
        expiresAt: mockMail.expiresAt,
      });
    });

    it('should get temp mail messages', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          from: 'noreply@example.com',
          subject: 'Verification Code',
          body: 'Your code is 123456',
          receivedAt: new Date(),
        },
      ];

      vi.mocked(emailVerification.getTempMailMessages).mockResolvedValue(mockMessages);

      const result = await caller.getTempMailMessages({
        tempMailId: 'temp-mail-123',
      });

      expect(result).toHaveLength(1);
      expect(result[0].body).toBe('Your code is 123456');
    });

    it('should wait for email verification code', async () => {
      const mockCode = {
        code: '123456',
        email: 'test123@temp-mail.org',
        source: 'temp-mail',
      };

      vi.mocked(emailVerification.waitForVerificationCode).mockResolvedValue(mockCode);

      const result = await caller.waitForEmailVerificationCode({
        tempMailId: 'temp-mail-123',
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('123456');
    });

    it('should handle email verification timeout', async () => {
      vi.mocked(emailVerification.waitForVerificationCode).mockResolvedValue(null);

      const result = await caller.waitForEmailVerificationCode({
        tempMailId: 'temp-mail-123',
        timeout: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('未收到验证码');
    });

    it('should get verification code from Outlook', async () => {
      const mockCode = {
        code: '654321',
        email: 'test@outlook.com',
        source: 'outlook-imap',
      };

      vi.mocked(emailVerification.getVerificationCodeFromOutlook).mockResolvedValue(mockCode);

      const result = await caller.getVerificationCodeFromOutlook({
        email: 'test@outlook.com',
        password: 'TestPassword123!',
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('654321');
      expect(result.source).toBe('outlook-imap');
    });

    it('should complete email verification flow', async () => {
      const mockCode = {
        code: '789012',
        email: 'test@outlook.com',
        source: 'outlook-imap',
      };

      vi.mocked(emailVerification.completeEmailVerificationFlow).mockResolvedValue(mockCode);

      const result = await caller.completeEmailVerification({
        email: 'test@outlook.com',
        password: 'TestPassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('789012');
    });
  });

  // ========== 短信验证测试 ==========
  describe('短信验证码接收', () => {
    it('should generate virtual phone number', async () => {
      const mockPhone = {
        number: '+1234567890',
        id: 'phone-123',
        provider: 'textbee',
        expiresAt: new Date(),
      };

      vi.mocked(smsVerification.generateVirtualPhoneNumber).mockResolvedValue(mockPhone);

      const result = await caller.generateVirtualPhoneNumber();

      expect(result).toEqual({
        number: '+1234567890',
        id: 'phone-123',
        provider: 'textbee',
        expiresAt: mockPhone.expiresAt,
      });
    });

    it('should get virtual phone messages', async () => {
      const mockMessages = [
        {
          id: 'sms-1',
          from: '+1111111111',
          body: 'Your verification code is 555555',
          receivedAt: new Date(),
        },
      ];

      vi.mocked(smsVerification.getVirtualPhoneMessages).mockResolvedValue(mockMessages);

      const result = await caller.getVirtualPhoneMessages({
        phoneId: 'phone-123',
      });

      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('555555');
    });

    it('should wait for SMS verification code', async () => {
      const mockCode = {
        code: '555555',
        phoneNumber: '+1234567890',
        source: 'textbee',
      };

      vi.mocked(smsVerification.waitForSMSVerificationCode).mockResolvedValue(mockCode);

      const result = await caller.waitForSMSVerificationCode({
        phoneId: 'phone-123',
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('555555');
    });

    it('should handle SMS verification timeout', async () => {
      vi.mocked(smsVerification.waitForSMSVerificationCode).mockResolvedValue(null);

      const result = await caller.waitForSMSVerificationCode({
        phoneId: 'phone-123',
        timeout: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('未收到验证码');
    });

    it('should complete SMS verification flow', async () => {
      const mockCode = {
        code: '999999',
        phoneNumber: '+1234567890',
        source: 'textbee',
      };

      vi.mocked(smsVerification.completeSMSVerificationFlow).mockResolvedValue(mockCode);

      const result = await caller.completeSMSVerification({
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.code).toBe('999999');
    });

    it('should generate multiple virtual phone numbers', async () => {
      const mockPhones = [
        {
          number: '+1111111111',
          id: 'phone-1',
          provider: 'textbee',
          expiresAt: new Date(),
        },
        {
          number: '+2222222222',
          id: 'phone-2',
          provider: 'textbee',
          expiresAt: new Date(),
        },
      ];

      vi.mocked(smsVerification.generateVirtualPhoneNumbersBatch).mockResolvedValue(mockPhones);

      const result = await caller.generateVirtualPhoneNumbersBatch({
        count: 2,
      });

      expect(result.total).toBe(2);
      expect(result.phones).toHaveLength(2);
    });

    it('should get virtual phone info', async () => {
      const mockInfo = {
        number: '+1234567890',
        id: 'phone-123',
        provider: 'textbee',
        expiresAt: new Date(),
        messageCount: 5,
      };

      vi.mocked(smsVerification.getVirtualPhoneInfo).mockResolvedValue(mockInfo);

      const result = await caller.getVirtualPhoneInfo({
        phoneId: 'phone-123',
      });

      expect(result).toEqual(mockInfo);
    });
  });

  // ========== 边界情况测试 ==========
  describe('边界情况', () => {
    it('should handle invalid email format', async () => {
      const result = await caller.verifyOutlookAccount({
        email: 'invalid-email',
        password: 'TestPassword123!',
      }).catch(err => ({ error: err.message }));

      expect(result).toHaveProperty('error');
    });

    it('should handle batch count limits', async () => {
      const result = await caller.createOutlookAccountsBatch({
        count: 150, // 超过限制
      }).catch(err => ({ error: err.message }));

      expect(result).toHaveProperty('error');
    });

    it('should handle SMS batch count limits', async () => {
      const result = await caller.generateVirtualPhoneNumbersBatch({
        count: 150, // 超过限制
      }).catch(err => ({ error: err.message }));

      expect(result).toHaveProperty('error');
    });
  });
});
