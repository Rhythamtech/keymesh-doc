---
title: SDK Integration Patterns
tags: [integration, patterns, code]
---

# SDK Integration Patterns

KeyMesh offers three flexible and concurrency-safe patterns to run requests across your key pool.

---

## Pattern 1: Scoped Client Overrides (`with_options`)

This is the recommended pattern for modern SDKs (like OpenAI or Anthropic). It creates a shallow copy of the client config pointing to the specific key for that single request, while sharing the underlying connection pool.

### Asynchronous Options Example

```python
import time
from openai import AsyncOpenAI
from keymesh import KeyPool

async_client = AsyncOpenAI(base_url="https://api.openai.com/v1")

async def run_async_with_options(pool: KeyPool) -> None:
    try:
        # 1. Acquire key
        key = await pool.acquire()
        start = time.monotonic()
        try:
            # 2. Scope the client config override
            scoped_client = async_client.with_options(api_key=key)
            response = await scoped_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "Hello!"}],
            )
            # 3. Release key and report latency
            await pool.release(key, latency=time.monotonic() - start)
            print(f"Success: {response.choices[0].message.content}")
        except BaseException:
            # 4. Report failure
            await pool.mark_failed(key)
            raise
    except Exception as e:
        print(f"Failed: {e}")
```

### Synchronous Options Example

```python
import time
from openai import OpenAI
from keymesh import SyncKeyPool

sync_client = OpenAI(base_url="https://api.openai.com/v1")

def run_sync_with_options(pool: SyncKeyPool) -> None:
    try:
        # 1. Acquire key
        key = pool.acquire()
        start = time.monotonic()
        try:
            # 2. Scope client override
            scoped_client = sync_client.with_options(api_key=key)
            response = scoped_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "Hello!"}],
            )
            # 3. Release key
            pool.release(key, latency=time.monotonic() - start)
            print(f"Success: {response.choices[0].message.content}")
        except BaseException:
            # 4. Report failure
            pool.mark_failed(key)
            raise
    except Exception as e:
        print(f"Failed: {e}")
```

---

## Pattern 2: Per-Request Custom Headers (`extra_headers`)

This pattern passes the API key directly within the authorization header of each call. The global client state remains completely untouched.

### Asynchronous Headers Example

```python
async def run_async_headers(pool: KeyPool) -> None:
    try:
        key = await pool.acquire()
        start = time.monotonic()
        try:
            # Pass the Authorization header dynamically per-request
            response = await async_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "Hello!"}],
                extra_headers={"Authorization": f"Bearer {key}"}
            )
            await pool.release(key, latency=time.monotonic() - start)
            print(f"Success: {response.choices[0].message.content}")
        except BaseException:
            await pool.mark_failed(key)
            raise
    except Exception as e:
        print(f"Failed: {e}")
```

### Synchronous Headers Example

```python
def run_sync_headers(pool: SyncKeyPool) -> None:
    try:
        key = pool.acquire()
        start = time.monotonic()
        try:
            response = sync_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "Hello!"}],
                extra_headers={"Authorization": f"Bearer {key}"}
            )
            pool.release(key, latency=time.monotonic() - start)
            print(f"Success: {response.choices[0].message.content}")
        except BaseException:
            pool.mark_failed(key)
            raise
    except Exception as e:
        print(f"Failed: {e}")
```

---

## Pattern 3: Lifecycle Hooks (Context Managers)

To prevent key leaks when errors happen, wrap KeyMesh lifecycle actions inside a Python context manager block. This guarantees your keys are always returned and never leak.

### Asynchronous Lifecycle Example

```python
import contextlib
import time
from typing import AsyncGenerator
from openai import RateLimitError
from keymesh import KeyPool

@contextlib.asynccontextmanager
async def async_key_lifecycle(pool: KeyPool) -> AsyncGenerator[str, None]:
    key = await pool.acquire()
    start = time.monotonic()
    try:
        yield key
        await pool.release(key, latency=time.monotonic() - start)
    except RateLimitError:
        # Rate limit hit: put key on a 60-second cooldown
        await pool.mark_rate_limited(key, cooldown=60.0)
        raise
    except BaseException:
        # Other failures: mark key as failed
        await pool.mark_failed(key)
        raise

# How to use it:
async def run_async_lifecycle(pool: KeyPool) -> None:
    try:
        async with async_key_lifecycle(pool) as key:
            scoped_client = async_client.with_options(api_key=key)
            response = await scoped_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "Hello!"}],
            )
            print(f"Success: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Failed: {e}")
```

### Synchronous Lifecycle Example

```python
import contextlib
import time
from typing import Generator
from openai import RateLimitError
from keymesh import SyncKeyPool

@contextlib.contextmanager
def sync_key_lifecycle(pool: SyncKeyPool) -> Generator[str, None, None]:
    key = pool.acquire()
    start = time.monotonic()
    try:
        yield key
        pool.release(key, latency=time.monotonic() - start)
    except RateLimitError:
        pool.mark_rate_limited(key, cooldown=60.0)
        raise
    except BaseException:
        pool.mark_failed(key)
        raise

# How to use it:
def run_sync_lifecycle(pool: SyncKeyPool) -> None:
    try:
        with sync_key_lifecycle(pool) as key:
            scoped_client = sync_client.with_options(api_key=key)
            response = scoped_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "Hello!"}],
            )
            print(f"Success: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Failed: {e}")
```
