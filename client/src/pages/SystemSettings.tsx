import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Settings } from "lucide-react";

export default function SystemSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 通知设置
  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotification: true,
    enableCardKeyNotification: true,
    enableTaskNotification: true,
    notificationEmail: user?.email || "",
  });

  // 注册设置
  const [registrationSettings, setRegistrationSettings] = useState({
    defaultConcurrency: 10,
    maxConcurrency: 50,
    defaultTimeout: 30,
    enableAutoRetry: true,
    maxRetries: 3,
  });

  // 代理设置
  const [proxySettings, setProxySettings] = useState({
    defaultRotationStrategy: "adaptive",
    enableHealthCheck: true,
    healthCheckInterval: 5,
    enableAutoRotation: true,
    rotationFrequency: 10,
  });

  // 系统设置
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: "",
    maxTasksPerUser: 100,
    enableDataExport: true,
    dataRetentionDays: 90,
  });

  const handleNotificationChange = (key: string, value: any) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegistrationChange = (key: string, value: any) => {
    setRegistrationSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleProxyChange = (key: string, value: any) => {
    setProxySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSystemChange = (key: string, value: any) => {
    setSystemSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("通知设置已保存", { description: "您的通知偏好已更新" });
    } catch (error) {
      toast.error("保存失败", { description: "无法保存通知设置，请重试" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegistration = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("注册设置已保存", { description: "默认注册参数已更新" });
    } catch (error) {
      toast.error("保存失败", { description: "无法保存注册设置，请重试" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProxy = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("代理设置已保存", { description: "代理默认配置已更新" });
    } catch (error) {
      toast.error("保存失败", { description: "无法保存代理设置，请重试" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("系统设置已保存", { description: "系统配置已更新" });
    } catch (error) {
      toast.error("保存失败", { description: "无法保存系统设置，请重试" });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              无权限访问
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              只有管理员可以访问系统设置页面。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-cyan-500" />
        <div>
          <h1 className="text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground">管理平台的全局配置和偏好设置</p>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="registration">注册</TabsTrigger>
          <TabsTrigger value="proxy">代理</TabsTrigger>
          <TabsTrigger value="system">系统</TabsTrigger>
        </TabsList>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>配置系统通知的偏好和方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>邮件通知</Label>
                    <p className="text-sm text-muted-foreground">接收系统邮件通知</p>
                  </div>
                  <Switch
                    checked={notificationSettings.enableEmailNotification}
                    onCheckedChange={(value) =>
                      handleNotificationChange("enableEmailNotification", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>卡密通知</Label>
                    <p className="text-sm text-muted-foreground">
                      新用户激活和卡密到期提醒
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.enableCardKeyNotification}
                    onCheckedChange={(value) =>
                      handleNotificationChange("enableCardKeyNotification", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>任务通知</Label>
                    <p className="text-sm text-muted-foreground">任务完成和错误提醒</p>
                  </div>
                  <Switch
                    checked={notificationSettings.enableTaskNotification}
                    onCheckedChange={(value) =>
                      handleNotificationChange("enableTaskNotification", value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-email">通知邮箱</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    value={notificationSettings.notificationEmail}
                    onChange={(e) =>
                      handleNotificationChange("notificationEmail", e.target.value)
                    }
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={loading}>
                {loading ? "保存中..." : "保存通知设置"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 注册设置 */}
        <TabsContent value="registration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>注册设置</CardTitle>
              <CardDescription>配置默认的注册参数和限制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-concurrency">默认并发数</Label>
                  <Input
                    id="default-concurrency"
                    type="number"
                    min="1"
                    max="50"
                    value={registrationSettings.defaultConcurrency}
                    onChange={(e) =>
                      handleRegistrationChange(
                        "defaultConcurrency",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    新建任务的默认并发数（1-50）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-concurrency">最大并发数</Label>
                  <Input
                    id="max-concurrency"
                    type="number"
                    min="1"
                    max="100"
                    value={registrationSettings.maxConcurrency}
                    onChange={(e) =>
                      handleRegistrationChange("maxConcurrency", parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    系统允许的最大并发数
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-timeout">默认超时时间（秒）</Label>
                  <Input
                    id="default-timeout"
                    type="number"
                    min="10"
                    max="300"
                    value={registrationSettings.defaultTimeout}
                    onChange={(e) =>
                      handleRegistrationChange("defaultTimeout", parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>自动重试</Label>
                    <p className="text-sm text-muted-foreground">
                      注册失败时自动重试
                    </p>
                  </div>
                  <Switch
                    checked={registrationSettings.enableAutoRetry}
                    onCheckedChange={(value) =>
                      handleRegistrationChange("enableAutoRetry", value)
                    }
                  />
                </div>

                {registrationSettings.enableAutoRetry && (
                  <div className="space-y-2">
                    <Label htmlFor="max-retries">最大重试次数</Label>
                    <Input
                      id="max-retries"
                      type="number"
                      min="1"
                      max="10"
                      value={registrationSettings.maxRetries}
                      onChange={(e) =>
                        handleRegistrationChange("maxRetries", parseInt(e.target.value))
                      }
                    />
                  </div>
                )}
              </div>

              <Button onClick={handleSaveRegistration} disabled={loading}>
                {loading ? "保存中..." : "保存注册设置"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 代理设置 */}
        <TabsContent value="proxy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>代理设置</CardTitle>
              <CardDescription>配置默认的代理轮换策略</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rotation-strategy">默认轮换策略</Label>
                  <Select
                    value={proxySettings.defaultRotationStrategy}
                    onValueChange={(value) =>
                      handleProxyChange("defaultRotationStrategy", value)
                    }
                  >
                    <SelectTrigger id="rotation-strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">轮询</SelectItem>
                      <SelectItem value="random">随机</SelectItem>
                      <SelectItem value="weighted">加权</SelectItem>
                      <SelectItem value="adaptive">自适应</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>健康检查</Label>
                    <p className="text-sm text-muted-foreground">
                      定期检查代理可用性
                    </p>
                  </div>
                  <Switch
                    checked={proxySettings.enableHealthCheck}
                    onCheckedChange={(value) =>
                      handleProxyChange("enableHealthCheck", value)
                    }
                  />
                </div>

                {proxySettings.enableHealthCheck && (
                  <div className="space-y-2">
                    <Label htmlFor="health-check-interval">
                      健康检查间隔（分钟）
                    </Label>
                    <Input
                      id="health-check-interval"
                      type="number"
                      min="1"
                      max="60"
                      value={proxySettings.healthCheckInterval}
                      onChange={(e) =>
                        handleProxyChange(
                          "healthCheckInterval",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>自动轮换</Label>
                    <p className="text-sm text-muted-foreground">
                      定期自动轮换代理
                    </p>
                  </div>
                  <Switch
                    checked={proxySettings.enableAutoRotation}
                    onCheckedChange={(value) =>
                      handleProxyChange("enableAutoRotation", value)
                    }
                  />
                </div>

                {proxySettings.enableAutoRotation && (
                  <div className="space-y-2">
                    <Label htmlFor="rotation-frequency">轮换频率（分钟）</Label>
                    <Input
                      id="rotation-frequency"
                      type="number"
                      min="1"
                      max="120"
                      value={proxySettings.rotationFrequency}
                      onChange={(e) =>
                        handleProxyChange("rotationFrequency", parseInt(e.target.value))
                      }
                    />
                  </div>
                )}
              </div>

              <Button onClick={handleSaveProxy} disabled={loading}>
                {loading ? "保存中..." : "保存代理设置"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统设置 */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>配置系统级别的参数和限制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>维护模式</Label>
                    <p className="text-sm text-muted-foreground">
                      启用后，普通用户将无法访问系统
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(value) =>
                      handleSystemChange("maintenanceMode", value)
                    }
                  />
                </div>

                {systemSettings.maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">维护信息</Label>
                    <Input
                      id="maintenance-message"
                      value={systemSettings.maintenanceMessage}
                      onChange={(e) =>
                        handleSystemChange("maintenanceMessage", e.target.value)
                      }
                      placeholder="系统维护中，请稍后再试..."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="max-tasks">每个用户最大任务数</Label>
                  <Input
                    id="max-tasks"
                    type="number"
                    min="1"
                    max="1000"
                    value={systemSettings.maxTasksPerUser}
                    onChange={(e) =>
                      handleSystemChange("maxTasksPerUser", parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>启用数据导出</Label>
                    <p className="text-sm text-muted-foreground">
                      允许用户导出他们的数据
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableDataExport}
                    onCheckedChange={(value) =>
                      handleSystemChange("enableDataExport", value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-retention">数据保留天数</Label>
                  <Input
                    id="data-retention"
                    type="number"
                    min="1"
                    max="365"
                    value={systemSettings.dataRetentionDays}
                    onChange={(e) =>
                      handleSystemChange("dataRetentionDays", parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    超过此天数的数据将被自动删除
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveSystem} disabled={loading}>
                {loading ? "保存中..." : "保存系统设置"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 成功提示 */}
      <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <p className="text-sm text-green-400">所有设置已同步到系统</p>
      </div>
    </div>
  );
}
