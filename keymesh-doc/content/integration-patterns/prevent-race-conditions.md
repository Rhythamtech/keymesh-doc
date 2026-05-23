---
title: Preventing Race Conditions
tags: [integration, safety, race-condition]
---

# Preventing Race Conditions

A common pitfall when integrating a key manager with standard AI SDKs (like OpenAI or Anthropic) is mutating client-wide properties globally.

## ⚠️ The Key-Mixing Bug

If you have a single shared `client` instance and change its API key in place inside parallel request loops, you will suffer from race conditions where requests use the wrong keys:

```python
# 🚫 BUGGY ANTI-PATTERN: DO NOT DO THIS
async def call_api(pool: KeyPool):
    key = await pool.acquire()
    try:
        client.api_key = key # ❌ Global mutation!
        response = await client.chat.completions.create(...)
        await pool.release(key)
    except Exception:
        await pool.mark_failed(key)
```

### 🚨 Detailed Race Condition Lifecycle

Here is exactly how requests get mixed up when mutating the client globally:

```mermaid
sequenceDiagram
    autonumber
    participant EventLoop as Async Event Loop
    participant TaskA as Task A (User 1)
    participant TaskB as Task B (User 2)
    participant Client as Shared OpenAI Client
    
    TaskA->>Client: Change client.api_key to "Key-A"
    TaskA->>EventLoop: await chat.completions.create() [Wait for network]
    Note over TaskA,EventLoop: Task A pauses to let other tasks run
    
    EventLoop->>TaskB: Task B starts
    TaskB->>Client: Change client.api_key to "Key-B" (Overwrites Key-A!)
    TaskB->>EventLoop: await chat.completions.create() [Wait for network]
    
    Note over EventLoop: Network ready for Task A
    EventLoop->>Client: Prepare request headers for Task A
    Note over Client: Reads shared client.api_key (which is now "Key-B")
    Client-->>TaskA: Task A request is sent using "Key-B" by mistake!
    
    Note over EventLoop: Network ready for Task B
    Client-->>TaskB: Task B request is sent using "Key-B"
    
    Note over TaskA,TaskB: BOTH requests were sent using Key-B. Key-A sat idle.
```

---

## 🛠️ The Fix

To ensure concurrency-safe executions, you must pass credentials dynamically per request. Do **not** mutate the shared client globally. 

Instead, use one of the following safe approaches:
1. **Scoped Client Overrides** (creating request-scoped configs via `with_options`).
2. **Request Headers injection** (injecting headers per call via `extra_headers`).
3. **Automated Lifecycles** (wrapping variables in context managers).

Review the next section for detailed code implementations of these solutions.
