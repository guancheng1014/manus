/**
 * 高级日志格式化工具
 * 提供美化的日志输出，支持 emoji、符号和树形结构
 */

export const LogLevel = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  ROCKET: '🚀',
  PARTY: '🎉',
  PROXY: '🌐',
  EMAIL: '📧',
  PHONE: '📱',
  DEVICE: '💻',
  FINGERPRINT: '🪶',
  CAPTCHA: '🔐',
  CHECK: '✔️',
  STEP: '📍',
  LINK: '🔗',
  KEY: '🔑',
  SHIELD: '🛡️',
  FIRE: '🔥',
  STAR: '⭐',
} as const;

export type LogLevelKey = keyof typeof LogLevel;

export interface LogEntry {
  timestamp: Date;
  level: LogLevelKey;
  message: string;
  details?: Record<string, any>;
  taskId?: string;
  children?: LogEntry[];
}

/**
 * 高级日志格式化类
 */
export class AdvancedLogFormatter {
  /**
   * 格式化单个日志条目
   */
  static formatLog(entry: LogEntry, indent = 0): string {
    const timestamp = entry.timestamp.toISOString();
    const emoji = LogLevel[entry.level];
    const taskId = entry.taskId ? `[${entry.taskId}] ` : '';
    const indentStr = '  '.repeat(indent);

    let output = `${indentStr}[${timestamp}] ${emoji} ${taskId}${entry.message}\n`;

    // 添加详情
    if (entry.details && Object.keys(entry.details).length > 0) {
      const detailKeys = Object.keys(entry.details);
      detailKeys.forEach((key, index) => {
        const isLast = index === detailKeys.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const value = entry.details![key];
        output += `${indentStr}  ${prefix} ${key}: ${value}\n`;
      });
    }

    // 添加子日志
    if (entry.children && entry.children.length > 0) {
      entry.children.forEach(child => {
        output += this.formatLog(child, indent + 1);
      });
    }

    return output;
  }

  /**
   * 格式化设备指纹信息
   */
  static formatDeviceFingerprint(fingerprint: any): string {
    return `
🪶 设备指纹信息
  ├─ 设备 ID: ${fingerprint.id}
  ├─ 💻 浏览器: ${fingerprint.browser}
  ├─ 🖥️ 分辨率: ${fingerprint.resolution}
  ├─ 💾 内存: ${fingerprint.memory}
  ├─ 🔲 CPU 核心: ${fingerprint.cpuCores}
  ├─ 🌐 语言: ${fingerprint.language}
  ├─ ⏰ 时区: ${fingerprint.timezone}
  └─ 📍 地区: ${fingerprint.region}
    `.trim();
  }

  /**
   * 格式化代理信息
   */
  static formatProxyInfo(proxy: any): string {
    return `✅ 代理获取成功
  ├─ 🌐 IP: ${proxy.ip}
  ├─ 📍 位置: ${proxy.location}
  ├─ ⏰ 时区: ${proxy.timezone}
  └─ 🌍 国家: ${proxy.country}`;
  }

  /**
   * 格式化注册步骤
   */
  static formatRegistrationStep(
    step: number,
    action: string,
    status: 'pending' | 'success' | 'error'
  ): string {
    const statusEmoji =
      status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳';
    return `${statusEmoji} [${step}] ${action}`;
  }

  /**
   * 格式化进度条
   */
  static formatProgress(current: number, total: number): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage}% (${current}/${total})`;
  }

  /**
   * 格式化表格
   */
  static formatTable(
    headers: string[],
    rows: (string | number)[][]
  ): string {
    const colWidths = headers.map((h, i) =>
      Math.max(
        h.length,
        ...rows.map(row => String(row[i]).length)
      )
    );

    const separator = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
    const headerRow =
      '│' +
      headers
        .map((h, i) => ` ${h.padEnd(colWidths[i])} `)
        .join('│') +
      '│';
    const divider = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';

    const dataRows = rows
      .map(
        row =>
          '│' +
          row
            .map((cell, i) => ` ${String(cell).padEnd(colWidths[i])} `)
            .join('│') +
          '│'
      )
      .join('\n');

    const footer = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

    return `${separator}\n${headerRow}\n${divider}\n${dataRows}\n${footer}`;
  }

  /**
   * 格式化错误堆栈
   */
  static formatError(error: Error | string, taskId?: string): string {
    const taskPrefix = taskId ? `[${taskId}] ` : '';
    const message = error instanceof Error ? error.message : String(error);
    const stack =
      error instanceof Error && error.stack
        ? error.stack.split('\n').slice(1).join('\n  ')
        : '';

    let output = `❌ ${taskPrefix}错误: ${message}`;
    if (stack) {
      output += `\n  堆栈:\n  ${stack}`;
    }

    return output;
  }

  /**
   * 格式化错误信息（重载版本）
   */
  static formatErrorWithDetails(error: Error | string, details?: Record<string, any>): string {
    const message = error instanceof Error ? error.message : String(error);
    let output = `❌ 错误: ${message}`;

    if (details) {
      output += '\n';
      Object.entries(details).forEach(([key, value], index, arr) => {
        const isLast = index === arr.length - 1;
        const prefix = isLast ? '└─' : '├─';
        output += `  ${prefix} ${key}: ${value}\n`;
      });
    }

    return output;
  }

  /**
   * 格式化成功消息
   */
  static formatSuccess(message: string, details?: Record<string, any>): string {
    let output = `🎉 ${message}`;

    if (details) {
      output += '\n';
      Object.entries(details).forEach(([key, value], index, arr) => {
        const isLast = index === arr.length - 1;
        const prefix = isLast ? '└─' : '├─';
        output += `  ${prefix} ${key}: ${value}\n`;
      });
    }

    return output;
  }

  /**
   * 格式化警告消息
   */
  static formatWarning(message: string, details?: Record<string, any>): string {
    let output = `⚠️ ${message}`;

    if (details) {
      output += '\n';
      Object.entries(details).forEach(([key, value], index, arr) => {
        const isLast = index === arr.length - 1;
        const prefix = isLast ? '└─' : '├─';
        output += `  ${prefix} ${key}: ${value}\n`;
      });
    }

    return output;
  }

  /**
   * 格式化信息消息
   */
  static formatInfo(message: string, details?: Record<string, any>): string {
    let output = `ℹ️ ${message}`;

    if (details) {
      output += '\n';
      Object.entries(details).forEach(([key, value], index, arr) => {
        const isLast = index === arr.length - 1;
        const prefix = isLast ? '└─' : '├─';
        output += `  ${prefix} ${key}: ${value}\n`;
      });
    }

    return output;
  }

  /**
   * 格式化任务开始
   */
  static formatTaskStart(taskId: string, targetCount: number): string {
    return `🚀 任务开始执行 [${taskId}]
  └─ 目标成功次数: ${targetCount}`;
  }

  /**
   * 格式化任务完成
   */
  static formatTaskComplete(
    taskId: string,
    successCount: number,
    totalCount: number
  ): string {
    const successRate = ((successCount / totalCount) * 100).toFixed(2);
    return `🎉 任务完成 [${taskId}]
  ├─ 成功: ${successCount}/${totalCount}
  └─ 成功率: ${successRate}%`;
  }

  /**
   * 格式化任务失败
   */
  static formatTaskFailed(taskId: string, error: string): string {
    return `❌ 任务失败 [${taskId}]
  └─ 原因: ${error}`;
  }

  /**
   * 格式化注册成功
   */
  static formatRegistrationSuccess(
    taskId: string,
    email: string,
    password: string
  ): string {
    return `🎉 注册成功！[${taskId}]
  ├─ 📧 邮箱: ${email}
  └─ 🔑 密码: ${password}`;
  }

  /**
   * 格式化注册失败
   */
  static formatRegistrationFailed(taskId: string, error: string): string {
    return `❌ 注册失败 [${taskId}]
  └─ 原因: ${error}`;
  }

  /**
   * 格式化邮箱验证
   */
  static formatEmailVerification(
    taskId: string,
    email: string,
    code: string
  ): string {
    return `📧 邮箱验证 [${taskId}]
  ├─ 邮箱: ${email}
  └─ 验证码: ${code}`;
  }

  /**
   * 格式化手机绑定
   */
  static formatPhoneBinding(
    taskId: string,
    phone: string,
    code: string
  ): string {
    return `📱 手机绑定 [${taskId}]
  ├─ 手机号: ${phone}
  └─ 验证码: ${code}`;
  }

  /**
   * 创建分隔符
   */
  static createSeparator(char = '=', length = 50): string {
    return char.repeat(length);
  }

  /**
   * 创建标题
   */
  static createTitle(title: string, char = '=', length = 50): string {
    const separator = this.createSeparator(char, length);
    return `${separator}\n${title}\n${separator}`;
  }
}

/**
 * 全局日志记录器实例
 */
export class Logger {
  private taskId?: string;

  constructor(taskId?: string) {
    this.taskId = taskId;
  }

  success(message: string, details?: Record<string, any>): string {
    return AdvancedLogFormatter.formatSuccess(message, details);
  }

  error(message: string, details?: Record<string, any>): string {
    return AdvancedLogFormatter.formatErrorWithDetails(message, details);
  }

  warning(message: string, details?: Record<string, any>): string {
    return AdvancedLogFormatter.formatWarning(message, details);
  }

  info(message: string, details?: Record<string, any>): string {
    return AdvancedLogFormatter.formatInfo(message, details);
  }

  step(step: number, action: string, status: 'pending' | 'success' | 'error'): string {
    return AdvancedLogFormatter.formatRegistrationStep(step, action, status);
  }

  progress(current: number, total: number): string {
    return AdvancedLogFormatter.formatProgress(current, total);
  }

  table(headers: string[], rows: (string | number)[][]): string {
    return AdvancedLogFormatter.formatTable(headers, rows);
  }

  separator(char = '=', length = 50): string {
    return AdvancedLogFormatter.createSeparator(char, length);
  }

  title(title: string, char = '=', length = 50): string {
    return AdvancedLogFormatter.createTitle(title, char, length);
  }
}
