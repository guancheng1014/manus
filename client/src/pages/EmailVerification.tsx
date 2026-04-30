/**
 * 邮箱验证码接收界面
 * 支持临时邮箱和 Outlook 邮箱的验证码接收
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

interface EmailVerificationResult {
  code: string;
  email: string;
  source: string;
  timestamp: Date;
}

export default function EmailVerification() {
  const [tempMailAddress, setTempMailAddress] = useState('');
  const [tempMailId, setTempMailId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<EmailVerificationResult[]>([]);

  // Outlook 邮箱验证
  const [outlookEmail, setOutlookEmail] = useState('');
  const [outlookPassword, setOutlookPassword] = useState('');

  const generateTempMailMutation = trpc.verification.generateTempMail.useMutation();
  const waitForEmailCodeMutation = trpc.verification.waitForEmailVerificationCode.useMutation();
  const getOutlookCodeMutation = trpc.verification.getVerificationCodeFromOutlook.useMutation();

  const handleGenerateTempMail = async () => {
    setIsLoading(true);
    try {
      const result = await generateTempMailMutation.mutateAsync();
      setTempMailAddress(result.address);
      setTempMailId(result.id);
      setVerificationCode('');
    } catch (error) {
      alert('生成临时邮箱失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaitForCode = async () => {
    if (!tempMailId) {
      alert('请先生成临时邮箱');
      return;
    }

    setIsLoading(true);
    try {
      const result = await waitForEmailCodeMutation.mutateAsync({
        tempMailId,
        timeout: 300000, // 5分钟
      });

      if (result.success && result.code) {
        setVerificationCode(result.code);
        setResults(prev => [
          ...prev,
          {
            code: result.code || '',
            email: tempMailAddress,
            source: result.source || 'temp-mail',
            timestamp: new Date(),
          },
        ]);
      } else {
        alert(result.error || '未收到验证码');
      }
    } catch (error) {
      alert('等待验证码失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOutlookCode = async () => {
    if (!outlookEmail || !outlookPassword) {
      alert('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);
    try {
      const result = await getOutlookCodeMutation.mutateAsync({
        email: outlookEmail,
        password: outlookPassword,
        timeout: 300000,
      });

      if (result.success && result.code) {
        setVerificationCode(result.code);
        setResults(prev => [
          ...prev,
          {
            code: result.code || '',
            email: outlookEmail,
            source: result.source || 'outlook-imap',
            timestamp: new Date(),
          },
        ]);
      } else {
        alert(result.error || '获取验证码失败');
      }
    } catch (error) {
      alert('获取验证码失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      alert('已复制到剪贴板');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">✉️ 邮箱验证码接收</h1>
        <EmojiButton emoji="🔄" label="刷新" onClick={() => setResults([])} />
      </div>

      <Tabs defaultValue="tempmail" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tempmail">临时邮箱</TabsTrigger>
          <TabsTrigger value="outlook">Outlook 邮箱</TabsTrigger>
        </TabsList>

        <TabsContent value="tempmail" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📬 临时邮箱验证</h2>

            <div className="space-y-4">
              {tempMailAddress ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">临时邮箱地址</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-2 rounded font-mono text-sm">
                      {tempMailAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(tempMailAddress);
                        alert('已复制');
                      }}
                    >
                      复制
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateTempMail}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {tempMailAddress ? '🔄 重新生成' : '📧 生成临时邮箱'}
                </Button>
                {tempMailAddress && (
                  <Button
                    onClick={handleWaitForCode}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? '⏳ 等待中...' : '⏱️ 等待验证码'}
                  </Button>
                )}
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">正在等待验证码，请稍候...</p>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              {verificationCode && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-2">✅ 验证码已接收</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-3 rounded font-mono text-lg font-bold">
                      {verificationCode}
                    </code>
                    <Button
                      size="sm"
                      onClick={handleCopyCode}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      📋 复制
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="outlook" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🔐 Outlook 邮箱验证</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="outlook-email">邮箱地址</Label>
                <Input
                  id="outlook-email"
                  type="email"
                  placeholder="your.email@outlook.com"
                  value={outlookEmail}
                  onChange={e => setOutlookEmail(e.target.value)}
                  disabled={isLoading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="outlook-password">密码</Label>
                <Input
                  id="outlook-password"
                  type="password"
                  placeholder="••••••••"
                  value={outlookPassword}
                  onChange={e => setOutlookPassword(e.target.value)}
                  disabled={isLoading}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleGetOutlookCode}
                disabled={isLoading || !outlookEmail || !outlookPassword}
                className="w-full"
              >
                {isLoading ? '⏳ 获取中...' : '🔓 获取验证码'}
              </Button>

              {isLoading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">正在连接 Outlook，请稍候...</p>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              {verificationCode && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-2">✅ 验证码已获取</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-3 rounded font-mono text-lg font-bold">
                      {verificationCode}
                    </code>
                    <Button
                      size="sm"
                      onClick={handleCopyCode}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      📋 复制
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 验证历史</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4">邮箱</th>
                  <th className="text-left py-3 px-4">验证码</th>
                  <th className="text-left py-3 px-4">来源</th>
                  <th className="text-left py-3 px-4">时间</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{result.email}</td>
                    <td className="py-3 px-4 font-mono font-bold">{result.code}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="bg-muted px-2 py-1 rounded">
                        {result.source === 'temp-mail' ? '📬 临时邮箱' : '🔐 Outlook'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {result.timestamp.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
