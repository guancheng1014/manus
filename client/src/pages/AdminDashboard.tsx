import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TRPCError } from "@trpc/server";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [count, setCount] = useState(10);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const statsQuery = trpc.stats.getSystemStats.useQuery();
  const keysQuery = trpc.cardKey.list.useQuery();
  const generateMutation = trpc.cardKey.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKeys(data.keys);
      setMessage({ type: "success", text: `成功生成 ${data.keys.length} 张卡密` });
      keysQuery.refetch();
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message });
    },
  });

  const handleGenerate = async () => {
    setLoading(true);
    await generateMutation.mutateAsync({ count, maxUses, expiresInDays });
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="bg-red-900/20 border-red-700 text-red-400 max-w-md">
          <AlertDescription>您没有权限访问此页面</AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{stats?.totalTasks || 0}</div>
            <div className="text-sm text-slate-400">总任务数</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">{stats?.successAccounts || 0}</div>
            <div className="text-sm text-slate-400">成功注册</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400">{stats?.totalAccounts || 0}</div>
            <div className="text-sm text-slate-400">总账号数</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">{stats?.successRate || "0"}%</div>
            <div className="text-sm text-slate-400">成功率</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 卡密生成 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-cyan-400">生成卡密</CardTitle>
            <CardDescription>批量生成新的卡密</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 block mb-1">数量</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 block mb-1">每张卡密的最大使用次数</label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 block mb-1">有效期（天）</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {message && (
              <Alert
                className={
                  message.type === "success"
                    ? "bg-green-900/20 border-green-700 text-green-400"
                    : "bg-red-900/20 border-red-700 text-red-400"
                }
              >
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "生成卡密"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 生成的卡密列表 */}
        {generatedKeys.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-sm">生成的卡密</CardTitle>
              <CardDescription>点击复制到剪贴板</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generatedKeys.map((key) => (
                  <div
                    key={key}
                    onClick={() => copyToClipboard(key)}
                    className="bg-slate-700 hover:bg-slate-600 p-2 rounded cursor-pointer flex items-center justify-between group"
                  >
                    <code className="text-xs text-cyan-400 font-mono break-all">{key}</code>
                    <Copy className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 ml-2 flex-shrink-0" />
                  </div>
                ))}
              </div>

              <Button
                onClick={() => {
                  const text = generatedKeys.join("\\n");
                  copyToClipboard(text);
                }}
                variant="outline"
                size="sm"
                className="w-full mt-3 text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
              >
                复制全部
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 卡密列表 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400">卡密管理</CardTitle>
          <CardDescription>所有已生成的卡密</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-400">卡密</th>
                  <th className="text-left py-2 px-2 text-slate-400">状态</th>
                  <th className="text-left py-2 px-2 text-slate-400">使用次数</th>
                  <th className="text-left py-2 px-2 text-slate-400">过期时间</th>
                </tr>
              </thead>
              <tbody>
                {keysQuery.isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <Loader2 className="inline animate-spin text-cyan-400" />
                    </td>
                  </tr>
                ) : keysQuery.data?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-400">
                      暂无卡密
                    </td>
                  </tr>
                ) : (
                  keysQuery.data?.slice(0, 20).map((key) => (
                    <tr key={key.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-2 px-2 text-slate-300 font-mono text-xs">
                        {key.keyCode.substring(0, 16)}...
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={
                            key.status === "active"
                              ? "text-green-400"
                              : key.status === "used"
                              ? "text-blue-400"
                              : key.status === "expired"
                              ? "text-yellow-400"
                              : "text-red-400"
                          }
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-300">
                        {key.usedCount}/{key.maxUses}
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-xs">
                        {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
