from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_baskets import router as baskets_router
from app.api.v1.routes_bill_upload import router as bill_upload_router
from app.api.v1.routes_bill_upload_async import router as bill_upload_async_router
from app.api.v1.routes_household import router as household_router
from app.api.v1.routes_product_intelligence import router as product_intelligence_router
from app.api.v1.routes_providers_search import router as providers_search_router
from app.api.v1.routes_search import router as search_router
from app.api.v1.routes_users import router as users_router
from app.core.config import settings
from app.db.session import engine
from app.queue import dispose_arq_pool

if settings.environment == "production" and settings.ocr_engine == "mock":
    # A real beta user's bill must never be silently swapped for canned OCR
    # text — refuse to boot rather than serve fabricated results.
    raise RuntimeError("OCR_ENGINE=mock is not allowed when ENVIRONMENT=production")

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
    allow_origins=settings.allowed_origins_list,
    # Vercel mints a new, unique preview URL on every deploy, so an
    # exact-match allowlist would need updating by hand each time — match
    # any of our Vercel deployments (prod + previews) by pattern instead.
    allow_origin_regex=r"https://ai-grocery-advisor.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(providers_search_router)
app.include_router(bill_upload_router)
app.include_router(bill_upload_async_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(baskets_router)
app.include_router(product_intelligence_router)
app.include_router(household_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
