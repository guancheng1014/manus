import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Zap, Activity, Trash2, Plus } from 'lucide-react';
import { trpc } from "@/lib/trpc";

export default function AdminDashboardNew() {
  const { user } = useAuth();
  const [emailStatus, setEmailStatus] = useState<'available' | 'assigned' | 'invalid' | 'registered'>('available');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 获取系统概览
  const { data: overview } = trpc.admin.getSystemOverview.useQuery();

  // 获取邮箱库数据
  const { data: emailPoolData, refetch: refetchEmails } = trpc.admin.getEmailPool.useQuery({
    limit: 50,
    offset: 0,
    status: emailStatus,
  });

  // 获取代理池统计
  const { data: proxyStats } = trpc.admin.getProxyStats.useQuery();

  // 获取代理列表
  const { data: proxyList } = trpc.admin.getProxyList.useQuery({ limit: 20 });

  // 添加邮箱到库
  const addEmailMutation = trpc.admin.addEmailToPool.useMutation({
    onSuccess: () => {
      setNewEmail('');
      setNewPassword('');
      refetchEmails();
    },
  });

  // 删除邮箱
  const deleteEmailMutation = trpc.admin.deleteEmailFromPool.useMutation({
    onSuccess: () => {
      refetchEmails();
    },
  });

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      {/* 系统概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">总用户数</p>
              <p className="text-2xl font-bold">{overview?.users || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">可用邮箱</p>
              <p className="text-2xl font-bold">
                {overview?.emails?.find((e: any) => e.status === 'available')?.count || 0}
              </p>
            </div>
            <Mail className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">代理池</p>
              <p className="text-2xl font-bold">{proxyStats?.proxy_count || 0}</p>
            </div>
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">EzSolver</p>
              <p className={`text-lg font-bold ${overview?.ezSolver === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                {overview?.ezSolver === 'online' ? '在线' : '离线'}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* 管理选项卡 */}
      <Tabs defaultValue="emails" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails">邮箱库管理</TabsTrigger>
          <TabsTrigger value="proxies">代理 IP 管理</TabsTrigger>
          <TabsTrigger value="monitor">全局监控</TabsTrigger>
        </TabsList>

        {/* 邮箱库管理 */}
        <TabsContent value="emails" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">添加邮箱到库</h3>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="邮箱地址"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                type="email"
              />
              <Input
                placeholder="密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
              />
              <Button
                onClick={() => {
                  if (newEmail && newPassword) {
                    addEmailMutation.mutate({ email: newEmail, password: newPassword });
                  }
                }}
                disabled={addEmailMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              <Select value={emailStatus} onValueChange={(v: any) => setEmailStatus(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">可用</SelectItem>
                  <SelectItem value="assigned">已分配</SelectItem>
                  <SelectItem value="invalid">无效</SelectItem>
                  <SelectItem value="registered">已注册</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailPoolData?.items?.map((email: any) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-mono text-sm">{email.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        email.status === 'available' ? 'bg-green-100 text-green-700' :
                        email.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        email.status === 'invalid' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {email.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEmailMutation.mutate({ id: email.id })}
                        disabled={deleteEmailMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 代理 IP 管理 */}
        <TabsContent value="proxies" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">代理池统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">总代理数</p>
                <p className="text-2xl font-bold">{proxyStats?.proxy_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">活跃代理</p>
                <p className="text-2xl font-bold">{proxyStats?.alive_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">精英代理</p>
                <p className="text-2xl font-bold">{proxyStats?.elite_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均延迟</p>
                <p className="text-2xl font-bold">{proxyStats?.avg_latency_ms || 0}ms</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">代理列表样本</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP:Port</TableHead>
                  <TableHead>国家</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>延迟</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxyList?.proxy?.slice(0, 10).map((proxy: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{proxy.host}:{proxy.port}</TableCell>
                    <TableCell>{proxy.country_code}</TableCell>
                    <TableCell>{proxy.type}</TableCell>
                    <TableCell>{proxy.latency_ms}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 全局监控 */}
        <TabsContent value="monitor" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">系统状态监控</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">EzSolver (验证码解决器)</p>
                  <p className="text-sm text-muted-foreground">http://localhost:8191</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  overview?.ezSolver === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {overview?.ezSolver === 'online' ? '✓ 在线' : '✗ 离线'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Worldpool (代理池)</p>
                  <p className="text-sm text-muted-foreground">http://localhost:8080</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  proxyStats?.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {proxyStats?.online ? '✓ 在线' : '✗ 离线'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">数据库</p>
                  <p className="text-sm text-muted-foreground">MySQL 连接</p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✓ 在线
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
