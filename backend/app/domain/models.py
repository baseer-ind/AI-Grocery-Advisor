from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text
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

    __table_args__ = (
        # GIN + pg_trgm gives fast ILIKE/similarity search; the extension and
        # index are created in the migration (raw SQL), this is documentation
        # of intent plus what `Base.metadata.create_all` will emit for a
        # fresh Postgres database in dev/test.
        Index("ix_products_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
        Index("ix_products_brand_trgm", "brand", postgresql_using="gin", postgresql_ops={"brand": "gin_trgm_ops"}),
    )


class ProductListing(Base):
    """A specific product as sold on a specific platform — the unit prices/fees are calculated against.

    `location_key` is an opaque identifier for "where this price applies" — a
    pincode, city code, or dark-store id, depending on what a given platform
    can resolve. It is nullable because every current provider is
    location-agnostic; the column exists so that adding a location-aware
    provider later is a data change, not a schema migration.
    """

    __tablename__ = "product_listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    platform_id: Mapped[int] = mapped_column(ForeignKey("platforms.id"))
    location_key: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)

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

    __table_args__ = (
        Index("ix_product_listings_product_location", "product_id", "location_key"),
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("product_listings.id"))
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2))
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    listing: Mapped["ProductListing"] = relationship(back_populates="price_history")


class User(Base):
    """Minimal account record — no auth flow yet, just the ownership anchor
    so bills/baskets/recommendations don't have to be retrofitted with a
    user relationship once accounts exist.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bill_uploads: Mapped[list["BillUpload"]] = relationship(back_populates="user")
    baskets: Mapped[list["Basket"]] = relationship(back_populates="user")


class BillUpload(Base):
    """One uploaded bill file and its processing status.

    `user_id` is nullable because uploads can happen anonymously today; the
    column exists so anonymous-to-account attribution doesn't require a
    migration later.
    """

    __tablename__ = "bill_uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    job_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="bill_uploads")
    basket: Mapped["Basket | None"] = relationship(back_populates="bill_upload", uselist=False)

    __table_args__ = (Index("ix_bill_uploads_job_id", "job_id"),)


class Basket(Base):
    """A normalized set of items derived from a bill upload (or, in future,
    a manually built basket) — the unit ownership is attached to.
    """

    __tablename__ = "baskets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    bill_upload_id: Mapped[int | None] = mapped_column(ForeignKey("bill_uploads.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="baskets")
    bill_upload: Mapped["BillUpload | None"] = relationship(back_populates="basket")
    items: Mapped[list["BasketItem"]] = relationship(back_populates="basket")


class BasketItem(Base):
    __tablename__ = "basket_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    basket_id: Mapped[int] = mapped_column(ForeignKey("baskets.id"))
    product_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[float] = mapped_column(Numeric(10, 2))
    unit: Mapped[str] = mapped_column(String(16))
    total_price: Mapped[float] = mapped_column(Numeric(10, 2))

    basket: Mapped["Basket"] = relationship(back_populates="items")
    recommendation: Mapped["BasketRecommendation | None"] = relationship(back_populates="basket_item", uselist=False)


class BasketRecommendation(Base):
    """The recommendation set computed for one basket item, persisted as
    JSON rather than fully normalized — it's a point-in-time computed
    result, not a row that itself needs querying/joining, so JSON keeps
    this from needing a schema change every time RecommendationSet grows
    a field.
    """

    __tablename__ = "basket_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    basket_item_id: Mapped[int] = mapped_column(ForeignKey("basket_items.id"), unique=True)
    recommendation_json: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    basket_item: Mapped["BasketItem"] = relationship(back_populates="recommendation")
