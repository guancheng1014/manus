import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Download } from "lucide-react";

/**
 * 用户管理页面（仅管理员可见）
 */
export default function UserManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // 获取所有用户使用记录
  const usageRecordsQuery = trpc.history.getRecords.useQuery(
    { limit: 100, offset: 0 },
    { enabled: user?.role === "admin" }
  );

  // 权限检查
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>访问被拒绝</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              只有管理员可以访问用户管理页面。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 处理搜索
  useEffect(() => {
    if (usageRecordsQuery.data) {
      const records = usageRecordsQuery.data.records || [];
      const filtered = records.filter(
        (record: any) =>
          record.userId?.toString().includes(searchQuery) ||
          record.action?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, usageRecordsQuery.data]);

  // 导出数据
  const handleExport = () => {
    if (!filteredUsers.length) return;

    const csv = [
      ["用户ID", "操作", "详情", "时间"],
      ...filteredUsers.map((record: any) => [
        record.userId,
        record.action,
        record.details || "",
        new Date(record.createdAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `user_records_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">用户管理</h1>
          <p className="text-gray-400 mt-1">查看和管理所有用户的使用记录</p>
        </div>
      </div>

      {/* 搜索和操作 */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索用户ID或操作..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-gray-500"
              />
            </div>
            <Button
              onClick={handleExport}
              disabled={!filteredUsers.length}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              导出 CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">总记录数</p>
              <p className="text-2xl font-bold text-cyan-400 mt-2">
                {usageRecordsQuery.data?.records?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">搜索结果</p>
              <p className="text-2xl font-bold text-green-400 mt-2">
                {filteredUsers.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">激活卡密</p>
              <p className="text-2xl font-bold text-yellow-400 mt-2">
                {usageRecordsQuery.data?.records?.filter(
                  (r: any) => r.action === "activate_card"
                ).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">注册任务</p>
              <p className="text-2xl font-bold text-purple-400 mt-2">
                {usageRecordsQuery.data?.records?.filter(
                  (r: any) => r.action === "create_task"
                ).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户记录表格 */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">使用记录详情</CardTitle>
        </CardHeader>
        <CardContent>
          {usageRecordsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">没有找到匹配的记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-gray-300">用户ID</TableHead>
                    <TableHead className="text-gray-300">操作</TableHead>
                    <TableHead className="text-gray-300">详情</TableHead>
                    <TableHead className="text-gray-300">时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((record: any, idx: number) => (
                    <TableRow
                      key={idx}
                      className="border-slate-700 hover:bg-slate-800/50"
                    >
                      <TableCell className="text-white font-mono">
                        {record.userId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.action === "activate_card"
                              ? "default"
                              : record.action === "create_task"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {record.action === "activate_card"
                            ? "激活卡密"
                            : record.action === "create_task"
                            ? "创建任务"
                            : record.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {record.details || "-"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(record.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
