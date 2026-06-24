"""In-memory sqlite session for tests that exercise the product-intelligence
learning loop (alias matching, correction recording, metrics) against a real
ORM session instead of mocking the database away — fuzzy matching and
aggregate queries are exactly the kind of logic that's easy to get subtly
wrong without an actual session to run them through.
"""

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.domain.models import Base


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        yield session

    await engine.dispose()
