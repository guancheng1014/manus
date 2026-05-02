import os
import platform
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from typing import Optional
import json

PORT = int(os.environ.get("PORT", 8191))
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", 4))

_worker_sem = threading.Semaphore(MAX_WORKERS)
_active_count = 0
_queued_count = 0
_count_lock = threading.Lock()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

def _ensure_display() -> Optional[subprocess.Popen]:
    if platform.system() != "Linux": return None
    if os.environ.get("DISPLAY"): return None
    xvfb = subprocess.Popen(["Xvfb", ":99", "-screen", "0", "1280x900x24"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.environ["DISPLAY"] = ":99"
    time.sleep(0.5)
    return xvfb

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[service] {self.address_string()} - {fmt % args}", flush=True)

    def send_json(self, code: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/solve":
            self.send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw)
        except:
            self.send_json(400, {"error": "invalid JSON"})
            return

        sitekey = payload.get("sitekey", "").strip()
        siteurl = payload.get("siteurl", "").strip()
        timeout = int(payload.get("timeout", 45))

        global _active_count, _queued_count
        with _count_lock: _queued_count += 1
        _worker_sem.acquire()
        with _count_lock:
            _queued_count -= 1
            _active_count += 1

        t0 = time.time()
        try:
            print(f"[service] running subprocess solver for {sitekey}", flush=True)
            env = os.environ.copy()
            env["HOME"] = "/home/ubuntu"
            
            cmd = ["python3", "solver.py", sitekey, siteurl]
            print(f"[service] executing: {' '.join(cmd)}", flush=True)
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5, env=env)
            
            stdout = proc.stdout.strip()
            stderr = proc.stderr.strip()
            
            print(f"[service] solver stdout: {stdout}", flush=True)
            print(f"[service] solver stderr: {stderr}", flush=True)
            
            if proc.returncode == 0:
                lines = stdout.split('\n')
                token = lines[-1]
                if token.startswith("ERROR:"):
                    self.send_json(500, {"error": token, "details": stdout})
                else:
                    elapsed = round(time.time() - t0, 2)
                    self.send_json(200, {"token": token, "elapsed": elapsed})
            else:
                err_msg = f"Subprocess failed (code {proc.returncode})"
                self.send_json(500, {"error": err_msg, "stdout": stdout, "stderr": stderr})
        except subprocess.TimeoutExpired:
            self.send_json(500, {"error": "timeout"})
        except Exception as e:
            self.send_json(500, {"error": str(e)})
        finally:
            with _count_lock: _active_count -= 1
            _worker_sem.release()

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"status": "ok", "active": _active_count, "queued": _queued_count})

if __name__ == "__main__":
    _ensure_display()
    server = ThreadedHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"[service] running on {PORT}", flush=True)
    server.serve_forever()
