/**
 * 错误处理工具单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  categorizeError,
  createAppError,
  handleError,
  ErrorCategory,
  AppError,
  ErrorChain,
  ErrorRecoveryManager,
  remapError,
} from './errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = new Error('ECONNREFUSED');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(503);
    });

    it('should categorize timeout errors', () => {
      const error = new Error('Request timeout');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.TIMEOUT);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(504);
    });

    it('should categorize authentication errors', () => {
      const error = new Error('Unauthorized 401');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.retryable).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    it('should categorize permission errors', () => {
      const error = new Error('403 Forbidden');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.PERMISSION);
      expect(result.retryable).toBe(false);
      expect(result.statusCode).toBe(403);
    });

    it('should categorize not found errors', () => {
      const error = new Error('404 Not found');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.NOT_FOUND);
      expect(result.retryable).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should categorize validation errors', () => {
      const error = new Error('Invalid input data');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.retryable).toBe(false);
      expect(result.statusCode).toBe(400);
    });

    it('should categorize rate limit errors', () => {
      const error = new Error('429 Too many requests');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(429);
    });

    it('should categorize external service errors', () => {
      const error = new Error('503 Service unavailable');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(503);
    });

    it('should categorize database errors', () => {
      const error = new Error('Database connection failed');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.DATABASE);
      expect(result.retryable).toBe(true);
      expect(result.statusCode).toBe(500);
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Some random error');
      const result = categorizeError(error);

      expect(result.category).toBe(ErrorCategory.UNKNOWN);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('createAppError', () => {
    it('should create app error', () => {
      const error = createAppError(
        ErrorCategory.VALIDATION,
        'INVALID_EMAIL',
        'Email format is invalid',
        '邮箱格式不正确',
        400,
        false,
        { field: 'email' }
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe('INVALID_EMAIL');
      expect(error.statusCode).toBe(400);
      expect(error.details?.field).toBe('email');
    });

    it('should convert to JSON', () => {
      const error = createAppError(
        ErrorCategory.VALIDATION,
        'INVALID_EMAIL',
        'Email format is invalid',
        '邮箱格式不正确'
      );

      const json = error.toJSON();

      expect(json.category).toBe(ErrorCategory.VALIDATION);
      expect(json.code).toBe('INVALID_EMAIL');
      expect(json.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('handleError', () => {
    it('should handle and log error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      const result = handleError(error, 'TEST_CONTEXT');

      expect(result.category).toBe(ErrorCategory.UNKNOWN);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('remapError', () => {
    it('should remap error', () => {
      const originalError = new Error('Original error');
      const remapped = remapError(originalError, 'NEW_CODE', 'New message');

      expect(remapped.code).toBe('NEW_CODE');
      expect(remapped.message).toBe('New message');
      expect(remapped).toBeInstanceOf(AppError);
    });
  });

  describe('ErrorChain', () => {
    it('should add errors', () => {
      const chain = new ErrorChain();

      chain.add(new Error('Error 1'));
      chain.add(new Error('Error 2'));

      expect(chain.getAll()).toHaveLength(2);
    });

    it('should get first error', () => {
      const chain = new ErrorChain();

      chain.add(new Error('Error 1'));
      chain.add(new Error('Error 2'));

      const first = chain.getFirst();
      expect(first?.message).toBe('Error 1');
    });

    it('should get last error', () => {
      const chain = new ErrorChain();

      chain.add(new Error('Error 1'));
      chain.add(new Error('Error 2'));

      const last = chain.getLast();
      expect(last?.message).toBe('Error 2');
    });

    it('should check if empty', () => {
      const chain = new ErrorChain();

      expect(chain.isEmpty()).toBe(true);

      chain.add(new Error('Error'));
      expect(chain.isEmpty()).toBe(false);
    });

    it('should check for retryable errors', () => {
      const chain = new ErrorChain();

      chain.add(new Error('ECONNREFUSED')); // retryable
      chain.add(new Error('401 Unauthorized')); // not retryable

      expect(chain.hasRetryable()).toBe(true);
    });

    it('should convert to JSON', () => {
      const chain = new ErrorChain();

      chain.add(new Error('Error 1'));
      chain.add(new Error('Error 2'));

      const json = chain.toJSON();

      expect(json.count).toBe(2);
      expect(json.errors).toHaveLength(2);
      expect(json.hasRetryable).toBeDefined();
    });
  });

  describe('ErrorRecoveryManager', () => {
    it('should register and execute recovery strategies', async () => {
      const manager = new ErrorRecoveryManager();
      const recover = vi.fn().mockResolvedValue(undefined);

      manager.register({
        canRecover: (error) => error.category === ErrorCategory.NETWORK,
        recover,
      });

      const error = categorizeError(new Error('ECONNREFUSED'));
      const recovered = await manager.tryRecover(error);

      expect(recovered).toBe(true);
      expect(recover).toHaveBeenCalled();
    });

    it('should try multiple strategies', async () => {
      const manager = new ErrorRecoveryManager();
      const recover1 = vi.fn().mockResolvedValue(undefined);
      const recover2 = vi.fn().mockResolvedValue(undefined);

      manager.register({
        canRecover: (error) => error.category === ErrorCategory.AUTHENTICATION,
        recover: recover1,
      });

      manager.register({
        canRecover: (error) => error.category === ErrorCategory.NETWORK,
        recover: recover2,
      });

      const error = categorizeError(new Error('ECONNREFUSED'));
      const recovered = await manager.tryRecover(error);

      expect(recovered).toBe(true);
      expect(recover2).toHaveBeenCalled();
      expect(recover1).not.toHaveBeenCalled();
    });

    it('should return false if no strategy matches', async () => {
      const manager = new ErrorRecoveryManager();

      manager.register({
        canRecover: (error) => error.category === ErrorCategory.AUTHENTICATION,
        recover: vi.fn(),
      });

      const error = categorizeError(new Error('ECONNREFUSED'));
      const recovered = await manager.tryRecover(error);

      expect(recovered).toBe(false);
    });

    it('should handle recovery failures', async () => {
      const manager = new ErrorRecoveryManager();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.register({
        canRecover: (error) => error.category === ErrorCategory.NETWORK,
        recover: vi.fn().mockRejectedValue(new Error('Recovery failed')),
      });

      const error = categorizeError(new Error('ECONNREFUSED'));
      const recovered = await manager.tryRecover(error);

      expect(recovered).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
