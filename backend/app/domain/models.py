from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Platform(Base):
    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    listings: Mapped[list["ProductListing"]] = relationship(back_populates="platform")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    brand: Mapped[str] = mapped_column(String(128))
    category: Mapped[str] = mapped_column(String(128))
    canonical_quantity: Mapped[float] = mapped_column(Numeric(10, 2))
    canonical_unit: Mapped[str] = mapped_column(String(16))

    listings: Mapped[list["ProductListing"]] = relationship(back_populates="product")


class ProductListing(Base):
    """A specific product as sold on a specific platform — the unit prices/fees are calculated against."""

    __tablename__ = "product_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    platform_id: Mapped[int] = mapped_column(ForeignKey("platforms.id"))

    mrp: Mapped[float] = mapped_column(Numeric(10, 2))
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    platform_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    handling_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    product_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    delivery_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    eta_minutes: Mapped[int] = mapped_column(Integer, default=0)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    product_url: Mapped[str] = mapped_column(String(512))

    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    product: Mapped["Product"] = relationship(back_populates="listings")
    platform: Mapped["Platform"] = relationship(back_populates="listings")
    price_history: Mapped[list["PriceHistory"]] = relationship(back_populates="listing")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("product_listings.id"))
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2))
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    listing: Mapped["ProductListing"] = relationship(back_populates="price_history")
