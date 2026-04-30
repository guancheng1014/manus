import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard, StatGrid, StatCards } from './StatCard';

describe('StatCard', () => {
  it('should render stat card with emoji, label, and value', () => {
    render(
      <StatCard emoji="📋" label="总任务数" value={42} />
    );

    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('总任务数')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <StatCard
        emoji="📋"
        label="总任务数"
        value={42}
        description="总任务数"
      />
    );

    expect(screen.getByText('总任务数')).toBeInTheDocument();
  });

  it('should render trend indicator when trend is provided', () => {
    const { rerender } = render(
      <StatCard emoji="📈" label="成功数" value={100} trend="up" />
    );

    expect(screen.getByText('📈')).toBeInTheDocument();

    rerender(
      <StatCard emoji="📉" label="失败数" value={5} trend="down" />
    );

    expect(screen.getByText('📉')).toBeInTheDocument();
  });

  it('should apply correct color class for trend', () => {
    const { container: upContainer } = render(
      <StatCard emoji="✨" label="成功" value={50} trend="up" />
    );

    const upTrend = upContainer.querySelector('.text-green-500');
    expect(upTrend).toBeInTheDocument();

    const { container: downContainer } = render(
      <StatCard emoji="❌" label="失败" value={5} trend="down" />
    );

    const downTrend = downContainer.querySelector('.text-red-500');
    expect(downTrend).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(
      <StatCard emoji="⏱️" label="运行时间" value="24h 30m" />
    );

    expect(screen.getByText('24h 30m')).toBeInTheDocument();
  });
});

describe('StatGrid', () => {
  it('should render multiple stat cards', () => {
    const stats = [
      { emoji: '📋', label: '任务', value: 10 },
      { emoji: '✨', label: '成功', value: 8 },
      { emoji: '❌', label: '失败', value: 2 },
    ];

    render(<StatGrid stats={stats} />);

    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should apply correct grid columns class', () => {
    const stats = [
      { emoji: '📋', label: '任务', value: 10 },
    ];

    const { container } = render(<StatGrid stats={stats} columns={2} />);

    const gridDiv = container.querySelector('.grid-cols-2');
    expect(gridDiv).toBeInTheDocument();
  });

  it('should render with default 4 columns', () => {
    const stats = [
      { emoji: '📋', label: '任务', value: 10 },
    ];

    const { container } = render(<StatGrid stats={stats} />);

    const gridDiv = container.querySelector('.grid-cols-4');
    expect(gridDiv).toBeInTheDocument();
  });
});

describe('StatCards', () => {
  it('should create TotalTasks stat card', () => {
    const stat = StatCards.TotalTasks(42);

    expect(stat.emoji).toBe('📋');
    expect(stat.label).toBe('最后任务');
    expect(stat.value).toBe(42);
  });

  it('should create SuccessCount stat card with up trend', () => {
    const stat = StatCards.SuccessCount(100);

    expect(stat.emoji).toBe('✨');
    expect(stat.label).toBe('流成功数');
    expect(stat.value).toBe(100);
    expect(stat.trend).toBe('up');
  });

  it('should create RunningCount stat card', () => {
    const stat = StatCards.RunningCount(5);

    expect(stat.emoji).toBe('⚙️');
    expect(stat.label).toBe('执行中数');
    expect(stat.value).toBe(5);
  });

  it('should create FailedCount stat card with down trend', () => {
    const stat = StatCards.FailedCount(2);

    expect(stat.emoji).toBe('❌');
    expect(stat.label).toBe('失败数');
    expect(stat.value).toBe(2);
    expect(stat.trend).toBe('down');
  });

  it('should create PaidOrders stat card', () => {
    const stat = StatCards.PaidOrders(150);

    expect(stat.emoji).toBe('✅');
    expect(stat.label).toBe('已支付');
    expect(stat.value).toBe(150);
    expect(stat.trend).toBe('up');
  });

  it('should create SuccessRate stat card', () => {
    const stat = StatCards.SuccessRate('95.5%');

    expect(stat.emoji).toBe('📊');
    expect(stat.label).toBe('成功率');
    expect(stat.value).toBe('95.5%');
    expect(stat.trend).toBe('up');
  });
});
