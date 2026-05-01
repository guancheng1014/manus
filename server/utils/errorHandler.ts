/**
 * 统一错误处理工具
 * 提供错误分类、错误日志、用户友好的错误消息
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorInfo {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    public category: ErrorCategory,
    public code: string,
    public message: string,
    public userMessage: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): ErrorInfo {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
      timestamp: new Date(),
    };
  }
}

/**
 * 分类错误
 */
export function categorizeError(error: Error | any): ErrorInfo {
  const message = error?.message || String(error);
  const code = error?.code || 'UNKNOWN_ERROR';

  // 网络错误
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('EHOSTUNREACH')
  ) {
    return {
      category: ErrorCategory.NETWORK,
      code: 'NETWORK_ERROR',
      message,
      userMessage: '网络连接失败，请检查网络设置',
      statusCode: 503,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // 超时错误
  if (message.includes('timeout') || message.includes('TIMEOUT')) {
    return {
      category: ErrorCategory.TIMEOUT,
      code: 'TIMEOUT_ERROR',
      message,
      userMessage: '请求超时，请稍后重试',
      statusCode: 504,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // 认证错误
  if (
    message.includes('Unauthorized') ||
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('Invalid credentials')
  ) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      code: 'AUTH_ERROR',
      message,
      userMessage: '认证失败，请重新登录',
      statusCode: 401,
      retryable: false,
      timestamp: new Date(),
    };
  }

  // 权限错误
  if (message.includes('Forbidden') || message.includes('403') || message.includes('Permission denied')) {
    return {
      category: ErrorCategory.PERMISSION,
      code: 'PERMISSION_ERROR',
      message,
      userMessage: '您没有权限执行此操作',
      statusCode: 403,
      retryable: false,
      timestamp: new Date(),
    };
  }

  // 未找到错误
  if (message.includes('Not found') || message.includes('404') || message.includes('not found')) {
    return {
      category: ErrorCategory.NOT_FOUND,
      code: 'NOT_FOUND_ERROR',
      message,
      userMessage: '请求的资源不存在',
      statusCode: 404,
      retryable: false,
      timestamp: new Date(),
    };
  }

  // 验证错误
  if (message.includes('Invalid') || message.includes('validation') || message.includes('Validation')) {
    return {
      category: ErrorCategory.VALIDATION,
      code: 'VALIDATION_ERROR',
      message,
      userMessage: '输入数据验证失败',
      statusCode: 400,
      retryable: false,
      timestamp: new Date(),
    };
  }

  // 速率限制
  if (message.includes('429') || message.includes('rate limit') || message.includes('Too many requests')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      code: 'RATE_LIMIT_ERROR',
      message,
      userMessage: '请求过于频繁，请稍后再试',
      statusCode: 429,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // 外部服务错误
  if (message.includes('External') || message.includes('Service unavailable') || message.includes('503')) {
    return {
      category: ErrorCategory.EXTERNAL_SERVICE,
      code: 'EXTERNAL_SERVICE_ERROR',
      message,
      userMessage: '外部服务暂时不可用，请稍后重试',
      statusCode: 503,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // 数据库错误
  if (message.includes('Database') || message.includes('database') || message.includes('SQL')) {
    return {
      category: ErrorCategory.DATABASE,
      code: 'DATABASE_ERROR',
      message,
      userMessage: '数据库操作失败，请稍后重试',
      statusCode: 500,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // 未知错误
  return {
    category: ErrorCategory.UNKNOWN,
    code: code || 'UNKNOWN_ERROR',
    message,
    userMessage: '发生未知错误，请稍后重试',
    statusCode: 500,
    retryable: false,
    timestamp: new Date(),
  };
}

/**
 * 创建 AppError
 */
export function createAppError(
  category: ErrorCategory,
  code: string,
  message: string,
  userMessage: string,
  statusCode: number = 500,
  retryable: boolean = false,
  details?: Record<string, any>
): AppError {
  return new AppError(category, code, message, userMessage, statusCode, retryable, details);
}

/**
 * 处理和记录错误
 */
export function handleError(error: Error | any, context?: string): ErrorInfo {
  const errorInfo = categorizeError(error);

  // 记录错误
  console.error(`[${context || 'ERROR'}] ${errorInfo.code}:`, {
    message: errorInfo.message,
    category: errorInfo.category,
    statusCode: errorInfo.statusCode,
    retryable: errorInfo.retryable,
    details: errorInfo.details,
  });

  return errorInfo;
}

/**
 * 验证错误
 */
export function validateAndThrow(condition: boolean, error: AppError): void {
  if (!condition) {
    throw error;
  }
}

/**
 * 安全执行函数
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }
}

/**
 * 错误重映射
 */
export function remapError(error: Error, newCode: string, newMessage: string): AppError {
  const errorInfo = categorizeError(error);
  return new AppError(
    errorInfo.category,
    newCode,
    newMessage,
    errorInfo.userMessage,
    errorInfo.statusCode,
    errorInfo.retryable,
    errorInfo.details
  );
}

/**
 * 错误链
 */
export class ErrorChain {
  private errors: ErrorInfo[] = [];

  add(error: Error | any, context?: string): this {
    const errorInfo = categorizeError(error);
    if (context) {
      errorInfo.details = { ...errorInfo.details, context };
    }
    this.errors.push(errorInfo);
    return this;
  }

  getAll(): ErrorInfo[] {
    return this.errors;
  }

  getFirst(): ErrorInfo | null {
    return this.errors[0] || null;
  }

  getLast(): ErrorInfo | null {
    return this.errors[this.errors.length - 1] || null;
  }

  isEmpty(): boolean {
    return this.errors.length === 0;
  }

  hasRetryable(): boolean {
    return this.errors.some(e => e.retryable);
  }

  toJSON() {
    return {
      count: this.errors.length,
      errors: this.errors,
      hasRetryable: this.hasRetryable(),
    };
  }
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  canRecover: (error: ErrorInfo) => boolean;
  recover: () => Promise<void>;
}

export class ErrorRecoveryManager {
  private strategies: RecoveryStrategy[] = [];

  register(strategy: RecoveryStrategy): this {
    this.strategies.push(strategy);
    return this;
  }

  async tryRecover(error: ErrorInfo): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover();
          return true;
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }
    }
    return false;
  }
}
