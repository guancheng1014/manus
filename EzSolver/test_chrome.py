import nodriver as uc
import asyncio
import os

async def main():
    print("🚀 正在测试 Chrome 启动 (nodriver)...")
    try:
        browser = await uc.start(
            browser_args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            headless=True  # 尝试先用无头模式测试
        )
        print("✅ 浏览器启动成功!")
        page = await browser.get("https://www.google.com")
        print(f"✅ 页面加载成功: {page.title}")
        await browser.stop()
    except Exception as e:
        print(f"❌ 浏览器启动失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())
