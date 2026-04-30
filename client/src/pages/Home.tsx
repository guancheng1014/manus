import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* 导航栏 */}
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-white font-bold text-lg">Manus 注册工具</span>
            </div>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              登录
            </Button>
          </div>
        </nav>

        {/* 主内容 */}
        <main className="max-w-6xl mx-auto px-4 py-20">
          {/* Hero 部分 */}
          <div className="text-center mb-20">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              专业的自动化批量账号注册平台
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              支持卡密授权、实时监控、智能反检测的一站式解决方案。专为 Manus.im 设计。
            </p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 text-lg rounded-lg"
            >
              立即开始
            </Button>
          </div>

          {/* 功能特性 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-all">
              <CardHeader>
                <Zap className="h-8 w-8 text-cyan-400 mb-2" />
                <CardTitle className="text-white">快速注册</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">
                  支持单账号和批量注册，并发控制灵活，最高支持 50 并发
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-all">
              <CardHeader>
                <Users className="h-8 w-8 text-green-400 mb-2" />
                <CardTitle className="text-white">卡密管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">
                  完整的卡密生成、激活、过期管理系统，支持使用次数限制
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-all">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-400 mb-2" />
                <CardTitle className="text-white">实时监控</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">
                  SSE 实时推送任务进度、成功率、详细日志，支持数据导出
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-all">
              <CardHeader>
                <Settings className="h-8 w-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">智能反检测</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">
                  随机浏览器指纹、代理轮换、真实用户行为模拟
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 工作流程 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-20">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">工作流程</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "激活卡密", desc: "使用卡密激活账户" },
                { step: "2", title: "配置参数", desc: "设置 API 和代理" },
                { step: "3", title: "创建任务", desc: "单个或批量注册" },
                { step: "4", title: "实时监控", desc: "查看进度和结果" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 技术特性 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">核心功能</h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  邮箱验证码自动获取
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  手机号 SMS 绑定
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  Turnstile 验证码自动解决
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  邀请链接 UTM 参数支持
                </li>
              </ul>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">安全保障</h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  卡密加密存储
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  权限隔离（用户/管理员）
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  操作审计日志
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  代理 IP 轮换
                </li>
              </ul>
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <footer className="border-t border-slate-700 bg-slate-800/50 mt-20 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-slate-400">
            <p>Manus 自动注册工具 © 2026 | 专业的批量账号注册解决方案</p>
          </div>
        </footer>
      </div>
    );
  }

  // 已登录用户的首页
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">欢迎回来, {user?.name}!</h1>
            <p className="text-slate-400 mt-1">选择下方功能开始使用</p>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="text-red-400 border-red-400 hover:bg-red-400/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="bg-slate-800 border-slate-700 hover:border-cyan-500 cursor-pointer transition-all"
            onClick={() => navigate("/dashboard/single")}
          >
            <CardHeader>
              <CardTitle className="text-cyan-400">单账号注册</CardTitle>
              <CardDescription>注册单个账号</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                输入邮箱、API 等信息，一键注册单个 Manus 账号
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-800 border-slate-700 hover:border-purple-500 cursor-pointer transition-all"
            onClick={() => navigate("/dashboard/batch")}
          >
            <CardHeader>
              <CardTitle className="text-purple-400">批量注册</CardTitle>
              <CardDescription>批量创建任务</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                导入邮箱列表，设置并发数，批量注册多个账号
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-800 border-slate-700 hover:border-green-500 cursor-pointer transition-all"
            onClick={() => navigate("/dashboard/monitor")}
          >
            <CardHeader>
              <CardTitle className="text-green-400">任务监控</CardTitle>
              <CardDescription>实时查看进度</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                监控任务进度、查看日志、导出结果
              </p>
            </CardContent>
          </Card>

          {user?.role === "admin" && (
            <Card
              className="bg-slate-800 border-slate-700 hover:border-blue-500 cursor-pointer transition-all"
              onClick={() => navigate("/dashboard/admin")}
            >
              <CardHeader>
                <CardTitle className="text-blue-400">管理后台</CardTitle>
                <CardDescription>管理员专用</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">
                  生成卡密、查看统计、管理用户
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
