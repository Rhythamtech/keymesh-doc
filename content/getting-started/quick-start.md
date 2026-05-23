---
title: Quick Start
tags: [getting-started, setup, usage]
---

# Quick Start

Get up and running with KeyMesh in less than five minutes.

## 📥 Installation

Install KeyMesh using your preferred Python package manager. We recommend `uv` for speed and dependency resolution:

```bash
# Using uv (recommended)
uv add keymesh

# Using pip
pip install keymesh
```

## ⚡ Basic Usage

Here is how to initialize a pool of API keys and acquire one for an operation. KeyMesh provides both **asynchronous (async)** and **synchronous (sync)** APIs.

### Asynchronous API (`KeyPool`)

For async runtimes (such as FastAPI, Tornado, or `asyncio` applications):

```python
from keymesh import KeyPool, SchedulerStrategy

# 1. Initialize the KeyPool with a list of API keys
pool = KeyPool(
    keys=["sk-key-1", "sk-key-2", "sk-key-3"],
    strategy=SchedulerStrategy.LEAST_BUSY
)

# 2. Acquire a credential (non-blocking scheduler selection)
key = await pool.acquire()

try:
    # 3. Use the key in any standard SDK or HTTP client directly
    # (KeyMesh does not intercept the HTTP call itself)
    response = await client.completions.create(api_key=key, ...)
    
    # 4. Release key back to the pool on success, reporting latency
    await pool.release(key, latency=response.elapsed)
    
except RateLimitError:
    # 5. Handle rate limits with a cooldown
    await pool.mark_rate_limited(key, cooldown=60.0)
    
except Exception:
    # 6. Track consecutive failures to prune dead keys
    await pool.mark_failed(key)
    
finally:
    # 7. Remember to shut down the pool when done to persist states
    await pool.close()
```

### Synchronous API (`SyncKeyPool`)

For sync/multi-threaded runtimes (such as Django, Flask, or simple scripts):

```python
from keymesh import SyncKeyPool, SchedulerStrategy

# 1. Initialize the SyncKeyPool
pool = SyncKeyPool(
    keys=["sk-key-1", "sk-key-2", "sk-key-3"],
    strategy=SchedulerStrategy.LEAST_BUSY
)

# 2. Acquire a credential
key = pool.acquire()

try:
    # 3. Call your model
    response = client.completions.create(api_key=key, ...)
    
    # 4. Release key back to the pool
    pool.release(key, latency=response.elapsed)
    
except RateLimitError:
    # 5. Put key on cooldown
    pool.mark_rate_limited(key, cooldown=60.0)
    
except Exception:
    # 6. Mark key failed
    pool.mark_failed(key)
    
finally:
    # 7. Close the pool
    pool.close()
```
