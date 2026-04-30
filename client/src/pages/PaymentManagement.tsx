import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, RefreshCw, Trash2 } from "lucide-react";

export default function PaymentManagement() {
  const [searchOrderId, setSearchOrderId] = useState("");
  
  // 获取订单列表 - 暂时使用空数组
  const orders: any[] = [];
  const isLoading = false;
  const refetch = () => {};

  // 获取统计数据 - 暂时使用默认值
  const stats = {
    totalOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    successRate: 0,
  };

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

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">总订单数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-slate-400 mt-1">所有订单</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">已支付</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats?.paidOrders || 0}</div>
            <p className="text-xs text-slate-400 mt-1">成功支付</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">总收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">¥{stats?.totalRevenue || 0}</div>
            <p className="text-xs text-slate-400 mt-1">人民币</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">
              {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-slate-400 mt-1">支付成功率</p>
          </CardContent>
        </Card>
      </div>

      {/* 订单管理 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">订单管理</CardTitle>
          <CardDescription>查看和管理所有支付订单</CardDescription>
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
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300">订单号</th>
                      <th className="text-left py-3 px-4 text-slate-300">用户</th>
                      <th className="text-left py-3 px-4 text-slate-300">金额</th>
                      <th className="text-left py-3 px-4 text-slate-300">支付方式</th>
                      <th className="text-left py-3 px-4 text-slate-300">状态</th>
                      <th className="text-left py-3 px-4 text-slate-300">创建时间</th>
                      <th className="text-left py-3 px-4 text-slate-300">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          加载中...
                        </td>
                      </tr>
                    ) : orders && orders.length > 0 ? (
                      orders.map((order: any) => (
                        <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs">{order.orderId}</td>
                          <td className="py-3 px-4 text-slate-300">{order.userId}</td>
                          <td className="py-3 px-4 text-slate-300">¥{order.amount}</td>
                          <td className="py-3 px-4 text-slate-300">{order.paymentMethod}</td>
                          <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
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

            {/* 其他标签页类似实现... */}
          </Tabs>
        </CardContent>
      </Card>

      {/* 导出选项 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">数据导出</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              导出为 CSV
            </Button>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
              <Download className="w-4 h-4 mr-2" />
              导出为 Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
