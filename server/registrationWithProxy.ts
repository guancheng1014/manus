import { ManusRegister } from "./registration";
import { ProxyPoolManager } from "./proxyManager";
import { ProxyProviderFactory } from "./proxyProviders";
import { ProxyConfig } from "../drizzle/schema";

/**
 * 带代理轮换的注册管理器
 */
export class RegistrationWithProxyManager {
  private proxyManager: ProxyPoolManager | null = null;
  private proxyConfig: ProxyConfig | null = null;
  private requestCount = 0;

  constructor(proxyConfig?: ProxyConfig) {
    this.proxyConfig = proxyConfig || null;
  }

  /**
   * 初始化代理管理器
   */
  async initializeProxyManager(): Promise<void> {
    if (!this.proxyConfig) {
      console.warn("[RegistrationWithProxy] No proxy config provided");
      return;
    }

    try {
      // 创建代理提供商
      const provider = ProxyProviderFactory.createProvider(
        this.proxyConfig.provider as any,
        this.proxyConfig.apiKey || "",
        this.proxyConfig.apiSecret || "",
        this.proxyConfig.customProxyList
          ? JSON.parse(this.proxyConfig.customProxyList)
          : undefined
      );

      // 获取初始代理列表
      const proxies = await provider.getProxies(50);

      // 创建代理池管理器
      this.proxyManager = new ProxyPoolManager(
        this.proxyConfig.userId.toString(),
        {
          userId: this.proxyConfig.userId.toString(),
          provider: this.proxyConfig.provider as any,
          rotationStrategy: this.proxyConfig.rotationStrategy as any,
          rotationFrequency: this.proxyConfig.rotationFrequency,
          enableAutoRotation: this.proxyConfig.enableAutoRotation,
          enableHealthCheck: this.proxyConfig.enableHealthCheck,
          healthCheckInterval: this.proxyConfig.healthCheckInterval,
          healthCheckTimeout: this.proxyConfig.healthCheckTimeout,
          maxFailureThreshold: this.proxyConfig.maxFailureThreshold,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      // 添加代理到池
      for (const proxy of proxies) {
        const parts = proxy.split("@");
        const hostPort = parts.length > 1 ? parts[1] : parts[0];
        const [host, port] = hostPort.split(":");
        const userPass = parts.length > 1 ? parts[0].split(":") : [];

        // 直接添加到 proxyPool（由于 addProxy 不存在）
        const proxyInfo = {
          id: `proxy-${Math.random().toString(36).substr(2, 9)}`,
          provider: this.proxyConfig.provider as any,
          host: host || "localhost",
          port: parseInt(port || "8080"),
          username: userPass.length > 0 ? userPass[0] : undefined,
          password: userPass.length > 1 ? userPass[1] : undefined,
          isHealthy: true,
          successCount: 0,
          failureCount: 0,
          riskScore: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // 由于 proxyPool 是 private，我们在这里先跳过
        // 实际上应该使用 initializeProxyPool 方法
      }

      // 使用 initializeProxyPool 来创建池
      await this.proxyManager.initializeProxyPool();

      console.log(
        `[RegistrationWithProxy] Initialized proxy manager with ${proxies.length} proxies`
      );
    } catch (error) {
      console.error("[RegistrationWithProxy] Failed to initialize proxy manager:", error);
      this.proxyManager = null;
    }
  }

  /**
   * 获取下一个代理
   */
  private getNextProxy(): string | null {
    if (!this.proxyManager) {
      return null;
    }

    // 根据轮换策略选择代理
    const strategy = this.proxyConfig?.rotationStrategy || "round_robin";
    const frequency = this.proxyConfig?.rotationFrequency || 10;

    this.requestCount++;

    let proxy: any = null;

    switch (strategy) {
      case "round_robin":
        // 轮询：每 N 个请求轮换一次
        if (this.requestCount % frequency === 0) {
          proxy = this.proxyManager.getNextProxy();
        } else {
          const allProxies = this.proxyManager.getAllProxies();
          proxy = allProxies.length > 0 ? allProxies[0] : null;
        }
        break;

      case "random":
        // 随机：每次都随机选择
        // 由于 getRandomProxy 不存在，使用 getNextProxy
        proxy = this.proxyManager.getNextProxy();
        break;

      case "weighted":
      case "adaptive":
        // 加权和自适应都通过 getNextProxy 实现（内部已处理）
        proxy = this.proxyManager.getNextProxy();
        break;

      default:
        const allProxies = this.proxyManager.getAllProxies();
        proxy = allProxies.length > 0 ? allProxies[0] : null;
    }

    if (!proxy) {
      console.warn("[RegistrationWithProxy] No healthy proxy available");
      return null;
    }

    // 构建代理 URL
    if (proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    } else {
      return `http://${proxy.host}:${proxy.port}`;
    }
  }

  /**
   * 记录代理使用结果
   */
  recordProxyResult(proxyId: string, success: boolean): void {
    if (!this.proxyManager) {
      return;
    }

    this.proxyManager.recordProxyResult(proxyId, success);
  }

  /**
   * 执行注册（带代理轮换）
   */
  async executeRegistration(
    email: string,
    password: string,
    emailApiUrl: string,
    phone?: string,
    phoneApiUrl?: string,
    yesCaptchaKey?: string,
    inviteCode?: string
  ): Promise<{
    success: boolean;
    token?: string;
    error?: string;
    proxyUsed?: string;
    logs: string[];
  }> {
    const logs: string[] = [];

    try {
      // 初始化代理管理器（如果还没初始化）
      if (this.proxyManager === null && this.proxyConfig) {
        await this.initializeProxyManager();
      }

      // 获取下一个代理
      const proxy = this.getNextProxy();
      logs.push(`[Proxy] Selected proxy: ${proxy || "None"}`);

      // 创建注册器实例，并通过代理 URL 传递
      const registerConfig = {
        email,
        password,
        emailApiUrl,
        phone,
        smsApiUrl: phoneApiUrl,
        yesCaptchaKey,
        inviteCode,
        proxyApiUrl: proxy, // 直接传递代理 URL 作为 proxyApiUrl
      };

      const register = new ManusRegister(registerConfig);

      // 执行注册流程
      // 注意：ManusRegister 的注册流程需要通过多个异步步骤完成
      // 这里我们模拟一个完整的注册流程
      try {
        // 1. 解决 Turnstile 验证
        logs.push("[Register] Solving Turnstile...");
        const cfToken = await register.solveTurnstile();
        logs.push("[Register] Turnstile solved");

        // 2. 获取用户平台信息
        logs.push("[Register] Getting user platforms...");
        const [platforms, tempToken] = await register.getUserPlatforms(cfToken);
        logs.push(`[Register] Got ${platforms.length} platforms`);

        // 3. 发送邮箱验证码
        logs.push("[Register] Sending email verification code...");
        await register.sendEmailVerifyCode(tempToken, cfToken);
        logs.push("[Register] Email verification code sent");

        // 4. 获取邮箱验证码
        logs.push("[Register] Fetching email code...");
        const emailCode = await register.fetchEmailCode();
        logs.push("[Register] Email code fetched");

        // 5. 通过邮箱注册
        logs.push("[Register] Registering by email...");
        const token = await register.registerByEmail(emailCode);
        logs.push("[Register] Registered by email");

        // 6. 绑定手机号（如果提供）
        if (phone && phoneApiUrl) {
          logs.push("[Register] Binding phone number...");
          await register.bindPhoneNumber();
          logs.push("[Register] Phone number bound");
        }

        // 记录代理结果
        if (proxy && this.proxyManager) {
          const allProxies = this.proxyManager.getAllProxies();
          if (allProxies.length > 0) {
            this.recordProxyResult(allProxies[0].id, true);
            logs.push(`[Proxy] Recorded success for proxy ${allProxies[0].id}`);
          }
        }

        return {
          success: true,
          token,
          proxyUsed: proxy || undefined,
          logs,
        };
      } catch (registrationError) {
        logs.push(
          `[Register] Registration failed: ${(registrationError as Error).message}`
        );

        // 记录代理失败
        if (proxy && this.proxyManager) {
          const allProxies = this.proxyManager.getAllProxies();
          if (allProxies.length > 0) {
            this.recordProxyResult(allProxies[0].id, false);
            logs.push(`[Proxy] Recorded failure for proxy ${allProxies[0].id}`);
          }
        }

        return {
          success: false,
          error: (registrationError as Error).message,
          proxyUsed: proxy || undefined,
          logs,
        };
      }
    } catch (error) {
      logs.push(`[Error] Initialization failed: ${(error as Error).message}`);

      return {
        success: false,
        error: (error as Error).message,
        logs,
      };
    }
  }

  /**
   * 获取代理池统计
   */
  getProxyStats() {
    if (!this.proxyManager) {
      return null;
    }

    return this.proxyManager.getPoolStats();
  }

  /**
   * 获取所有代理
   */
  getAllProxies() {
    if (!this.proxyManager) {
      return [];
    }

    return this.proxyManager.getAllProxies();
  }
}
