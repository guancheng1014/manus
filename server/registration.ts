/**
 * 改进版 Manus.im 自动注册核心逻辑类
 * 基于 registration.ts 的增强版本，包含错误处理、重试机制等
 */

import axios from "axios";
import crypto from "crypto";

type LogLevel = 'info' | 'warn' | 'error';

export class ManusRegister {
  private readonly API_BASE = "https://api.manus.im";
  private readonly AUTH_SERVICE = "user.v1.UserAuthPublicService";
  private readonly USER_SERVICE = "user.v1.UserService";
  private readonly TEAM_SERVICE = "team.v1.TeamService";
  private readonly PUBLIC_SERVICE = "user.v1.UserPublicService";
  private readonly YESCAPTCHA_URL = "https://api.yescaptcha.com";
  private readonly EZSOLVER_URL = process.env.EZSOLVER_URL || "http://localhost:8191";
  private readonly WORLDPOOL_URL = "http://localhost:8080";
  private readonly TURNSTILE_SITEKEY = "0x4AAAAAAA_sd0eRNCinWBgU";
  private readonly TURNSTILE_PAGE = "https://manus.im/login";

  private yesCaptchaKey: string;
  private email: string;
  private password: string;
  private emailApiUrl: string;
  private regionCode: string;
  private phone: string;
  private smsApiUrl: string;
  private inviteCode: string;
  private utmSource: string;
  private utmMedium: string;
  private utmCampaign: string;
  private clientId: string;
  private proxyApiUrl: string;
  private proxyUrl: string = "";

  private jwtToken: string = "";
  private logs: string[] = [];

  private ua: string = "";
  private secChUa: string = "";
  private secChUaPlatform: string = "";
  private chromeVersion: string = "";

  // 重试配置
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000;
  private readonly MAX_WAIT_TIME = 5 * 60 * 1000; // 5 分钟

  constructor(cfg: any) {
    this.yesCaptchaKey = cfg.yesCaptchaKey || "";
    this.email = cfg.email || "";
    this.password = cfg.password || "Manus@Test2026!";
    this.emailApiUrl = cfg.emailApiUrl || "";
    this.regionCode = cfg.regionCode || "+1";
    
    // 处理手机号，去除重复的国家码
    let rawPhone = cfg.phone || "";
    if (rawPhone && rawPhone.startsWith(this.regionCode)) {
      rawPhone = rawPhone.substring(this.regionCode.length);
    } else if (rawPhone && rawPhone.startsWith("+1")) {
      rawPhone = rawPhone.substring(2);
    }
    this.phone = rawPhone;
    
    this.smsApiUrl = cfg.smsApiUrl || "";
    this.inviteCode = cfg.inviteCode || "";
    this.utmSource = cfg.utmSource || "invitation";
    this.utmMedium = cfg.utmMedium || "social";
    this.utmCampaign = cfg.utmCampaign || "copy_link";
    this.clientId = this.uuid4();
    this.proxyApiUrl = cfg.proxyApiUrl || "";

    this.generateFingerprint();
    this.validateInputs();
  }

  /**
   * 验证输入参数
   */
  private validateInputs(): void {
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      throw new Error("Invalid email format");
    }

    if (!this.emailApiUrl || !/^https?:\/\//.test(this.emailApiUrl)) {
      throw new Error("Invalid email API URL");
    }

    // 移除强制要求，因为我们现在有本地 EzSolver 替代方案
    // if (!this.yesCaptchaKey) {
    //   throw new Error("YesCaptcha key is required");
    // }

    if (this.phone && !/^\d+$/.test(this.phone)) {
      throw new Error("Invalid phone number format");
    }

    if (this.smsApiUrl && !/^https?:\/\//.test(this.smsApiUrl)) {
      throw new Error("Invalid SMS API URL");
    }

    this.log("✅ 输入参数验证成功", 'info');
  }

  /**
   * 改进的日志方法，支持日志级别
   */
  private log(message: string, level: LogLevel = 'info'): void {
    const timestamp = new Date().toISOString();
    const levelEmoji = { info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${levelEmoji} ${message}`;
    this.logs.push(logEntry);
    
    if (level === 'error') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  /**
   * 错误分类
   */
  private classifyError(error: any): {
    type: 'network' | 'validation' | 'api' | 'timeout' | 'unknown';
    recoverable: boolean;
    message: string;
  } {
    const message = error.message || String(error);

    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return { type: 'timeout', recoverable: true, message };
    }

    if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
      return { type: 'network', recoverable: true, message };
    }

    if (message.includes('已注册') || message.includes('invalid')) {
      return { type: 'validation', recoverable: false, message };
    }

    if (message.includes('code') && message.includes('!== 0')) {
      return { type: 'api', recoverable: false, message };
    }

    return { type: 'unknown', recoverable: false, message };
  }

  /**
   * 带指数退避的重试机制
   */
  private async retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const errorClassification = this.classifyError(error);

        if (!errorClassification.recoverable) {
          this.log(`${operationName} 失败（不可恢复）: ${errorClassification.message}`, 'error');
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          this.log(
            `${operationName} 失败，${delay}ms 后重试 (${attempt + 1}/${maxRetries - 1}): ${errorClassification.message}`,
            'warn'
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.log(`${operationName} 在 ${maxRetries} 次尝试后仍然失败`, 'error');
    throw lastError;
  }

  private generateFingerprint(): void {
    const majorVersions = [128, 129, 130, 131, 132, 133, 134, 135, 136];
    const major = majorVersions[Math.floor(Math.random() * majorVersions.length)];
    const build = Math.floor(Math.random() * 300) + 6500;
    const patch = Math.floor(Math.random() * 170) + 30;
    this.chromeVersion = `${major}.0.${build}.${patch}`;

    const osList = [
      { ua: "Windows NT 10.0; Win64; x64", platform: '"Windows"' },
      { ua: "Windows NT 11.0; Win64; x64", platform: '"Windows"' },
      { ua: "Macintosh; Intel Mac OS X 10_15_7", platform: '"macOS"' },
      { ua: "Macintosh; Intel Mac OS X 14_0", platform: '"macOS"' },
      { ua: "X11; Linux x86_64", platform: '"Linux"' },
    ];
    const os = osList[Math.floor(Math.random() * osList.length)];

    this.ua = `Mozilla/5.0 (${os.ua}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${this.chromeVersion} Safari/537.36`;

    const notABrands = [
      '"Not_A Brand";v="8"',
      '"Not/A)Brand";v="8"',
      '"Not A(Brand";v="99"',
      '"Not)A;Brand";v="99"',
      '"Not;A=Brand";v="8"',
    ];
    const notA = notABrands[Math.floor(Math.random() * notABrands.length)];
    this.secChUa = `"Chromium";v="${major}", "Google Chrome";v="${major}", ${notA}`;
    this.secChUaPlatform = os.platform;

    this.log(`[Fingerprint] Chrome/${this.chromeVersion} | Platform=${this.secChUaPlatform}`, 'info');
  }

  /**
   * 改进的代理获取方法 - 现在是异步的
   */
  public async fetchProxy(): Promise<void> {
    // 优先尝试本地 Worldpool
    try {
      this.log("[Proxy] 尝试从本地 Worldpool 获取代理...", 'info');
      const wpResponse = await axios.get(`${this.WORLDPOOL_URL}/proxies/random?protocol=http&google_pass=true`, { timeout: 5000 });
      if (wpResponse.data && wpResponse.data.host) {
        const p = wpResponse.data;
        this.proxyUrl = `http://${p.host}:${p.port}`;
        this.log(`[Proxy] 从 Worldpool 获取到代理: ${p.host}:${p.port} (${p.country_code || 'unknown'})`, 'info');
        return;
      }
    } catch (e: any) {
      this.log(`[Proxy] 本地 Worldpool 获取失败: ${e.message}`, 'warn');
    }

    if (!this.proxyApiUrl) return;

    try {
      const response = await axios.get(this.proxyApiUrl, { timeout: 10000 });
      const line = (response.data || "").trim();
      const parts = line.split(":");

      if (parts.length === 4) {
        this.proxyUrl = `http://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
      } else if (parts.length === 2) {
        this.proxyUrl = `http://${parts[0]}:${parts[1]}`;
      } else {
        this.proxyUrl = line;
      }
      
      // 验证代理
      await this.validateProxy();
      this.log(`[Proxy] 代理已设置: ${parts[0]}:${parts[1]}`, 'info');
    } catch (error) {
      this.log(`[Proxy] 获取代理失败: ${error}`, 'warn');
      // 继续流程，不抛出异常
    }
  }

  /**
   * 验证代理有效性
   */
  private async validateProxy(): Promise<boolean> {
    if (!this.proxyUrl) return true;

    try {
      await axios.get('https://httpbin.org/ip', {
        httpAgent: this.proxyUrl,
        httpsAgent: this.proxyUrl,
        timeout: 5000,
      });
      
      this.log(`[Proxy] 代理验证成功`, 'info');
      return true;
    } catch (error) {
      this.log(`[Proxy] 代理验证失败: ${error}`, 'warn');
      this.proxyUrl = ""; // 清除无效代理
      return false;
    }
  }

  private generateDcr(withFgRequestId: boolean = false): string {
    const screens = [
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1366, height: 768 },
      { width: 3840, height: 2160 },
    ];
    const screen = screens[Math.floor(Math.random() * screens.length)];

    const vpWidth = screen.width - Math.floor(Math.random() * 200);
    const vpHeight = screen.height - (Math.floor(Math.random() * 140) + 60);

    const langSets = [
      ["en-US", "en"],
      ["en-US", "en", "zh-CN"],
      ["en-US"],
      ["en-US", "en", "fr"],
    ];
    const languages = langSets[Math.floor(Math.random() * langSets.length)];

    const data = {
      ua: this.ua,
      locale: "en",
      languages,
      timezone: "America/New_York",
      fgRequestId: withFgRequestId ? this.uuid4() : "",
      clientId: this.clientId,
      screen,
      viewport: { width: vpWidth, height: vpHeight },
      timestamp: Date.now(),
      timezoneOffset: 300,
    };

    const json = JSON.stringify(data);
    const base64 = Buffer.from(json).toString("base64");

    let result = "";
    for (let i = 0; i < base64.length; i++) {
      const c = base64.charCodeAt(i);
      if (c >= 65 && c <= 90) {
        result += String.fromCharCode(((c - 65 + 3) % 26) + 65);
      } else if (c >= 97 && c <= 122) {
        result += String.fromCharCode(((c - 97 + 3) % 26) + 97);
      } else if (c >= 48 && c <= 57) {
        result += String.fromCharCode(((c - 48 + 3) % 10) + 48);
      } else {
        result += base64[i];
      }
    }

    return result;
  }

  private uuid4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getAxiosConfig() {
    return {
      headers: {
        "User-Agent": this.ua,
        "sec-ch-ua": this.secChUa,
        "sec-ch-ua-platform": this.secChUaPlatform,
        "x-client-dcr": this.generateDcr(true),
      },
      ...(this.proxyUrl && { httpAgent: this.proxyUrl, httpsAgent: this.proxyUrl }),
    };
  }

  async solveTurnstile(): Promise<string> {
    return this.retryWithExponentialBackoff(async () => {
      // 优先尝试本地 EzSolver
      try {
        this.log("[Turnstile] 尝试使用本地 EzSolver 解决验证码...", 'info');
        const ezResponse = await axios.post(
          `${this.EZSOLVER_URL}/solve`,
          {
            sitekey: this.TURNSTILE_SITEKEY,
            siteurl: this.TURNSTILE_PAGE,
            timeout: 60
          },
          { timeout: 70000 }
        );
        if (ezResponse.data.token) {
          this.log("[Turnstile] 本地 EzSolver 解决成功", 'info');
          return ezResponse.data.token;
        }
      } catch (e: any) {
        this.log(`[Turnstile] 本地 EzSolver 失败: ${e.message}, 切换至 YesCaptcha`, 'warn');
      }

      // 备选方案: YesCaptcha
      if (!this.yesCaptchaKey) {
        throw new Error("Local EzSolver failed and no YesCaptcha key provided");
      }

      const response = await axios.post(
        `${this.YESCAPTCHA_URL}/api/createTask`,
        {
          clientKey: this.yesCaptchaKey,
          task: {
            type: "TurnstileTaskProxyless",
            websiteURL: this.TURNSTILE_PAGE,
            websiteKey: this.TURNSTILE_SITEKEY,
          },
        },
        { timeout: 30000 }
      );

      if (!response.data.taskId) {
        throw new Error("Failed to create captcha task");
      }

      const taskId = response.data.taskId;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const resultResponse = await axios.post(
          `${this.YESCAPTCHA_URL}/api/getTaskResult`,
          {
            clientKey: this.yesCaptchaKey,
            taskId,
          },
          { timeout: 10000 }
        );

        if (resultResponse.data.status === "ready") {
          return resultResponse.data.solution.token;
        }

        attempts++;
      }

      throw new Error("Captcha solving timeout");
    }, "[Turnstile] 解决验证码");
  }

  async getUserPlatforms(cfToken: string): Promise<[string[], string]> {
    return this.retryWithExponentialBackoff(async () => {
      const response = await axios.post(
        `${this.API_BASE}/rpc`,
        {
          service: this.PUBLIC_SERVICE,
          method: "GetUserPlatforms",
          req: {
            email: this.email,
            cfToken,
          },
        },
        this.getAxiosConfig()
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || "Failed to get user platforms");
      }

      const platforms = response.data.data?.platforms || [];
      const tempToken = response.data.data?.tempToken || "";

      return [platforms, tempToken];
    }, "[Email] 检查邮箱");
  }

  async sendEmailVerifyCode(tempToken: string, cfToken: string): Promise<void> {
    return this.retryWithExponentialBackoff(async () => {
      const response = await axios.post(
        `${this.API_BASE}/rpc`,
        {
          service: this.AUTH_SERVICE,
          method: "SendEmailVerifyCodeWithCaptcha",
          req: {
            email: this.email,
            tempToken,
            cfToken,
          },
        },
        this.getAxiosConfig()
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || "Failed to send verification code");
      }
    }, "[Email] 发送验证码");
  }

  /**
   * 改进的邮箱验证码提取 - 支持多种格式
   */
  async fetchEmailCode(): Promise<string> {
    return this.retryWithExponentialBackoff(async () => {
      let attempts = 0;
      const maxAttempts = 60;
      const startTime = Date.now();

      while (attempts < maxAttempts) {
        if (Date.now() - startTime > this.MAX_WAIT_TIME) {
          throw new Error(`Email code fetch timeout after ${this.MAX_WAIT_TIME / 1000} seconds`);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          const response = await axios.get(this.emailApiUrl, { timeout: 10000 });
          const html = response.data;

          // 支持多种验证码格式
          const patterns = [
            /verification[_\s]*code[:\s]*(\d{6})/i,
            /code[:\s]*(\d{6})/i,
            /(\d{6})/,
            /verification[_\s]*code[:\s]*([A-Z0-9]{6})/i,
          ];

          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              const code = match[1];
              this.log(`[Email] 验证码已提取: ${code}`, 'info');
              return code;
            }
          }
        } catch (error) {
          this.log(`[Email] API 调用失败 (尝试 ${attempts + 1}/${maxAttempts}): ${error}`, 'warn');
        }

        attempts++;
      }

      throw new Error("Failed to fetch email code after 60 attempts");
    }, "[Email] 获取验证码", 1);
  }

  async registerByEmail(verifyCode: string): Promise<string> {
    return this.retryWithExponentialBackoff(async () => {
      const refer = this.inviteCode
        ? `https://manus.im/invitation/${this.inviteCode}?utm_source=${this.utmSource}&utm_medium=${this.utmMedium}&utm_campaign=${this.utmCampaign}`
        : "";

      const response = await axios.post(
        `${this.API_BASE}/rpc`,
        {
          service: this.AUTH_SERVICE,
          method: "RegisterByEmail",
          req: {
            email: this.email,
            password: this.password,
            verifyCode,
            authCommandCmd: {
              firstFromPlatform: "web",
              utmSource: this.utmSource,
              utmMedium: this.utmMedium,
              utmCampaign: this.utmCampaign,
              refer,
              locale: "en",
              tz: "America/New_York",
              tzOffset: 300,
              firstEntry: refer || "https://manus.im",
            },
          },
        },
        this.getAxiosConfig()
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || "Registration failed");
      }

      const token = response.data.data?.token || "";
      this.jwtToken = token;

      return token;
    }, "[Register] 提交注册");
  }

  /**
   * 改进的短信验证码提取 - 支持多种格式
   */
  private async fetchSMSCode(): Promise<string> {
    let attempts = 0;
    let smsCode = "";
    const startTime = Date.now();

    while (attempts < 60) {
      if (Date.now() - startTime > this.MAX_WAIT_TIME) {
        throw new Error(`SMS code fetch timeout after ${this.MAX_WAIT_TIME / 1000} seconds`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const smsResponse = await axios.get(this.smsApiUrl, { timeout: 10000 });
        
        // 支持多种验证码格式
        const patterns = [
          /verification[_\s]*code[:\s]*(\d{6})/i,
          /code[:\s]*(\d{6})/i,
          /(\d{6})/,
        ];

        for (const pattern of patterns) {
          const match = smsResponse.data.match(pattern);
          if (match && match[1]) {
            smsCode = match[1];
            this.log(`[SMS] 验证码已提取: ${smsCode}`, 'info');
            return smsCode;
          }
        }
      } catch (error) {
        this.log(`[SMS] API 调用失败 (尝试 ${attempts + 1}/60): ${error}`, 'warn');
      }

      attempts++;
    }

    throw new Error("Failed to fetch SMS code after 60 attempts");
  }

  async bindPhoneNumber(): Promise<void> {
    if (!this.phone || !this.smsApiUrl) return;

    try {
      // 发送短信验证码
      await this.retryWithExponentialBackoff(async () => {
        const response = await axios.post(
          `${this.API_BASE}/rpc`,
          {
            service: this.USER_SERVICE,
            method: "SendPhoneVerifyCode",
            req: {
              phone: `${this.regionCode}${this.phone}`,
            },
          },
          {
            ...this.getAxiosConfig(),
            headers: {
              ...this.getAxiosConfig().headers,
              Authorization: `Bearer ${this.jwtToken}`,
            },
          }
        );

        if (response.data.code !== 0) {
          throw new Error(response.data.msg || "Failed to send phone code");
        }
      }, "[Phone] 发送验证码");

      // 获取短信验证码
      const smsCode = await this.fetchSMSCode();

      // 绑定手机号
      await this.retryWithExponentialBackoff(async () => {
        await axios.post(
          `${this.API_BASE}/rpc`,
          {
            service: this.USER_SERVICE,
            method: "BindPhoneNumber",
            req: {
              phone: `${this.regionCode}${this.phone}`,
              verifyCode: smsCode,
            },
          },
          {
            ...this.getAxiosConfig(),
            headers: {
              ...this.getAxiosConfig().headers,
              Authorization: `Bearer ${this.jwtToken}`,
            },
          }
        );
      }, "[Phone] 绑定手机号");

      this.log("[Phone] 手机号绑定成功", 'info');
    } catch (error: any) {
      this.log(`[Phone] 手机号绑定错误: ${error.message}`, 'warn');
      // 不抛出异常，继续流程
    }
  }

  async run(): Promise<any> {
    try {
      this.log("[Start] 开始注册流程...", 'info');

      // 获取代理
      if (this.proxyApiUrl) {
        this.log("[Proxy] 获取代理...", 'info');
        await this.fetchProxy();
      }

      // Step 1: Turnstile
      this.log("[Turnstile] 创建 YesCaptcha 任务...", 'info');
      const cfToken = await this.solveTurnstile();
      this.log(`[Turnstile] 已解决, token长度=${cfToken.length}`, 'info');

      // Step 2: 检查邮箱
      this.log(`[Email] 检查邮箱 ${this.email} ...`, 'info');
      const [platforms, tempToken] = await this.getUserPlatforms(cfToken);
      if (platforms.length > 0) {
        throw new Error(`邮箱已注册, 平台: ${platforms.join(",")}`);
      }
      this.log(`[Email] 邮箱可用, tempToken=${tempToken.substring(0, 30)}...`, 'info');

      // Step 3: 发送邮箱验证码
      this.log("[Turnstile] 重新获取 Turnstile token (发送验证码用)...", 'info');
      const cfToken2 = await this.solveTurnstile();
      this.log(`[Turnstile] 已解决, token长度=${cfToken2.length}`, 'info');

      this.log("[Email] 发送验证码...", 'info');
      await this.sendEmailVerifyCode(tempToken, cfToken2);
      this.log("[Email] 验证码已发送", 'info');

      // Step 4: 获取邮箱验证码
      this.log("[Email] 等待邮箱验证码...", 'info');
      const verifyCode = await this.fetchEmailCode();
      this.log(`[Email] 验证码: ${verifyCode}`, 'info');

      // Step 5: 注册
      this.log("[Register] 提交注册...", 'info');
      const token = await this.registerByEmail(verifyCode);
      this.log(`[Register] 注册成功! Token=${token.substring(0, 40)}...`, 'info');

      // Step 6: 绑定手机号
      if (this.phone) {
        this.log("[Phone] 绑定手机号...", 'info');
        await this.bindPhoneNumber();
      }

      this.log("[Complete] 注册流程完成！", 'info');

      return {
        ok: true,
        email: this.email,
        token,
        logs: this.logs,
      };
    } catch (error: any) {
      const errorClassification = this.classifyError(error);
      this.log(`[Error] ${error.message} (类型: ${errorClassification.type})`, 'error');
      
      return {
        ok: false,
        error: error.message,
        errorType: errorClassification.type,
        recoverable: errorClassification.recoverable,
        logs: this.logs,
      };
    }
  }

  getLogs(): string[] {
    return this.logs;
  }
}
