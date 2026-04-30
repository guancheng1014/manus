import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function HistoryRecords() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const summaryQuery = trpc.history.getSummary.useQuery();
  const recordsQuery = trpc.history.getRecords.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  const summary = summaryQuery.data;
  const records = recordsQuery.data?.records || [];

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      register_single: "单账号注册",
      create_batch_task: "批量任务创建",
      activate_card: "卡密激活",
      export: "数据导出",
      generate_cards: "卡密生成",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      register_single: "text-cyan-400",
      create_batch_task: "text-purple-400",
      activate_card: "text-green-400",
      export: "text-blue-400",
      generate_cards: "text-yellow-400",
    };
    return colors[action] || "text-slate-400";
  };

  return (
    <div className="space-y-6">
      {/* 统计摘要 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-cyan-400">{summary.totalActions}</div>
              <div className="text-sm text-slate-400">总操作数</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-400">{summary.registrations}</div>
              <div className="text-sm text-slate-400">单账号注册</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-400">{summary.batchTasks}</div>
              <div className="text-sm text-slate-400">批量任务</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-400">{summary.cardActivations}</div>
              <div className="text-sm text-slate-400">卡密激活</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-400">
                {summary.lastAction ? new Date(summary.lastAction).toLocaleDateString() : "-"}
              </div>
              <div className="text-sm text-slate-400">最后操作</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 操作记录表格 */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400">操作历史记录</CardTitle>
          <CardDescription>查看您的所有操作历史</CardDescription>
        </CardHeader>
        <CardContent>
          {recordsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-cyan-400" />
            </div>
          ) : records.length === 0 ? (
            <Alert className="bg-slate-700 border-slate-600">
              <AlertDescription className="text-slate-400">暂无操作记录</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">操作类型</th>
                      <th className="text-left py-3 px-4 text-slate-400">任务 ID</th>
                      <th className="text-left py-3 px-4 text-slate-400">详情</th>
                      <th className="text-left py-3 px-4 text-slate-400">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record: any) => (
                      <tr key={record.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${getActionColor(record.action)}`}>
                            {getActionLabel(record.action)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">
                          {record.taskId ? record.taskId.substring(0, 12) + "..." : "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {record.details
                            ? (() => {
                                try {
                                  const parsed = JSON.parse(record.details as string);
                                  return JSON.stringify(parsed).substring(0, 50) + "...";
                                } catch {
                                  return (record.details as string).substring(0, 50) + "...";
                                }
                              })()
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {new Date(record.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  第 {page + 1} 页 (共 {Math.ceil((recordsQuery.data?.total || 0) / pageSize)} 页)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-slate-300"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!recordsQuery.data?.hasMore}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-slate-300"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
