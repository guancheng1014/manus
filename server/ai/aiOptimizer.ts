import { invokeLLM } from "../_core/llm";

/**
 * GPT-4 AI 智能优化模块
 * 用于分析注册失败原因、自动调整并发数、优化轮换策略
 */

export interface RegistrationFailureAnalysis {
  failureReason: string; // 失败原因
  failureCategory: "validation" | "network" | "detection" | "rate_limit" | "unknown";
  confidence: number; // 置信度 (0-1)
  recommendations: string[]; // 优化建议
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  action: string; // 操作类型
  parameter: string; // 参数名
  currentValue: number; // 当前值
  suggestedValue: number; // 建议值
  reason: string; // 原因
}

export interface RegistrationMetrics {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageTime: number;
  recentErrors: string[];
  concurrency: number;
  rotationStrategy: string;
  proxySuccessRate: number;
}

export class AIOptimizer {
  /**
   * 分析注册失败原因
   */
  async analyzeFailure(
    email: string,
    error: string,
    context: Record<string, any>
  ): Promise<RegistrationFailureAnalysis> {
    const prompt = `
你是一个 Manus.im 自动注册系统的专家分析师。

用户尝试注册邮箱: ${email}
错误信息: ${error}
上下文信息:
- 代理: ${context.proxy || "未使用"}
- User-Agent: ${context.userAgent || "默认"}
- 网络状态: ${context.networkStatus || "正常"}
- 之前的尝试: ${context.previousAttempts || 0}

请分析这个错误的原因，并分类为以下之一：
1. validation - 验证失败（邮箱格式、密码要求等）
2. network - 网络问题（超时、连接失败等）
3. detection - 被检测（验证码失败、IP 被封禁等）
4. rate_limit - 速率限制
5. unknown - 未知错误

请返回 JSON 格式的分析结果，包含：
{
  "failureReason": "具体的失败原因",
  "failureCategory": "分类",
  "confidence": 0.85,
  "recommendations": ["建议1", "建议2"],
  "suggestedActions": [
    {
      "action": "adjust_concurrency",
      "parameter": "concurrency",
      "currentValue": 10,
      "suggestedValue": 5,
      "reason": "检测到速率限制，建议降低并发"
    }
  ]
}
    `;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "你是一个 Manus.im 自动注册系统的专家分析师。请提供准确的错误分析和优化建议。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "failure_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                failureReason: { type: "string" },
                failureCategory: {
                  type: "string",
                  enum: ["validation", "network", "detection", "rate_limit", "unknown"],
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                recommendations: { type: "array", items: { type: "string" } },
                suggestedActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      parameter: { type: "string" },
                      currentValue: { type: "number" },
                      suggestedValue: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["action", "parameter", "currentValue", "suggestedValue", "reason"],
                  },
                },
              },
              required: ["failureReason", "failureCategory", "confidence", "recommendations", "suggestedActions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        return JSON.parse(content);
      }

      throw new Error("无效的响应格式");
    } catch (error) {
      console.error("AI 分析失败:", error);
      return {
        failureReason: "分析失败",
        failureCategory: "unknown",
        confidence: 0,
        recommendations: ["请检查错误日志"],
        suggestedActions: [],
      };
    }
  }

  /**
   * 自动调整并发数
   */
  async optimizeConcurrency(metrics: RegistrationMetrics): Promise<SuggestedAction> {
    const prompt = `
基于以下注册指标，建议最优的并发数：

总尝试: ${metrics.totalAttempts}
成功数: ${metrics.successCount}
失败数: ${metrics.failureCount}
成功率: ${metrics.successRate}%
平均耗时: ${metrics.averageTime}秒
当前并发: ${metrics.concurrency}
代理成功率: ${metrics.proxySuccessRate}%

最近的错误:
${metrics.recentErrors.slice(0, 5).join("\n")}

请分析这些指标，并建议最优的并发数。考虑因素：
1. 如果成功率低于 50%，建议降低并发
2. 如果平均耗时超过 30 秒，建议降低并发
3. 如果代理成功率低于 30%，建议更换代理或降低并发
4. 如果成功率高于 80% 且耗时低于 10 秒，可以考虑提高并发

返回 JSON 格式：
{
  "action": "adjust_concurrency",
  "parameter": "concurrency",
  "currentValue": ${metrics.concurrency},
  "suggestedValue": <建议的并发数>,
  "reason": "优化原因"
}
    `;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "你是一个注册系统性能优化专家。请基于指标数据提供准确的并发数建议。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "concurrency_optimization",
            strict: true,
            schema: {
              type: "object",
              properties: {
                action: { type: "string" },
                parameter: { type: "string" },
                currentValue: { type: "number" },
                suggestedValue: { type: "number" },
                reason: { type: "string" },
              },
              required: ["action", "parameter", "currentValue", "suggestedValue", "reason"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        return JSON.parse(content);
      }

      throw new Error("无效的响应格式");
    } catch (error) {
      console.error("并发优化失败:", error);
      return {
        action: "adjust_concurrency",
        parameter: "concurrency",
        currentValue: metrics.concurrency,
        suggestedValue: Math.max(1, Math.floor(metrics.concurrency * 0.8)),
        reason: "优化失败，默认降低 20%",
      };
    }
  }

  /**
   * 优化轮换策略
   */
  async optimizeRotationStrategy(metrics: RegistrationMetrics): Promise<SuggestedAction> {
    const prompt = `
基于以下指标，建议最优的代理轮换策略：

当前策略: ${metrics.rotationStrategy}
代理成功率: ${metrics.proxySuccessRate}%
总尝试: ${metrics.totalAttempts}
成功率: ${metrics.successRate}%

可用的轮换策略：
1. round_robin - 轮询（简单、均衡）
2. random - 随机（无序、不可预测）
3. weighted - 加权（基于成功率）
4. adaptive - 自适应（动态调整）

请分析当前策略的效果，并建议更优的策略。

返回 JSON 格式：
{
  "action": "change_rotation_strategy",
  "parameter": "rotationStrategy",
  "currentValue": "${metrics.rotationStrategy}",
  "suggestedValue": "<建议的策略>",
  "reason": "优化原因"
}
    `;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "你是一个代理轮换策略优化专家。请基于指标数据提供准确的策略建议。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        const parsed = JSON.parse(content);
        return {
          action: parsed.action,
          parameter: parsed.parameter,
          currentValue: metrics.rotationStrategy as any,
          suggestedValue: parsed.suggestedValue as any,
          reason: parsed.reason,
        };
      }

      throw new Error("无效的响应格式");
    } catch (error) {
      console.error("轮换策略优化失败:", error);
      return {
        action: "change_rotation_strategy",
        parameter: "rotationStrategy",
        currentValue: metrics.rotationStrategy as any,
        suggestedValue: "adaptive" as any,
        reason: "优化失败，建议使用自适应策略",
      };
    }
  }

  /**
   * 生成优化报告
   */
  async generateOptimizationReport(metrics: RegistrationMetrics): Promise<string> {
    const prompt = `
基于以下注册系统的性能指标，生成一份优化报告：

总尝试: ${metrics.totalAttempts}
成功数: ${metrics.successCount}
失败数: ${metrics.failureCount}
成功率: ${metrics.successRate}%
平均耗时: ${metrics.averageTime}秒
当前并发: ${metrics.concurrency}
轮换策略: ${metrics.rotationStrategy}
代理成功率: ${metrics.proxySuccessRate}%

请生成一份详细的优化报告，包含：
1. 当前系统状态评估
2. 主要问题分析
3. 具体的优化建议（至少 3 条）
4. 预期的改进效果
5. 实施优先级

报告应该清晰、专业、可操作。
    `;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "你是一个注册系统性能优化顾问。请生成专业的优化报告。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      return typeof content === "string" ? content : "报告生成失败";
    } catch (error) {
      console.error("报告生成失败:", error);
      return "无法生成优化报告，请稍后重试";
    }
  }
}

// 全局 AI 优化器实例
export const aiOptimizer = new AIOptimizer();
