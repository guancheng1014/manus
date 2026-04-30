import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

export default function SingleRegister() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "Manus@Test2026!",
    emailApiUrl: "",
    regionCode: "+1",
    phone: "",
    smsApiUrl: "",
    yesCaptchaKey: "",
    inviteCode: "",
    proxyApiUrl: "",
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.registration.registerSingle.useMutation({
    onSuccess: (data) => {
      setTaskId(data.taskId);
      setLogs(["任务已创建，正在后台执行注册..."]);
      // 这里可以添加 SSE 连接来实时获取日志
    },
    onError: (error) => {
      setLogs((prev) => [...prev, `错误: ${error.message}`]);
    },
  });

  const handleRegister = async () => {
    if (!formData.email || !formData.emailApiUrl || !formData.yesCaptchaKey) {
      setLogs(["错误: 请填写必填项（邮箱、邮箱API、YesCaptcha Key）"]);
      return;
    }

    setLoading(true);
    setLogs(["开始注册流程..."]);

    await registerMutation.mutateAsync({
      ...formData,
      phone: formData.phone || undefined,
      smsApiUrl: formData.smsApiUrl || undefined,
      inviteCode: formData.inviteCode || undefined,
      proxyApiUrl: formData.proxyApiUrl || undefined,
    });

    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseInviteUrl = (url: string) => {
    try {
      const match = url.match(/\/invitation\/([A-Z0-9]+)/);
      if (match) {
        handleInputChange("inviteCode", match[1]);
        const urlObj = new URL(url);
        const utm_source = urlObj.searchParams.get("utm_source");
        const utm_medium = urlObj.searchParams.get("utm_medium");
        const utm_campaign = urlObj.searchParams.get("utm_campaign");
        if (utm_source) handleInputChange("utmSource", utm_source);
        if (utm_medium) handleInputChange("utmMedium", utm_medium);
        if (utm_campaign) handleInputChange("utmCampaign", utm_campaign);
      }
    } catch (e) {
      // 忽略解析错误
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：表单 */}
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">YesCaptcha 配置</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="ClientKey"
                value={formData.yesCaptchaKey}
                onChange={(e) => handleInputChange("yesCaptchaKey", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">邮箱注册</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="email"
                placeholder="邮箱"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                placeholder="密码"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                placeholder="邮箱收信API"
                value={formData.emailApiUrl}
                onChange={(e) => handleInputChange("emailApiUrl", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">手机验证（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={formData.regionCode} onValueChange={(value) => handleInputChange("regionCode", value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="+1">+1 美国/加拿大</SelectItem>
                  <SelectItem value="+44">+44 英国</SelectItem>
                  <SelectItem value="+86">+86 中国</SelectItem>
                  <SelectItem value="+81">+81 日本</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="手机号（不含区号）"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                placeholder="短信API"
                value={formData.smsApiUrl}
                onChange={(e) => handleInputChange("smsApiUrl", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">邀请链接（可选）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="粘贴完整邀请链接"
                onChange={(e) => parseInviteUrl(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                placeholder="邀请码"
                value={formData.inviteCode}
                onChange={(e) => handleInputChange("inviteCode", e.target.value)}
                disabled
                className="bg-slate-700 border-slate-600 text-white opacity-50"
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">代理配置（可选）</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="代理API地址"
                value={formData.proxyApiUrl}
                onChange={(e) => handleInputChange("proxyApiUrl", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              "开始注册"
            )}
          </Button>
        </div>

        {/* 右侧：日志 */}
        <div>
          <Card className="bg-slate-800 border-slate-700 h-full">
            <CardHeader>
              <CardTitle className="text-cyan-400">实时日志</CardTitle>
              <CardDescription>注册过程详细日志</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-500">等待操作...</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="text-cyan-400">
                      {log}
                    </div>
                  ))
                )}
              </div>

              {result && (
                <div className="mt-4 space-y-2">
                  {result.ok ? (
                    <Alert className="bg-green-900/20 border-green-700 text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>注册成功！</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-900/20 border-red-700 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}

                  {result.token && (
                    <div className="bg-slate-700 rounded p-2 text-xs text-slate-300 break-all flex items-center justify-between">
                      <span>Token: {result.token.substring(0, 30)}...</span>
                      <Copy className="h-4 w-4 cursor-pointer text-cyan-400" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
