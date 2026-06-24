from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Grocery Advisor"
    database_url: str = "postgresql+asyncpg://grocery:grocery@db:5432/grocery_advisor"
    redis_url: str = "redis://redis:6379/0"
    claude_api_key: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    environment: str = "development"
    curated_prices_path: str = "data/curated_prices.csv"
    ocr_engine: str = "tesseract"
    google_client_id: str | None = None
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    # Which LLM extraction fallback to use when the rule-based bill parser
    # finds zero line items. "none" (the default) disables the fallback
    # entirely — a bill that the regex parser can't read just stays
    # unread, no API key required, no cost. Swapping this to "gemini",
    # "claude", or "openai" later is a config change, not a code change —
    # see app/services/llm_extraction/registry.py.
    llm_fallback_provider: str = "none"
    # Hard ceiling on fallback calls per UTC day, enforced via Redis
    # (app/services/llm_fallback_quota.py). Caps worst-case spend
    # independent of upload volume; tune up once usage data justifies it.
    llm_fallback_daily_cap: int = 200

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
