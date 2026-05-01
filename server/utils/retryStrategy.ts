/**
 * 重试策略工具
 * 提供指数退避、线性退避、自定义重试策略
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  strategy?: 'exponential' | 'linear' | 'fixed';
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
}

/**
 * 计算下一次重试的延迟时间
 */
export function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  strategy: 'exponential' | 'linear' | 'fixed'
): number {
  let delay: number;

  switch (strategy) {
    case 'exponential':
      delay = initialDelayMs * Math.pow(2, attempt - 1);
      break;
    case 'linear':
      delay = initialDelayMs * attempt;
      break;
    case 'fixed':
      delay = initialDelayMs;
      break;
    default:
      delay = initialDelayMs;
  }

  // 添加随机抖动，避免雷群效应
  const jitter = delay * 0.1 * Math.random();
  const finalDelay = Math.min(delay + jitter, maxDelayMs);

  return Math.round(finalDelay);
}

/**
 * 通用重试函数
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    strategy = 'exponential',
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;
  const startTime = Date.now();
  let totalDelayMs = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries || !shouldRetry(lastError, attempt)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
        };
      }

      const nextDelayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs, strategy);
      totalDelayMs += nextDelayMs;

      if (onRetry) {
        onRetry(attempt, lastError, nextDelayMs);
      }

      await sleep(nextDelayMs);
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: maxRetries,
    totalTimeMs: Date.now() - startTime,
  };
}

/**
 * 睡眠函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 是否为临时错误（可重试）
 */
export function isTemporaryError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const temporaryPatterns = [
    'timeout',
    'econnrefused',
    'econnreset',
    'etimedout',
    'ehostunreach',
    'enetunreach',
    'temporarily unavailable',
    'service unavailable',
    '503',
    '429', // Rate limit
    'rate limit',
    'too many requests',
  ];

  return temporaryPatterns.some(pattern => message.includes(pattern));
}

/**
 * 是否为永久错误（不应重试）
 */
export function isPermanentError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const permanentPatterns = [
    'invalid',
    'unauthorized',
    '401',
    '403',
    'forbidden',
    'not found',
    '404',
    'bad request',
    '400',
    'authentication failed',
    'invalid credentials',
  ];

  return permanentPatterns.some(pattern => message.includes(pattern));
}

/**
 * 智能重试决策
 */
export function shouldRetryError(error: Error, attempt: number, maxRetries: number): boolean {
  // 永久错误不重试
  if (isPermanentError(error)) {
    return false;
  }

  // 达到最大重试次数
  if (attempt >= maxRetries) {
    return false;
  }

  // 临时错误可以重试
  if (isTemporaryError(error)) {
    return true;
  }

  // 默认重试
  return true;
}

/**
 * 创建自定义重试函数
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  return () => retryWithBackoff(fn, options);
}

/**
 * 批量重试
 */
export async function retryBatch<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  options: RetryOptions = {}
): Promise<{
  successful: T[];
  failed: Array<{ item: T; error: Error }>;
  totalAttempts: number;
}> {
  const successful: T[] = [];
  const failed: Array<{ item: T; error: Error }> = [];
  let totalAttempts = 0;

  for (const item of items) {
    const result = await retryWithBackoff(() => processor(item), options);
    totalAttempts += result.attempts;

    if (result.success) {
      successful.push(item);
    } else {
      failed.push({
        item,
        error: result.error || new Error('Unknown error'),
      });
    }
  }

  return {
    successful,
    failed,
    totalAttempts,
  };
}

/**
 * 电路断路器模式
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold = 5,
    private successThreshold = 2,
    private resetTimeoutMs = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeoutMs) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = 'closed';
          this.failureCount = 0;
          this.successCount = 0;
        }
      } else {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;

  constructor(
    private maxTokens: number,
    private refillIntervalMs: number
  ) {
    this.tokens = maxTokens;
    this.lastRefillTime = Date.now();
  }

  async acquire(tokensNeeded: number = 1): Promise<void> {
    while (this.tokens < tokensNeeded) {
      const now = Date.now();
      const timeSinceLastRefill = now - this.lastRefillTime;
      const refillsNeeded = Math.ceil(timeSinceLastRefill / this.refillIntervalMs);

      if (refillsNeeded > 0) {
        this.tokens = Math.min(this.maxTokens, this.tokens + refillsNeeded);
        this.lastRefillTime = now;
      }

      if (this.tokens < tokensNeeded) {
        const waitTime = this.refillIntervalMs - (timeSinceLastRefill % this.refillIntervalMs);
        await sleep(waitTime);
      }
    }

    this.tokens -= tokensNeeded;
  }

  getTokens(): number {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;
    const refillsNeeded = Math.ceil(timeSinceLastRefill / this.refillIntervalMs);

    if (refillsNeeded > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + refillsNeeded);
      this.lastRefillTime = now;
    }

    return this.tokens;
  }
}
