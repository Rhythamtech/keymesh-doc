---
title: The Request Cycle
tags: [concepts, lifecycle]
---

# The Request Cycle

KeyMesh operates on a simple, loop-based state machine containing three phases: **Acquire ➔ Execute ➔ Report**.

## 🔄 Lifecycle Diagram

```mermaid
flowchart TD
    App[Your Application] -->|1. Acquire Key| Pool[KeyPool / SyncKeyPool]
    Pool -->|2. Select Best Key| Scheduler[Scheduler Strategy]
    Scheduler -->|3. Check Health & State| State[Key Health & Metrics]
    Pool -->|4. Return Key String| App
    App -->|5. Make API Call Directly| Provider[OpenAI / Anthropic / Local AI]
    Provider -->|6. Get Response| App
    
    subgraph Inside KeyMesh
        Pool
        Scheduler
        State
        Storage[(Optional File Cache)]
        State <.-> Storage
    end
    
    App -->|7a. Release Key & Log Latency| Pool
    App -->|7b. Rate Limited (Cooldown)| Pool
    App -->|7c. Report Failure| Pool
```

---

## 🧭 The Three Phases

### 1. Acquire
When your code needs to perform an LLM inference, it requests a credential from KeyMesh:
* **Async**: `key = await pool.acquire()`
* **Sync**: `key = pool.acquire()`

The pool delegates selection to the chosen **Scheduler**. Schedulers check key metrics (like concurrent request counts, average latency, and cooldown status) to choose the best available key.

### 2. Execute
Once the application gets the raw API key string from the pool, it directly calls the provider SDK. 

> [!IMPORTANT]
> KeyMesh **never** intercepts the HTTP call. You pass the raw key to the standard client configurations. This ensures zero middleware overhead, maintaining the highest possible speed.

### 3. Report
After completing the execution, the application MUST report the outcome back to the pool:
* **Success**: `pool.release(key, latency=0.25)` resets consecutive failures, decrements active workloads, and updates the Exponential Moving Average (EMA) latency.
* **Rate Limit (429)**: `pool.mark_rate_limited(key, cooldown=60.0)` sets a cooldown timestamp. Schedulers will skip this key until the cooldown time expires.
* **Other Failures**: `pool.mark_failed(key)` increments consecutive failure counts. If failures cross a threshold, the key can be pruned or deprioritized.
