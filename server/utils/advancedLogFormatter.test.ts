import { describe, it, expect } from 'vitest';
import {
  AdvancedLogFormatter,
  Logger,
  LogLevel,
  type LogEntry,
} from './advancedLogFormatter';

describe('AdvancedLogFormatter', () => {
  describe('formatLog', () => {
    it('should format a simple log entry', () => {
      const entry: LogEntry = {
        timestamp: new Date('2026-05-01T06:38:17Z'),
        level: 'SUCCESS',
        message: '任务开始执行',
      };

      const result = AdvancedLogFormatter.formatLog(entry);

      expect(result).toContain('✅');
      expect(result).toContain('任务开始执行');
      expect(result).toContain('2026-05-01T06:38:17');
    });

    it('should include task ID when provided', () => {
      const entry: LogEntry = {
        timestamp: new Date('2026-05-01T06:38:17Z'),
        level: 'SUCCESS',
        message: '代理获取成功',
        taskId: 'T45116',
      };

      const result = AdvancedLogFormatter.formatLog(entry);

      expect(result).toContain('[T45116]');
      expect(result).toContain('代理获取成功');
    });

    it('should format details with tree structure', () => {
      const entry: LogEntry = {
        timestamp: new Date('2026-05-01T06:38:17Z'),
        level: 'SUCCESS',
        message: '代理获取成功',
        details: {
          'IP': '98.228.61.210',
          '位置': 'Urbana, US',
          '时区': 'America/Chicago',
        },
      };

      const result = AdvancedLogFormatter.formatLog(entry);

      expect(result).toContain('IP: 98.228.61.210');
      expect(result).toContain('位置: Urbana, US');
      expect(result).toContain('时区: America/Chicago');
      expect(result).toContain('├─');
      expect(result).toContain('└─');
    });

    it('should handle nested log entries', () => {
      const entry: LogEntry = {
        timestamp: new Date('2026-05-01T06:38:17Z'),
        level: 'SUCCESS',
        message: '任务开始执行',
        children: [
          {
            timestamp: new Date('2026-05-01T06:38:18Z'),
            level: 'SUCCESS',
            message: '代理获取成功',
            details: { 'IP': '98.228.61.210' },
          },
        ],
      };

      const result = AdvancedLogFormatter.formatLog(entry);

      expect(result).toContain('任务开始执行');
      expect(result).toContain('代理获取成功');
      expect(result).toContain('IP: 98.228.61.210');
    });
  });

  describe('formatDeviceFingerprint', () => {
    it('should format device fingerprint correctly', () => {
      const fingerprint = {
        id: 'tTpA00_G9Kd3pXv35GTydg',
        browser: 'Chrome/132',
        resolution: '1536x864',
        memory: '8GB',
        cpuCores: 2,
        language: 'en-US',
        timezone: 'America/Chicago',
        region: 'US',
      };

      const result = AdvancedLogFormatter.formatDeviceFingerprint(fingerprint);

      expect(result).toContain('🪶 设备指纹信息');
      expect(result).toContain('设备 ID: tTpA00_G9Kd3pXv35GTydg');
      expect(result).toContain('💻 浏览器: Chrome/132');
      expect(result).toContain('🖥️ 分辨率: 1536x864');
      expect(result).toContain('💾 内存: 8GB');
      expect(result).toContain('🔲 CPU 核心: 2');
      expect(result).toContain('🌐 语言: en-US');
      expect(result).toContain('⏰ 时区: America/Chicago');
      expect(result).toContain('📍 地区: US');
    });
  });

  describe('formatProxyInfo', () => {
    it('should format proxy info correctly', () => {
      const proxy = {
        ip: '98.228.61.210',
        location: 'Urbana, US',
        timezone: 'America/Chicago',
        country: 'United States',
      };

      const result = AdvancedLogFormatter.formatProxyInfo(proxy);

      expect(result).toContain('✅ 代理获取成功');
      expect(result).toContain('🌐 IP: 98.228.61.210');
      expect(result).toContain('📍 位置: Urbana, US');
      expect(result).toContain('⏰ 时区: America/Chicago');
      expect(result).toContain('🌍 国家: United States');
    });
  });

  describe('formatRegistrationStep', () => {
    it('should format registration step with success status', () => {
      const result = AdvancedLogFormatter.formatRegistrationStep(
        1,
        '检查邀请码',
        'success'
      );

      expect(result).toContain('✅');
      expect(result).toContain('[1]');
      expect(result).toContain('检查邀请码');
    });

    it('should format registration step with error status', () => {
      const result = AdvancedLogFormatter.formatRegistrationStep(
        2,
        '获取代理',
        'error'
      );

      expect(result).toContain('❌');
      expect(result).toContain('[2]');
      expect(result).toContain('获取代理');
    });

    it('should format registration step with pending status', () => {
      const result = AdvancedLogFormatter.formatRegistrationStep(
        3,
        '识别验证码',
        'pending'
      );

      expect(result).toContain('⏳');
      expect(result).toContain('[3]');
      expect(result).toContain('识别验证码');
    });
  });

  describe('formatProgress', () => {
    it('should format progress bar correctly', () => {
      const result = AdvancedLogFormatter.formatProgress(5, 10);

      expect(result).toContain('50%');
      expect(result).toContain('5/10');
      expect(result).toContain('█');
      expect(result).toContain('░');
    });

    it('should handle 0% progress', () => {
      const result = AdvancedLogFormatter.formatProgress(0, 10);

      expect(result).toContain('0%');
      expect(result).toContain('0/10');
    });

    it('should handle 100% progress', () => {
      const result = AdvancedLogFormatter.formatProgress(10, 10);

      expect(result).toContain('100%');
      expect(result).toContain('10/10');
    });
  });

  describe('formatTable', () => {
    it('should format table correctly', () => {
      const headers = ['任务', '状态', '数量'];
      const rows = [
        ['注册', '成功', '100'],
        ['验证', '进行中', '50'],
        ['失败', '失败', '5'],
      ];

      const result = AdvancedLogFormatter.formatTable(headers, rows);

      expect(result).toContain('任务');
      expect(result).toContain('状态');
      expect(result).toContain('数量');
      expect(result).toContain('注册');
      expect(result).toContain('成功');
      expect(result).toContain('100');
      expect(result).toContain('┌');
      expect(result).toContain('├');
      expect(result).toContain('└');
    });
  });

  describe('formatSuccess', () => {
    it('should format success message', () => {
      const result = AdvancedLogFormatter.formatSuccess('注册成功');

      expect(result).toContain('🎉');
      expect(result).toContain('注册成功');
    });

    it('should include details when provided', () => {
      const result = AdvancedLogFormatter.formatSuccess('注册成功', {
        '邮箱': 'test@example.com',
        '密码': 'password123',
      });

      expect(result).toContain('🎉');
      expect(result).toContain('注册成功');
      expect(result).toContain('邮箱: test@example.com');
      expect(result).toContain('密码: password123');
    });
  });

  describe('formatWarning', () => {
    it('should format warning message', () => {
      const result = AdvancedLogFormatter.formatWarning('代理即将过期');

      expect(result).toContain('⚠️');
      expect(result).toContain('代理即将过期');
    });
  });

  describe('formatInfo', () => {
    it('should format info message', () => {
      const result = AdvancedLogFormatter.formatInfo('系统维护中');

      expect(result).toContain('ℹ️');
      expect(result).toContain('系统维护中');
    });
  });

  describe('createSeparator', () => {
    it('should create separator with default character', () => {
      const result = AdvancedLogFormatter.createSeparator('=', 10);

      expect(result).toBe('==========');
    });

    it('should create separator with custom character', () => {
      const result = AdvancedLogFormatter.createSeparator('-', 5);

      expect(result).toBe('-----');
    });
  });

  describe('createTitle', () => {
    it('should create title with separators', () => {
      const result = AdvancedLogFormatter.createTitle('测试标题', '=', 10);

      expect(result).toContain('==========');
      expect(result).toContain('测试标题');
    });
  });
});

describe('Logger', () => {
  it('should create logger instance', () => {
    const logger = new Logger('T12345');

    expect(logger).toBeDefined();
  });

  it('should format success message', () => {
    const logger = new Logger();
    const result = logger.success('测试成功');

    expect(result).toContain('🎉');
    expect(result).toContain('测试成功');
  });

  it('should format error message', () => {
    const logger = new Logger();
    const result = logger.error('测试错误');

    expect(result).toContain('❌');
    expect(result).toContain('测试错误');
  });

  it('should format warning message', () => {
    const logger = new Logger();
    const result = logger.warning('测试警告');

    expect(result).toContain('⚠️');
    expect(result).toContain('测试警告');
  });

  it('should format info message', () => {
    const logger = new Logger();
    const result = logger.info('测试信息');

    expect(result).toContain('ℹ️');
    expect(result).toContain('测试信息');
  });

  it('should format progress', () => {
    const logger = new Logger();
    const result = logger.progress(5, 10);

    expect(result).toContain('50%');
    expect(result).toContain('5/10');
  });

  it('should create separator', () => {
    const logger = new Logger();
    const result = logger.separator('=', 5);

    expect(result).toBe('=====');
  });

  it('should create title', () => {
    const logger = new Logger();
    const result = logger.title('标题', '=', 5);

    expect(result).toContain('=====');
    expect(result).toContain('标题');
  });
});

describe('LogLevel', () => {
  it('should have all required log levels', () => {
    expect(LogLevel.SUCCESS).toBe('✅');
    expect(LogLevel.ERROR).toBe('❌');
    expect(LogLevel.WARNING).toBe('⚠️');
    expect(LogLevel.INFO).toBe('ℹ️');
    expect(LogLevel.LOADING).toBe('⏳');
    expect(LogLevel.ROCKET).toBe('🚀');
    expect(LogLevel.PARTY).toBe('🎉');
  });
});
