/**
 * 短信验证码接收界面
 * 支持虚拟手机号的验证码接收和批量生成
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

interface SMSVerificationResult {
  code: string;
  phoneNumber: string;
  source: string;
  timestamp: Date;
}

interface VirtualPhone {
  number: string;
  id: string;
  provider: string;
  expiresAt: Date;
}

export default function SMSVerification() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SMSVerificationResult[]>([]);
  const [virtualPhones, setVirtualPhones] = useState<VirtualPhone[]>([]);
  const [batchCount, setBatchCount] = useState(5);

  const generatePhoneMutation = trpc.verification.generateVirtualPhoneNumber.useMutation();
  const waitForSMSMutation = trpc.verification.waitForSMSVerificationCode.useMutation();
  const generateBatchMutation = trpc.verification.generateVirtualPhoneNumbersBatch.useMutation();

  const handleGeneratePhone = async () => {
    setIsLoading(true);
    try {
      const result = await generatePhoneMutation.mutateAsync();
      setPhoneNumber(result.number);
      setPhoneId(result.id);
      setVerificationCode('');
    } catch (error) {
      alert('生成虚拟手机号失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaitForSMS = async () => {
    if (!phoneId) {
      alert('请先生成虚拟手机号');
      return;
    }

    setIsLoading(true);
    try {
      const result = await waitForSMSMutation.mutateAsync({
        phoneId,
        timeout: 300000, // 5分钟
      });

      if (result.success && result.code) {
        setVerificationCode(result.code);
        setResults(prev => [
          ...prev,
          {
            code: result.code || '',
            phoneNumber: phoneNumber,
            source: result.source || 'textbee',
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

  const handleGenerateBatch = async () => {
    if (batchCount < 1 || batchCount > 100) {
      alert('请输入 1-100 之间的数字');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateBatchMutation.mutateAsync({
        count: batchCount,
      });

      setVirtualPhones(result.phones);
    } catch (error) {
      alert('批量生成失败');
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

  const handleExportPhones = () => {
    if (virtualPhones.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const csv = [
      ['手机号', '提供商', '过期时间'],
      ...virtualPhones.map(phone => [
        phone.number,
        phone.provider,
        new Date(phone.expiresAt).toLocaleString(),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `virtual_phones_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📱 短信验证码接收</h1>
        <EmojiButton emoji="🔄" label="刷新" onClick={() => setResults([])} />
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">单个接收</TabsTrigger>
          <TabsTrigger value="batch">批量生成</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📲 虚拟手机号验证</h2>

            <div className="space-y-4">
              {phoneNumber ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">虚拟手机号</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-2 rounded font-mono text-sm">
                      {phoneNumber}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(phoneNumber);
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
                  onClick={handleGeneratePhone}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {phoneNumber ? '🔄 重新生成' : '📱 生成虚拟手机号'}
                </Button>
                {phoneNumber && (
                  <Button
                    onClick={handleWaitForSMS}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? '⏳ 等待中...' : '⏱️ 等待验证码'}
                  </Button>
                )}
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">正在等待短信，请稍候...</p>
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

        <TabsContent value="batch" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📦 批量生成虚拟手机号</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="batch-count">生成数量</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="batch-count"
                    type="number"
                    min="1"
                    max="100"
                    value={batchCount}
                    onChange={e => setBatchCount(parseInt(e.target.value) || 1)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground pt-2">最多 100 个</span>
                </div>
              </div>

              <Button
                onClick={handleGenerateBatch}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? '⏳ 生成中...' : '🚀 开始生成'}
              </Button>

              {isLoading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">正在生成虚拟手机号，请稍候...</p>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              {virtualPhones.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">📊 生成统计</p>
                    <p className="text-2xl font-bold">{virtualPhones.length} 个手机号</p>
                  </div>

                  <Button
                    onClick={handleExportPhones}
                    variant="outline"
                    className="w-full"
                  >
                    📥 导出 CSV
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {virtualPhones.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">📋 手机号列表</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4">手机号</th>
                      <th className="text-left py-3 px-4">提供商</th>
                      <th className="text-left py-3 px-4">过期时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {virtualPhones.map((phone, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono">{phone.number}</td>
                        <td className="py-3 px-4 text-xs">
                          <span className="bg-muted px-2 py-1 rounded">
                            {phone.provider === 'textbee' ? '📱 TextBee' : phone.provider}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(phone.expiresAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 验证历史</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4">手机号</th>
                  <th className="text-left py-3 px-4">验证码</th>
                  <th className="text-left py-3 px-4">来源</th>
                  <th className="text-left py-3 px-4">时间</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{result.phoneNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold">{result.code}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="bg-muted px-2 py-1 rounded">
                        {result.source === 'textbee' ? '📱 TextBee' : result.source}
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
