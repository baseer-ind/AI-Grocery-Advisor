from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _build_engine(database_url: str):
    """Managed Postgres providers (e.g. Render) hand out connection strings
    with `?sslmode=require`, a libpq/psycopg2 keyword asyncpg's `connect()`
    doesn't accept — it raises `TypeError: unexpected keyword argument
    'sslmode'` on every connection attempt. Strip it from the URL and pass
    the equivalent as a driver-level `ssl` connect arg instead.
    """
    parts = urlsplit(database_url)
    query = parse_qs(parts.query)
    sslmode = query.pop("sslmode", [None])[0]
    clean_url = urlunsplit(parts._replace(query=urlencode(query, doseq=True)))

    connect_args = {}
    if sslmode and sslmode != "disable":
        connect_args["ssl"] = True

    return create_async_engine(
        clean_url,
        echo=False,
        connect_args=connect_args,
        # Render's backend spins down on inactivity, which leaves stale
        # connections sitting in the pool when it wakes back up — without
        # pre_ping, the first request after idle reuses a dead connection
        # and asyncpg raises `connection is closed`. pool_recycle caps how
        # long a connection can live before being replaced, as a second
        # line of defense against the same staleness.
        pool_pre_ping=True,
        pool_recycle=300,
    )


engine = _build_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session():
    async with SessionLocal() as session:
        yield session
