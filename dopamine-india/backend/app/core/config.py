from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "local"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dopamine_india"
    redis_url: str = "redis://localhost:6379/0"
    supabase_url: str = ""
    supabase_jwt_secret: str = ""

    class Config:
        env_prefix = "DOPAMINE_"
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
