---
title: Concurrency & Safety
tags: [concepts, concurrency, locking]
---

# Concurrency & Safety

KeyMesh is built from the ground up for highly concurrent systems, guaranteeing that state modifications remain safe across threads and event loops.

## 🔒 State Mutation Locks

To prevent race conditions, KeyMesh splits its runtime representation into separate async-safe and thread-safe implementations:

1. **Async Runtimes (`KeyState`)**:
   In async programs (`asyncio`), all mutations to a key's health metrics and workload tracking must obtain the individual key's lock:
   ```python
   async with self._lock:
       # Mutate active requests, success count, latencies, etc.
   ```
2. **Threaded/Synchronous Runtimes (`SyncKeyState`)**:
   In multi-threaded environments, KeyMesh relies on Python's standard `threading.Lock` to guarantee thread safety:
   ```python
   with self._lock:
       # Safely update variables
   ```

---

## ⏳ Non-Blocking Cooldowns

When a key receives a `mark_rate_limited` report:
1. It is assigned a monotonic expiration time (`cooldown_until`).
2. Schedulers dynamically filter out any key that is currently cooling down.
3. If all keys are in cooldown, KeyMesh raises a `KeyExhaustionError`.

Because schedulers act as stateless selectors, they never pause or block the thread/event loop with sleep commands. Your application can immediately catch exceptions or check fallback paths without blocking other concurrent tasks.

---

## 📈 Latency Estimation (EMA)

Rather than keeping a huge history list of request durations, KeyMesh computes a running **Exponential Moving Average (EMA)** with a default smoothing factor ($\alpha$) of `0.2`.

The mathematical formula used for updates is:

$$\text{Latency}_{\text{avg}} = \alpha \cdot \text{Latency}_{\text{new}} + (1 - \alpha) \cdot \text{Latency}_{\text{prev}}$$

### Why EMA?
- **Recency bias**: It prioritizes the latest network speeds while ignoring old, outdated latencies.
- **Resilience**: A single slow connection spike will not permanently ruin a key's latency score.
- **Efficiency**: Constant-time memory and execution footprints.
