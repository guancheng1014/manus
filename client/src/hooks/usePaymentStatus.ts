import { useState, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export type PaymentStatus = "pending" | "success" | "failed" | "error";

interface PaymentStatusState {
  isOpen: boolean;
  status: PaymentStatus;
  message?: string;
  orderId?: string;
  amount?: number;
}

export function usePaymentStatus() {
  const [paymentState, setPaymentState] = useState<PaymentStatusState>({
    isOpen: false,
    status: "pending",
  });

  // 支付宝支付
  const alipayMutation = trpc.advanced.payment.createAlipayOrder.useMutation();
  
  // 微信支付
  const wechatMutation = trpc.advanced.payment.createWechatOrder.useMutation();

  // 打开弹窗
  const openModal = useCallback((status: PaymentStatus, message?: string) => {
    setPaymentState((prev) => ({
      ...prev,
      isOpen: true,
      status,
      message,
    }));
  }, []);

  // 关闭弹窗
  const closeModal = useCallback(() => {
    setPaymentState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // 支付宝支付处理
  const handleAlipayPayment = useCallback(
    async (cardKeyId: string, amount: number) => {
      try {
        openModal("pending", "正在创建支付宝订单...");

        const result = await alipayMutation.mutateAsync({
          cardKeyId: parseInt(cardKeyId),
          quantity: 1,
          totalAmount: amount,
        });

        if (result.success && result.paymentUrl) {
          // 重定向到支付宝支付页面
          window.location.href = result.paymentUrl;
        } else {
          openModal("failed", result.error || "创建订单失败");
          toast.error("支付宝订单创建失败");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "支付处理失败";
        openModal("error", errorMessage);
        toast.error(errorMessage);
      }
    },
    [alipayMutation, openModal]
  );

  // 微信支付处理
  const handleWechatPayment = useCallback(
    async (cardKeyId: string, amount: number, paymentMethod: "h5" | "jsapi" | "native" = "h5") => {
      try {
        openModal("pending", "正在创建微信支付订单...");

        const result = await wechatMutation.mutateAsync({
          cardKeyId: parseInt(cardKeyId),
          quantity: 1,
          totalAmount: amount,
          tradeType: paymentMethod === 'h5' ? 'MWEB' : paymentMethod === 'jsapi' ? 'JSAPI' : 'NATIVE',
        });

        if (result.success) {
          if (paymentMethod === "h5" && result.mwebUrl) {
            // H5 支付：重定向
            window.location.href = result.mwebUrl;
          } else if (paymentMethod === "jsapi" && result.jsapiParams) {
            // JSAPI 支付：调用微信 JS-SDK
            if ((window as any).wx) {
              (window as any).wx.choosePayment({
                nonceStr: result.jsapiParams.nonceStr,
                package: `prepay_id=${result.jsapiParams.prepayId}`,
                paySign: result.jsapiParams.paySign,
                signType: "RSA",
                timeStamp: result.jsapiParams.timeStamp,
                success: () => {
                  openModal("success", "支付成功！卡密已激活");
                  toast.success("支付成功，卡密已激活");
                },
                fail: () => {
                  openModal("failed", "支付被取消");
                  toast.error("支付被取消");
                },
              });
            }
          } else if (paymentMethod === "native" && result.codeUrl) {
            // Native 支付：显示二维码
            openModal("pending", `请扫描二维码完成支付\n订单号: ${result.orderId}`);
          }
        } else {
          openModal("failed", result.error || "创建订单失败");
          toast.error("微信订单创建失败");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "支付处理失败";
        openModal("error", errorMessage);
        toast.error(errorMessage);
      }
    },
    [wechatMutation, openModal]
  );

  // 处理支付成功回调
  const handlePaymentSuccess = useCallback(
    (orderId: string, amount: number) => {
      setPaymentState((prev) => ({
        ...prev,
        orderId,
        amount,
      }));
      openModal("success", "支付成功！卡密已激活");
      toast.success("支付成功，卡密已激活");
    },
    [openModal]
  );

  // 处理支付失败回调
  const handlePaymentFailed = useCallback(
    (orderId: string, reason?: string) => {
      setPaymentState((prev) => ({
        ...prev,
        orderId,
      }));
      openModal("failed", reason || "支付失败，请重试");
      toast.error(reason || "支付失败");
    },
    [openModal]
  );

  return {
    paymentState,
    openModal,
    closeModal,
    handleAlipayPayment,
    handleWechatPayment,
    handlePaymentSuccess,
    handlePaymentFailed,
    isLoading: alipayMutation.isPending || wechatMutation.isPending,
  };
}
