import React from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  emoji: string;
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

/**
 * 统计卡片组件
 * 用于展示关键指标，支持 emoji 图标和趋势指示
 */
export const StatCard: React.FC<StatCardProps> = ({
  emoji,
  label,
  value,
  trend,
  description,
}) => {
  const getTrendEmoji = () => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <div className="space-y-4">
        {/* 标题和趋势 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <p className="text-sm text-slate-400">{label}</p>
          </div>
          {trend && (
            <span className={`text-2xl ${getTrendColor()}`}>
              {getTrendEmoji()}
            </span>
          )}
        </div>

        {/* 数值 */}
        <div>
          <p className="text-4xl font-bold text-white">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * 统计卡片网格组件
 * 用于展示多个统计指标
 */
interface StatGridProps {
  stats: StatCardProps[];
  columns?: 1 | 2 | 3 | 4;
}

export const StatGrid: React.FC<StatGridProps> = ({ stats, columns = 4 }) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

/**
 * 预定义的统计卡片集合
 */
export const StatCards = {
  TotalTasks: (value: number | string) => ({
    emoji: '📋',
    label: '最后任务',
    value,
    description: '总任务数',
  }),
  SuccessCount: (value: number | string) => ({
    emoji: '✨',
    label: '流成功数',
    value,
    trend: 'up' as const,
    description: '成功注册数',
  }),
  RunningCount: (value: number | string) => ({
    emoji: '⚙️',
    label: '执行中数',
    value,
    description: '进行中的任务',
  }),
  FailedCount: (value: number | string) => ({
    emoji: '❌',
    label: '失败数',
    value,
    trend: 'down' as const,
    description: '失败的任务',
  }),
  TotalOrders: (value: number | string) => ({
    emoji: '📦',
    label: '总订单数',
    value,
    description: '订单总数',
  }),
  PaidOrders: (value: number | string) => ({
    emoji: '✅',
    label: '已支付',
    value,
    trend: 'up' as const,
    description: '已支付订单',
  }),
  PendingOrders: (value: number | string) => ({
    emoji: '⏳',
    label: '待支付',
    value,
    description: '待支付订单',
  }),
  RefundedOrders: (value: number | string) => ({
    emoji: '💰',
    label: '已退款',
    value,
    description: '已退款订单',
  }),
  SuccessRate: (value: number | string) => ({
    emoji: '📊',
    label: '成功率',
    value,
    trend: 'up' as const,
    description: '注册成功率',
  }),
  ActiveUsers: (value: number | string) => ({
    emoji: '👥',
    label: '活跃用户',
    value,
    description: '在线用户数',
  }),
  ProxyHealth: (value: number | string) => ({
    emoji: '🌐',
    label: '代理健康度',
    value,
    trend: 'up' as const,
    description: '代理可用性',
  }),
  SystemUptime: (value: number | string) => ({
    emoji: '⏱️',
    label: '系统运行时间',
    value,
    description: '系统可用性',
  }),
};
