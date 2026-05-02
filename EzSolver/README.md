<div align="center">

<h1>⚡ EzSolver</h1>

<p><strong>Fast, cross-platform Cloudflare Turnstile solver powered by a real browser.</strong><br/>
No paid APIs. No third-party services. Just Python and Chrome.</p>

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=flat-square&logo=python)](https://python.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)]()
[![Made by](https://img.shields.io/badge/Made%20by-Ismoiloff-orange?style=flat-square)](https://github.com/ismoiloffS)

</div>

---

## How it works

EzSolver injects a Turnstile widget directly into the target page using a real Chrome browser via [nodriver](https://github.com/ultrafunkamsterdam/nodriver). Because it runs in a genuine browser with a persistent profile, Cloudflare's fingerprinting sees a real user — no token farms, no captcha services needed.

- **Invisible widgets** resolve automatically within seconds
- **Managed (checkbox) widgets** are clicked with human-like mouse movement
- On Linux servers, a virtual display (Xvfb) is started automatically — no `xvfb-run` needed
- Chrome path and profile directory are auto-detected per OS, with env var overrides

---

## Requirements

- Python **3.8+**
- Google Chrome installed
- `nodriver` Python package
- **Linux only:** `Xvfb` (for headless servers)

---

## Installation

**1. Clone the repo**

```bash
git clone https://github.com/ismoiloffS/EzSolver.git
cd EzSolver
```

**2. Install the Python dependency**

```bash
pip install nodriver
```

**3. Linux headless servers only — install Xvfb**

```bash
sudo apt install xvfb
```

> Windows users: nothing extra needed, Chrome runs normally.

---

## Usage

### Option A — Standalone solver (single token)

Run `solver.py` directly from the command line:

```bash
python solver.py <sitekey> <siteurl>
```

**Example:**

```bash
python solver.py 0x4AAAAAAActoBfh_En8yr3T https://example.com/
```

**Output:**

```
[solver] clicking Cloudflare iframe at (48, 52)
0.abc123...longtoken...xyz
```

---

### Option B — Local API service

Start `service.py` once and send as many solve requests as you want via HTTP.

**Start the service:**

```bash
python service.py
```

```
[service] Turnstile solver service running on http://0.0.0.0:8191
```

**Send a request with the CLI client:**

```bash
python clientsend.py <sitekey> <siteurl> [timeout]
```

```bash
python clientsend.py 0x4AAAAAAActoBfh_En8yr3T https://example.com/
```

```
Token (14.32s): 0.abc123...longtoken...xyz
```

**Or call it from your own code / any HTTP client:**

```bash
curl -s -X POST http://127.0.0.1:8191/solve \
  -H "Content-Type: application/json" \
  -d '{"sitekey":"0x4AAAAAAActoBfh_En8yr3T","siteurl":"https://example.com/"}'
```

```json
{
  "token": "0.abc123...longtoken...xyz",
  "elapsed": 14.32
}
```

**Use it from Python:**

```python
from clientsend import request_token

token, elapsed = request_token(
    sitekey="0x4AAAAAAActoBfh_En8yr3T",
    siteurl="https://example.com/"
)
print(f"Got token in {elapsed}s: {token}")
```

---

## API reference

### `POST /solve`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `sitekey` | string | yes | — | Turnstile sitekey from the target page |
| `siteurl` | string | yes | — | Full URL of the page with the Turnstile widget |
| `timeout` | integer | no | `45` | Max seconds to wait for a token |

**Success response `200`:**
```json
{ "token": "0.abc...", "elapsed": 12.5 }
```

**Error response `500`:**
```json
{ "error": "Turnstile token not obtained within 45s" }
```

### `GET /health`

Returns current service status — useful for uptime checks and monitoring queue depth.

```json
{ "status": "ok", "workers": 4, "active": 2, "queued": 5 }
```

---

## Scaling

EzSolver uses a **worker pool** to handle high volumes safely. Instead of spinning up unlimited Chrome instances (which would crash your machine), requests queue up and are processed as workers free up — no requests are dropped.

```
500 requests → queue → [worker 1] [worker 2] [worker 3] [worker 4] → tokens
```

**Rule of thumb:** each Chrome worker uses ~500 MB RAM.

| Machine RAM | Recommended `MAX_WORKERS` | Throughput (est.) |
|-------------|--------------------------|-------------------|
| 2 GB | 2 | ~8 tokens/min |
| 4 GB | 4 (default) | ~16 tokens/min |
| 8 GB | 8 | ~32 tokens/min |
| 16 GB+ | 16 | ~64 tokens/min |

Set `MAX_WORKERS` when starting the service:

```bash
MAX_WORKERS=8 python service.py
```

Check the queue live via `/health`:

```bash
curl http://127.0.0.1:8191/health
```

```json
{ "status": "ok", "workers": 8, "active": 6, "queued": 47 }
```

For truly massive scale (thousands of concurrent solves), run **multiple service instances** behind a load balancer (nginx, Caddy, etc.) across several machines.

---

## Configuration

| Environment variable | Default | Description |
|----------------------|---------|-------------|
| `CHROME_PATH` | auto-detected | Path to your Chrome executable |
| `TS_PROFILE_DIR` | `%TEMP%\ts_profile` / `/tmp/ts_profile` | Persistent Chrome profile directory |
| `PORT` | `8191` | Port the service listens on |
| `MAX_WORKERS` | `4` | Max concurrent Chrome instances |

**Example:**
```bash
MAX_WORKERS=8 PORT=9000 python service.py
```

---

## Project structure

```
EzSolver/
├── solver.py      # Core solver — browser automation logic
├── service.py     # HTTP API wrapper around the solver
└── clientsend.py  # CLI client + importable helper for service.py
```

---

## Troubleshooting

**Chrome not found**
> Set `CHROME_PATH` to the full path of your Chrome executable.

**Timeout / token not received**
> The target site may be serving a harder challenge. Try increasing the timeout: `python clientsend.py <key> <url> 90`

**Linux: Xvfb not found**
> `sudo apt install xvfb`

---

<div align="center">

Made with ☕ by [Ismoiloff](https://github.com/ismoiloffS)

</div>
