"""Thin async Redis wrapper used as a best-effort cache.

Deliberately fails open: if Redis is unreachable, every operation here
returns a cache miss / no-op instead of raising, so a cache outage degrades
to "slower" rather than "down." This is the same posture as the price
providers — a dependency that can fail should never take the request down
with it.
"""

import json
from typing import Any

import redis.asyncio as redis

from app.core.config import settings

_client: redis.Redis | None = None


def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def cache_get(key: str) -> Any | None:
    try:
        raw = await _get_client().get(key)
    except Exception:
        # Any failure here — including a stale client bound to a now-closed
        # event loop — must degrade to a cache miss, never take the caller down.
        _reset_client()
        return None
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    try:
        await _get_client().set(key, json.dumps(value), ex=ttl_seconds)
    except Exception:
        _reset_client()
        return


def _reset_client() -> None:
    global _client
    _client = None
