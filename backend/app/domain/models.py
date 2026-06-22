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
    """Account record. `hashed_password` is nullable because Google
    Sign-In accounts never set one; `google_sub` is nullable because
    email/password accounts never set it. A user may have either, both,
    or (temporarily, mid-registration) neither — never enforced as
    mutually exclusive, since linking both methods to one account is a
    reasonable future feature, not something to design out now.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    preferences: Mapped["UserPreferences | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    bill_uploads: Mapped[list["BillUpload"]] = relationship(back_populates="user")
    baskets: Mapped[list["Basket"]] = relationship(back_populates="user")


class UserPreferences(Base):
    """Free-form preference storage, one row per user. JSON columns
    (rather than dedicated tables) for `grocery_preferences` and
    `cashback_preferences` because both are open-ended, user-editable
    key/value data that doesn't need to be queried/joined on — the same
    reasoning already applied to `BasketRecommendation.recommendation_json`.
    `membership_tier` is a plain column (not JSON) because it's a small,
    enumerable value other code may eventually need to filter/branch on
    (e.g. a future recommendation-engine discount for paid members).
    """

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    grocery_preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    cashback_preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    membership_tier: Mapped[str | None] = mapped_column(String(32), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="preferences")


class UserSession(Base):
    """A server-side session: the token handed to the client is opaque
    (a random string), not a self-describing JWT, so a session can be
    revoked (logout) by deleting/marking this row rather than waiting
    out a token's expiry.
    """

    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(String(128), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="sessions")

    __table_args__ = (Index("ix_user_sessions_token", "token"),)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(String(128), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")

    __table_args__ = (Index("ix_password_reset_tokens_token", "token"),)


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
    """A normalized set of items derived from a bill upload, OCR, or a
    manually entered list — the unit ownership and comparison results are
    attached to.

    `source` distinguishes how the basket was built (`"bill_upload"` vs.
    `"manual"` today; OCR-derived baskets currently flow through
    `bill_upload` since they originate from the same upload pipeline).
    `location_key` mirrors `ProductListing.location_key` — the same opaque
    pincode/city/dark-store identifier — so a saved basket can be re-compared
    against the location it was originally priced for.
    """

    __tablename__ = "baskets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    bill_upload_id: Mapped[int | None] = mapped_column(ForeignKey("bill_uploads.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="manual", server_default="manual")
    location_key: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="baskets")
    bill_upload: Mapped["BillUpload | None"] = relationship(back_populates="basket")
    items: Mapped[list["BasketItem"]] = relationship(back_populates="basket")
    optimization: Mapped["BasketOptimization | None"] = relationship(
        back_populates="basket", uselist=False, cascade="all, delete-orphan"
    )


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


class BasketOptimization(Base):
    """The basket-level comparison result (current/cheapest/best-overall/
    multi-platform-optimized cost plus the four recommendations), persisted
    as JSON for the same reason `BasketRecommendation.recommendation_json`
    is: a point-in-time computed result that doesn't need its own joinable
    columns, and shouldn't require a migration every time
    `BasketOptimizationResult` grows a field. One row per basket — re-running
    a comparison for the same basket overwrites it rather than accumulating
    history, since "basket history" is the list of `Basket` rows themselves.
    """

    __tablename__ = "basket_optimizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    basket_id: Mapped[int] = mapped_column(ForeignKey("baskets.id"), unique=True)
    optimization_json: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    basket: Mapped["Basket"] = relationship(back_populates="optimization")
