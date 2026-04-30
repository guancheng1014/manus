import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard, StatGrid } from '@/components/StatCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/lib/i18n';

// 模拟数据
const chartData = [
  { date: '2026-04-20', tasks: 10, success: 8, failed: 2 },
  { date: '2026-04-21', tasks: 15, success: 12, failed: 3 },
  { date: '2026-04-22', tasks: 20, success: 18, failed: 2 },
  { date: '2026-04-23', tasks: 25, success: 22, failed: 3 },
  { date: '2026-04-24', tasks: 30, success: 27, failed: 3 },
  { date: '2026-04-25', tasks: 28, success: 25, failed: 3 },
  { date: '2026-04-26', tasks: 35, success: 32, failed: 3 },
  { date: '2026-04-27', tasks: 40, success: 36, failed: 4 },
  { date: '2026-04-28', tasks: 38, success: 34, failed: 4 },
  { date: '2026-04-29', tasks: 42, success: 38, failed: 4 },
  { date: '2026-04-30', tasks: 45, success: 41, failed: 4 },
];

const proxyData = [
  { name: 'Luminati', value: 35, color: '#3b82f6' },
  { name: 'Oxylabs', value: 30, color: '#10b981' },
  { name: 'SmartProxy', value: 25, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#8b5cf6' },
];

export function Dashboard() {
  const t = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📊 {t('stats.title')}</h1>
          <p className="text-muted-foreground mt-2">实时监控您的注册任务和系统性能</p>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* 关键指标卡片 */}
      <StatGrid
        stats={[
          {
            emoji: '📈',
            label: t('stats.totalTasks'),
            value: '342',
            trend: 'up',
            
          },
          {
            emoji: '✅',
            label: t('stats.successCount'),
            value: '308',
            trend: 'up',
            
          },
          {
            emoji: '❌',
            label: t('stats.failCount'),
            value: '34',
            trend: 'down',
            
          },
          {
            emoji: '👥',
            label: t('stats.totalAccounts'),
            value: '1,234',
            trend: 'up',
            
          },
        ]}
      />

      {/* 趋势图表 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 任务趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>📉 任务趋势</CardTitle>
            <CardDescription>过去 11 天的任务统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tasks" stroke="#3b82f6" name="总任务" />
                <Line type="monotone" dataKey="success" stroke="#10b981" name="成功" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="失败" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 成功率对比 */}
        <Card>
          <CardHeader>
            <CardTitle>📊 成功率对比</CardTitle>
            <CardDescription>每日成功率趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" stackId="a" fill="#10b981" name="成功" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="失败" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 代理分布 */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 代理提供商分布</CardTitle>
          <CardDescription>各代理提供商的使用比例</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={proxyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {proxyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {proxyData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 实时数据 */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ 实时数据</CardTitle>
          <CardDescription>最近 24 小时的关键指标</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">平均成功率</p>
              <p className="text-2xl font-bold mt-2">90.2%</p>
              <p className="text-xs text-green-600 mt-1">↑ 2.3% vs 昨天</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">平均响应时间</p>
              <p className="text-2xl font-bold mt-2">1.2s</p>
              <p className="text-xs text-green-600 mt-1">↓ 0.1s vs 昨天</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">活跃任务</p>
              <p className="text-2xl font-bold mt-2">12</p>
              <p className="text-xs text-yellow-600 mt-1">→ 同比</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">系统状态</p>
              <p className="text-2xl font-bold mt-2 text-green-600">✓ 正常</p>
              <p className="text-xs text-muted-foreground mt-1">运行时间: 99.9%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
