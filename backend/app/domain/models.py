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
    household: Mapped["Household | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Household(Base):
    """The unit of onboarding intelligence, replacing the bill-upload-first
    model: a household exists, and accrues signal, independently of whether
    its owner ever uploads a bill. `user_id` is nullable for the same reason
    `BillUpload.user_id` is — early beta usage shouldn't require an account.
    """

    __tablename__ = "households"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), unique=True, nullable=True)
    size: Mapped[int] = mapped_column(Integer)
    adults: Mapped[int] = mapped_column(Integer)
    children: Mapped[int] = mapped_column(Integer, default=0)
    seniors: Mapped[int] = mapped_column(Integer, default=0)
    city: Mapped[str] = mapped_column(String(128))
    monthly_grocery_budget: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="household")
    shopping_behavior: Mapped["ShoppingBehavior | None"] = relationship(
        back_populates="household", uselist=False, cascade="all, delete-orphan"
    )
    shopping_style: Mapped["ShoppingStyle | None"] = relationship(
        back_populates="household", uselist=False, cascade="all, delete-orphan"
    )


class ShoppingBehavior(Base):
    """Step 2 of onboarding: where and how often a household shops.
    `stores` is JSON (a small fixed-vocabulary multi-select) rather than a
    join table for the same reason `UserPreferences` uses JSON — open-ended,
    never queried/joined on independently of its household.
    """

    __tablename__ = "shopping_behaviors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    household_id: Mapped[int] = mapped_column(ForeignKey("households.id"), unique=True)
    stores: Mapped[list[str]] = mapped_column(JSON, default=list)
    frequency: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    household: Mapped["Household"] = relationship(back_populates="shopping_behavior")


class ShoppingStyle(Base):
    """Step 3 of onboarding: self-reported shopping priorities
    (convenience-first, save-money, premium-brands, etc.) — a fixed-
    vocabulary multi-select, same JSON reasoning as `ShoppingBehavior.stores`.
    """

    __tablename__ = "shopping_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    household_id: Mapped[int] = mapped_column(ForeignKey("households.id"), unique=True)
    priorities: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    household: Mapped["Household"] = relationship(back_populates="shopping_style")


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
    unparsed_ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    store_name: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    bill_date: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    used_llm_fallback: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="baskets")
    bill_upload: Mapped["BillUpload | None"] = relationship(back_populates="basket")
    items: Mapped[list["BasketItem"]] = relationship(back_populates="basket")
    optimization: Mapped["BasketOptimization | None"] = relationship(
        back_populates="basket", uselist=False, cascade="all, delete-orphan"
    )


class BasketItem(Base):
    """`matched_product_id`/`match_confidence`/`match_tier` are the output of
    the alias-matching layer (see `product_alias_service.py`); `review_status`
    tracks where the item sits in the verification loop. All four are
    nullable/defaulted because manually-entered baskets (`routes_baskets.py`)
    never run alias matching against an `Basket.bill_upload_id`-less row.
    """

    __tablename__ = "basket_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    basket_id: Mapped[int] = mapped_column(ForeignKey("baskets.id"))
    product_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[float] = mapped_column(Numeric(10, 2))
    unit: Mapped[str] = mapped_column(String(16))
    total_price: Mapped[float] = mapped_column(Numeric(10, 2))

    matched_product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    match_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3), nullable=True)
    match_tier: Mapped[str | None] = mapped_column(String(16), nullable=True)  # 'auto' | 'suggest' | 'manual'
    review_status: Mapped[str] = mapped_column(String(16), default="auto_confirmed", server_default="auto_confirmed")
    # 'auto_confirmed' | 'pending_review' | 'user_confirmed' | 'user_edited' | 'user_rejected'

    basket: Mapped["Basket"] = relationship(back_populates="items")
    recommendation: Mapped["BasketRecommendation | None"] = relationship(back_populates="basket_item", uselist=False)


class ProductAlias(Base):
    """The product-intelligence learning system's permanent memory: every
    raw OCR string ever matched (or corrected by a user) to a canonical
    product, with a confidence score that strengthens every time the same
    alias gets confirmed again. This table is the data moat — it is the one
    thing in this pipeline meant to grow forever and never be wiped.
    """

    __tablename__ = "product_aliases"

    alias_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    raw_text: Mapped[str] = mapped_column(String(255))
    canonical_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    confidence_score: Mapped[float] = mapped_column(Numeric(4, 3), default=1.0)
    source_bill_id: Mapped[int | None] = mapped_column(ForeignKey("bill_uploads.id"), nullable=True)
    user_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    times_seen: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    canonical_product: Mapped["Product"] = relationship()

    __table_args__ = (
        Index("ix_product_aliases_raw_text_trgm", "raw_text", postgresql_using="gin", postgresql_ops={"raw_text": "gin_trgm_ops"}),
        Index("ix_product_aliases_canonical_product", "canonical_product_id"),
    )


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
