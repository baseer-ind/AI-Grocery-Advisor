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

    class Config:
        env_file = ".env"


settings = Settings()
