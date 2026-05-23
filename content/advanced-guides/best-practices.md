---
title: Best Practices
tags: [advanced, design, patterns]
---

# Best Practices

Follow these guidelines to keep your application stable, fast, and bug-free under heavy traffic.

---

## 🟢 Do's (Best Practices)

* **DO reuse a single client:** Initialize your `AsyncOpenAI` or `OpenAI` client **once** at application start and reuse it across requests. This maintains persistent HTTP connection pools, dramatically reducing latency.
* **DO use scoped clients:** Use `client.with_options(api_key=key)` to safely attach a key to a specific request without causing race conditions.
* **DO use Context Managers:** Wrap your key calls in context managers (using `try/finally` or Python's `@contextmanager`) to ensure keys are always released back to the pool, even if a request crashes.
* **DO choose JSON storage in production:** Use `JSONStorage` or `SyncJSONStorage` to persist cooldowns and latency metrics across application restarts.
* **DO set reasonable cooldowns:** A 60-second cooldown is usually perfect. This gives rate-limited keys a brief break without keeping them out of action for too long.

---

## 🔴 Don't's (Common Mistakes)

* **DON'T mutate the global key:** Never run `client.api_key = key` on a shared client inside parallel loops or multi-threaded codes. This will cause different concurrent requests to mix up their keys.
* **DON'T instantiate clients inside request handlers:** Do not call `client = AsyncOpenAI()` inside your request loops. Creating a client for every single request ruins connection reuse and hurts performance.
* **DON'T block or sleep on rate limits:** If a key hits a rate limit, do not call `time.sleep()`. Let KeyMesh handle the cooldown; it will automatically skip the cooling key and keep your app running at full speed.
* **DON'T forget to close the pool:** Always run `await pool.close()` or `pool.close()` when your application shuts down to save statistics and release storage locks safely.
* **DON'T keep repeatedly failing keys:** Clean up and remove keys that fail consecutively so KeyMesh does not waste time testing them.
