from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Grocery Advisor"
    database_url: str = "postgresql+asyncpg://grocery:grocery@db:5432/grocery_advisor"
    redis_url: str = "redis://redis:6379/0"
    claude_api_key: str | None = None
    openai_api_key: str | None = None
    environment: str = "development"
    curated_prices_path: str = "data/curated_prices.csv"
    ocr_engine: str = "tesseract"
    google_client_id: str | None = None
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
