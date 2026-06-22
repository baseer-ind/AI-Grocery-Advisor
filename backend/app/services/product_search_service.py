from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models import Product, ProductListing
from app.domain.schemas import (
    ListingResult,
    ProductSearchResult,
    RecommendationOut,
    RecommendationSetOut,
)
from app.services.pricing_engine import compute_pricing
from app.services.recommendation_engine import ListingView, build_recommendations


async def search_products(session: AsyncSession, query: str) -> list[ProductSearchResult]:
    stmt = (
        select(Product)
        .options(selectinload(Product.listings).selectinload(ProductListing.platform))
        .where(or_(Product.name.ilike(f"%{query}%"), Product.brand.ilike(f"%{query}%")))
    )
    products = (await session.scalars(stmt)).unique().all()

    results = []
    for product in products:
        if not product.listings:
            continue

        views = [
            ListingView(listing=listing, platform=listing.platform, pricing=compute_pricing(listing))
            for listing in product.listings
        ]
        rec_set = build_recommendations(views)

        results.append(
            ProductSearchResult(
                product_id=product.id,
                product_name=product.name,
                brand=product.brand,
                category=product.category,
                canonical_quantity=float(product.canonical_quantity),
                canonical_unit=product.canonical_unit,
                listings=[
                    ListingResult(
                        platform=v.platform.name,
                        platform_slug=v.platform.slug,
                        mrp=v.pricing.mrp,
                        selling_price=v.pricing.selling_price,
                        delivery_fee=v.pricing.delivery_fee,
                        platform_fee=v.pricing.platform_fee,
                        handling_fee=v.pricing.handling_fee,
                        effective_cost=v.pricing.effective_cost,
                        platform_discount_pct=v.pricing.platform_discount_pct,
                        real_discount_pct=v.pricing.real_discount_pct,
                        product_rating=float(v.listing.product_rating),
                        delivery_rating=float(v.listing.delivery_rating),
                        eta_minutes=v.listing.eta_minutes,
                        in_stock=v.listing.in_stock,
                        product_url=v.listing.product_url,
                    )
                    for v in views
                ],
                recommendations=RecommendationSetOut(
                    best_overall=RecommendationOut(**rec_set.best_overall.__dict__),
                    cheapest=RecommendationOut(**rec_set.cheapest.__dict__),
                    fastest=RecommendationOut(**rec_set.fastest.__dict__),
                    highest_rated=RecommendationOut(**rec_set.highest_rated.__dict__),
                    best_value=RecommendationOut(**rec_set.best_value.__dict__),
                ),
            )
        )

    return results
