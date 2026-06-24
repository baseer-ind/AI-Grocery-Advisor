"""Hard daily ceiling on LLM fallback calls — the safety net that makes
"unlimited bill uploads" safe regardless of which provider is active or
how big a usage spike (real or abusive) hits the upload endpoint.

Deliberately the opposite failure posture from `app/core/cache.py`: a cache
miss on Redis-down just means "slower," but a quota check on Redis-down
must deny the LLM call, not allow it — an unenforceable cap is the same as
no cap, and the entire point of this module is bounding worst-case spend.
"""

from datetime import datetime, timezone

import redis.asyncio as redis

from app.core.config import settings

_client: redis.Redis | None = None


def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def _today_key() -> str:
    return f"llm_fallback:calls:{datetime.now(timezone.utc):%Y-%m-%d}"


async def try_consume_fallback_quota() -> bool:
    """Atomically increments today's counter and reports whether this call
    is within the configured daily cap. Returns False (deny) on any Redis
    failure — see module docstring for why this fails closed, not open.
    """
    if settings.llm_fallback_daily_cap <= 0:
        return False

    key = _today_key()
    try:
        client = _get_client()
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, 2 * 24 * 60 * 60)
    except Exception:
        _reset_client()
        return False

    return count <= settings.llm_fallback_daily_cap


def _reset_client() -> None:
    global _client
    _client = None
