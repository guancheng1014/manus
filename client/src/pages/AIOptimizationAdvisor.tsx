import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, TrendingUp, Zap, Brain, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface OptimizationReport {
  timestamp: string;
  successRate: number;
  failureAnalysis: {
    validation: number;
    network: number;
    detection: number;
    rateLimit: number;
    unknown: number;
  };
  recommendations: {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    action: string;
  }[];
  metrics: {
    avgTime: number;
    totalAttempts: number;
    successCount: number;
    failCount: number;
  };
}

const mockReport: OptimizationReport = {
  timestamp: new Date().toISOString(),
  successRate: 72,
  failureAnalysis: {
    validation: 15,
    network: 8,
    detection: 12,
    rateLimit: 5,
    unknown: 8,
  },
  recommendations: [
    {
      title: "增加并发数",
      description: "当前并发数为 5，建议增加到 15。系统有足够的代理资源支持更高的并发。",
      impact: "high",
      action: "将并发数从 5 增加到 15",
    },
    {
      title: "优化轮换策略",
      description: "当前使用轮询策略，建议切换到加权策略。这样可以优先使用成功率高的代理。",
      impact: "high",
      action: "切换到加权轮换策略",
    },
    {
      title: "增加代理提供商",
      description: "当前仅使用 Luminati，建议同时使用 Oxylabs。这样可以降低被检测的风险。",
      impact: "medium",
      action: "添加 Oxylabs 作为备用提供商",
    },
    {
      title: "调整请求间隔",
      description: "当前请求间隔为 100ms，建议增加到 200ms 以降低被检测的风险。",
      impact: "medium",
      action: "将请求间隔增加到 200ms",
    },
  ],
  metrics: {
    avgTime: 4.2,
    totalAttempts: 150,
    successCount: 108,
    failCount: 42,
  },
};

export default function AIOptimizationAdvisor() {
  const [report, setReport] = useState<OptimizationReport>(mockReport);
  const [concurrency, setConcurrency] = useState(5);
  const [strategy, setStrategy] = useState("round_robin");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // 模拟 AI 分析
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 这里应该调用真实的 AI 优化接口
      // const response = await trpc.ai.analyzeAndOptimize.mutate({
      //   concurrency,
      //   strategy,
      // });

      toast.success("分析完成！已生成优化建议");
    } catch (error) {
      toast.error("分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyRecommendation = (action: string) => {
    toast.success(`已应用优化：${action}`);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-900 text-red-300";
      case "medium":
        return "bg-yellow-900 text-yellow-300";
      case "low":
        return "bg-green-900 text-green-300";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "high":
        return "高影响";
      case "medium":
        return "中影响";
      case "low":
        return "低影响";
      default:
        return "未知";
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            AI 智能优化建议
          </h1>
          <p className="text-slate-400">基于 GPT-4 的智能分析和优化建议</p>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`} />
          {isAnalyzing ? "分析中..." : "重新分析"}
        </Button>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">成功率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{report.successRate}%</div>
            <p className="text-xs text-slate-400 mt-1">注册成功率</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">平均耗时</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{report.metrics.avgTime}s</div>
            <p className="text-xs text-slate-400 mt-1">每个账号</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">总尝试数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">{report.metrics.totalAttempts}</div>
            <p className="text-xs text-slate-400 mt-1">本周</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">成功数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{report.metrics.successCount}</div>
            <p className="text-xs text-slate-400 mt-1">
              失败 {report.metrics.failCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 失败原因分析 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            失败原因分析
          </CardTitle>
          <CardDescription>基于 AI 分析的失败原因分布</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {Object.entries(report.failureAnalysis).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300 capitalize">
                    {key === "validation"
                      ? "验证失败"
                      : key === "network"
                      ? "网络错误"
                      : key === "detection"
                      ? "被检测"
                      : key === "rateLimit"
                      ? "速率限制"
                      : "其他"}
                  </span>
                  <span className="text-white font-semibold">{value}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 参数调整 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            参数调整
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <label className="text-slate-300 text-sm font-medium">
              并发数：{concurrency}
            </label>
            <Slider
              value={[concurrency]}
              onValueChange={(v) => setConcurrency(v[0])}
              min={1}
              max={50}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-slate-400 mt-2">
              建议值：15（当前：{concurrency}）
            </p>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium">轮换策略</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {["round_robin", "random", "weighted", "adaptive"].map((s) => (
                <Button
                  key={s}
                  onClick={() => setStrategy(s)}
                  variant={strategy === s ? "default" : "outline"}
                  className={
                    strategy === s
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-slate-700 hover:bg-slate-800"
                  }
                >
                  {s === "round_robin"
                    ? "轮询"
                    : s === "random"
                    ? "随机"
                    : s === "weighted"
                    ? "加权"
                    : "自适应"}
                </Button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              建议值：加权（当前：
              {strategy === "round_robin"
                ? "轮询"
                : strategy === "random"
                ? "随机"
                : strategy === "weighted"
                ? "加权"
                : "自适应"}
              ）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 优化建议 */}
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            AI 优化建议
          </CardTitle>
          <CardDescription>基于当前系统状态的智能优化建议</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {report.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="border border-slate-700 rounded-lg p-4 space-y-3 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{rec.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                </div>
                <Badge className={getImpactColor(rec.impact)}>
                  {getImpactLabel(rec.impact)}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-xs text-slate-500">{rec.action}</span>
                <Button
                  onClick={() => handleApplyRecommendation(rec.action)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  应用
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 提示 */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-300">AI 分析说明</h4>
          <p className="text-sm text-blue-200 mt-1">
            AI 优化建议基于您过去 7 天的注册数据进行分析。建议每周运行一次分析以获得最新的优化建议。
          </p>
        </div>
      </div>
    </div>
  );
}
