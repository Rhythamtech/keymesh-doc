---
title: What is KeyMesh?
tags: [getting-started, introduction]
---

# What is KeyMesh?

When you build AI applications that make many concurrent requests, you often hit a wall: **Rate Limits** (the `429 Too Many Requests` error). This happens because providers like OpenAI or Anthropic limit how many requests you can make per minute on your API keys.

**KeyMesh** solves this problem. It lets you put multiple API keys into a "pool" (a group). KeyMesh then automatically decides which key to use for each request. This allows you to combine several lower-tier keys to get the aggregate throughput of a premium tier key.

## 🛡️ How KeyMesh is Designed (What it is NOT)

To keep your code fast, lightweight, and simple, KeyMesh follows these strict architectural boundaries:

1. **No Middleman (No Proxy):** KeyMesh does **not** sit between your code and the internet. It does not send internet requests for you. It only runs locally on your machine and tells your code: *"Use this key next."* This means it adds **zero latency** (it won't slow down your connection).
2. **Works with Any Client:** You do not need any special tools, wrappers, or transport gateways. You can use standard official clients like `openai` or raw `httpx` directly.
3. **You Control the Request:** KeyMesh gives you a key, you use it to call your AI model, and then you tell KeyMesh if the call succeeded, failed, or hit a rate limit.
4. **Zero Couplings:** KeyMesh remains completely framework-agnostic. It does not wrap `openai`, `anthropic`, or any specific client. It only yields keys and records the outcome of operations.

## 🚀 Runtime Flow

KeyMesh coordinates credentials via a simple, high-performance async-safe flow:

1. **Acquire**: The application requests a key from `KeyPool` / `SyncKeyPool`.
2. **Select**: The pool requests a key from the `Scheduler` based on strategies like Least Busy or Weighted.
3. **Execute**: The application makes the API call directly to the LLM Provider using the selected key.
4. **Report**: The application reports the outcome (`release`, `mark_failed`, or `mark_rate_limited`) back to the pool to update key metrics and cooldown status.
