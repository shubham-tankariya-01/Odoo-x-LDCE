import os
import re
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @field_validator('DATABASE_URL')
    @classmethod
    def clean_db_url(cls, v: str) -> str:
        if not v:
            return v
        match = re.search(r"postgresql://[^\s'\"]+", v)
        extracted = match.group(0) if match else v.strip().strip("'").strip('"')
        if extracted.startswith("postgresql://"):
            extracted = extracted.replace("postgresql://", "postgresql+asyncpg://", 1)
        return extracted

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

settings = Settings()
