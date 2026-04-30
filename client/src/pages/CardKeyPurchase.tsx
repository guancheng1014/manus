import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatusModal } from "@/components/PaymentStatusModal";

interface CardKeyPackage {
  id: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
  features: string[];
  popular?: boolean;
}

const packages: CardKeyPackage[] = [
  {
    id: "basic",
    name: "基础套餐",
    quantity: 1,
    price: 99,
    features: ["1 张卡密", "30 天有效期", "无限使用次数", "邮件支持"],
  },
  {
    id: "pro",
    name: "专业套餐",
    quantity: 5,
    price: 399,
    discount: 20,
    features: ["5 张卡密", "90 天有效期", "无限使用次数", "优先支持", "代理轮换"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "企业套餐",
    quantity: 20,
    price: 1299,
    discount: 35,
    features: ["20 张卡密", "365 天有效期", "无限使用次数", "24/7 支持", "专属账户经理"],
  },
];

export default function CardKeyPurchase() {
  const [selectedPackage, setSelectedPackage] = useState<CardKeyPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"alipay" | "wechat">("alipay");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "error">("pending");

  const handlePurchase = (pkg: CardKeyPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
    setPaymentStatus("pending");
  };

  const handlePaymentConfirm = async () => {
    try {
      // 模拟支付过程
      setPaymentStatus("pending");
      
      // 这里应该调用真实的支付 API
      // const response = await trpc.payment.createOrder.mutate({
      //   packageId: selectedPackage!.id,
      //   paymentMethod,
      //   quantity: selectedPackage!.quantity,
      // });

      // 模拟支付成功
      setTimeout(() => {
        setPaymentStatus("success");
        toast.success(`购买成功！已获得 ${selectedPackage?.quantity} 张卡密`);
        
        // 3 秒后关闭弹窗
        setTimeout(() => {
          setShowPaymentModal(false);
        }, 3000);
      }, 2000);
    } catch (error) {
      setPaymentStatus("failed");
      toast.error("购买失败，请重试");
    }
  };

  const calculateSavings = (pkg: CardKeyPackage) => {
    if (!pkg.discount) return 0;
    return Math.round((pkg.price * pkg.discount) / 100);
  };

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">购买卡密</h1>
        <p className="text-slate-400">选择适合您的套餐，开始使用 Manus 自动注册工具</p>
      </div>

      {/* 套餐卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`border-2 transition-all ${
              pkg.popular
                ? "border-blue-500 bg-slate-900 shadow-lg shadow-blue-500/20"
                : "border-slate-700 bg-slate-900/50"
            }`}
          >
            {pkg.popular && (
              <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full w-fit mx-auto -mt-3 mb-4">
                <Zap className="w-3 h-3 inline mr-1" />
                最受欢迎
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-white">{pkg.name}</CardTitle>
              <CardDescription className="text-slate-400">
                {pkg.quantity} 张卡密
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 价格 */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">¥{pkg.price}</span>
                  {pkg.discount && (
                    <Badge variant="secondary" className="bg-green-900 text-green-300">
                      省 ¥{calculateSavings(pkg)}
                    </Badge>
                  )}
                </div>
                {pkg.discount && (
                  <p className="text-xs text-slate-400">
                    原价：¥{Math.round(pkg.price / (1 - pkg.discount / 100))}
                  </p>
                )}
              </div>

              {/* 功能列表 */}
              <div className="space-y-3">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* 购买按钮 */}
              <Button
                onClick={() => handlePurchase(pkg)}
                className={`w-full ${
                  pkg.popular
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                立即购买
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 支付方式选择 */}
      {showPaymentModal && selectedPackage && (
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">选择支付方式</CardTitle>
            <CardDescription>
              购买 {selectedPackage.name} - ¥{selectedPackage.price}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="alipay">支付宝</TabsTrigger>
                <TabsTrigger value="wechat">微信支付</TabsTrigger>
              </TabsList>

              <TabsContent value="alipay" className="mt-6 space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-2">支付宝二维码</p>
                  <div className="w-32 h-32 bg-slate-700 rounded mx-auto flex items-center justify-center">
                    <span className="text-slate-500 text-sm">QR Code</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="wechat" className="mt-6 space-y-4">
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-2">微信支付二维码</p>
                  <div className="w-32 h-32 bg-slate-700 rounded mx-auto flex items-center justify-center">
                    <span className="text-slate-500 text-sm">QR Code</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                取消
              </Button>
              <Button
                onClick={handlePaymentConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                确认支付
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支付状态弹窗 */}
      {showPaymentModal && selectedPackage && (
        <PaymentStatusModal
          isOpen={showPaymentModal}
          status={paymentStatus}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* FAQ */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">常见问题</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-2">卡密有效期是多久？</h4>
            <p className="text-slate-400 text-sm">
              不同套餐有不同的有效期。基础套餐 30 天，专业套餐 90 天，企业套餐 365 天。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">可以退款吗？</h4>
            <p className="text-slate-400 text-sm">
              支持 7 天内无理由退款。如有问题，请联系客服。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">如何使用卡密？</h4>
            <p className="text-slate-400 text-sm">
              购买后，卡密将自动发送到您的邮箱。在登录后的卡密激活页面输入卡密即可激活。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
