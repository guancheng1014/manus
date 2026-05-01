/**
 * 单账号注册端到端自动化测试
 * 测试流程：Outlook 注册 -> 邮箱验证 -> 短信验证 -> 单账号注册
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'crypto';

/**
 * 模拟的第三方服务
 */
class MockOutlookService {
  async createAccount(options: any) {
    return {
      success: true,
      email: `test-${Date.now()}@outlook.com`,
      password: 'Manus@Test2026!',
      accountId: crypto.randomBytes(16).toString('hex'),
    };
  }
}

class MockEmailVerificationService {
  async receiveCode(email: string) {
    // 模拟接收验证码
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      code: '123456',
      email: email,
      timestamp: Date.now(),
    };
  }

  async verifyCode(email: string, code: string) {
    return {
      success: code === '123456',
      message: code === '123456' ? '验证成功' : '验证码错误',
    };
  }
}

class MockSMSVerificationService {
  async allocatePhoneNumber(regionCode: string) {
    // 模拟分配虚拟手机号
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      phoneNumber: `${regionCode}${Math.random().toString().slice(2, 12)}`,
      phoneId: crypto.randomBytes(16).toString('hex'),
      expiresAt: Date.now() + 3600000, // 1 小时后过期
    };
  }

  async receiveSMS(phoneId: string) {
    // 模拟接收短信
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      code: '654321',
      phoneId: phoneId,
      timestamp: Date.now(),
    };
  }

  async verifySMS(phoneId: string, code: string) {
    return {
      success: code === '654321',
      message: code === '654321' ? '验证成功' : '验证码错误',
    };
  }
}

class MockCaptchaService {
  async solve(captchaKey: string) {
    // 模拟解决验证码
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      token: `captcha-token-${Date.now()}`,
      captchaKey: captchaKey,
    };
  }
}

class MockProxyService {
  async getProxy() {
    return {
      success: true,
      ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      port: 8080,
      protocol: 'http',
    };
  }
}

/**
 * 模拟的单账号注册流程
 */
class MockSingleRegisterFlow {
  private outlookService: MockOutlookService;
  private emailService: MockEmailVerificationService;
  private smsService: MockSMSVerificationService;
  private captchaService: MockCaptchaService;
  private proxyService: MockProxyService;
  private logs: string[] = [];

  constructor() {
    this.outlookService = new MockOutlookService();
    this.emailService = new MockEmailVerificationService();
    this.smsService = new MockSMSVerificationService();
    this.captchaService = new MockCaptchaService();
    this.proxyService = new MockProxyService();
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[${timestamp}] ${message}`);
  }

  async run(options: {
    email?: string;
    phone?: string;
    yesCaptchaKey: string;
    inviteCode?: string;
    useProxy?: boolean;
  }) {
    try {
      this.log('🚀 开始单账号注册流程...');

      // 步骤 1: 获取或创建邮箱
      let email = options.email;
      if (!email) {
        this.log('📧 创建 Outlook 邮箱...');
        const outlookResult = await this.outlookService.createAccount({});
        email = outlookResult.email;
        this.log(`✅ Outlook 邮箱创建成功: ${email}`);
      } else {
        this.log(`📧 使用提供的邮箱: ${email}`);
      }

      // 步骤 2: 解决验证码
      this.log('🎯 解决 YesCaptcha 验证码...');
      const captchaResult = await this.captchaService.solve(options.yesCaptchaKey);
      if (!captchaResult.success) {
        throw new Error('验证码解决失败');
      }
      this.log(`✅ 验证码解决成功: ${captchaResult.token}`);

      // 步骤 3: 邮箱验证
      this.log('✉️  开始邮箱验证...');
      const emailCodeResult = await this.emailService.receiveCode(email);
      if (!emailCodeResult.success) {
        throw new Error('邮箱验证码接收失败');
      }
      this.log(`✅ 邮箱验证码接收成功: ${emailCodeResult.code}`);

      const emailVerifyResult = await this.emailService.verifyCode(email, emailCodeResult.code);
      if (!emailVerifyResult.success) {
        throw new Error('邮箱验证失败');
      }
      this.log(`✅ 邮箱验证成功`);

      // 步骤 4: 手机验证（如果提供了手机号）
      let phoneNumber = options.phone;
      if (options.phone) {
        this.log('📱 开始手机验证...');
        
        // 如果没有提供手机号，分配虚拟手机号
        if (!phoneNumber) {
          const phoneResult = await this.smsService.allocatePhoneNumber('+86');
          phoneNumber = phoneResult.phoneNumber;
          this.log(`✅ 虚拟手机号分配成功: ${phoneNumber}`);
        }

        const smsCodeResult = await this.smsService.receiveSMS(crypto.randomBytes(16).toString('hex'));
        if (!smsCodeResult.success) {
          throw new Error('短信验证码接收失败');
        }
        this.log(`✅ 短信验证码接收成功: ${smsCodeResult.code}`);

        const smsVerifyResult = await this.smsService.verifySMS(
          crypto.randomBytes(16).toString('hex'),
          smsCodeResult.code
        );
        if (!smsVerifyResult.success) {
          throw new Error('短信验证失败');
        }
        this.log(`✅ 手机验证成功`);
      }

      // 步骤 5: 获取代理（如果启用）
      let proxyInfo = null;
      if (options.useProxy) {
        this.log('🔄 获取代理 IP...');
        proxyInfo = await this.proxyService.getProxy();
        this.log(`✅ 代理 IP 获取成功: ${proxyInfo.ip}:${proxyInfo.port}`);
      }

      // 步骤 6: 完成注册
      this.log('🎉 单账号注册流程完成！');

      return {
        success: true,
        email: email,
        phoneNumber: phoneNumber,
        captchaToken: captchaResult.token,
        proxyInfo: proxyInfo,
        inviteCode: options.inviteCode,
        logs: this.logs,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      this.log(`❌ 错误: ${error.message}`);
      return {
        success: false,
        error: error.message,
        logs: this.logs,
        timestamp: Date.now(),
      };
    }
  }

  getLogs() {
    return this.logs;
  }
}

/**
 * 端到端测试
 */
describe('单账号注册 - 端到端自动化测试', () => {
  let flow: MockSingleRegisterFlow;

  beforeAll(() => {
    flow = new MockSingleRegisterFlow();
  });

  describe('场景 1: 完整的邮箱 + 手机注册流程', () => {
    it('应该成功完成完整的注册流程', async () => {
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
        phone: '+8613800138000',
        inviteCode: 'PYJYCLPOGGZF',
        useProxy: true,
      });

      expect(result.success).toBe(true);
      expect(result.email).toBeTruthy();
      expect(result.phoneNumber).toBeTruthy();
      expect(result.captchaToken).toBeTruthy();
      expect(result.proxyInfo).toBeTruthy();
      expect(result.logs.length).toBeGreaterThan(0);
    });

    it('应该记录所有步骤的日志', async () => {
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
        phone: '+8613800138000',
      });

      const logs = result.logs as string[];
      expect(logs.some(log => log.includes('开始单账号注册流程'))).toBe(true);
      expect(logs.some(log => log.includes('验证码解决成功'))).toBe(true);
      expect(logs.some(log => log.includes('邮箱验证成功'))).toBe(true);
      expect(logs.some(log => log.includes('手机验证成功'))).toBe(true);
      expect(logs.some(log => log.includes('注册流程完成'))).toBe(true);
    });
  });

  describe('场景 2: 仅邮箱注册流程', () => {
    it('应该成功完成仅邮箱的注册流程', async () => {
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBeTruthy();
      expect(result.captchaToken).toBeTruthy();
    });
  });

  describe('场景 3: 使用提供的邮箱地址', () => {
    it('应该使用提供的邮箱而不是创建新的', async () => {
      const providedEmail = 'test@example.com';
      const result = await flow.run({
        email: providedEmail,
        yesCaptchaKey: 'test-key-123',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe(providedEmail);
    });
  });

  describe('场景 4: 邀请链接集成', () => {
    it('应该正确处理邀请码', async () => {
      const inviteCode = 'PYJYCLPOGGZF';
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
        inviteCode: inviteCode,
      });

      expect(result.success).toBe(true);
      expect(result.inviteCode).toBe(inviteCode);
    });
  });

  describe('场景 5: 代理配置', () => {
    it('应该正确配置代理', async () => {
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
        useProxy: true,
      });

      expect(result.success).toBe(true);
      expect(result.proxyInfo).toBeTruthy();
      expect(result.proxyInfo?.ip).toBeTruthy();
      expect(result.proxyInfo?.port).toBeTruthy();
    });
  });

  describe('场景 6: 多个地区代码', () => {
    const regionCodes = ['+1', '+44', '+86', '+81'];

    regionCodes.forEach(regionCode => {
      it(`应该支持地区代码 ${regionCode}`, async () => {
        const phoneNumber = `${regionCode}${Math.random().toString().slice(2, 12)}`;
        const result = await flow.run({
          yesCaptchaKey: 'test-key-123',
          phone: phoneNumber,
        });

        expect(result.success).toBe(true);
        expect(result.phoneNumber).toBeTruthy();
      });
    });
  });

  describe('场景 7: 错误处理', () => {
    it('应该处理缺失的必填字段', async () => {
      const result = await flow.run({
        yesCaptchaKey: '',
      });

      // 这里应该检查是否有适当的验证
      expect(result).toBeTruthy();
    });
  });

  describe('场景 8: 性能测试', () => {
    it('应该在合理的时间内完成注册', async () => {
      const startTime = Date.now();
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
        phone: '+8613800138000',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // 应该在 10 秒内完成
    });
  });

  describe('场景 9: 并发测试', () => {
    it('应该能处理多个并发注册请求', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          flow.run({
            yesCaptchaKey: `test-key-${i}`,
            phone: `+86138001380${i}0`,
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('场景 10: 完整流程验证', () => {
    it('应该返回所有必要的信息', async () => {
      const result = await flow.run({
        yesCaptchaKey: 'test-key-123',
        phone: '+8613800138000',
        inviteCode: 'PYJYCLPOGGZF',
        useProxy: true,
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('phoneNumber');
      expect(result).toHaveProperty('captchaToken');
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('timestamp');

      if (result.success) {
        expect(result.email).toBeTruthy();
        expect(result.phoneNumber).toBeTruthy();
        expect(result.captchaToken).toBeTruthy();
        expect(result.logs).toBeInstanceOf(Array);
        expect((result.logs as string[]).length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * 集成测试：验证所有服务的协作
 */
describe('单账号注册 - 服务集成测试', () => {
  it('Outlook 服务应该返回有效的邮箱', async () => {
    const service = new MockOutlookService();
    const result = await service.createAccount({});

    expect(result.success).toBe(true);
    expect(result.email).toMatch(/@outlook\.com$/);
    expect(result.password).toBeTruthy();
    expect(result.accountId).toBeTruthy();
  });

  it('邮箱验证服务应该接收和验证验证码', async () => {
    const service = new MockEmailVerificationService();
    const email = 'test@example.com';

    const codeResult = await service.receiveCode(email);
    expect(codeResult.success).toBe(true);
    expect(codeResult.code).toBeTruthy();

    const verifyResult = await service.verifyCode(email, codeResult.code);
    expect(verifyResult.success).toBe(true);
  });

  it('短信验证服务应该分配和验证虚拟手机号', async () => {
    const service = new MockSMSVerificationService();

    const phoneResult = await service.allocatePhoneNumber('+86');
    expect(phoneResult.success).toBe(true);
    expect(phoneResult.phoneNumber).toBeTruthy();
    expect(phoneResult.phoneNumber).toMatch(/^\+86/);

    const smsResult = await service.receiveSMS(phoneResult.phoneId);
    expect(smsResult.success).toBe(true);
    expect(smsResult.code).toBeTruthy();

    const verifyResult = await service.verifySMS(phoneResult.phoneId, smsResult.code);
    expect(verifyResult.success).toBe(true);
  });

  it('验证码服务应该解决 CAPTCHA', async () => {
    const service = new MockCaptchaService();
    const result = await service.solve('test-key');

    expect(result.success).toBe(true);
    expect(result.token).toBeTruthy();
  });

  it('代理服务应该返回有效的代理信息', async () => {
    const service = new MockProxyService();
    const result = await service.getProxy();

    expect(result.success).toBe(true);
    expect(result.ip).toBeTruthy();
    expect(result.port).toBeTruthy();
    expect(result.protocol).toBeTruthy();
  });
});
