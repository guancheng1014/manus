import asyncio
import sys
import time
import os
from pyppeteer import launch

async def _solve(sitekey: str, siteurl: str, timeout: int) -> str:
    print(f"DEBUG: Starting solver for {sitekey} on {siteurl}", file=sys.stderr)
    
    # 尝试多种 UA
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    
    browser = await launch({
        'executablePath': '/usr/bin/google-chrome',
        'headless': True,
        'args': [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            f'--user-agent={ua}'
        ]
    })
    
    try:
        page = await browser.newPage()
        await page.setViewport({'width': 1280, 'height': 800})
        
        # 绕过自动化检测
        await page.evaluateOnNewDocument("""
            () => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
            }
        """)
        
        print(f"DEBUG: Navigating to {siteurl}", file=sys.stderr)
        await page.goto(siteurl, {'waitUntil': 'networkidle2', 'timeout': 60000})
        
        # 寻找现有的 Turnstile 容器
        print("DEBUG: Searching for existing turnstile...", file=sys.stderr)
        
        # 注入辅助脚本
        inject_script = f"""
        () => {{
            window._tsToken = null;
            
            // 拦截现有回调
            const findAndIntercept = () => {{
                const iframes = document.querySelectorAll('iframe[src*="challenges.cloudflare.com"]');
                if (iframes.length > 0) {{
                    console.log('Found turnstile iframe');
                }}
            }};
            
            // 暴力注入新容器作为备选
            if (!document.getElementById('_ts_box')) {{
                const wrap = document.createElement('div');
                wrap.id = '_ts_box';
                wrap.style.position = 'fixed';
                wrap.style.top = '20px';
                wrap.style.left = '20px';
                wrap.style.zIndex = '9999';
                document.body.appendChild(wrap);
                
                window._tsLoad = function() {{
                    if (typeof turnstile !== 'undefined') {{
                        turnstile.render('#_ts_box', {{
                            sitekey: '{sitekey}',
                            callback: function(token) {{ window._tsToken = token; }}
                        }});
                    }}
                }};
                
                const s = document.createElement('script');
                s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=_tsLoad&render=explicit';
                s.async = true;
                document.head.appendChild(s);
            }}
            
            findAndIntercept();
        }}
        """
        await page.evaluate(inject_script)

        print("DEBUG: Polling for token...", file=sys.stderr)
        start_time = time.time()
        while time.time() - start_time < timeout:
            token = await page.evaluate("() => window._tsToken")
            if token:
                print("DEBUG: Token found!", file=sys.stderr)
                return token
            
            # 检查是否有自动完成的 token (有些页面会自动加载 turnstile)
            auto_token = await page.evaluate("""
                () => {
                    try {
                        return turnstile.getResponse();
                    } catch(e) {
                        return null;
                    }
                }
            """)
            if auto_token:
                print("DEBUG: Auto-token found!", file=sys.stderr)
                return auto_token
                
            await asyncio.sleep(2)
            
        raise TimeoutError("Failed to get Turnstile token within timeout")
        
    finally:
        await browser.close()
        print("DEBUG: Browser closed", file=sys.stderr)

def solve(sitekey: str, siteurl: str, timeout: int = 60) -> str:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_solve(sitekey, siteurl, timeout))
    finally:
        loop.close()

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        try:
            res = solve(sys.argv[1], sys.argv[2])
            print(res)
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)
