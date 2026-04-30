import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiRouter } from './aiRouter';

// Mock invokeLLM
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: '这是一个测试回答',
        },
      },
    ],
  })),
}));

describe('aiRouter', () => {
  describe('ask', () => {
    it('should return answer for valid question', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.ask({ question: '如何验证卡密？' });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should reject empty question', async () => {
      const caller = aiRouter.createCaller({});

      try {
        await caller.ask({ question: '' });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('问题不能为空');
      }
    });

    it('should handle AI service error gracefully', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.ask({ question: '测试问题' });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    });
  });

  describe('getFAQ', () => {
    it('should return FAQ list', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getFAQ();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // 检查 FAQ 项的结构
      const faqItem = result[0];
      expect(faqItem.id).toBeDefined();
      expect(faqItem.question).toBeDefined();
      expect(faqItem.emoji).toBeDefined();
      expect(faqItem.answer).toBeDefined();
    });

    it('should contain expected FAQ items', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getFAQ();

      const ids = result.map((item: any) => item.id);
      expect(ids).toContain('verify-cardkey');
      expect(ids).toContain('batch-register');
      expect(ids).toContain('export-results');
      expect(ids).toContain('proxy-config');
      expect(ids).toContain('claim-account');
      expect(ids).toContain('payment-issue');
    });
  });

  describe('getHelp', () => {
    it('should return help topics when no topic specified', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getHelp({});

      expect(result).toBeDefined();
      expect(result.topics).toBeDefined();
      expect(Array.isArray(result.topics)).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should return help content for valid topic', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getHelp({ topic: 'cardkey' });

      expect(result).toBeDefined();
      expect(result.topic).toBe('cardkey');
      expect(result.content).toBeDefined();
      expect(result.content).toContain('卡密');
    });

    it('should return topics list for invalid topic', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getHelp({ topic: 'invalid-topic' });

      expect(result.topics).toBeDefined();
      expect(Array.isArray(result.topics)).toBe(true);
    });

    it('should have all expected help topics', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getHelp({});

      const expectedTopics = ['cardkey', 'registration', 'proxy', 'payment'];
      expectedTopics.forEach(topic => {
        expect(result.topics).toContain(topic);
      });
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getSystemStatus();

      expect(result).toBeDefined();
      expect(result.status).toBe('operational');
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.services).toBeDefined();
    });

    it('should have all required services', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getSystemStatus();

      expect(result.services.registration).toBeDefined();
      expect(result.services.payment).toBeDefined();
      expect(result.services.proxy).toBeDefined();
      expect(result.services.ai).toBeDefined();
    });

    it('should have all services operational', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.getSystemStatus();

      Object.values(result.services).forEach(status => {
        expect(status).toContain('✅');
      });
    });
  });

  describe('submitFeedback', () => {
    it('should accept valid feedback', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.submitFeedback({
        type: 'bug',
        title: '测试 Bug',
        description: '这是一个测试 bug 报告',
        email: 'test@example.com',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should accept feedback without email', async () => {
      const caller = aiRouter.createCaller({});
      const result = await caller.submitFeedback({
        type: 'feature',
        title: '新功能建议',
        description: '这是一个新功能建议',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should reject invalid feedback type', async () => {
      const caller = aiRouter.createCaller({});

      try {
        await caller.submitFeedback({
          type: 'invalid' as any,
          title: '测试',
          description: '测试',
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject empty title', async () => {
      const caller = aiRouter.createCaller({});

      try {
        await caller.submitFeedback({
          type: 'bug',
          title: '',
          description: '测试',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('标题不能为空');
      }
    });

    it('should reject empty description', async () => {
      const caller = aiRouter.createCaller({});

      try {
        await caller.submitFeedback({
          type: 'bug',
          title: '测试',
          description: '',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('描述不能为空');
      }
    });

    it('should reject invalid email', async () => {
      const caller = aiRouter.createCaller({});

      try {
        await caller.submitFeedback({
          type: 'bug',
          title: '测试',
          description: '测试',
          email: 'invalid-email',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('邮箱格式不正确');
      }
    });

    it('should accept all feedback types', async () => {
      const caller = aiRouter.createCaller({});
      const types: Array<'bug' | 'feature' | 'improvement' | 'other'> = [
        'bug',
        'feature',
        'improvement',
        'other',
      ];

      for (const type of types) {
        const result = await caller.submitFeedback({
          type,
          title: `测试 ${type}`,
          description: `这是一个 ${type} 反馈`,
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
