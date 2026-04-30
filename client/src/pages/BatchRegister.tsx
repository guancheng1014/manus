import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";

export default function BatchRegister() {
  const { user } = useAuth();
  const [taskName, setTaskName] = useState("");
  const [emailList, setEmailList] = useState("");
  const [phoneList, setPhoneList] = useState("");
  const [password, setPassword] = useState("Manus@Test2026!");
  const [yesCaptchaKey, setYesCaptchaKey] = useState("");
  const [concurrency, setConcurrency] = useState(5);
  const [inviteCode, setInviteCode] = useState("");
  const [proxyApiUrl, setProxyApiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const createTaskMutation = trpc.registration.createBatchTask.useMutation({
    onSuccess: (data) => {
      setMessage({ type: "success", text: `任务创建成功！任务ID: ${data.taskId}` });
      setCreatedTaskId(data.taskId);
      // 重置表单
      setTaskName("");
      setEmailList("");
      setPhoneList("");
      setYesCaptchaKey("");
      setInviteCode("");
      setProxyApiUrl("");
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message });
    },
  });

  const parseEmailList = (text: string) => {
    return text
      .split("\\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [email, emailApiUrl] = line.split("----").map((s) => s.trim());
        return { email, emailApiUrl };
      })
      .filter((item) => item.email && item.emailApiUrl);
  };

  const parsePhoneList = (text: string) => {
    return text
      .split("\\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [regionCode, phone] = line.split(":").map((s) => s.trim());
        return { regionCode, phone };
      });
  };

  const handleCreateTask = async () => {
    if (!emailList.trim() || !yesCaptchaKey.trim()) {
      setMessage({ type: "error", text: "请填写邮箱列表和 YesCaptcha Key" });
      return;
    }

    const accounts = parseEmailList(emailList);
    if (accounts.length === 0) {
      setMessage({
        type: "error",
        text: "邮箱列表格式错误，请使用格式：邮箱----邮箱API（每行一个）",
      });
      return;
    }

    const phones = parsePhoneList(phoneList);

    // 合并手机号到账号列表
    const accountsWithPhone = accounts.map((acc, idx) => ({
      ...acc,
      phone: phones[idx]?.phone || "",
      smsApiUrl: "",
    }));

    setLoading(true);
    await createTaskMutation.mutateAsync({
      taskName: taskName || `批量任务-${new Date().toLocaleString()}`,
      accounts: accountsWithPhone,
      password,
      yesCaptchaKey,
      concurrency,
      inviteCode: inviteCode || undefined,
      proxyApiUrl: proxyApiUrl || undefined,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基础配置 */}
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">任务配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 block mb-1">任务名称（可选）</label>
                <Input
                  placeholder="e.g. 批量注册-第1批"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">并发数 (1-50)</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">密码</label>
                <Input
                  placeholder="统一密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">YesCaptcha Key</label>
                <Input
                  placeholder="ClientKey"
                  value={yesCaptchaKey}
                  onChange={(e) => setYesCaptchaKey(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">邀请码（可选）</label>
                <Input
                  placeholder="邀请码"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">代理API（可选）</label>
                <Input
                  placeholder="代理API地址"
                  value={proxyApiUrl}
                  onChange={(e) => setProxyApiUrl(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中间：邮箱列表 */}
        <div>
          <Card className="bg-slate-800 border-slate-700 h-full">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-sm">邮箱列表</CardTitle>
              <CardDescription className="text-xs">格式: 邮箱----邮箱API</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="test1@outlook.com----http://api.example.com/mail1&#10;test2@outlook.com----http://api.example.com/mail2"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white font-mono text-xs h-96"
              />
              <div className="mt-2 text-xs text-slate-400">
                已识别: {parseEmailList(emailList).length} 个邮箱
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：手机列表 */}
        <div>
          <Card className="bg-slate-800 border-slate-700 h-full">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-sm">手机号列表（可选）</CardTitle>
              <CardDescription className="text-xs">格式: 区号:手机号</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="+1:4843778191&#10;+1:4843778192"
                value={phoneList}
                onChange={(e) => setPhoneList(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white font-mono text-xs h-96"
              />
              <div className="mt-2 text-xs text-slate-400">
                已识别: {parsePhoneList(phoneList).length} 个手机号
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 消息和按钮 */}
      <div className="space-y-3">
        {message && (
          <Alert
            className={
              message.type === "success"
                ? "bg-green-900/20 border-green-700 text-green-400"
                : "bg-red-900/20 border-red-700 text-red-400"
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleCreateTask}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              创建任务中...
            </>
          ) : (
            "创建批量任务"
          )}
        </Button>

        {createdTaskId && (
          <Card className="bg-blue-900/20 border-blue-700">
            <CardContent className="pt-4">
              <p className="text-blue-400 text-sm">
                任务已创建，请前往"任务监控"页面查看实时进度
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
