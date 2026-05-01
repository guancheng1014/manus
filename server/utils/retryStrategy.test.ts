/**
 * 重试策略单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateDelay,
  retryWithBackoff,
  isTemporaryError,
  isPermanentError,
  shouldRetryError,
  CircuitBreaker,
  RateLimiter,
  retryBatch,
} from './retryStrategy';

describe('retryStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = calculateDelay(1, 1000, 30000, 'exponential');
      const delay2 = calculateDelay(2, 1000, 30000, 'exponential');
      const delay3 = calculateDelay(3, 1000, 30000, 'exponential');

      expect(delay1).toBeLessThanOrEqual(1100); // 1000 + 10% jitter
      expect(delay2).toBeGreaterThanOrEqual(1900); // 2000 - 10% jitter
      expect(delay3).toBeGreaterThanOrEqual(3900); // 4000 - 10% jitter
    });

    it('should calculate linear backoff', () => {
      const delay1 = calculateDelay(1, 1000, 30000, 'linear');
      const delay2 = calculateDelay(2, 1000, 30000, 'linear');
      const delay3 = calculateDelay(3, 1000, 30000, 'linear');

      expect(delay1).toBeLessThanOrEqual(1100);
      expect(delay2).toBeGreaterThanOrEqual(1900);
      expect(delay3).toBeGreaterThanOrEqual(2900);
    });

    it('should calculate fixed backoff', () => {
      const delay1 = calculateDelay(1, 1000, 30000, 'fixed');
      const delay2 = calculateDelay(2, 1000, 30000, 'fixed');

      expect(delay1).toBeLessThanOrEqual(1100);
      expect(delay2).toBeLessThanOrEqual(1100);
    });

    it('should respect max delay', () => {
      const delay = calculateDelay(10, 1000, 5000, 'exponential');
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        strategy: 'fixed',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

      const result = await retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        strategy: 'fixed',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Persistent error');
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      await retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        onRetry,
        strategy: 'fixed',
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1,
        expect.any(Error),
        expect.any(Number)
      );
    });

    it('should respect shouldRetry predicate', async () => {
      const shouldRetry = vi.fn().mockReturnValue(false);
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        shouldRetry,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isTemporaryError', () => {
    it('should identify timeout as temporary', () => {
      expect(isTemporaryError(new Error('Request timeout'))).toBe(true);
    });

    it('should identify connection errors as temporary', () => {
      expect(isTemporaryError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isTemporaryError(new Error('ECONNRESET'))).toBe(true);
    });

    it('should identify rate limit as temporary', () => {
      expect(isTemporaryError(new Error('429 Too many requests'))).toBe(true);
    });

    it('should identify 503 as temporary', () => {
      expect(isTemporaryError(new Error('503 Service unavailable'))).toBe(true);
    });

    it('should not identify invalid error as temporary', () => {
      expect(isTemporaryError(new Error('Invalid request'))).toBe(false);
    });
  });

  describe('isPermanentError', () => {
    it('should identify 401 as permanent', () => {
      expect(isPermanentError(new Error('401 Unauthorized'))).toBe(true);
    });

    it('should identify 403 as permanent', () => {
      expect(isPermanentError(new Error('403 Forbidden'))).toBe(true);
    });

    it('should identify 404 as permanent', () => {
      expect(isPermanentError(new Error('404 Not found'))).toBe(true);
    });

    it('should identify invalid credentials as permanent', () => {
      expect(isPermanentError(new Error('Invalid credentials'))).toBe(true);
    });

    it('should not identify timeout as permanent', () => {
      expect(isPermanentError(new Error('Request timeout'))).toBe(false);
    });
  });

  describe('shouldRetryError', () => {
    it('should not retry permanent errors', () => {
      const result = shouldRetryError(new Error('401 Unauthorized'), 1, 3);
      expect(result).toBe(false);
    });

    it('should retry temporary errors', () => {
      const result = shouldRetryError(new Error('Request timeout'), 1, 3);
      expect(result).toBe(true);
    });

    it('should not retry after max attempts', () => {
      const result = shouldRetryError(new Error('Request timeout'), 3, 3);
      expect(result).toBe(false);
    });
  });

  describe('CircuitBreaker', () => {
    it('should execute successfully in closed state', async () => {
      const breaker = new CircuitBreaker(5, 2, 1000);
      const fn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(breaker.getState().state).toBe('closed');
    });

    it('should open circuit after failure threshold', async () => {
      const breaker = new CircuitBreaker(2, 2, 1000);
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('open');

      // Next call should fail immediately
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    });

    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker(1, 2, 100);
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      try {
        await breaker.execute(fn);
      } catch (e) {
        // Expected
      }

      expect(breaker.getState().state).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be half-open now
      const successFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      expect(breaker.getState().state).toBe('half-open');
    });

    it('should reset circuit', () => {
      const breaker = new CircuitBreaker(1, 2, 1000);
      const state1 = breaker.getState();

      breaker.reset();
      const state2 = breaker.getState();

      expect(state2.state).toBe('closed');
      expect(state2.failureCount).toBe(0);
    });
  });

  describe('RateLimiter', () => {
    it('should acquire tokens', async () => {
      const limiter = new RateLimiter(10, 1000);

      await limiter.acquire(5);
      expect(limiter.getTokens()).toBe(5);

      await limiter.acquire(3);
      expect(limiter.getTokens()).toBe(2);
    });

    it('should wait when no tokens available', async () => {
      const limiter = new RateLimiter(1, 100);

      const start = Date.now();
      await limiter.acquire(1);
      await limiter.acquire(1);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(90);
    });

    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter(5, 100);

      await limiter.acquire(5);
      expect(limiter.getTokens()).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(limiter.getTokens()).toBeGreaterThan(0);
    });
  });

  describe('retryBatch', () => {
    it('should process all items', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockResolvedValue('success');

      const result = await retryBatch(items, processor);

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(processor).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures', async () => {
      const items = [1, 2, 3];
      const processor = vi
        .fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const result = await retryBatch(items, processor, {
        maxRetries: 1,
      });

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
    });

    it('should retry failed items', async () => {
      const items = [1, 2];
      const processor = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success')
        .mockResolvedValueOnce('success');

      const result = await retryBatch(items, processor, {
        maxRetries: 2,
        initialDelayMs: 10,
        strategy: 'fixed',
      });

      expect(result.successful).toHaveLength(2);
      expect(result.totalAttempts).toBeGreaterThan(2);
    });
  });
});
