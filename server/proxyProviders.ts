import axios from "axios";

/**
 * 代理提供商基类
 */
export abstract class ProxyProvider {
  protected apiKey: string;
  protected apiSecret?: string;

  constructor(apiKey: string, apiSecret?: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * 获取代理列表
   */
  abstract getProxies(count: number): Promise<string[]>;

  /**
   * 测试代理连接
   */
  async testProxy(proxyUrl: string): Promise<boolean> {
    try {
      const HttpProxyAgent = require("http-proxy-agent");
      const HttpsProxyAgent = require("https-proxy-agent");

      const response = await axios.get("https://httpbin.org/ip", {
        httpAgent: HttpProxyAgent(proxyUrl),
        httpsAgent: HttpsProxyAgent(proxyUrl),
        timeout: 10000,
      });

      return response.status === 200;
    } catch (error) {
      console.error("[ProxyProvider] Test failed:", error);
      return false;
    }
  }
}

/**
 * Luminati 代理提供商
 * API 文档: https://luminati.io/cp/api
 */
export class LuminatiProvider extends ProxyProvider {
  private readonly apiUrl = "https://api.luminati.io";

  async getProxies(count: number): Promise<string[]> {
    try {
      // Luminati 使用 username:password@proxy.luminati.io:port 格式
      // 需要从 API 获取可用的代理端口
      const response = await axios.get(`${this.apiUrl}/zones`, {
        auth: {
          username: "lum-customer-" + this.apiKey,
          password: this.apiSecret || "",
        },
      });

      const zones = response.data.zones || [];
      if (zones.length === 0) {
        throw new Error("No zones available in Luminati");
      }

      const proxies: string[] = [];
      const zone = zones[0]; // 使用第一个 zone

      for (let i = 0; i < Math.min(count, 10); i++) {
        const port = 22225 + i; // Luminati 代理端口范围
        const proxyUrl = `http://lum-customer-${this.apiKey}-zone-${zone.name}-session-${i}:${this.apiSecret}@proxy.luminati.io:${port}`;
        proxies.push(proxyUrl);
      }

      return proxies;
    } catch (error) {
      console.error("[LuminatiProvider] Failed to get proxies:", error);
      throw error;
    }
  }
}

/**
 * Oxylabs 代理提供商
 * API 文档: https://developers.oxylabs.io/
 */
export class OxylabsProvider extends ProxyProvider {
  private readonly apiUrl = "https://api.oxylabs.io";

  async getProxies(count: number): Promise<string[]> {
    try {
      // Oxylabs 使用 username:password@pr.oxylabs.io:port 格式
      // 需要从 API 获取可用的代理
      const response = await axios.get(`${this.apiUrl}/v1/proxy_list`, {
        auth: {
          username: this.apiKey,
          password: this.apiSecret || "",
        },
      });

      const proxyList = response.data.data || [];
      if (proxyList.length === 0) {
        throw new Error("No proxies available in Oxylabs");
      }

      const proxies: string[] = [];

      for (let i = 0; i < Math.min(count, proxyList.length); i++) {
        const proxy = proxyList[i];
        const proxyUrl = `http://${this.apiKey}:${this.apiSecret}@pr.oxylabs.io:7777`;
        proxies.push(proxyUrl);
      }

      return proxies;
    } catch (error) {
      console.error("[OxylabsProvider] Failed to get proxies:", error);
      throw error;
    }
  }
}

/**
 * SmartProxy 代理提供商
 * API 文档: https://smartproxy.com/docs
 */
export class SmartProxyProvider extends ProxyProvider {
  private readonly apiUrl = "https://api.smartproxy.com";

  async getProxies(count: number): Promise<string[]> {
    try {
      // SmartProxy 使用 username:password@gate.smartproxy.com:port 格式
      // 需要从 API 获取可用的代理
      const response = await axios.get(`${this.apiUrl}/v1/proxies`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const proxyList = response.data.data || [];
      if (proxyList.length === 0) {
        throw new Error("No proxies available in SmartProxy");
      }

      const proxies: string[] = [];

      for (let i = 0; i < Math.min(count, proxyList.length); i++) {
        // SmartProxy 支持多个端口
        const port = 7000 + i;
        const proxyUrl = `http://${this.apiKey}:${this.apiSecret}@gate.smartproxy.com:${port}`;
        proxies.push(proxyUrl);
      }

      return proxies;
    } catch (error) {
      console.error("[SmartProxyProvider] Failed to get proxies:", error);
      throw error;
    }
  }
}

/**
 * 自定义代理提供商
 */
export class CustomProxyProvider extends ProxyProvider {
  private proxyList: string[];

  constructor(proxyList: string[]) {
    super("");
    this.proxyList = proxyList;
  }

  async getProxies(count: number): Promise<string[]> {
    return this.proxyList.slice(0, count);
  }
}

/**
 * 代理提供商工厂
 */
export class ProxyProviderFactory {
  static createProvider(
    provider: "luminati" | "oxylabs" | "smartproxy" | "custom",
    apiKey: string,
    apiSecret?: string,
    customProxyList?: string[]
  ): ProxyProvider {
    switch (provider) {
      case "luminati":
        return new LuminatiProvider(apiKey, apiSecret);
      case "oxylabs":
        return new OxylabsProvider(apiKey, apiSecret);
      case "smartproxy":
        return new SmartProxyProvider(apiKey, apiSecret);
      case "custom":
        return new CustomProxyProvider(customProxyList || []);
      default:
        throw new Error(`Unknown proxy provider: ${provider}`);
    }
  }
}
