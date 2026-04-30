import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { EmojiButton } from '@/components/EmojiButton';
import { StatCard, StatGrid } from '@/components/StatCard';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [editingName, setEditingName] = useState((user as any)?.name || '');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 获取用户信息
  const { data: profile, isLoading: profileLoading } = (trpc as any).user.getProfile.useQuery();
  const { data: stats } = (trpc as any).user.getAccountStats.useQuery();
  const { data: apiKeys } = (trpc as any).user.getApiKeys.useQuery();
  const { data: notificationSettings } = (trpc as any).user.getNotificationSettings.useQuery();
  const { data: securitySettings } = (trpc as any).user.getSecuritySettings.useQuery();
  const { data: activityLog } = (trpc as any).user.getActivityLog.useQuery({ limit: 10 });

  // 更新个人信息
  const updateProfile = (trpc as any).user.updateProfile.useMutation({
    onSuccess: () => {
      // 更新成功
      console.log('个人信息已更新');
    },
    onError: (error: any) => {
      // 更新失败
      console.error('更新失败:', error.message);
    },
  });

  // 创建 API 密钥
  const createApiKey = (trpc as any).user.createApiKey.useMutation({
    onSuccess: (data: any) => {
      // 创建成功
      console.log('API 密钥已创建');
    },
  });

  // 修改密码
  const changePassword = (trpc as any).user.changePassword.useMutation({
    onSuccess: () => {
      // 密码已修改
      console.log('密码已修改');
    },
  });

  const handleUpdateProfile = () => {
    if (editingName.trim()) {
      updateProfile.mutate({ name: editingName });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('内容已复制到剪贴板');
  };

  if (profileLoading) {
    return <div className="p-8 text-center">⏳ 加载中...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 个人信息卡片 */}
      <Card className="border-blue-500/20 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            个人信息
          </CardTitle>
          <CardDescription>管理您的账户信息和基本设置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">用户名</label>
              <div className="flex gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="输入您的用户名"
                  className="bg-slate-800/50 border-slate-700"
                />
                <EmojiButton
                  emoji="💾"
                  label="保存"
                  onClick={handleUpdateProfile}
                  disabled={updateProfile.isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">邮箱</label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-slate-800/50 border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">账户类型</p>
                <p className="font-medium">
                  {profile?.role === 'admin' ? '👑 管理员' : '👤 普通用户'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">加入时间</p>
                <p className="font-medium">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 账户统计 */}
      {stats && (
        <div>
          <h3 className="text-lg font-semibold mb-4">📊 账户统计</h3>
          <StatGrid
            stats={[
              {
                emoji: '📋',
                label: '总任务数',
                value: stats.totalTasks,
              },
              {
                emoji: '✅',
                label: '成功数',
                value: stats.successCount,
              },
              {
                emoji: '❌',
                label: '失败数',
                value: stats.failCount,
              },
              {
                emoji: '👥',
                label: '总账号数',
                value: stats.totalAccounts,
              },
            ]}
          />
        </div>
      )}

      {/* 选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="profile">🔐 安全设置</TabsTrigger>
          <TabsTrigger value="api">🔑 API 密钥</TabsTrigger>
          <TabsTrigger value="notifications">🔔 通知设置</TabsTrigger>
          <TabsTrigger value="activity">📝 活动日志</TabsTrigger>
        </TabsList>

        {/* 安全设置 */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-blue-500/20 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔐</span>
                安全设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 修改密码 */}
              <div className="space-y-4">
                <h4 className="font-semibold">修改密码</h4>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="当前密码"
                    className="bg-slate-800/50 border-slate-700"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="新密码（至少8个字符，包含大小写和数字）"
                      className="bg-slate-800/50 border-slate-700 pr-10"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Input
                    type="password"
                    placeholder="确认新密码"
                    className="bg-slate-800/50 border-slate-700"
                  />
                  <EmojiButton
                    emoji="🔄"
                    label="修改密码"
                    onClick={() => {
                      if (formData.newPassword === formData.confirmPassword) {
                        changePassword.mutate({
                          currentPassword: formData.currentPassword,
                          newPassword: formData.newPassword,
                          confirmPassword: formData.confirmPassword,
                        } as any);
                      }
                    }}
                    disabled={changePassword.isPending}
                  />
                </div>
              </div>

              {/* 两步验证 */}
              <div className="space-y-4 border-t border-slate-700 pt-4">
                <h4 className="font-semibold">两步验证</h4>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                  <div>
                    <p className="font-medium">
                      {securitySettings?.twoFactorEnabled ? '✅ 已启用' : '❌ 未启用'}
                    </p>
                    <p className="text-sm text-slate-400">
                      增强账户安全性
                    </p>
                  </div>
                  <EmojiButton
                    emoji={securitySettings?.twoFactorEnabled ? '🔓' : '🔒'}
                    label={securitySettings?.twoFactorEnabled ? '禁用' : '启用'}
                    onClick={() => {}}
                  />
                </div>
              </div>

              {/* 登录历史 */}
              <div className="space-y-4 border-t border-slate-700 pt-4">
                <h4 className="font-semibold">最近登录</h4>
                <div className="space-y-2">
                  {securitySettings?.loginHistory?.slice(0, 3).map((login: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded text-sm">
                      <p className="font-medium">{login.device}</p>
                      <p className="text-slate-400">{login.ip} • {login.location}</p>
                      <p className="text-slate-500 text-xs">
                        {new Date(login.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API 密钥 */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-blue-500/20 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔑</span>
                API 密钥管理
              </CardTitle>
              <CardDescription>用于 API 集成和自动化任务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EmojiButton
                emoji="➕"
                label="创建新密钥"
                onClick={() => createApiKey.mutate({ name: '新密钥' })}
                disabled={createApiKey.isPending}
              />

              <div className="space-y-3">
                {apiKeys?.map((key: any) => (
                  <div key={key.id} className="p-4 bg-slate-800/50 rounded border border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-sm text-slate-400">
                          创建于 {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 p-2 bg-slate-900 rounded text-xs font-mono">
                        {key.key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="p-2 hover:bg-slate-700 rounded"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      最后使用: {new Date(key.lastUsed).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-blue-500/20 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔔</span>
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 邮件通知 */}
              <div className="space-y-3">
                <h4 className="font-semibold">📧 邮件通知</h4>
                {Object.entries(notificationSettings?.emailNotifications || {}).map(
                  ([key, value]: any) => (
                    <label key={key} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  )
                )}
              </div>

              {/* 应用内通知 */}
              <div className="space-y-3 border-t border-slate-700 pt-4">
                <h4 className="font-semibold">🔔 应用内通知</h4>
                {Object.entries(notificationSettings?.inAppNotifications || {}).map(
                  ([key, value]: any) => (
                    <label key={key} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  )
                )}
              </div>

              <EmojiButton
                emoji="💾"
                label="保存设置"
                onClick={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 活动日志 */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="border-blue-500/20 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📝</span>
                活动日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLog?.activities?.map((activity: any) => (
                  <div key={activity.id} className="p-3 bg-slate-800/50 rounded border-l-2 border-blue-500">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium">{activity.description}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {activity.ip && (
                      <p className="text-sm text-slate-400">IP: {activity.ip}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
