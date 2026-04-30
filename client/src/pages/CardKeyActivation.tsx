import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function CardKeyActivation() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [cardKey, setCardKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activateMutation = trpc.cardKey.activate.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: "卡密激活成功！正在跳转..." });
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message });
    },
  });

  const handleActivate = async () => {
    if (!cardKey.trim()) {
      setMessage({ type: "error", text: "请输入卡密" });
      return;
    }

    setLoading(true);
    await activateMutation.mutateAsync({ keyCode: cardKey });
    setLoading(false);
  };

  // 如果用户已登录且已激活卡密，跳转到仪表板
  if (user && user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-center text-cyan-400">正在跳转...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-white">Manus 注册工具</CardTitle>
          <CardDescription className="text-center text-slate-400">
            专业的自动化批量账号注册平台
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              卡密激活
            </label>
            <Input
              type="password"
              placeholder="输入您的卡密"
              value={cardKey}
              onChange={(e) => setCardKey(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleActivate()}
              disabled={loading}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
            />
            <p className="text-xs text-slate-500">
              首次使用需要输入卡密进行激活，卡密由管理员生成
            </p>
          </div>

          {message && (
            <Alert
              className={
                message.type === "success"
                  ? "bg-green-900/20 border-green-700 text-green-400"
                  : "bg-red-900/20 border-red-700 text-red-400"
              }
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleActivate}
            disabled={loading || !cardKey.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                激活中...
              </>
            ) : (
              "激活卡密"
            )}
          </Button>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              需要帮助？请联系管理员获取卡密
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
