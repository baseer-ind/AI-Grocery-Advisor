from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes_bill_upload import router as bill_upload_router
from app.api.v1.routes_providers_search import router as providers_search_router
from app.api.v1.routes_search import router as search_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(providers_search_router)
app.include_router(bill_upload_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
