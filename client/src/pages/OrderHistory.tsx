import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: number;
  orderId: string;
  amount: string | number;
  paymentMethod: "alipay" | "wechat";
  status: "pending" | "paid" | "failed" | "refunded";
  transactionId?: string;
  quantity: number;
  paidAt?: string;
  createdAt: string;
}

export default function OrderHistory() {
  const [searchOrderId, setSearchOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "paid" | "failed" | "refunded" | undefined
  >(undefined);

  // 获取订单列表
  const ordersQuery = trpc.orders.getOrders.useQuery(
    {
      limit: 20,
      offset: currentPage * 20,
      status: statusFilter,
      searchOrderId: searchOrderId || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { refetchInterval: 30000 }
  );

  // 获取订单统计
  const statsQuery = trpc.orders.getOrderStats.useQuery();

  // 导出订单
  const exportMutation = trpc.orders.exportOrders.useMutation({
    onSuccess: (data: any) => {
      // 创建下载链接
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", data.filename);
      link.click();
      toast.success("订单已导出为 CSV 文件");
    },
    onError: (error: any) => {
      toast.error("导出失败：" + error.message);
    },
  });

  const orders = ordersQuery.data?.orders || [];
  const total = ordersQuery.data?.total || 0;
  const hasMore = ordersQuery.data?.hasMore || false;
  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: "待支付", variant: "outline" },
      paid: { label: "已支付", variant: "default" },
      failed: { label: "支付失败", variant: "destructive" },
      refunded: { label: "已退款", variant: "secondary" },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === "alipay" ? "支付宝" : "微信支付";
  };

  const handleExport = () => {
    exportMutation.mutate({
      status: statusFilter,
      searchOrderId: searchOrderId || undefined,
    });
  };

  const handleRefresh = () => {
    ordersQuery.refetch();
    statsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              总订单数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-slate-400 mt-1">
              总金额：¥{Number(stats?.totalAmount || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              已支付
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats?.paidOrders || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              卡密数量：{stats?.totalQuantity || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              待支付
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {stats?.pendingOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              失败/退款
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {(stats?.failedOrders || 0) + (stats?.refundedOrders || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和操作栏 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg">订单列表</CardTitle>
          <CardDescription>查看和管理您的所有订单</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="搜索订单号..."
              value={searchOrderId}
              onChange={(e) => {
                setSearchOrderId(e.target.value);
                setCurrentPage(0);
              }}
              className="flex-1 min-w-[200px] bg-slate-800 border-slate-600 text-white"
            />
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(undefined);
                  setCurrentPage(0);
                }}
                size="sm"
              >
                全部
              </Button>
              <Button
                variant={statusFilter === "paid" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("paid");
                  setCurrentPage(0);
                }}
                size="sm"
              >
                已支付
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("pending");
                  setCurrentPage(0);
                }}
                size="sm"
              >
                待支付
              </Button>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={ordersQuery.isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending || orders.length === 0}
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 订单表格 */}
      <Card className="border-slate-700 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  订单号
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  支付方式
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  数量
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  支付时间
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-slate-400">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    暂无订单
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-700 hover:bg-slate-800/30 transition"
                  >
                    <td className="px-6 py-4 text-sm text-white font-mono">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      ¥{Number(order.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {order.paidAt
                        ? new Date(order.paidAt).toLocaleString("zh-CN")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            显示 {currentPage * 20 + 1} 到{" "}
            {Math.min((currentPage + 1) * 20, total)} / 总共 {total} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasMore}
            >
              下一页
            </Button>
          </div>
        </div>
      </Card>

      {/* 订单详情弹窗 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>订单号：{selectedOrder?.orderId}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">订单号</p>
                  <p className="text-white font-mono">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">金额</p>
                  <p className="text-white">¥{Number(selectedOrder.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">支付方式</p>
                  <p className="text-white">
                    {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">状态</p>
                  <p className="text-white">{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">卡密数量</p>
                  <p className="text-white">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">交易ID</p>
                  <p className="text-white font-mono">
                    {selectedOrder.transactionId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">支付时间</p>
                  <p className="text-white">
                    {selectedOrder.paidAt
                      ? new Date(selectedOrder.paidAt).toLocaleString("zh-CN")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">创建时间</p>
                  <p className="text-white">
                    {new Date(selectedOrder.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
