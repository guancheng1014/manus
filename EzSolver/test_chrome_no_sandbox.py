import asyncio
import nodriver as uc
import os

async def main():
    print("🚀 测试 Chrome 启动 (no-sandbox)...")
    try:
        browser = await uc.start(
            browser_executable_path="/usr/bin/google-chrome",
            headless=True,
            sandbox=False,
            browser_args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        print("✅ 浏览器启动成功!")
        page = await browser.get("https://google.com")
        print(f"✅ 页面加载成功: {page.url}")
        await browser.stop()
    except Exception as e:
        print(f"❌ 浏览器启动失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())
