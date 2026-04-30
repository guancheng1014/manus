import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle, Loader, Save, TestTube } from 'lucide-react';

interface PaymentConfigFormProps {
  paymentMethod: 'alipay' | 'wechat';
  onSuccess?: () => void;
}

export function PaymentConfigForm({ paymentMethod, onSuccess }: PaymentConfigFormProps) {
  const [formData, setFormData] = useState({
    appId: '',
    appSecret: '',
    merchantId: '',
    merchantKey: '',
    publicKey: '',
    privateKey: '',
    notifyUrl: '',
    returnUrl: '',
    isEnabled: false,
    testMode: true,
    config: '',
  });

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: config, isLoading: isLoadingConfig } = trpc.paymentConfig.getByMethod.useQuery(
    { paymentMethod },
    { retry: false }
  );

  useEffect(() => {
    if (config) {
      setFormData({
        appId: config.appId || '',
        appSecret: '***',
        merchantId: config.merchantId || '',
        merchantKey: config.merchantKey ? '***' : '',
        publicKey: config.publicKey || '',
        privateKey: config.privateKey ? '***' : '',
        notifyUrl: config.notifyUrl || '',
        returnUrl: config.returnUrl || '',
        isEnabled: config.isEnabled || false,
        testMode: config.testMode ?? true,
        config: config.config || '',
      });
    }
  }, [config]);

  const upsertMutation = trpc.paymentConfig.upsert.useMutation({
    onSuccess: () => {
      setTestResult(null);
      onSuccess?.();
    },
  });

  const testMutation = trpc.paymentConfig.test.useMutation({
    onSuccess: (result) => {
      setTestResult(result || { success: false, message: '测试失败' });
    },
  });

  const toggleMutation = trpc.paymentConfig.toggle.useMutation({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertMutation.mutateAsync({
      paymentMethod,
      ...formData,
      appSecret: formData.appSecret === '***' ? config?.appSecret || '' : formData.appSecret,
      merchantKey: formData.merchantKey === '***' ? config?.merchantKey || '' : formData.merchantKey,
      privateKey: formData.privateKey === '***' ? config?.privateKey || '' : formData.privateKey,
    });
  };

  const handleTest = async () => {
    const result = await testMutation.mutateAsync({ paymentMethod });
    if (result) {
      setTestResult(result);
    }
  };

  const handleToggle = async (isEnabled: boolean) => {
    try {
      await toggleMutation.mutateAsync({ paymentMethod, isEnabled });
    } catch (err) {
      if (!config) {
        await upsertMutation.mutateAsync({
          paymentMethod,
          ...formData,
          appSecret: formData.appSecret === '***' ? '' : formData.appSecret,
          merchantKey: formData.merchantKey === '***' ? '' : formData.merchantKey,
          privateKey: formData.privateKey === '***' ? '' : formData.privateKey,
          isEnabled,
        });
      }
    }
  };

  const paymentName = paymentMethod === 'alipay' ? '支付宝' : '微信支付';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{paymentName}配置</CardTitle>
            <CardDescription>配置{paymentName}支付参数</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config?.isEnabled ? 'default' : 'secondary'}>
              {config?.isEnabled ? '已启用' : '已禁用'}
            </Badge>
            <Switch
              checked={config?.isEnabled || false}
              onCheckedChange={handleToggle}
              disabled={toggleMutation.isPending}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">基础信息</h3>

            <div>
              <label className="text-sm font-medium">应用 ID</label>
              <Input
                placeholder={`输入${paymentName}应用ID`}
                value={formData.appId}
                onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">应用密钥</label>
              <Input
                type="password"
                placeholder={`输入${paymentName}应用密钥`}
                value={formData.appSecret}
                onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                required
              />
            </div>

            {paymentMethod === 'alipay' && (
              <>
                <div>
                  <label className="text-sm font-medium">商户 ID</label>
                  <Input
                    placeholder="输入支付宝商户ID"
                    value={formData.merchantId}
                    onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">商户私钥</label>
                  <Textarea
                    placeholder="输入支付宝商户私钥"
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">支付宝公钥</label>
                  <Textarea
                    placeholder="输入支付宝公钥"
                    value={formData.publicKey}
                    onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                    rows={4}
                  />
                </div>
              </>
            )}

            {paymentMethod === 'wechat' && (
              <>
                <div>
                  <label className="text-sm font-medium">商户号</label>
                  <Input
                    placeholder="输入微信商户号"
                    value={formData.merchantId}
                    onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">商户密钥</label>
                  <Input
                    type="password"
                    placeholder="输入微信商户密钥"
                    value={formData.merchantKey}
                    onChange={(e) => setFormData({ ...formData, merchantKey: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">回调设置</h3>

            <div>
              <label className="text-sm font-medium">支付回调 URL</label>
              <Input
                type="url"
                placeholder="https://example.com/api/payment/notify"
                value={formData.notifyUrl}
                onChange={(e) => setFormData({ ...formData, notifyUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">返回 URL</label>
              <Input
                type="url"
                placeholder="https://example.com/payment/success"
                value={formData.returnUrl}
                onChange={(e) => setFormData({ ...formData, returnUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">测试模式</h3>
                <p className="text-sm text-muted-foreground">启用测试模式以测试支付流程</p>
              </div>
              <Switch
                checked={formData.testMode}
                onCheckedChange={(checked) => setFormData({ ...formData, testMode: checked })}
              />
            </div>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={upsertMutation.isPending || isLoadingConfig}
              className="flex-1"
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending || !formData.appId || !formData.appSecret}
            >
              {testMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  测试连接
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
