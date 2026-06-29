from fastapi import FastAPI

from app.api.health import router as health_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Dopamine India API",
    version="0.1.0",
    description=(
        "Simulation-only backend for Dopamine India. No real payments, "
        "deliveries, or bookings are ever processed."
    ),
)

app.include_router(health_router, prefix="/api/v1")
