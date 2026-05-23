---
title: API Reference
tags: [reference, api, keypool]
---

# API Reference

Detailed breakdown of KeyMesh classes, methods, strategies, and exceptions.

---

## ⚡ KeyPool (Async)

The primary pool manager class for asynchronous runtimes.

### `KeyPool(keys, strategy, storage, alpha)`
Creates the key pool instance.
* **`keys`** (`List[str]`): Raw API credentials to load.
* **`strategy`** (`SchedulerStrategy`): Dynamic strategy to use. Default is `SchedulerStrategy.LEAST_BUSY`.
* **`storage`** (`BaseStorage`): Storage engine to persist states. Default is `MemoryStorage`.
* **`alpha`** (`float`): EMA smoothing factor between `0.0` and `1.0`. Default is `0.2`.

### `await pool.acquire()`
Retrieves the next healthy credential from the pool.
* **Returns**: `str` (API Key).
* **Raises**: `KeyExhaustionError` if all keys are cooling down or broken.

### `await pool.release(key, latency)`
Returns a key back to the pool, updating status and response time.
* **`key`** (`str`): The key to return.
* **`latency`** (`float`): Operation elapsed duration in seconds.

### `await pool.mark_rate_limited(key, cooldown)`
Puts a key on cooldown, temporarily disabling it.
* **`key`** (`str`): The rate-limited key.
* **`cooldown`** (`float`): Cooldown duration in seconds.

### `await pool.mark_failed(key)`
Tracks connection and other general client-side exceptions.
* **`key`** (`str`): The failing key.

### `await pool.close()`
Flushes current metrics to the storage backend and releases resources.

---

## ⚡ SyncKeyPool (Sync)

Thread-safe pool manager for synchronous runtimes. Methods are identical to `KeyPool` but do **not** require `await`.

### `SyncKeyPool(keys, strategy, storage, alpha)`
Creates the sync key pool.

### `pool.acquire()`
* **Returns**: `str`.

### `pool.release(key, latency)`
### `pool.mark_rate_limited(key, cooldown)`
### `pool.mark_failed(key)`
### `pool.close()`

---

## 🧭 Scheduler Strategies

Schedulers are stateless algorithms used to select credentials:

* **`SchedulerStrategy.ROUND_ROBIN`**: Cycles through keys sequentially in a loop.
* **`SchedulerStrategy.LEAST_BUSY`**: Prioritizes keys with the lowest current active concurrent requests.
* **`SchedulerStrategy.WEIGHTED`**: Prioritizes keys based on their historical success rates and response speeds (EMA).

---

## ⚠️ Exceptions

All exceptions raised by KeyMesh inherit from a common base class:

* **`KeyMeshError`**: Base exception class.
  * **`KeyPoolEmptyError`**: Raised if you instantiate a pool without passing any keys.
  * **`KeyExhaustionError`**: Raised if all keys in the pool are currently in cooldown or marked as failed.
  * **`StorageError`**: Raised if the storage engine fails to load or save metrics.
