import asyncio
import nodriver as uc
import os

async def test():
    print("🚀 测试 Chrome v18 启动逻辑...")
    # 强制设置环境变量
    os.environ["CHROME_PATH"] = "/usr/bin/google-chrome"
    
    try:
        # 使用最基本的启动参数
        browser = await uc.start(
            browser_executable_path="/usr/bin/google-chrome",
            headless=True,
            no_sandbox=True,
            browser_args=["--disable-dev-shm-usage", "--disable-gpu", "--disable-software-rasterizer"]
        )
        print("✅ 浏览器启动成功!")
        await browser.stop()
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == "__main__":
    asyncio.run(test())
