"""Seeds platforms and a handful of real-world-shaped products/listings for the demo slice."""

import asyncio

from sqlalchemy import select

from app.db.session import SessionLocal, engine
from app.domain.models import Base, Platform, Product, ProductListing

PLATFORMS = [
    {"name": "Blinkit", "slug": "blinkit"},
    {"name": "Zepto", "slug": "zepto"},
    {"name": "Swiggy Instamart", "slug": "swiggy-instamart"},
    {"name": "BigBasket", "slug": "bigbasket"},
    {"name": "Amazon Fresh", "slug": "amazon-fresh"},
    {"name": "JioMart", "slug": "jiomart"},
    {"name": "Flipkart Minutes", "slug": "flipkart-minutes"},
    {"name": "DMart Ready", "slug": "dmart-ready"},
]

PRODUCTS = [
    {
        "name": "Aashirvaad Whole Wheat Atta 5kg",
        "brand": "Aashirvaad",
        "category": "Atta & Flour",
        "canonical_quantity": 5,
        "canonical_unit": "kg",
        "listings": [
            {"platform": "blinkit", "mrp": 399, "selling_price": 299, "delivery_fee": 40, "platform_fee": 5,
             "handling_fee": 10, "product_rating": 4.3, "delivery_rating": 4.5, "eta_minutes": 12, "in_stock": True,
             "product_url": "https://blinkit.com/search?q=aashirvaad+atta+5kg"},
            {"platform": "zepto", "mrp": 399, "selling_price": 309, "delivery_fee": 25, "platform_fee": 0,
             "handling_fee": 8, "product_rating": 4.2, "delivery_rating": 4.6, "eta_minutes": 10, "in_stock": True,
             "product_url": "https://www.zeptonow.com/search?query=aashirvaad+atta+5kg"},
            {"platform": "swiggy-instamart", "mrp": 399, "selling_price": 319, "delivery_fee": 0, "platform_fee": 12,
             "handling_fee": 5, "product_rating": 4.1, "delivery_rating": 4.3, "eta_minutes": 18, "in_stock": True,
             "product_url": "https://www.swiggy.com/instamart/search?query=aashirvaad%20atta%205kg"},
            {"platform": "bigbasket", "mrp": 399, "selling_price": 339, "delivery_fee": 0, "platform_fee": 0,
             "handling_fee": 0, "product_rating": 4.4, "delivery_rating": 4.0, "eta_minutes": 90, "in_stock": True,
             "product_url": "https://www.bigbasket.com/ps/?q=aashirvaad+atta+5kg"},
            {"platform": "jiomart", "mrp": 399, "selling_price": 329, "delivery_fee": 30, "platform_fee": 0,
             "handling_fee": 0, "product_rating": 4.0, "delivery_rating": 3.9, "eta_minutes": 120, "in_stock": True,
             "product_url": "https://www.jiomart.com/search/aashirvaad-atta-5kg"},
        ],
    },
    {
        "name": "Amul Butter 500g",
        "brand": "Amul",
        "category": "Dairy",
        "canonical_quantity": 500,
        "canonical_unit": "g",
        "listings": [
            {"platform": "blinkit", "mrp": 275, "selling_price": 265, "delivery_fee": 0, "platform_fee": 5,
             "handling_fee": 5, "product_rating": 4.6, "delivery_rating": 4.5, "eta_minutes": 11, "in_stock": True,
             "product_url": "https://blinkit.com/search?q=amul+butter+500g"},
            {"platform": "zepto", "mrp": 275, "selling_price": 259, "delivery_fee": 25, "platform_fee": 0,
             "handling_fee": 0, "product_rating": 4.5, "delivery_rating": 4.6, "eta_minutes": 9, "in_stock": True,
             "product_url": "https://www.zeptonow.com/search?query=amul+butter+500g"},
            {"platform": "dmart-ready", "mrp": 275, "selling_price": 249, "delivery_fee": 49, "platform_fee": 0,
             "handling_fee": 0, "product_rating": 4.3, "delivery_rating": 3.7, "eta_minutes": 180, "in_stock": True,
             "product_url": "https://www.dmart.in/search?q=amul+butter+500g"},
        ],
    },
]


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        platform_by_slug = {}
        for p in PLATFORMS:
            existing = await session.scalar(select(Platform).where(Platform.slug == p["slug"]))
            if not existing:
                existing = Platform(**p)
                session.add(existing)
                await session.flush()
            platform_by_slug[p["slug"]] = existing

        for prod in PRODUCTS:
            existing_product = await session.scalar(select(Product).where(Product.name == prod["name"]))
            if existing_product:
                continue
            product = Product(
                name=prod["name"],
                brand=prod["brand"],
                category=prod["category"],
                canonical_quantity=prod["canonical_quantity"],
                canonical_unit=prod["canonical_unit"],
            )
            session.add(product)
            await session.flush()

            for listing in prod["listings"]:
                platform = platform_by_slug[listing["platform"]]
                session.add(
                    ProductListing(
                        product_id=product.id,
                        platform_id=platform.id,
                        mrp=listing["mrp"],
                        selling_price=listing["selling_price"],
                        delivery_fee=listing["delivery_fee"],
                        platform_fee=listing["platform_fee"],
                        handling_fee=listing["handling_fee"],
                        product_rating=listing["product_rating"],
                        delivery_rating=listing["delivery_rating"],
                        eta_minutes=listing["eta_minutes"],
                        in_stock=listing["in_stock"],
                        product_url=listing["product_url"],
                    )
                )

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
