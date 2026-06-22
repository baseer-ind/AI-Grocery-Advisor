from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.domain.schemas import ProductSearchResult
from app.services.product_search_service import search_products

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.get("", response_model=list[ProductSearchResult])
async def search(q: str = Query(..., min_length=2), session: AsyncSession = Depends(get_session)):
    return await search_products(session, q)
