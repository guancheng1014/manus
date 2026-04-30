import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function ProxyConfiguration() {
  const [provider, setProvider] = useState<"luminati" | "oxylabs" | "smartproxy" | "custom">(
    "custom"
  );
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [customProxyList, setCustomProxyList] = useState("");
  const [rotationStrategy, setRotationStrategy] = useState<
    "round_robin" | "random" | "weighted" | "adaptive"
  >("round_robin");
  const [rotationFrequency, setRotationFrequency] = useState(10);
  const [healthCheckInterval, setHealthCheckInterval] = useState(5);
  const [healthCheckTimeout, setHealthCheckTimeout] = useState(10);
  const [enableAutoRotation, setEnableAutoRotation] = useState(true);
  const [enableHealthCheck, setEnableHealthCheck] = useState(true);
  const [maxFailureThreshold, setMaxFailureThreshold] = useState(3);
  const [testHost, setTestHost] = useState("");
  const [testPort, setTestPort] = useState("");
  const [testUsername, setTestUsername] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const saveConfigMutation = trpc.proxy.saveConfig.useMutation();
  const getConfigQuery = trpc.proxy.getConfig.useQuery();
  const getPoolStatsQuery = trpc.proxy.getPoolStats.useQuery();
  const getAllProxiesQuery = trpc.proxy.getAllProxies.useQuery();
  const testConnectionMutation = trpc.proxy.testConnection.useMutation();
  const refreshPoolMutation = trpc.proxy.refreshProxyPool.useMutation();

  // 加载现有配置
  useEffect(() => {
    if (getConfigQuery.data) {
      const config = getConfigQuery.data;
      setProvider(config.provider);
      setApiKey(config.apiKey || "");
      setApiSecret(config.apiSecret || "");
      setCustomProxyList(config.customProxyList ? JSON.parse(config.customProxyList).join("\n") : "");
      setRotationStrategy(config.rotationStrategy);
      setRotationFrequency(config.rotationFrequency);
      setHealthCheckInterval(config.healthCheckInterval);
      setHealthCheckTimeout(config.healthCheckTimeout);
      setEnableAutoRotation(!!config.enableAutoRotation);
      setEnableHealthCheck(!!config.enableHealthCheck);
      setMaxFailureThreshold(config.maxFailureThreshold);
    }
  }, [getConfigQuery.data]);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const customProxyArray = customProxyList
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p);

      await saveConfigMutation.mutateAsync({
        provider,
        apiKey: apiKey || undefined,
        apiSecret: apiSecret || undefined,
        customProxyList: provider === "custom" ? customProxyArray : undefined,
        rotationStrategy,
        rotationFrequency,
        healthCheckInterval,
        healthCheckTimeout,
        enableAutoRotation,
        enableHealthCheck,
        maxFailureThreshold,
      });

      toast.success("代理配置已保存");
      getConfigQuery.refetch();
      getPoolStatsQuery.refetch();
    } catch (error) {
      toast.error("保存配置失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testHost || !testPort) {
      toast.error("请输入代理地址和端口");
      return;
    }

    setIsTesting(true);
    try {
      const result = await testConnectionMutation.mutateAsync({
        host: testHost,
        port: parseInt(testPort),
        username: testUsername || undefined,
        password: testPassword || undefined,
      });

      if (result.success) {
        toast.success(`代理连接成功，IP: ${result.ip}`);
      } else {
        toast.error(`代理连接失败: ${result.error}`);
      }
    } catch (error) {
      toast.error("测试连接失败");
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshPool = async () => {
    setIsLoading(true);
    try {
      await refreshPoolMutation.mutateAsync();
      toast.success("代理池已刷新");
      getPoolStatsQuery.refetch();
      getAllProxiesQuery.refetch();
    } catch (error) {
      toast.error("刷新代理池失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">代理配置管理</h1>
        <p className="text-slate-400 mt-2">配置代理提供商、轮换策略和健康检查参数</p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">配置</TabsTrigger>
          <TabsTrigger value="stats">统计</TabsTrigger>
          <TabsTrigger value="proxies">代理列表</TabsTrigger>
          <TabsTrigger value="test">测试</TabsTrigger>
        </TabsList>

        {/* 配置标签页 */}
        <TabsContent value="config" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">代理提供商设置</CardTitle>
              <CardDescription className="text-slate-400">选择代理提供商并配置相关参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">提供商</Label>
                <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="custom">自定义代理</SelectItem>
                    <SelectItem value="luminati">Luminati</SelectItem>
                    <SelectItem value="oxylabs">Oxylabs</SelectItem>
                    <SelectItem value="smartproxy">SmartProxy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {provider !== "custom" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-300">API Key</Label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="输入 API Key"
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>

                  {provider !== "luminati" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">API Secret</Label>
                      <Input
                        type="password"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="输入 API Secret"
                        className="bg-slate-700 border-slate-600 text-slate-100"
                      />
                    </div>
                  )}
                </>
              )}

              {provider === "custom" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">代理列表</Label>
                  <Textarea
                    value={customProxyList}
                    onChange={(e) => setCustomProxyList(e.target.value)}
                    placeholder="每行一个代理，格式: host:port 或 username:password@host:port"
                    className="bg-slate-700 border-slate-600 text-slate-100 font-mono text-sm"
                    rows={6}
                  />
                  <p className="text-xs text-slate-400">
                    示例: 192.168.1.1:8080 或 user:pass@proxy.example.com:3128
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">轮换策略</CardTitle>
              <CardDescription className="text-slate-400">配置代理轮换和自动切换参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">轮换策略</Label>
                <Select value={rotationStrategy} onValueChange={(value: any) => setRotationStrategy(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="round_robin">轮询</SelectItem>
                    <SelectItem value="random">随机</SelectItem>
                    <SelectItem value="weighted">加权（基于成功率）</SelectItem>
                    <SelectItem value="adaptive">自适应（基于风险评分）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">轮换频率（每 N 个请求）</Label>
                <Input
                  type="number"
                  min={1}
                  value={rotationFrequency}
                  onChange={(e) => setRotationFrequency(parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300">启用自动轮换</Label>
                <Switch
                  checked={enableAutoRotation}
                  onCheckedChange={setEnableAutoRotation}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">健康检查</CardTitle>
              <CardDescription className="text-slate-400">配置代理健康检查参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">检查间隔（分钟）</Label>
                <Input
                  type="number"
                  min={1}
                  value={healthCheckInterval}
                  onChange={(e) => setHealthCheckInterval(parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">检查超时（秒）</Label>
                <Input
                  type="number"
                  min={1}
                  value={healthCheckTimeout}
                  onChange={(e) => setHealthCheckTimeout(parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">失败阈值（连续失败次数）</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxFailureThreshold}
                  onChange={(e) => setMaxFailureThreshold(parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300">启用健康检查</Label>
                <Switch
                  checked={enableHealthCheck}
                  onCheckedChange={setEnableHealthCheck}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveConfig}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存配置"
            )}
          </Button>
        </TabsContent>

        {/* 统计标签页 */}
        <TabsContent value="stats" className="space-y-6">
          {getPoolStatsQuery.data ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">代理池统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">总代理数</p>
                    <p className="text-2xl font-bold text-slate-100 mt-2">
                      {getPoolStatsQuery.data.total}
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">健康代理</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">
                      {getPoolStatsQuery.data.healthy}
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">不健康代理</p>
                    <p className="text-2xl font-bold text-red-400 mt-2">
                      {getPoolStatsQuery.data.unhealthy}
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">平均成功率</p>
                    <p className="text-2xl font-bold text-blue-400 mt-2">
                      {getPoolStatsQuery.data.averageSuccessRate}%
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg col-span-2">
                    <p className="text-slate-400 text-sm">平均风险评分</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-2">
                      {getPoolStatsQuery.data.averageRiskScore}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleRefreshPool}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      刷新中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      刷新代理池
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400">暂无代理池数据，请先保存配置</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 代理列表标签页 */}
        <TabsContent value="proxies" className="space-y-6">
          {getAllProxiesQuery.data && getAllProxiesQuery.data.length > 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">代理列表</CardTitle>
                <CardDescription className="text-slate-400">
                  共 {getAllProxiesQuery.data.length} 个代理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400">ID</th>
                        <th className="text-left py-3 px-4 text-slate-400">地址</th>
                        <th className="text-left py-3 px-4 text-slate-400">成功</th>
                        <th className="text-left py-3 px-4 text-slate-400">失败</th>
                        <th className="text-left py-3 px-4 text-slate-400">风险</th>
                        <th className="text-left py-3 px-4 text-slate-400">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllProxiesQuery.data.map((proxy: any) => (
                        <tr key={proxy.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {proxy.id.substring(0, 12)}...
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {proxy.host}:{proxy.port}
                          </td>
                          <td className="py-3 px-4 text-green-400">{proxy.successCount}</td>
                          <td className="py-3 px-4 text-red-400">{proxy.failureCount}</td>
                          <td className="py-3 px-4 text-yellow-400">{proxy.riskScore}</td>
                          <td className="py-3 px-4">
                            {proxy.isHealthy ? (
                              <span className="inline-flex items-center gap-1 text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                健康
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                不健康
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400">暂无代理，请先保存配置</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 测试标签页 */}
        <TabsContent value="test" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">代理连接测试</CardTitle>
              <CardDescription className="text-slate-400">测试代理是否可以正常连接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">代理地址</Label>
                <Input
                  value={testHost}
                  onChange={(e) => setTestHost(e.target.value)}
                  placeholder="例如: 192.168.1.1"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">端口</Label>
                <Input
                  type="number"
                  value={testPort}
                  onChange={(e) => setTestPort(e.target.value)}
                  placeholder="例如: 8080"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">用户名（可选）</Label>
                <Input
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">密码（可选）</Label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="输入密码"
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  "测试连接"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
