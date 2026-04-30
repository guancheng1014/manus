import axios from "axios";

/**
 * 代理提供商类型
 */
export type ProxyProvider = "luminati" | "oxylabs" | "smartproxy" | "custom";

/**
 * 代理信息接口
 */
export interface ProxyInfo {
  id: string;
  provider: ProxyProvider;
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  isp?: string;
  lastUsedAt?: Date;
  successCount: number;
  failureCount: number;
  riskScore: number; // 0-100
  isHealthy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 代理配置接口
 */
export interface ProxyConfiguration {
  userId: string;
  provider: ProxyProvider;
  apiKey?: string;
  apiSecret?: string;
  customProxyList?: string[]; // 自定义代理列表
  rotationStrategy: "round_robin" | "random" | "weighted" | "adaptive";
  rotationFrequency: number; // 每 N 个请求轮换一次
  healthCheckInterval: number; // 分钟
  healthCheckTimeout: number; // 秒
  enableAutoRotation: boolean;
  enableHealthCheck: boolean;
  maxFailureThreshold: number; // 连续失败次数超过此值则标记为不健康
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 代理池管理器
 */
export class ProxyPoolManager {
  private proxyPool: Map<string, ProxyInfo> = new Map();
  private rotationIndex: number = 0;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(private userId: string, private config: ProxyConfiguration) {}

  /**
   * 从 Luminati 获取代理
   */
  async fetchLuminatiProxies(): Promise<ProxyInfo[]> {
    try {
      if (!this.config.apiKey) {
        throw new Error("Luminati API key not configured");
      }

      // Luminati API 端点
      const response = await axios.get("https://api.luminati.io/v1/proxies", {
        auth: {
          username: this.config.apiKey,
          password: this.config.apiSecret || "",
        },
        timeout: 10000,
      });

      const proxies: ProxyInfo[] = response.data.map((p: any) => ({
        id: `luminati-${p.id}`,
        provider: "luminati",
        host: p.ip,
        port: p.port,
        country: p.country,
        city: p.city,
        isp: p.isp,
        successCount: 0,
        failureCount: 0,
        riskScore: 0,
        isHealthy: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return proxies;
    } catch (error) {
      console.error("[ProxyManager] Failed to fetch Luminati proxies:", error);
      return [];
    }
  }

  /**
   * 从 Oxylabs 获取代理
   */
  async fetchOxylabsProxies(): Promise<ProxyInfo[]> {
    try {
      if (!this.config.apiKey) {
        throw new Error("Oxylabs API key not configured");
      }

      // Oxylabs API 端点
      const response = await axios.get("https://api.oxylabs.io/v1/proxies", {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        timeout: 10000,
      });

      const proxies: ProxyInfo[] = response.data.results.map((p: any) => ({
        id: `oxylabs-${p.id}`,
        provider: "oxylabs",
        host: p.proxy_address,
        port: p.port,
        username: p.username,
        password: p.password,
        country: p.country,
        city: p.city,
        successCount: 0,
        failureCount: 0,
        riskScore: 0,
        isHealthy: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return proxies;
    } catch (error) {
      console.error("[ProxyManager] Failed to fetch Oxylabs proxies:", error);
      return [];
    }
  }

  /**
   * 从 SmartProxy 获取代理
   */
  async fetchSmartproxyProxies(): Promise<ProxyInfo[]> {
    try {
      if (!this.config.apiKey) {
        throw new Error("SmartProxy API key not configured");
      }

      // SmartProxy API 端点
      const response = await axios.get("https://api.smartproxy.com/v1/proxies", {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        timeout: 10000,
      });

      const proxies: ProxyInfo[] = response.data.data.map((p: any) => ({
        id: `smartproxy-${p.id}`,
        provider: "smartproxy",
        host: p.host,
        port: p.port,
        username: p.username,
        password: p.password,
        country: p.country,
        city: p.city,
        successCount: 0,
        failureCount: 0,
        riskScore: 0,
        isHealthy: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return proxies;
    } catch (error) {
      console.error("[ProxyManager] Failed to fetch SmartProxy proxies:", error);
      return [];
    }
  }

  /**
   * 初始化代理池
   */
  async initializeProxyPool(): Promise<void> {
    try {
      let proxies: ProxyInfo[] = [];

      // 根据配置的提供商获取代理
      switch (this.config.provider) {
        case "luminati":
          proxies = await this.fetchLuminatiProxies();
          break;
        case "oxylabs":
          proxies = await this.fetchOxylabsProxies();
          break;
        case "smartproxy":
          proxies = await this.fetchSmartproxyProxies();
          break;
        case "custom":
          proxies = this.parseCustomProxies();
          break;
      }

      // 添加到代理池
      proxies.forEach((proxy) => {
        this.proxyPool.set(proxy.id, proxy);
      });

      console.log(`[ProxyManager] Initialized proxy pool with ${proxies.length} proxies`);

      // 启动健康检查
      if (this.config.enableHealthCheck) {
        this.startHealthCheck();
      }
    } catch (error) {
      console.error("[ProxyManager] Failed to initialize proxy pool:", error);
    }
  }

  /**
   * 解析自定义代理列表
   */
  private parseCustomProxies(): ProxyInfo[] {
    const proxies: ProxyInfo[] = [];

    if (!this.config.customProxyList) {
      return proxies;
    }

    this.config.customProxyList.forEach((proxyUrl, index) => {
      try {
        // 支持格式: host:port 或 username:password@host:port
        let host: string;
        let port: number;
        let username: string | undefined;
        let password: string | undefined;

        if (proxyUrl.includes("@")) {
          const [auth, address] = proxyUrl.split("@");
          const authParts = auth.split(":");
          username = authParts[0];
          password = authParts[1];
          const addressParts = address.split(":");
          host = addressParts[0];
          port = parseInt(addressParts[1]);
        } else {
          const parts = proxyUrl.split(":");
          host = parts[0];
          port = parseInt(parts[1]);
        }

        proxies.push({
          id: `custom-${index}`,
          provider: "custom",
          host,
          port,
          username,
          password,
          successCount: 0,
          failureCount: 0,
          riskScore: 0,
          isHealthy: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error(`[ProxyManager] Failed to parse proxy: ${proxyUrl}`, error);
      }
    });

    return proxies;
  }

  /**
   * 获取下一个代理（基于轮换策略）
   */
  getNextProxy(): ProxyInfo | null {
    const healthyProxies = Array.from(this.proxyPool.values()).filter(
      (p) => p.isHealthy
    );

    if (healthyProxies.length === 0) {
      console.warn("[ProxyManager] No healthy proxies available");
      return null;
    }

    let selectedProxy: ProxyInfo;

    switch (this.config.rotationStrategy) {
      case "round_robin":
        selectedProxy = healthyProxies[this.rotationIndex % healthyProxies.length];
        this.rotationIndex++;
        break;

      case "random":
        selectedProxy = healthyProxies[Math.floor(Math.random() * healthyProxies.length)];
        break;

      case "weighted":
        // 基于成功率加权选择
        selectedProxy = this.selectByWeightedSuccessRate(healthyProxies);
        break;

      case "adaptive":
        // 自适应选择（基于风险评分和成功率）
        selectedProxy = this.selectAdaptive(healthyProxies);
        break;

      default:
        selectedProxy = healthyProxies[0];
    }

    selectedProxy.lastUsedAt = new Date();
    return selectedProxy;
  }

  /**
   * 基于成功率的加权选择
   */
  private selectByWeightedSuccessRate(proxies: ProxyInfo[]): ProxyInfo {
    // 计算每个代理的成功率
    const weights = proxies.map((p) => {
      const total = p.successCount + p.failureCount;
      return total > 0 ? p.successCount / total : 0.5;
    });

    // 计算总权重
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    // 随机选择（基于权重）
    let random = Math.random() * totalWeight;
    for (let i = 0; i < proxies.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return proxies[i];
      }
    }

    return proxies[0];
  }

  /**
   * 自适应选择代理
   */
  private selectAdaptive(proxies: ProxyInfo[]): ProxyInfo {
    // 计算每个代理的评分（成功率 + 低风险评分）
    const scores = proxies.map((p) => {
      const total = p.successCount + p.failureCount;
      const successRate = total > 0 ? p.successCount / total : 0.5;
      const riskFactor = 1 - p.riskScore / 100;
      return successRate * 0.7 + riskFactor * 0.3;
    });

    // 选择评分最高的代理
    let maxScore = -1;
    let selectedProxy = proxies[0];

    scores.forEach((score, index) => {
      if (score > maxScore) {
        maxScore = score;
        selectedProxy = proxies[index];
      }
    });

    return selectedProxy;
  }

  /**
   * 记录代理使用结果
   */
  recordProxyResult(proxyId: string, success: boolean, riskScore?: number): void {
    const proxy = this.proxyPool.get(proxyId);
    if (!proxy) {
      return;
    }

    if (success) {
      proxy.successCount++;
      proxy.failureCount = 0; // 重置连续失败计数
    } else {
      proxy.failureCount++;

      // 如果连续失败次数超过阈值，标记为不健康
      if (proxy.failureCount >= this.config.maxFailureThreshold) {
        proxy.isHealthy = false;
        console.warn(
          `[ProxyManager] Proxy ${proxyId} marked as unhealthy (${proxy.failureCount} failures)`
        );
      }
    }

    // 更新风险评分
    if (riskScore !== undefined) {
      proxy.riskScore = riskScore;
    }

    proxy.updatedAt = new Date();
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    const intervalMs = this.config.healthCheckInterval * 60 * 1000;

    this.healthCheckTimer = setInterval(async () => {
      console.log("[ProxyManager] Starting health check...");

      this.proxyPool.forEach(async (proxy, proxyId) => {
        const isHealthy = await this.checkProxyHealth(proxy);
        proxy.isHealthy = isHealthy;

        if (!isHealthy) {
          console.warn(`[ProxyManager] Proxy ${proxyId} failed health check`);
        }
      });

      console.log("[ProxyManager] Health check completed");
    }, intervalMs);
  }

  /**
   * 检查代理健康状态
   */
  private async checkProxyHealth(proxy: ProxyInfo): Promise<boolean> {
    try {
      const proxyUrl = this.buildProxyUrl(proxy);

      // 使用代理访问测试 URL
      const response = await axios.get("https://httpbin.org/ip", {
        httpAgent: require("http-proxy-agent")(proxyUrl),
        httpsAgent: require("https-proxy-agent")(proxyUrl),
        timeout: this.config.healthCheckTimeout * 1000,
      });

      return response.status === 200;
    } catch (error) {
      console.error(`[ProxyManager] Health check failed for proxy:`, error);
      return false;
    }
  }

  /**
   * 构建代理 URL
   */
  private buildProxyUrl(proxy: ProxyInfo): string {
    if (proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
    return `http://${proxy.host}:${proxy.port}`;
  }

  /**
   * 获取代理池统计
   */
  getPoolStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    averageSuccessRate: number;
    averageRiskScore: number;
  } {
    const proxies: ProxyInfo[] = [];
    this.proxyPool.forEach((proxy) => {
      proxies.push(proxy);
    });
    const healthyProxies = proxies.filter((p) => p.isHealthy);

    const totalSuccessCount = proxies.reduce((sum, p) => sum + p.successCount, 0);
    const totalRequests = proxies.reduce(
      (sum, p) => sum + p.successCount + p.failureCount,
      0
    );
    const averageSuccessRate =
      totalRequests > 0 ? (totalSuccessCount / totalRequests) * 100 : 0;

    const averageRiskScore =
      proxies.length > 0
        ? proxies.reduce((sum, p) => sum + p.riskScore, 0) / proxies.length
        : 0;

    return {
      total: proxies.length,
      healthy: healthyProxies.length,
      unhealthy: proxies.length - healthyProxies.length,
      averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
    };
  }

  /**
   * 获取所有代理信息
   */
  getAllProxies(): ProxyInfo[] {
    const proxies: ProxyInfo[] = [];
    this.proxyPool.forEach((proxy) => {
      proxies.push(proxy);
    });
    return proxies;
  }

  /**
   * 获取健康的代理
   */
  getHealthyProxies(): ProxyInfo[] {
    const proxies: ProxyInfo[] = [];
    this.proxyPool.forEach((proxy) => {
      if (proxy.isHealthy) {
        proxies.push(proxy);
      }
    });
    return proxies;
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * 销毁代理管理器
   */
  destroy(): void {
    this.stopHealthCheck();
    this.proxyPool.clear();
  }
}

/**
 * 代理管理器工厂
 */
export class ProxyManagerFactory {
  private managers: Map<string, ProxyPoolManager> = new Map();

  /**
   * 创建或获取代理管理器
   */
  async getOrCreateManager(
    userId: string,
    config: ProxyConfiguration
  ): Promise<ProxyPoolManager> {
    const key = `${userId}-${config.provider}`;

    if (!this.managers.has(key)) {
      const manager = new ProxyPoolManager(userId, config);
      await manager.initializeProxyPool();
      this.managers.set(key, manager);
    }

    return this.managers.get(key)!;
  }

  /**
   * 销毁所有管理器
   */
  destroyAll(): void {
    this.managers.forEach((manager) => {
      manager.destroy();
    });
    this.managers.clear();
  }
}
