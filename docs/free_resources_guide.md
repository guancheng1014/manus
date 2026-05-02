# 免费获取打码 Key 与海外代理的开源方案指南

针对自动化注册中高成本的 **YesCaptcha Key** 和 **海外代理**，以下是基于 Github 开源项目的免费替代方案。

---

## 1. 打码服务 (Turnstile) 免费替代方案

Manus.im 使用的是 Cloudflare Turnstile 验证。与其支付打码费用，不如使用基于“浏览器模拟”的本地开源求解器。

### 推荐项目：EzSolver
- **Github**: [ismoiloffS/EzSolver](https://github.com/ismoiloffS/EzSolver)
- **原理**: 使用 `nodriver`（高性能浏览器自动化库）启动真实的 Chrome 浏览器，通过模拟真实的鼠标轨迹和人类行为来“骗过” Cloudflare。
- **优点**: 
  - **完全免费**: 无需任何第三方 API。
  - **本地运行**: 响应速度快，不消耗额度。
  - **API 支持**: 提供简单的 HTTP 接口，可直接替换您代码中的 YesCaptcha 调用。

### 替代方案：FlareSolverr
- **Github**: [FlareSolverr/FlareSolverr](https://github.com/FlareSolverr/FlareSolverr)
- **原理**: 作为一个代理服务器，自动处理 Cloudflare 的挑战（Challenge）并返回带有有效 Cookie 的页面。

---

## 2. 海外代理 (Proxy) 免费获取方案

免费代理通常生存期短，因此需要一个“动态采集+实时校验”的代理池。

### 推荐项目：Worldpool
- **Github**: [CelestialBrain/worldpool](https://github.com/CelestialBrain/worldpool)
- **特点**: 
  - **全球覆盖**: 从 120+ 个源采集 IP。
  - **高频更新**: 每 20 分钟自动更新一次。
  - **精准校验**: 自动检测 IP 是否能访问 Google、TikTok 等特定站点。
- **用法**: 部署后通过 `GET /proxies/random?protocol=socks5&google_pass=true` 即可获取一个高质量的海外代理。

### 备用项目：Free-Proxy-List
- **Github**: [proxifly/free-proxy-list](https://github.com/proxifly/free-proxy-list)
- **特点**: 提供原始的 txt/json 列表，更新频率极高（5分钟一次）。

---

## 3. “白嫖”策略与建议

### 3.1 商业平台的试用计划
很多打码和代理平台提供免费额度，可以通过脚本自动化“续期”：
- **Bright Data / Oxylabs**: 通常提供 $5-$10 的新用户试用金。
- **Capsolver / 2Captcha**: 偶尔有开发者奖励计划，提交开源项目集成可获得免费额度。

### 3.2 搭建建议
1. **部署本地 Solver**: 在您的服务器上启动 `EzSolver` 服务。
2. **集成代理池**: 运行 `Worldpool` 并将其 API 地址填入您的 `proxyApiUrl`。
3. **代码适配**: 修改您的 `ManusRegister` 类，将原本发送给 YesCaptcha 的请求重定向到您本地的 `EzSolver` 地址。

> **注意**: 免费资源的成功率通常低于付费资源（约 60%-80%），建议在脚本中增加更多的重试逻辑。
