import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: number;
  orderId: string;
  amount: number;
  paymentMethod: "alipay" | "wechat";
  status: "pending" | "paid" | "failed" | "refunded";
  transactionId?: string;
  quantity: number;
  paidAt?: string;
  createdAt: string;
}

// 示例数据
const mockOrders: Order[] = [
  {
    id: 1,
    orderId: "ORD-20260501-001",
    amount: 99,
    paymentMethod: "alipay",
    status: "paid",
    transactionId: "2024050100001234",
    quantity: 1,
    paidAt: "2026-05-01 10:30:00",
    createdAt: "2026-05-01 10:00:00",
  },
  {
    id: 2,
    orderId: "ORD-20260501-002",
    amount: 199,
    paymentMethod: "wechat",
    status: "paid",
    transactionId: "4200001234567890",
    quantity: 2,
    paidAt: "2026-05-01 11:15:00",
    createdAt: "2026-05-01 11:00:00",
  },
  {
    id: 3,
    orderId: "ORD-20260501-003",
    amount: 499,
    paymentMethod: "alipay",
    status: "pending",
    quantity: 5,
    createdAt: "2026-05-01 12:00:00",
  },
  {
    id: 4,
    orderId: "ORD-20260430-001",
    amount: 99,
    paymentMethod: "wechat",
    status: "failed",
    quantity: 1,
    createdAt: "2026-04-30 15:30:00",
  },
];

export default function OrderHistory() {
  const [searchOrderId, setSearchOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredOrders = mockOrders.filter((order) =>
    order.orderId.toLowerCase().includes(searchOrderId.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; color: string }> = {
      pending: { label: "待支付", variant: "outline", color: "text-yellow-400" },
      paid: { label: "已支付", variant: "default", color: "text-green-400" },
      failed: { label: "支付失败", variant: "destructive", color: "text-red-400" },
      refunded: { label: "已退款", variant: "secondary", color: "text-blue-400" },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === "alipay" ? "支付宝" : "微信支付";
  };

  const handleExport = () => {
    // 生成 CSV
    const headers = ["订单号", "金额", "支付方式", "状态", "数量", "支付时间", "创建时间"];
    const rows = filteredOrders.map((order) => [
      order.orderId,
      `¥${order.amount}`,
      getPaymentMethodLabel(order.paymentMethod),
      statusMap[order.status]?.label || order.status,
      order.quantity,
      order.paidAt || "-",
      order.createdAt,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `order-history-${new Date().toISOString().split("T")[0]}.csv`);
    link.click();

    toast.success("订单已导出为 CSV 文件");
  };

  const statusMap: Record<string, { label: string }> = {
    pending: { label: "待支付" },
    paid: { label: "已支付" },
    failed: { label: "支付失败" },
    refunded: { label: "已退款" },
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">总订单数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{mockOrders.length}</div>
            <p className="text-xs text-slate-400 mt-1">所有订单</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">已支付</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {mockOrders.filter((o) => o.status === "paid").length}
            </div>
            <p className="text-xs text-slate-400 mt-1">成功支付</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">总金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              ¥{mockOrders.reduce((sum, o) => sum + o.amount, 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">人民币</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">
              {mockOrders.length > 0
                ? `${((mockOrders.filter((o) => o.status === "paid").length / mockOrders.length) * 100).toFixed(0)}%`
                : "0%"}
            </div>
            <p className="text-xs text-slate-400 mt-1">支付成功率</p>
          </CardContent>
        </Card>
      </div>

      {/* 订单列表 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">订单历史</CardTitle>
          <CardDescription>查看您的所有购买记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="paid">已支付</TabsTrigger>
              <TabsTrigger value="pending">待支付</TabsTrigger>
              <TabsTrigger value="failed">失败</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="搜索订单号..."
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
                <Button
                  onClick={() => setSearchOrderId("")}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重置
                </Button>
                <Button
                  onClick={handleExport}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300">订单号</th>
                      <th className="text-left py-3 px-4 text-slate-300">金额</th>
                      <th className="text-left py-3 px-4 text-slate-300">支付方式</th>
                      <th className="text-left py-3 px-4 text-slate-300">数量</th>
                      <th className="text-left py-3 px-4 text-slate-300">状态</th>
                      <th className="text-left py-3 px-4 text-slate-300">支付时间</th>
                      <th className="text-left py-3 px-4 text-slate-300">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs">{order.orderId}</td>
                          <td className="py-3 px-4 text-slate-300">¥{order.amount}</td>
                          <td className="py-3 px-4 text-slate-300">{getPaymentMethodLabel(order.paymentMethod)}</td>
                          <td className="py-3 px-4 text-slate-300">{order.quantity}</td>
                          <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{order.paidAt || "-"}</td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetail(true);
                              }}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          暂无订单
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* 其他标签页 */}
            {["paid", "pending", "failed"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4 mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-300">订单号</th>
                        <th className="text-left py-3 px-4 text-slate-300">金额</th>
                        <th className="text-left py-3 px-4 text-slate-300">支付方式</th>
                        <th className="text-left py-3 px-4 text-slate-300">数量</th>
                        <th className="text-left py-3 px-4 text-slate-300">状态</th>
                        <th className="text-left py-3 px-4 text-slate-300">支付时间</th>
                        <th className="text-left py-3 px-4 text-slate-300">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOrders
                        .filter((o) => o.status === status)
                        .map((order) => (
                          <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-slate-300 font-mono text-xs">{order.orderId}</td>
                            <td className="py-3 px-4 text-slate-300">¥{order.amount}</td>
                            <td className="py-3 px-4 text-slate-300">{getPaymentMethodLabel(order.paymentMethod)}</td>
                            <td className="py-3 px-4 text-slate-300">{order.quantity}</td>
                            <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                            <td className="py-3 px-4 text-slate-400 text-xs">{order.paidAt || "-"}</td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetail(true);
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 订单详情弹窗 */}
      {showDetail && selectedOrder && (
        <Card className="border-slate-700 bg-slate-900/50 fixed inset-0 m-auto w-96 h-fit">
          <CardHeader>
            <CardTitle className="text-white">订单详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">订单号</p>
              <p className="text-white font-mono">{selectedOrder.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">金额</p>
              <p className="text-white">¥{selectedOrder.amount}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">支付方式</p>
              <p className="text-white">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">状态</p>
              <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
            </div>
            {selectedOrder.transactionId && (
              <div>
                <p className="text-sm text-slate-400">交易号</p>
                <p className="text-white font-mono text-xs">{selectedOrder.transactionId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400">创建时间</p>
              <p className="text-white text-sm">{selectedOrder.createdAt}</p>
            </div>
            {selectedOrder.paidAt && (
              <div>
                <p className="text-sm text-slate-400">支付时间</p>
                <p className="text-white text-sm">{selectedOrder.paidAt}</p>
              </div>
            )}
            <Button
              onClick={() => setShowDetail(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 mt-6"
            >
              关闭
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
