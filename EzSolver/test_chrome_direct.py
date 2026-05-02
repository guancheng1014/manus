import asyncio
import nodriver as uc
import os

async def test():
    print("🚀 正在测试 Chrome 直接启动...")
    try:
        # 尝试使用 nodriver 的内部启动逻辑，但显式传递 no_sandbox
        browser = await uc.start(
            browser_executable_path="/usr/bin/google-chrome",
            headless=True,
            no_sandbox=True,
            browser_args=["--disable-dev-shm-usage"]
        )
        print("✅ 浏览器启动成功!")
        page = await browser.get("https://google.com")
        print(f"✅ 页面加载成功: {page.url}")
        await browser.stop()
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
