import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface QuickQuestion {
  id: string;
  question: string;
  emoji: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: 'verify-cardkey',
    question: '如何验证卡密？',
    emoji: '🔑',
  },
  {
    id: 'batch-register',
    question: '批量注册失败怎么办？',
    emoji: '📋',
  },
  {
    id: 'export-results',
    question: '如何导出注册结果？',
    emoji: '📥',
  },
  {
    id: 'proxy-config',
    question: '代理配置问题',
    emoji: '🌐',
  },
  {
    id: 'claim-account',
    question: '账号领取流程',
    emoji: '📦',
  },
  {
    id: 'payment-issue',
    question: '支付相关问题',
    emoji: '💳',
  },
];

const FAQ_ANSWERS: Record<string, string> = {
  'verify-cardkey': `验证卡密的步骤：
1. 进入"卡密激活"页面
2. 在输入框中输入您的卡密
3. 点击"✅ 验证"按钮
4. 系统会检查卡密的有效性和使用次数
5. 验证成功后会显示卡密的详细信息`,

  'batch-register': `批量注册失败的常见原因和解决方案：
• 网络连接问题 - 检查网络是否正常
• 代理配置错误 - 确保代理地址和端口正确
• 邀请链接失效 - 更换新的邀请链接
• 并发数过高 - 降低并发数重试
• 账号被限制 - 等待一段时间后重试

建议：从较低的并发数开始，逐步增加`,

  'export-results': `导出注册结果的方法：
1. 进入"订单历史"页面
2. 点击"📥 导出 CSV"按钮
3. 选择要导出的时间范围
4. 选择导出格式（CSV 或 Excel）
5. 点击"导出"按钮
6. 文件将自动下载到您的计算机

导出的文件包含：邮箱、密码、注册时间、状态等信息`,

  'proxy-config': `代理配置指南：
1. 进入"代理配置"页面
2. 选择代理提供商（Luminati、Oxylabs、SmartProxy 等）
3. 输入代理地址和端口
4. 输入用户名和密码（如需要）
5. 选择轮换策略（随机、轮流、地理位置等）
6. 点击"✅ 验证"测试代理连接
7. 配置完成后点击"💾 保存"

建议：定期检查代理健康状态`,

  'claim-account': `领取账号的流程：
1. 注册任务完成后，进入"账号管理"页面
2. 查看已注册的账号列表
3. 点击"📦 点击领取账号"按钮
4. 选择要领取的账号
5. 系统会生成下载链接
6. 点击下载获取账号信息（邮箱和密码）
7. 妥善保管账号信息

注意：账号信息只能下载一次，请妥善保管`,

  'payment-issue': `支付相关问题解答：
• 支付失败 - 检查支付方式是否正确，余额是否充足
• 订单未到账 - 通常需要 5-15 分钟，请耐心等待
• 发票问题 - 进入"订单历史"页面下载发票
• 退款申请 - 联系客服处理退款请求
• 发票抬头修改 - 在支付前修改发票抬头

客服邮箱：support@manus.im`,
};

/**
 * AI 助手浮窗组件
 * 提供实时对话、智能问答和常见问题解答
 */
export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 您好！我是 Manus AI 助手。有什么我可以帮助您的吗？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const askAI = trpc.ai.ask.useMutation();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 首先检查是否是快速问题
      const quickQuestion = QUICK_QUESTIONS.find(q => q.question === question);
      let answer: string;

      if (quickQuestion && FAQ_ANSWERS[quickQuestion.id]) {
        // 使用预定义的 FAQ 答案
        answer = FAQ_ANSWERS[quickQuestion.id];
      } else {
        // 调用 AI API 获取智能回答
        try {
          const response = await askAI.mutateAsync({ question });
          answer = typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);
        } catch (error) {
          console.error('AI 服务错误:', error);
          answer = '抱歉，我暂时无法回答您的问题。请稍后再试，或联系客服获取帮助。';
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话历史
  const handleClearHistory = () => {
    if (window.confirm('确定要清空对话历史吗？')) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '👋 您好！我是 Manus AI 助手。有什么我可以帮助您的吗？',
          timestamp: new Date(),
        },
      ]);
    }
  };

  // 浮窗关闭状态
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 z-40"
        title="打开 AI 助手"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  // 浮窗最小化状态
  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl z-50">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <span className="font-semibold">Manus AI 助手</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[600px] z-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <span className="font-semibold">Manus AI 助手</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearHistory}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            title="清空对话"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={cn(
                'max-w-xs px-4 py-2 rounded-lg text-sm',
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-600'
              )}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg rounded-bl-none border border-slate-200 dark:border-slate-600">
              <p className="text-sm flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                正在思考...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 快速问题 - 仅在初始状态显示 */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">
            💡 快速问题：
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q.id}
                onClick={() => handleSendMessage(q.question)}
                disabled={isLoading}
                className="w-full text-left text-sm px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>{q.emoji}</span>
                <span>{q.question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 rounded-b-lg flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              handleSendMessage(input);
            }
          }}
          placeholder="输入您的问题..."
          disabled={isLoading}
          className="flex-1 text-sm"
        />
        <Button
          onClick={() => handleSendMessage(input)}
          disabled={isLoading || !input.trim()}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Send size={18} />
        </Button>
      </div>

      {/* 提示信息 */}
      <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 rounded-b-lg">
        💬 由 AI 驱动的智能助手，支持自然语言交互
      </div>
    </Card>
  );
};
