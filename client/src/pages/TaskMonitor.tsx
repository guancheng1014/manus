import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, Pause, X, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";

export default function TaskMonitor() {
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const tasksQuery = trpc.registration.listTasks.useQuery();
  const taskQuery = selectedTaskId ? trpc.registration.getTask.useQuery({ taskId: selectedTaskId }) : null;
  const resultsQuery = selectedTaskId ? trpc.registration.getResults.useQuery({ taskId: selectedTaskId }) : null;
  const cancelMutation = trpc.registration.cancelTask.useMutation();

  const task = taskQuery?.data;
  const results = resultsQuery?.data || [];

  useEffect(() => {
    if (task) {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 任务状态: ${task.status}`,
        `[${new Date().toLocaleTimeString()}] 进度: ${task.successCount}/${task.totalAccounts} 成功`,
      ]);
    }
  }, [task?.status, task?.successCount]);

  const handleCancel = async () => {
    if (!selectedTaskId) return;
    await cancelMutation.mutateAsync({ taskId: selectedTaskId });
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 任务已取消`]);
  };

  const handleExportCSV = () => {
    if (!results.length) return;

    const headers = ["邮箱", "手机号", "密码", "Token", "状态"];
    const rows = results.map((r) => [
      r.email,
      r.phone || "-",
      r.password,
      r.token ? r.token.substring(0, 30) + "..." : "-",
      r.success ? "成功" : "失败",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-results-${selectedTaskId}.csv`;
    a.click();
  };

  const successRate = task ? ((task.successCount / task.totalAccounts) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：任务列表 */}
        <div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">任务列表</CardTitle>
              <CardDescription>选择要监控的任务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {tasksQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-cyan-400" />
                </div>
              ) : tasksQuery.data?.length === 0 ? (
                <div className="text-slate-400 text-sm">暂无任务</div>
              ) : (
                tasksQuery.data?.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTaskId === t.id
                        ? "bg-cyan-900/30 border-cyan-500 text-cyan-400"
                        : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <div className="font-semibold text-sm">{t.taskName}</div>
                    <div className="text-xs text-slate-400">
                      {t.successCount}/{t.totalAccounts} 成功
                    </div>
                    <div className={`text-xs font-semibold ${
                      t.status === "completed"
                        ? "text-green-400"
                        : t.status === "running"
                        ? "text-blue-400"
                        : t.status === "cancelled"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}>
                      {t.status}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 中间和右侧：任务详情 */}
        {task ? (
          <>
            <div className="lg:col-span-2 space-y-4">
              {/* 进度卡片 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400">任务进度</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-300">成功率</span>
                      <span className="text-sm font-semibold text-cyan-400">{successRate}%</span>
                    </div>
                    <Progress value={parseFloat(successRate)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-2xl font-bold text-green-400">{task.successCount}</div>
                      <div className="text-xs text-slate-400">成功</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-2xl font-bold text-red-400">{task.failCount}</div>
                      <div className="text-xs text-slate-400">失败</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-2xl font-bold text-blue-400">{task.concurrency}</div>
                      <div className="text-xs text-slate-400">并发数</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-slate-300">
                    <div>状态: <span className="font-semibold text-cyan-400">{task.status}</span></div>
                    <div>总数: <span className="font-semibold">{task.totalAccounts}</span></div>
                    <div>创建时间: <span className="font-semibold">{new Date(task.createdAt).toLocaleString()}</span></div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {task.status === "running" && (
                      <Button
                        onClick={handleCancel}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        取消任务
                      </Button>
                    )}
                    {results.length > 0 && (
                      <Button
                        onClick={handleExportCSV}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        导出 CSV
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 结果表格 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400 text-sm">注册结果 ({results.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-2 text-slate-400">邮箱</th>
                          <th className="text-left py-2 px-2 text-slate-400">状态</th>
                          <th className="text-left py-2 px-2 text-slate-400">Token</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.slice(0, 10).map((r) => (
                          <tr key={r.id} className="border-b border-slate-700">
                            <td className="py-2 px-2 text-slate-300">{r.email}</td>
                            <td className="py-2 px-2">
                              <span className={r.success ? "text-green-400" : "text-red-400"}>
                                {r.success ? "✓ 成功" : "✗ 失败"}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-slate-400 truncate">
                              {r.token ? r.token.substring(0, 20) + "..." : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {results.length > 10 && (
                      <div className="text-center py-2 text-xs text-slate-400">
                        还有 {results.length - 10} 条记录，请导出查看全部
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 h-full flex items-center justify-center">
              <CardContent className="text-center text-slate-400">
                选择一个任务以查看详情
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 实时日志 */}
      {selectedTaskId && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-cyan-400">实时日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="text-slate-500">等待日志...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="text-cyan-400">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
