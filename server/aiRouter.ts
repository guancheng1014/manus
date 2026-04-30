import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

/**
 * AI 助手路由器
 * 提供智能问答和自然语言交互
 */
export const aiRouter = router({
  /**
   * 智能问答
   */
  ask: publicProcedure
    .input(
      z.object({
        question: z.string().min(1, "问题不能为空"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const systemPrompt = `你是 Manus 自动注册工具的 AI 助手。你的职责是帮助用户解决关于以下功能的问题：

1. 卡密激活 - 验证和激活卡密
2. 单个账号注册 - 注册单个账号
3. 批量注册 - 批量注册多个账号
4. 实时监控 - 监控注册进度
5. 账号管理 - 管理已注册的账号
6. 订单历史 - 查看订单和支付记录
7. 代理配置 - 配置代理服务器
8. 支付管理 - 支付相关问题

请根据用户的问题提供有帮助的、准确的答案。如果问题与这些功能无关，请礼貌地告诉用户这不在你的支持范围内。

回答要求：
- 简洁明了，避免冗长的解释
- 使用中文回答
- 如果涉及步骤，请用编号列表
- 提供实用的建议和解决方案`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: input.question,
            },
          ],
        });

        const answer =
          response.choices[0]?.message?.content ||
          "抱歉，我无法生成答案。请稍后再试。";

        return {
          answer,
          success: true,
        };
      } catch (error) {
        console.error("AI 服务错误:", error);
        throw new Error("AI 服务暂时不可用，请稍后再试");
      }
    }),

  /**
   * 获取常见问题列表
   */
  getFAQ: publicProcedure.query(() => {
    return [
      {
        id: "verify-cardkey",
        question: "如何验证卡密？",
        emoji: "🔑",
        answer: `验证卡密的步骤：
1. 进入"卡密激活"页面
2. 在输入框中输入您的卡密
3. 点击"✅ 验证"按钮
4. 系统会检查卡密的有效性和使用次数
5. 验证成功后会显示卡密的详细信息`,
      },
      {
        id: "batch-register",
        question: "批量注册失败怎么办？",
        emoji: "📋",
        answer: `批量注册失败的常见原因和解决方案：
• 网络连接问题 - 检查网络是否正常
• 代理配置错误 - 确保代理地址和端口正确
• 邀请链接失效 - 更换新的邀请链接
• 并发数过高 - 降低并发数重试
• 账号被限制 - 等待一段时间后重试

建议：从较低的并发数开始，逐步增加`,
      },
      {
        id: "export-results",
        question: "如何导出注册结果？",
        emoji: "📥",
        answer: `导出注册结果的方法：
1. 进入"订单历史"页面
2. 点击"📥 导出 CSV"按钮
3. 选择要导出的时间范围
4. 选择导出格式（CSV 或 Excel）
5. 点击"导出"按钮
6. 文件将自动下载到您的计算机

导出的文件包含：邮箱、密码、注册时间、状态等信息`,
      },
      {
        id: "proxy-config",
        question: "代理配置问题",
        emoji: "🌐",
        answer: `代理配置指南：
1. 进入"代理配置"页面
2. 选择代理提供商（Luminati、Oxylabs、SmartProxy 等）
3. 输入代理地址和端口
4. 输入用户名和密码（如需要）
5. 选择轮换策略（随机、轮流、地理位置等）
6. 点击"✅ 验证"测试代理连接
7. 配置完成后点击"💾 保存"

建议：定期检查代理健康状态`,
      },
      {
        id: "claim-account",
        question: "账号领取流程",
        emoji: "📦",
        answer: `领取账号的流程：
1. 注册任务完成后，进入"账号管理"页面
2. 查看已注册的账号列表
3. 点击"📦 点击领取账号"按钮
4. 选择要领取的账号
5. 系统会生成下载链接
6. 点击下载获取账号信息（邮箱和密码）
7. 妥善保管账号信息

注意：账号信息只能下载一次，请妥善保管`,
      },
      {
        id: "payment-issue",
        question: "支付相关问题",
        emoji: "💳",
        answer: `支付相关问题解答：
• 支付失败 - 检查支付方式是否正确，余额是否充足
• 订单未到账 - 通常需要 5-15 分钟，请耐心等待
• 发票问题 - 进入"订单历史"页面下载发票
• 退款申请 - 联系客服处理退款请求
• 发票抬头修改 - 在支付前修改发票抬头

客服邮箱：support@manus.im`,
      },
    ];
  }),

  /**
   * 获取帮助文档
   */
  getHelp: publicProcedure
    .input(
      z.object({
        topic: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const helpDocs: Record<string, string> = {
        cardkey: `卡密系统帮助文档

卡密是访问本系统的凭证，每个卡密都有以下属性：
- 有效期：卡密的过期时间
- 使用次数：卡密可以使用的次数
- 剩余次数：卡密还能使用的次数

激活卡密：
1. 进入"卡密激活"页面
2. 输入卡密代码
3. 点击"✅ 验证"按钮
4. 系统会验证卡密并显示详细信息

注意事项：
- 卡密只能激活一次
- 激活后无法转让
- 请妥善保管卡密代码`,

        registration: `账号注册帮助文档

本系统支持两种注册方式：

单个注册：
1. 进入"单个账号注册"页面
2. 输入邀请链接或邀请码
3. 点击"🚀 开始注册"按钮
4. 系统会自动完成注册流程
5. 注册完成后显示账号信息

批量注册：
1. 进入"批量注册"页面
2. 输入多个邀请链接（每行一个）
3. 设置并发数和重试次数
4. 点击"🚀 开始批量注册"按钮
5. 实时监控注册进度
6. 注册完成后导出结果

建议：
- 从较低的并发数开始
- 使用稳定的代理
- 定期检查注册进度`,

        proxy: `代理配置帮助文档

代理配置用于绕过地理限制和提高成功率。

支持的代理提供商：
- Luminati (Bright Data)
- Oxylabs
- SmartProxy
- Zyte
- 其他 HTTP 代理

配置步骤：
1. 选择代理提供商
2. 输入代理地址和端口
3. 输入认证信息（如需要）
4. 选择轮换策略
5. 点击"✅ 验证"测试连接
6. 点击"💾 保存"保存配置

轮换策略：
- 随机：每次请求使用随机代理
- 轮流：按顺序轮流使用代理
- 地理位置：根据地理位置选择代理
- 性能优先：选择性能最好的代理`,

        payment: `支付帮助文档

本系统支持多种支付方式：
- 支付宝
- 微信支付
- 信用卡
- 银行转账

支付流程：
1. 进入"订单历史"页面
2. 查看待支付订单
3. 点击"💳 支付"按钮
4. 选择支付方式
5. 完成支付
6. 订单自动更新

常见问题：
- 支付失败：检查网络和支付方式
- 订单未更新：刷新页面或等待几分钟
- 发票问题：联系客服

客服邮箱：support@manus.im`,
      };

      if (input.topic && helpDocs[input.topic]) {
        return {
          topic: input.topic,
          content: helpDocs[input.topic],
        };
      }

      return {
        topics: Object.keys(helpDocs),
        message: "请指定要查看的帮助主题",
      };
    }),

  /**
   * 获取系统状态
   */
  getSystemStatus: publicProcedure.query(async () => {
    return {
      status: "operational",
      message: "系统正常运行",
      timestamp: new Date(),
      services: {
        registration: "✅ 正常",
        payment: "✅ 正常",
        proxy: "✅ 正常",
        ai: "✅ 正常",
      },
    };
  }),

  /**
   * 提交反馈
   */
  submitFeedback: publicProcedure
    .input(
      z.object({
        type: z.enum(["bug", "feature", "improvement", "other"]),
        title: z.string().min(1, "标题不能为空"),
        description: z.string().min(1, "描述不能为空"),
        email: z.string().email("邮箱格式不正确").optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 这里可以集成邮件服务或数据库存储
        console.log("收到用户反馈:", input);

        return {
          success: true,
          message: "感谢您的反馈！我们会尽快处理。",
        };
      } catch (error) {
        console.error("反馈提交失败:", error);
        throw new Error("反馈提交失败，请稍后再试");
      }
    }),
});
