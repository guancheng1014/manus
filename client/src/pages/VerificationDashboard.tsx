/**
 * 验证管理仪表板
 * 统一管理 Outlook 注册、邮箱验证、短信验证的结果和进度
 * 提供实时监控、数据导出、统计分析等功能
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw, Trash2, Eye } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { EmojiButton } from '@/components/EmojiButton';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/_core/hooks/useAuth';

interface VerificationRecord {
  id: string;
  type: 'outlook' | 'email' | 'sms';
  email?: string;
  phoneNumber?: string;
  code: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

interface VerificationStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
  averageTime: number;
}

export default function VerificationDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
    averageTime: 0,
  });
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'outlook' | 'email' | 'sms'>('all');

  // 从 localStorage 加载记录
  useEffect(() => {
    const loadRecords = () => {
      try {
        const stored = localStorage.getItem('verificationRecords');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecords(parsed);
          calculateStats(parsed);
        }
      } catch (error) {
        console.error('加载验证记录失败:', error);
      }
    };

    loadRecords();
    const interval = setInterval(loadRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateStats = (recordsList: VerificationRecord[]) => {
    const total = recordsList.length;
    const success = recordsList.filter(r => r.status === 'success').length;
    const failed = recordsList.filter(r => r.status === 'failed').length;
    const pending = recordsList.filter(r => r.status === 'pending').length;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    // 计算平均耗时（仅统计已完成的记录）
    const completedRecords = recordsList.filter(r => r.completedAt);
    const averageTime = completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => {
          const time = r.completedAt ? new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime() : 0;
          return sum + time;
        }, 0) / completedRecords.length / 1000
      : 0;

    setStats({
      total,
      success,
      failed,
      pending,
      successRate,
      averageTime,
    });
  };

  const filteredRecords = records.filter(r => filter === 'all' || r.type === filter);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const headers = ['类型', '邮箱/手机', '验证码', '状态', '创建时间', '完成时间', '耗时(秒)'];
    const rows = filteredRecords.map(r => {
      const duration = r.completedAt
        ? (new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()) / 1000
        : '-';
      return [
        r.type === 'outlook' ? 'Outlook' : r.type === 'email' ? '邮箱' : '短信',
        r.email || r.phoneNumber || '-',
        r.code,
        r.status === 'success' ? '成功' : r.status === 'failed' ? '失败' : '待处理',
        new Date(r.createdAt).toLocaleString(),
        r.completedAt ? new Date(r.completedAt).toLocaleString() : '-',
        duration,
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `verification-records-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportJSON = () => {
    if (filteredRecords.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const json = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `verification-records-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  const handleClearRecords = () => {
    if (confirm('确定要清除所有验证记录吗？此操作不可撤销。')) {
      setRecords([]);
      setStats({
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        averageTime: 0,
      });
      localStorage.removeItem('verificationRecords');
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const stored = localStorage.getItem('verificationRecords');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecords(parsed);
        calculateStats(parsed);
      }
      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'outlook':
        return '📧';
      case 'email':
        return '✉️';
      case 'sms':
        return '📱';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          emoji="📊"
          label="总数"
          value={stats.total}
          trend="neutral"
        />
        <StatCard
          emoji="✅"
          label="成功"
          value={stats.success}
          trend={stats.successRate > 50 ? 'up' : 'down'}
        />
        <StatCard
          emoji="❌"
          label="失败"
          value={stats.failed}
          trend={stats.failed > 0 ? 'down' : 'neutral'}
        />
        <StatCard
          emoji="⏳"
          label="待处理"
          value={stats.pending}
          trend={stats.pending > 0 ? 'neutral' : 'up'}
        />
        <StatCard
          emoji="📈"
          label="成功率"
          value={`${stats.successRate.toFixed(1)}%`}
          trend={stats.successRate > 80 ? 'up' : stats.successRate > 50 ? 'neutral' : 'down'}
        />
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-900/30 data-[state=active]:text-cyan-400">
            📊 概览
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-cyan-900/30 data-[state=active]:text-cyan-400">
            📋 记录
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyan-900/30 data-[state=active]:text-cyan-400">
            💾 导出
          </TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">验证进度</CardTitle>
              <CardDescription>所有验证类型的综合进度</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-300">整体成功率</span>
                  <span className="text-sm font-semibold text-cyan-400">{stats.successRate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.successRate} className="h-2 bg-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400">平均耗时</div>
                  <div className="text-2xl font-bold text-green-400">{stats.averageTime.toFixed(1)}s</div>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400">总记录数</div>
                  <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                </div>
              </div>

              {/* 类型分布 */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">📧</div>
                  <div className="text-xs text-slate-400">Outlook</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {records.filter(r => r.type === 'outlook').length}
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">✉️</div>
                  <div className="text-xs text-slate-400">邮箱</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {records.filter(r => r.type === 'email').length}
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-xs text-slate-400">短信</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {records.filter(r => r.type === 'sms').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 记录标签页 */}
        <TabsContent value="records" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-cyan-400">验证记录</CardTitle>
                  <CardDescription>所有验证操作的详细记录</CardDescription>
                </div>
                <div className="flex gap-2">
                  <EmojiButton
                    emoji="🔄"
                    label="刷新"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  />
                  <EmojiButton
                    emoji="🗑️"
                    label="清空"
                    onClick={handleClearRecords}
                    variant="destructive"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 筛选按钮 */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  全部 ({records.length})
                </Button>
                <Button
                  variant={filter === 'outlook' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('outlook')}
                  className={filter === 'outlook' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  📧 Outlook ({records.filter(r => r.type === 'outlook').length})
                </Button>
                <Button
                  variant={filter === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('email')}
                  className={filter === 'email' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  ✉️ 邮箱 ({records.filter(r => r.type === 'email').length})
                </Button>
                <Button
                  variant={filter === 'sms' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('sms')}
                  className={filter === 'sms' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  📱 短信 ({records.filter(r => r.type === 'sms').length})
                </Button>
              </div>

              {/* 记录列表 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-cyan-400" />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <Alert className="bg-slate-700/50 border-slate-600">
                    <AlertDescription className="text-slate-300">
                      暂无验证记录
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-all cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getTypeIcon(record.type)}</span>
                            <span className="text-sm font-semibold text-slate-200">
                              {record.email || record.phoneNumber || '未知'}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(record.status)}`}>
                              {record.status === 'success' ? '✅ 成功' : record.status === 'failed' ? '❌ 失败' : '⏳ 待处理'}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            验证码: {record.code} • {new Date(record.createdAt).toLocaleString()}
                          </div>
                          {record.error && (
                            <div className="text-xs text-red-400 mt-1">错误: {record.error}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 详情面板 */}
          {selectedRecord && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">验证详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">类型</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {selectedRecord.type === 'outlook' ? 'Outlook' : selectedRecord.type === 'email' ? '邮箱' : '短信'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">状态</div>
                    <Badge className={`text-xs ${getStatusColor(selectedRecord.status)}`}>
                      {selectedRecord.status === 'success' ? '✅ 成功' : selectedRecord.status === 'failed' ? '❌ 失败' : '⏳ 待处理'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">邮箱/手机</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {selectedRecord.email || selectedRecord.phoneNumber || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">验证码</div>
                    <div className="text-sm font-mono font-semibold text-cyan-400">
                      {selectedRecord.code}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">创建时间</div>
                    <div className="text-sm text-slate-300">
                      {new Date(selectedRecord.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">完成时间</div>
                    <div className="text-sm text-slate-300">
                      {selectedRecord.completedAt ? new Date(selectedRecord.completedAt).toLocaleString() : '-'}
                    </div>
                  </div>
                </div>
                {selectedRecord.error && (
                  <Alert className="bg-red-500/10 border-red-500/30">
                    <AlertDescription className="text-red-400">
                      错误: {selectedRecord.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 导出标签页 */}
        <TabsContent value="export" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">导出数据</CardTitle>
              <CardDescription>选择导出格式和范围</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 导出范围选择 */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">导出范围</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  >
                    全部 ({records.length})
                  </Button>
                  <Button
                    variant={filter === 'outlook' ? 'default' : 'outline'}
                    onClick={() => setFilter('outlook')}
                    className={filter === 'outlook' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  >
                    Outlook ({records.filter(r => r.type === 'outlook').length})
                  </Button>
                  <Button
                    variant={filter === 'email' ? 'default' : 'outline'}
                    onClick={() => setFilter('email')}
                    className={filter === 'email' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  >
                    邮箱 ({records.filter(r => r.type === 'email').length})
                  </Button>
                  <Button
                    variant={filter === 'sms' ? 'default' : 'outline'}
                    onClick={() => setFilter('sms')}
                    className={filter === 'sms' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                  >
                    短信 ({records.filter(r => r.type === 'sms').length})
                  </Button>
                </div>
              </div>

              {/* 导出格式选择 */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-3 block">导出格式</label>
                <div className="grid grid-cols-1 gap-3">
                  <EmojiButton
                    emoji="📊"
                    label={`导出为 CSV (${filteredRecords.length} 条记录)`}
                    onClick={handleExportCSV}
                    disabled={filteredRecords.length === 0}
                    className="w-full justify-start"
                  />
                  <EmojiButton
                    emoji="📄"
                    label={`导出为 JSON (${filteredRecords.length} 条记录)`}
                    onClick={handleExportJSON}
                    disabled={filteredRecords.length === 0}
                    className="w-full justify-start"
                  />
                </div>
              </div>

              {/* 导出说明 */}
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <AlertDescription className="text-blue-300 text-sm">
                  💡 提示：导出的数据包含所有验证记录的详细信息，可用于数据分析和备份。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
