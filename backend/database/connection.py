import os
import re
import ssl
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

# Load .env file from local database folder or parent backend folder
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"

load_dotenv(dotenv_path=env_path)
raw_url = os.getenv("DATABASE_URL", "")

def clean_database_url(url: str) -> str:
    if not url:
        return ""
    # Extract string inside quotes if format is: psql 'postgresql://...'
    match = re.search(r"postgresql(\+asyncpg)?://[^\s'\"]+", url)
    if match:
        extracted = match.group(0)
    else:
        extracted = url.strip().strip("'").strip('"')

    # Ensure driver is asyncpg
    if extracted.startswith("postgresql://"):
        extracted = extracted.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Strip unsupported psycopg parameters for asyncpg
    if "?" in extracted:
        extracted = extracted.split("?")[0]
        
    return extracted

DATABASE_URL = clean_database_url(raw_url)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not configured.")

# Create a permissive SSL context for Neon (asyncpg requires this instead of sslmode=require in URL)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Create async SQLAlchemy engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"ssl": ssl_context},
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI Dependency for async database session management."""
    async with SessionLocal() as session:
        yield session

async def test_connection() -> dict:
    """Test Neon async database connectivity and return status details."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version(), current_database(), current_user;"))
            row = result.fetchone()
            return {
                "status": "connected",
                "version": row[0] if row else "Unknown",
                "database": row[1] if row else "Unknown",
                "user": row[2] if row else "Unknown",
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }
