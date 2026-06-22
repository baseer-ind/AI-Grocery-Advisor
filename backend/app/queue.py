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
