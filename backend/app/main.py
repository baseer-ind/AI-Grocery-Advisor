from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_bill_upload import router as bill_upload_router
from app.api.v1.routes_bill_upload_async import router as bill_upload_async_router
from app.api.v1.routes_providers_search import router as providers_search_router
from app.api.v1.routes_search import router as search_router
from app.api.v1.routes_users import router as users_router
from app.core.config import settings
from app.db.session import engine
from app.queue import dispose_arq_pool

app = FastAPI(title=settings.app_name)


@app.on_event("shutdown")
async def dispose_engine() -> None:
    """Each `with TestClient(app) as client:` block runs on its own anyio
    portal/event loop. The async engine's connection pool and the arq Redis
    pool are both module-level singletons, so a pooled connection checked
    out under one test file's loop is unusable once that loop closes and the
    next test file opens a new one (`RuntimeError: ... attached to a
    different loop` / `Event loop is closed`). Disposing both on shutdown
    forces the next portal to open fresh connections instead of reusing
    now-orphaned ones.
    """
    await engine.dispose()
    await dispose_arq_pool()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(providers_search_router)
app.include_router(bill_upload_router)
app.include_router(bill_upload_async_router)
app.include_router(auth_router)
app.include_router(users_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
