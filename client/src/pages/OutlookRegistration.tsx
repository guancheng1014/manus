/**
 * Outlook 批量注册界面
 * 支持单个/批量创建 Outlook 账户，显示实时进度
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { EmojiButton } from '@/components/EmojiButton';
import { useLocation } from 'wouter';

interface Account {
  email: string;
  password: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  createdAt?: Date;
}

export default function OutlookRegistration() {
  const [count, setCount] = useState(5);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [proxyUrl, setProxyUrl] = useState('');
  const [captchaKey, setCaptchaKey] = useState('');
  const [, setLocation] = useLocation();

  const createBatchMutation = trpc.verification.createOutlookAccountsBatch.useMutation();

  const handleCreateBatch = async () => {
    if (count < 1 || count > 100) {
      alert('请输入 1-100 之间的数字');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setAccounts([]);

    try {
      const result = await createBatchMutation.mutateAsync({
        count,
        proxyUrl: proxyUrl || undefined,
        captchaKey: captchaKey || undefined,
      });

      // 模拟进度更新
      const createdAccounts = result.accounts.map((acc, idx) => ({
        ...acc,
        createdAt: new Date(),
      }));

      setAccounts(createdAccounts);
      setProgress(100);

      // 自动导入到邮箱验证页面（仅保存数据，不自动跳转，方便用户查看结果列表）
      const successAccounts = createdAccounts.filter(a => a.status === 'success');
      if (successAccounts.length > 0) {
        localStorage.setItem('importedOutlookAccounts', JSON.stringify(successAccounts));
      }
    } catch (error) {
      console.error('创建失败:', error);
      alert('创建失败，请检查配置');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (accounts.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const csv = [
      ['邮箱', '密码', '状态', '创建时间'],
      ...accounts.map(acc => [
        acc.email,
        acc.password,
        acc.status === 'success' ? '成功' : '失败',
        acc.createdAt?.toLocaleString() || '',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `outlook_accounts_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const successCount = accounts.filter(a => a.status === 'success').length;
  const failedCount = accounts.filter(a => a.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📧 Outlook 批量注册</h1>
        <EmojiButton emoji="⚙️" label="设置" onClick={() => {}} />
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">创建账户</TabsTrigger>
          <TabsTrigger value="results">结果列表</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🔧 创建配置</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="count">创建数量</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={e => setCount(parseInt(e.target.value) || 1)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground pt-2">最多 100 个</span>
                </div>
              </div>

              <div>
                <Label htmlFor="proxy">代理 URL（可选）</Label>
                <Input
                  id="proxy"
                  placeholder="http://proxy.example.com:8080"
                  value={proxyUrl}
                  onChange={e => setProxyUrl(e.target.value)}
                  disabled={isLoading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="captcha">CAPTCHA Key（可选）</Label>
                <Input
                  id="captcha"
                  placeholder="您的 CAPTCHA Key"
                  value={captchaKey}
                  onChange={e => setCaptchaKey(e.target.value)}
                  disabled={isLoading}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleCreateBatch}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? '正在创建...' : '🚀 开始创建'}
              </Button>
            </div>
          </Card>

          {isLoading && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  正在创建账户，请稍候...
                </p>
              </div>
            </Card>
          )}

          {accounts.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📊 创建统计</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{accounts.length}</div>
                  <div className="text-sm text-muted-foreground">总数</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-muted-foreground">成功</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-sm text-muted-foreground">失败</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" className="flex-1">
                  📥 导出 CSV
                </Button>
                <Button
                  onClick={() => {
                    setAccounts([]);
                    setProgress(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  🔄 重置
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {accounts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">暂无数据</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">邮箱</th>
                    <th className="text-left py-3 px-4">密码</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{acc.email}</td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <code className="bg-muted px-2 py-1 rounded">{acc.password}</code>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            acc.status === 'success'
                              ? 'bg-green-500/20 text-green-600'
                              : 'bg-red-500/20 text-red-600'
                          }`}
                        >
                          {acc.status === 'success' ? '✅ 成功' : '❌ 失败'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {acc.createdAt?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
