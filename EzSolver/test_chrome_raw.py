import asyncio
import subprocess
import os

def test_chrome():
    print("🚀 测试 Chrome 命令行启动...")
    cmd = [
        "/usr/bin/google-chrome",
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--remote-debugging-port=9222",
        "https://google.com"
    ]
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        import time
        time.sleep(5)
        if proc.poll() is None:
            print("✅ Chrome 进程已启动并运行中")
            proc.terminate()
        else:
            out, err = proc.communicate()
            print(f"❌ Chrome 启动后立即退出: {err.decode()}")
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == "__main__":
    test_chrome()
