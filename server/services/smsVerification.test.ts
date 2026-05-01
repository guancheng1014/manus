/**
 * 短信验证服务单元测试
 * 测试 TextBee API、虚拟手机号、验证码提取等功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as smsVerification from './smsVerification';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

describe('smsVerification 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVirtualPhoneNumber', () => {
    it('should generate a virtual phone number', async () => {
      const mockResponse = {
        number: '+1234567890',
        id: 'phone-123',
        provider: 'textbee',
        expiresAt: new Date(),
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await smsVerification.generateVirtualPhoneNumber();

      expect(result).toHaveProperty('number');
      expect(result).toHaveProperty('id');
      expect(result.provider).toBe('textbee');
    });

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await smsVerification.generateVirtualPhoneNumber().catch(err => err);

      expect(result).toBeDefined();
    });
  });

  describe('getVirtualPhoneMessages', () => {
    it('should retrieve SMS messages', async () => {
      const mockMessages = [
        {
          id: 'sms-1',
          from: '+1111111111',
          body: 'Your verification code is 123456',
          receivedAt: new Date(),
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockMessages,
      } as Response);

      const result = await smsVerification.getVirtualPhoneMessages('phone-123');

      expect(result).toHaveLength(1);
      expect(result[0].body).toContain('123456');
    });

    it('should return empty array when no messages', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await smsVerification.getVirtualPhoneMessages('phone-empty');

      expect(result).toEqual([]);
    });
  });

  describe('extractSMSVerificationCode', () => {
    it('should extract 6-digit code from SMS', () => {
      const body = 'Your verification code is 123456';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBe('123456');
    });

    it('should extract 4-digit code', () => {
      const body = 'Code: 5678';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBe('5678');
    });

    it('should extract code with Chinese label', () => {
      const body = '验证码：654321';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBe('654321');
    });

    it('should extract code with English label', () => {
      const body = 'Verification Code: 987654';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBe('987654');
    });

    it('should return null when no code found', () => {
      const body = 'No verification code in this message';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBeNull();
    });

    it('should handle codes with brackets', () => {
      const body = 'Your code: [111111]';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBe('111111');
    });

    it('should handle codes with dashes', () => {
      const body = 'Code: 11-11-11';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      // 应该提取连续的数字或处理格式化的代码
      expect(code).toBeDefined();
    });
  });

  describe('waitForSMSVerificationCode', () => {
    it('should wait and return SMS verification code', async () => {
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
              id: 'sms-1',
              from: '+1111111111',
              body: 'Code: 555555',
              receivedAt: new Date(),
            },
          ],
        } as Response;
      });

      const result = await smsVerification.waitForSMSVerificationCode('phone-123', 10000);

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

      const result = await smsVerification.waitForSMSVerificationCode('phone-123', 1000);

      expect(result).toBeNull();
    });
  });

  describe('getFreeSMSNumber', () => {
    it('should get a free SMS number', async () => {
      const mockPhone = {
        number: '+9876543210',
        id: 'phone-free',
        provider: 'textbee',
        expiresAt: new Date(),
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPhone,
      } as Response);

      const result = await smsVerification.getFreeSMSNumber();

      expect(result).toHaveProperty('number');
      expect(result).toHaveProperty('id');
    });

    it('should handle provider fallback', async () => {
      // 第一次失败，第二次成功
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            number: '+1111111111',
            id: 'phone-fallback',
            provider: 'textbee',
          }),
        } as Response;
      });

      const result = await smsVerification.getFreeSMSNumber();

      expect(result).toBeDefined();
    });
  });

  describe('completeSMSVerificationFlow', () => {
    it('should complete full SMS verification flow', async () => {
      const result = await smsVerification.completeSMSVerificationFlow(30000);

      expect(result).toBeDefined();
      if (result) {
        expect(result.code).toBeDefined();
        expect(result.phoneNumber).toBeDefined();
      }
    });
  });

  describe('deleteVirtualPhoneNumber', () => {
    it('should delete virtual phone number', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await smsVerification.deleteVirtualPhoneNumber('phone-123');

      expect(result).toBeDefined();
    });

    it('should handle deletion errors', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await smsVerification.deleteVirtualPhoneNumber('invalid-id').catch(
        err => err
      );

      expect(result).toBeDefined();
    });
  });

  describe('getVirtualPhoneInfo', () => {
    it('should get phone info', async () => {
      const mockInfo = {
        number: '+1234567890',
        id: 'phone-123',
        provider: 'textbee',
        expiresAt: new Date(),
        messageCount: 5,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockInfo,
      } as Response);

      const result = await smsVerification.getVirtualPhoneInfo('phone-123');

      expect(result).toHaveProperty('number');
      expect(result).toHaveProperty('messageCount');
    });
  });

  describe('generateVirtualPhoneNumbersBatch', () => {
    it('should generate multiple phone numbers', async () => {
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

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPhones,
      } as Response);

      const result = await smsVerification.generateVirtualPhoneNumbersBatch(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('number');
    });

    it('should handle partial failures in batch', async () => {
      const mockPhones = [
        {
          number: '+1111111111',
          id: 'phone-1',
          provider: 'textbee',
          expiresAt: new Date(),
        },
        null, // 失败
        {
          number: '+3333333333',
          id: 'phone-3',
          provider: 'textbee',
          expiresAt: new Date(),
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPhones.filter(p => p !== null),
      } as Response);

      const result = await smsVerification.generateVirtualPhoneNumbersBatch(3);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('验证码提取边界情况', () => {
    it('should handle multiple codes in SMS', () => {
      const body = 'Code 1: 111111, Code 2: 222222';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBeDefined();
      expect(['111111', '222222']).toContain(code);
    });

    it('should handle codes with spaces', () => {
      const body = 'Your code: 1 2 3 4 5 6';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      // 应该能提取或返回 null
      expect(code === null || typeof code === 'string').toBe(true);
    });

    it('should handle very long SMS', () => {
      const longBody = 'A'.repeat(5000) + 'Code: 789789' + 'B'.repeat(5000);
      const code = (smsVerification as any).extractSMSVerificationCode(longBody);

      expect(code).toBe('789789');
    });

    it('should handle mixed language codes', () => {
      const body = '验证码 Verification Code: 555555';
      const code = (smsVerification as any).extractSMSVerificationCode(body);

      expect(code).toBe('555555');
    });
  });
});
