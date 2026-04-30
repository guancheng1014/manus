import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentStatus = "pending" | "success" | "failed" | "error";

interface PaymentStatusModalProps {
  isOpen: boolean;
  status: PaymentStatus;
  message?: string;
  orderId?: string;
  amount?: number;
  onClose: () => void;
  onRetry?: () => void;
}

export function PaymentStatusModal({
  isOpen,
  status,
  message,
  orderId,
  amount,
  onClose,
  onRetry,
}: PaymentStatusModalProps) {
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const statusConfig = {
    pending: {
      icon: Loader2,
      title: "处理中",
      description: "正在处理您的支付请求，请稍候...",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    success: {
      icon: CheckCircle,
      title: "支付成功",
      description: "您的支付已成功处理，卡密已激活！",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    failed: {
      icon: XCircle,
      title: "支付失败",
      description: "支付处理失败，请检查您的账户或重试。",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    error: {
      icon: AlertCircle,
      title: "错误",
      description: "发生了一个错误，请稍后重试。",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "border-2 bg-slate-900/95 backdrop-blur-sm",
          config.borderColor
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* 状态图标 */}
          <div
            className={cn(
              "rounded-full p-4",
              config.bgColor
            )}
          >
            {status === "pending" ? (
              <Icon className={cn("h-12 w-12 animate-spin", config.color)} />
            ) : (
              <Icon className={cn("h-12 w-12", config.color)} />
            )}
          </div>

          {/* 状态描述 */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-300">
              {message || config.description}
            </p>

            {/* 订单信息 */}
            {orderId && (
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                <p>订单号: <span className="font-mono text-slate-300">{orderId}</span></p>
                {amount && (
                  <p>金额: <span className="font-mono text-slate-300">¥{amount.toFixed(2)}</span></p>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 w-full">
            {status === "failed" || status === "error" ? (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 hover:bg-slate-800"
                >
                  关闭
                </Button>
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    重试
                  </Button>
                )}
              </>
            ) : status === "success" ? (
              <Button
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                完成
              </Button>
            ) : (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </Button>
            )}
          </div>

          {/* 进度提示 */}
          {status === "pending" && (
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full animate-pulse" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
