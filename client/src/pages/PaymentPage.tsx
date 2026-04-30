import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentStatusModal } from "@/components/PaymentStatusModal";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { CreditCard, Smartphone } from "lucide-react";

export default function PaymentPage() {
  const { paymentState, closeModal, handleAlipayPayment, handleWechatPayment } = usePaymentStatus();
  const [cardKeyId, setCardKeyId] = useState("");
  const [amount, setAmount] = useState(99);
  const [wechatMethod, setWechatMethod] = useState<"h5" | "jsapi" | "native">("h5");

  const handleAlipay = async () => {
    if (!cardKeyId) {
      alert("请输入卡密 ID");
      return;
    }
    await handleAlipayPayment(cardKeyId, amount);
  };

  const handleWechat = async () => {
    if (!cardKeyId) {
      alert("请输入卡密 ID");
      return;
    }
    await handleWechatPayment(cardKeyId, amount, wechatMethod);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">购买卡密</h1>
          <p className="text-slate-400">选择您喜欢的支付方式完成购买</p>
        </div>

        {/* 支付方式选择 */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">选择支付方式</CardTitle>
            <CardDescription>支持支付宝和微信支付</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alipay" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="alipay" className="data-[state=active]:bg-blue-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  支付宝
                </TabsTrigger>
                <TabsTrigger value="wechat" className="data-[state=active]:bg-green-600">
                  <Smartphone className="w-4 h-4 mr-2" />
                  微信支付
                </TabsTrigger>
              </TabsList>

              {/* 支付宝支付 */}
              <TabsContent value="alipay" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="alipay-cardkey" className="text-slate-300">
                    卡密 ID
                  </Label>
                  <Input
                    id="alipay-cardkey"
                    type="text"
                    placeholder="输入卡密 ID"
                    value={cardKeyId}
                    onChange={(e) => setCardKeyId(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="alipay-amount" className="text-slate-300">
                    金额 (¥)
                  </Label>
                  <Input
                    id="alipay-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    💡 支付宝支付将跳转到支付宝页面，请按照提示完成支付。
                  </p>
                </div>

                <Button
                  onClick={handleAlipay}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  使用支付宝支付
                </Button>
              </TabsContent>

              {/* 微信支付 */}
              <TabsContent value="wechat" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="wechat-cardkey" className="text-slate-300">
                    卡密 ID
                  </Label>
                  <Input
                    id="wechat-cardkey"
                    type="text"
                    placeholder="输入卡密 ID"
                    value={cardKeyId}
                    onChange={(e) => setCardKeyId(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="wechat-amount" className="text-slate-300">
                    金额 (¥)
                  </Label>
                  <Input
                    id="wechat-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-3 block">支付方式</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "h5" as const, label: "H5 支付", desc: "移动网页" },
                      { value: "jsapi" as const, label: "JSAPI", desc: "公众号" },
                      { value: "native" as const, label: "Native", desc: "扫码支付" },
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setWechatMethod(method.value)}
                        className={`p-3 rounded-lg border-2 transition ${
                          wechatMethod === method.value
                            ? "border-green-500 bg-green-500/10"
                            : "border-slate-700 bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="text-sm font-medium text-white">{method.label}</div>
                        <div className="text-xs text-slate-400">{method.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-green-300">
                    💡 选择合适的微信支付方式。H5 适合移动网页，JSAPI 适合公众号，Native 适合扫码。
                  </p>
                </div>

                <Button
                  onClick={handleWechat}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  使用微信支付
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 支付说明 */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-sm">支付说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <p>• 支付完成后，卡密将自动激活到您的账户</p>
            <p>• 支持的金额：¥99、¥199、¥499、¥999</p>
            <p>• 支付失败可以重新尝试，不会重复扣款</p>
            <p>• 如有问题，请联系客服支持</p>
          </CardContent>
        </Card>
      </div>

      {/* 支付状态弹窗 */}
      <PaymentStatusModal
        isOpen={paymentState.isOpen}
        status={paymentState.status}
        message={paymentState.message}
        orderId={paymentState.orderId}
        amount={paymentState.amount}
        onClose={closeModal}
      />
    </div>
  );
}
