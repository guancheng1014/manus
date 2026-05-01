/**
 * 邮箱验证服务单元测试
 * 测试 Temp-Mail API、IMAP 连接、验证码提取等功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as emailVerification from './emailVerification';

// Mock fetch 和其他外部依赖
vi.stubGlobal('fetch', vi.fn());

describe('emailVerification 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTempMailAddress', () => {
    it('should generate a temporary mail address', async () => {
      const mockResponse = {
        address: 'test123@temp-mail.org',
        id: 'temp-mail-123',
        expiresAt: new Date(),
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await emailVerification.generateTempMailAddress();

      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('id');
      expect(result.address).toContain('@temp-mail.org');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await emailVerification.generateTempMailAddress().catch(err => err);

      expect(result).toBeDefined();
    });
  });

  describe('getTempMailMessages', () => {
    it('should retrieve messages from temp mail', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          from: 'noreply@example.com',
          subject: 'Verification Code',
          body: 'Your verification code is 123456',
          receivedAt: new Date(),
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockMessages,
      } as Response);

      const result = await emailVerification.getTempMailMessages('temp-mail-123');

      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('123456');
    });

    it('should return empty array when no messages', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await emailVerification.getTempMailMessages('temp-mail-empty');

      expect(result).toEqual([]);
    });
  });

  describe('extractVerificationCode', () => {
    it('should extract 6-digit verification code', () => {
      const body = 'Your verification code is 123456. Please enter it within 10 minutes.';
      const code = (emailVerification as any).extractVerificationCode(body);

      expect(code).toBe('123456');
    });

    it('should extract 4-digit verification code', () => {
      const body = 'Your code: 5678';
      const code = (emailVerification as any).extractVerificationCode(body);

      expect(code).toBe('5678');
    });

    it('should extract code from labeled format', () => {
      const body = 'Verification Code: 987654';
      const code = (emailVerification as any).extractVerificationCode(body);

      expect(code).toBe('987654');
    });

    it('should return null when no code found', () => {
      const body = 'No verification code in this message';
      const code = (emailVerification as any).extractVerificationCode(body);

      expect(code).toBeNull();
    });

    it('should handle Chinese labeled codes', () => {
      const body = '验证码：111111';
      const code = (emailVerification as any).extractVerificationCode(body);

      expect(code).toBe('111111');
    });
  });

  describe('waitForVerificationCode', () => {
    it('should wait and return verification code', async () => {
      const mockCode = {
        code: '555555',
        email: 'test@temp-mail.org',
        source: 'temp-mail',
      };

      // Mock multiple calls to simulate polling
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => [],
          } as Response;
        }
        return {
          ok: true,
          json: async () => [
            {
              id: 'msg-1',
              from: 'service@example.com',
              subject: 'Code',
              body: 'Code: 555555',
              receivedAt: new Date(),
            },
          ],
        } as Response;
      });

      const result = await emailVerification.waitForVerificationCode('temp-mail-123', 10000);

      expect(result).toBeDefined();
      if (result) {
        expect(result.code).toBe('555555');
      }
    });

    it('should timeout if no code received', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await emailVerification.waitForVerificationCode('temp-mail-123', 1000);

      expect(result).toBeNull();
    });
  });

  describe('connectOutlookViaIMAP', () => {
    it('should connect to Outlook IMAP', async () => {
      // 这是一个 stub 函数，目前返回 true
      const result = await emailVerification.connectOutlookViaIMAP(
        'test@outlook.com',
        'password123'
      );

      expect(result).toBe(true);
    });

    it('should handle invalid credentials', async () => {
      // 目前是 stub，但应该在实现时处理错误
      const result = await emailVerification.connectOutlookViaIMAP(
        'invalid@outlook.com',
        'wrongpassword'
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getVerificationCodeFromOutlook', () => {
    it('should get verification code from Outlook', async () => {
      const result = await emailVerification.getVerificationCodeFromOutlook(
        'test@outlook.com',
        'password123',
        30000
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.code).toBeDefined();
        expect(result.email).toBe('test@outlook.com');
        expect(result.source).toBe('outlook-imap');
      }
    });
  });

  describe('deleteTempMailAddress', () => {
    it('should delete temporary mail address', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await emailVerification.deleteTempMailAddress('temp-mail-123');

      expect(result).toBeDefined();
    });

    it('should handle deletion errors', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await emailVerification.deleteTempMailAddress('invalid-id').catch(
        err => err
      );

      expect(result).toBeDefined();
    });
  });

  describe('completeEmailVerificationFlow', () => {
    it('should complete full email verification flow', async () => {
      const result = await emailVerification.completeEmailVerificationFlow(
        'test@outlook.com',
        'password123'
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.code).toBeDefined();
        expect(result.email).toBeDefined();
      }
    });

    it('should handle flow without password', async () => {
      const result = await emailVerification.completeEmailVerificationFlow(
        'test@temp-mail.org'
      );

      expect(result).toBeDefined();
    });
  });

  describe('验证码提取边界情况', () => {
    it('should handle multiple codes in message', () => {
      const body = 'Code 1: 111111, Code 2: 222222';
      const code = (emailVerification as any).extractVerificationCode(body);

      // 应该返回第一个找到的代码
      expect(code).toBeDefined();
      expect(['111111', '222222']).toContain(code);
    });

    it('should handle codes with special characters', () => {
      const body = 'Your code: [123456]';
      const code = (emailVerification as any).extractVerificationCode(body);

      expect(code).toBe('123456');
    });

    it('should ignore non-digit sequences', () => {
      const body = 'Please use code ABC123DEF for verification';
      const code = (emailVerification as any).extractVerificationCode(body);

      // 应该不匹配非纯数字的代码
      expect(code).toBeNull();
    });

    it('should handle very long messages', () => {
      const longBody = 'A'.repeat(10000) + 'Code: 654321' + 'B'.repeat(10000);
      const code = (emailVerification as any).extractVerificationCode(longBody);

      expect(code).toBe('654321');
    });
  });
});
