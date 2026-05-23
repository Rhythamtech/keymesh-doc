---
title: Multi-Provider Routing
tags: [advanced, routing, providers]
---

# Multi-Provider Routing

A powerful feature of KeyMesh is pooling keys from **different providers** (like SiliconFlow, OpenRouter, DeepInfra, or local tools like Ollama and LM Studio) to run the same underlying models.

---

## 1. The Configuration Schema

To achieve this, map each API key to its provider metadata (endpoints, models, etc.) using a simple lookup dictionary:

```python
providers_config = {
    "sk-siliconflow-key-xyz": {
        "provider": "siliconflow",
        "base_url": "https://api.siliconflow.cn/v1",
        "model": "MiniMaxAI/MiniMax-M2.5",
    },
    "sk-openrouter-key-abc": {
        "provider": "openrouter",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "minimax/minimax-m2.7",
    },
    "sk-lmstudio-local-key": {
        "provider": "lmstudio",
        "base_url": "http://localhost:1234/v1",
        "model": "MiniMaxAI/minimax-m2",
    }
}
```

---

## 2. Implementation: Dynamic Routing Pattern

When a key is acquired from the pool, use it to resolve the correct provider settings dynamically. Create a temporary client configuration matching that endpoint and execute the call:

```python
import asyncio
import time
from openai import AsyncOpenAI
from keymesh import KeyPool

async def run_dynamic_route(pool: KeyPool, config: dict, prompt: str):
    # 1. Acquire key from pool
    key = await pool.acquire()
    start_time = time.monotonic()
    
    # 2. Look up provider settings mapped to this key
    meta = config.get(key)
    if not meta:
        await pool.mark_failed(key)
        raise ValueError("Key metadata missing from configuration schema!")
        
    base_url = meta["base_url"]
    model_name = meta["model"]
    provider = meta["provider"]
    
    print(f"Routing request to {provider} at {base_url} using model {model_name}")
    
    # 3. Create a temporary client for this provider
    client = AsyncOpenAI(base_url=base_url, api_key=key)
    
    try:
        # 4. Make the call
        response = await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}]
        )
        latency = time.monotonic() - start_time
        
        # 5. Release key on success
        await pool.release(key, latency=latency)
        print(f"Success via {provider}: {response.choices[0].message.content[:30]}...")
        
    except Exception as e:
        # 6. Differentiate rate limits from connection failures
        if "429" in str(e) or "rate" in str(e).lower():
            await pool.mark_rate_limited(key, cooldown=60.0)
        else:
            await pool.mark_failed(key)
        raise e
```
