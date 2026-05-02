import asyncio
from pyppeteer import launch

async def main():
    print("Launching browser...")
    browser = await launch({
        'executablePath': '/usr/bin/google-chrome',
        'headless': True,
        'args': ['--no-sandbox', '--disable-setuid-sandbox']
    })
    print("Browser launched.")
    page = await browser.newPage()
    print("Opening page...")
    await page.goto('https://www.google.com')
    print("Page title:", await page.title())
    await browser.close()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
