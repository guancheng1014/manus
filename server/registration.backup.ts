import axios from "axios";
import crypto from "crypto";

/**
 * Manus.im 自动注册核心逻辑类
 * 移植自 PHP v3.6 版本
 */
export class ManusRegister {
  private readonly API_BASE = "https://api.manus.im";
  private readonly AUTH_SERVICE = "user.v1.UserAuthPublicService";
  private readonly USER_SERVICE = "user.v1.UserService";
  private readonly TEAM_SERVICE = "team.v1.TeamService";
  private readonly PUBLIC_SERVICE = "user.v1.UserPublicService";
  private readonly YESCAPTCHA_URL = "https://api.yescaptcha.com";
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

    if (this.proxyApiUrl) {
      this.fetchProxy();
    }
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

    this.log(`[Fingerprint] Chrome/${this.chromeVersion} | Platform=${this.secChUaPlatform}`);
  }

  private fetchProxy(): void {
    try {
      axios.get(this.proxyApiUrl, { timeout: 10000 }).then((response) => {
        const line = (response.data || "").trim();
        const parts = line.split(":");

        if (parts.length === 4) {
          this.proxyUrl = `http://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
        } else if (parts.length === 2) {
          this.proxyUrl = `http://${parts[0]}:${parts[1]}`;
        } else {
          this.proxyUrl = line;
        }
        this.log(`[Proxy] 代理已设置: ${parts[0]}:${parts[1]}`);
      }).catch((error) => {
        this.log(`[Proxy] 获取代理失败: ${error}`);
      });
    } catch (error) {
      this.log(`[Proxy] 获取代理失败: ${error}`);
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

  private log(message: string): void {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
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
    try {
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
    } catch (error) {
      this.log(`[Turnstile] 错误: ${error}`);
      throw error;
    }
  }

  async getUserPlatforms(cfToken: string): Promise<[string[], string]> {
    try {
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
    } catch (error) {
      this.log(`[Email] 检查邮箱错误: ${error}`);
      throw error;
    }
  }

  async sendEmailVerifyCode(tempToken: string, cfToken: string): Promise<void> {
    try {
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
    } catch (error) {
      this.log(`[Email] 发送验证码错误: ${error}`);
      throw error;
    }
  }

  async fetchEmailCode(): Promise<string> {
    try {
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await axios.get(this.emailApiUrl, { timeout: 10000 });
        const html = response.data;

        // 简单的正则提取验证码（假设格式为 6 位数字）
        const match = html.match(/(\d{6})/);
        if (match) {
          return match[1];
        }

        attempts++;
      }

      throw new Error("Failed to fetch email code");
    } catch (error) {
      this.log(`[Email] 获取验证码错误: ${error}`);
      throw error;
    }
  }

  async registerByEmail(verifyCode: string): Promise<string> {
    try {
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
    } catch (error) {
      this.log(`[Register] 注册错误: ${error}`);
      throw error;
    }
  }

  async bindPhoneNumber(): Promise<void> {
    if (!this.phone || !this.smsApiUrl) return;

    try {
      // 发送短信验证码
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

      // 获取短信验证码
      let attempts = 0;
      let smsCode = "";

      while (attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const smsResponse = await axios.get(this.smsApiUrl, { timeout: 10000 });
        const match = smsResponse.data.match(/(\d{6})/);
        if (match) {
          smsCode = match[1];
          break;
        }

        attempts++;
      }

      if (!smsCode) {
        throw new Error("Failed to fetch SMS code");
      }

      // 绑定手机号
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

      this.log("[Phone] 手机号绑定成功");
    } catch (error) {
      this.log(`[Phone] 手机号绑定错误: ${error}`);
      // 不抛出异常，继续流程
    }
  }

  async run(): Promise<any> {
    try {
      this.log("[Start] 开始注册流程...");

      // Step 1: Turnstile
      this.log("[Turnstile] 创建 YesCaptcha 任务...");
      const cfToken = await this.solveTurnstile();
      this.log(`[Turnstile] 已解决, token长度=${cfToken.length}`);

      // Step 2: 检查邮箱
      this.log(`[Email] 检查邮箱 ${this.email} ...`);
      const [platforms, tempToken] = await this.getUserPlatforms(cfToken);
      if (platforms.length > 0) {
        throw new Error(`邮箱已注册, 平台: ${platforms.join(",")}`);
      }
      this.log(`[Email] 邮箱可用, tempToken=${tempToken.substring(0, 30)}...`);

      // Step 3: 发送邮箱验证码
      this.log("[Turnstile] 重新获取 Turnstile token (发送验证码用)...");
      const cfToken2 = await this.solveTurnstile();
      this.log(`[Turnstile] 已解决, token长度=${cfToken2.length}`);

      this.log("[Email] 发送验证码...");
      await this.sendEmailVerifyCode(tempToken, cfToken2);
      this.log("[Email] 验证码已发送");

      // Step 4: 获取邮箱验证码
      this.log("[Email] 等待邮箱验证码...");
      const verifyCode = await this.fetchEmailCode();
      this.log(`[Email] 验证码: ${verifyCode}`);

      // Step 5: 注册
      this.log("[Register] 提交注册...");
      const token = await this.registerByEmail(verifyCode);
      this.log(`[Register] 注册成功! Token=${token.substring(0, 40)}...`);

      // Step 6: 绑定手机号
      if (this.phone) {
        this.log("[Phone] 绑定手机号...");
        await this.bindPhoneNumber();
      }

      return {
        ok: true,
        email: this.email,
        token,
        logs: this.logs,
      };
    } catch (error: any) {
      this.log(`[Error] ${error.message}`);
      return {
        ok: false,
        error: error.message,
        logs: this.logs,
      };
    }
  }
}
