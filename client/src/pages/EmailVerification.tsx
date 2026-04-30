/**
 * 邮箱验证码接收界面
 * 支持临时邮箱和 Outlook 邮箱的验证码接收
 * 支持从 Outlook 注册页面自动导入账户
 */
import { useState, useEffect } from 'react';
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

interface ImportedAccount {
  email: string;
  password: string;
  status: 'success' | 'failed' | 'pending';
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
  
  // 导入的账户
  const [importedAccounts, setImportedAccounts] = useState<ImportedAccount[]>([]);
  const [currentImportIndex, setCurrentImportIndex] = useState(0);
  
  const generateTempMailMutation = trpc.verification.generateTempMail.useMutation();
  const waitForEmailCodeMutation = trpc.verification.waitForEmailVerificationCode.useMutation();
  const getOutlookCodeMutation = trpc.verification.getVerificationCodeFromOutlook.useMutation();

  // 页面加载时检查是否有导入的账户
  useEffect(() => {
    const stored = localStorage.getItem('importedOutlookAccounts');
    if (stored) {
      try {
        const accounts = JSON.parse(stored);
        setImportedAccounts(accounts);
        if (accounts.length > 0) {
          // 自动填充第一个账户
          setOutlookEmail(accounts[0].email);
          setOutlookPassword(accounts[0].password);
        }
        // 清除 localStorage
        localStorage.removeItem('importedOutlookAccounts');
      } catch (error) {
        console.error('解析导入的账户失败:', error);
      }
    }
  }, []);

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
            source: result.source || 'outlook',
            timestamp: new Date(),
          },
        ]);
      } else {
        alert(result.error || '未收到验证码');
      }
    } catch (error) {
      alert('获取验证码失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理下一个导入的账户
  const handleNextImportedAccount = () => {
    if (currentImportIndex + 1 < importedAccounts.length) {
      const nextIndex = currentImportIndex + 1;
      setCurrentImportIndex(nextIndex);
      const nextAccount = importedAccounts[nextIndex];
      setOutlookEmail(nextAccount.email);
      setOutlookPassword(nextAccount.password);
      setVerificationCode('');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('验证码已复制到剪贴板');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📧 邮箱验证码接收</h1>
      </div>

      {importedAccounts.length > 0 && (
        <Card className="p-4 bg-blue-900/20 border-blue-500/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                已导入 {importedAccounts.length} 个 Outlook 账户
              </p>
              <span className="text-xs text-muted-foreground">
                {currentImportIndex + 1} / {importedAccounts.length}
              </span>
            </div>
            <Progress value={((currentImportIndex + 1) / importedAccounts.length) * 100} />
          </div>
        </Card>
      )}

      <Tabs defaultValue="outlook" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outlook">Outlook 邮箱</TabsTrigger>
          <TabsTrigger value="tempmail">临时邮箱</TabsTrigger>
        </TabsList>

        <TabsContent value="outlook" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="outlook-email">邮箱地址</Label>
                <Input
                  id="outlook-email"
                  type="email"
                  placeholder="your-email@outlook.com"
                  value={outlookEmail}
                  onChange={(e) => setOutlookEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="outlook-password">密码</Label>
                <Input
                  id="outlook-password"
                  type="password"
                  placeholder="输入密码"
                  value={outlookPassword}
                  onChange={(e) => setOutlookPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <EmojiButton
                  emoji="📨"
                  label="获取验证码"
                  onClick={handleGetOutlookCode}
                  disabled={isLoading || !outlookEmail || !outlookPassword}
                />
                {importedAccounts.length > 0 && currentImportIndex + 1 < importedAccounts.length && (
                  <EmojiButton
                    emoji="➡️"
                    label="下一个账户"
                    onClick={handleNextImportedAccount}
                    disabled={isLoading}
                  />
                )}
              </div>

              {verificationCode && (
                <Card className="p-4 bg-green-900/20 border-green-500/50">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">验证码</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-lg font-mono">
                        {verificationCode}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopyCode(verificationCode)}
                        variant="outline"
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tempmail" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              {tempMailAddress && (
                <div>
                  <Label>临时邮箱地址</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={tempMailAddress}
                      readOnly
                      className="bg-muted"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(tempMailAddress);
                        alert('邮箱地址已复制');
                      }}
                      variant="outline"
                    >
                      复制
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <EmojiButton
                  emoji="✉️"
                  label={tempMailAddress ? '重新生成' : '生成临时邮箱'}
                  onClick={handleGenerateTempMail}
                  disabled={isLoading}
                />
                {tempMailAddress && (
                  <EmojiButton
                    emoji="⏳"
                    label="等待验证码"
                    onClick={handleWaitForCode}
                    disabled={isLoading}
                  />
                )}
              </div>

              {verificationCode && (
                <Card className="p-4 bg-green-900/20 border-green-500/50">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">验证码</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-lg font-mono">
                        {verificationCode}
                      </code>
                      <Button
                        size="sm"
                        onClick={() => handleCopyCode(verificationCode)}
                        variant="outline"
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📋 验证历史</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{result.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleString()}
                  </p>
                </div>
                <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {result.code}
                </code>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
