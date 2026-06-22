"""Lazily-created arq Redis connection pool used to enqueue background jobs.

Mirrors the lazy-singleton pattern in `app/core/cache.py` — created on first
use rather than at import time, so importing this module never requires
Redis to be reachable.
"""

from arq import ArqRedis, create_pool
from arq.connections import RedisSettings

from app.core.config import settings

_pool: ArqRedis | None = None


async def get_arq_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    return _pool


async def dispose_arq_pool() -> None:
    """Each `with TestClient(app) as client:` block runs its own anyio
    portal/event loop; a pool opened under one loop is unusable once that
    loop closes (`RuntimeError: Event loop is closed` from the underlying
    redis connection). Closing on shutdown forces the next portal to open a
    fresh pool instead of reusing now-orphaned connections.
    """
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None
