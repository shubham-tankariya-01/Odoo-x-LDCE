import os
import re
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load .env file from local database folder or parent backend folder
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR / "db.env"

load_dotenv(dotenv_path=env_path)

raw_url = os.getenv("DATABASE_URL", "")

# Clean raw DATABASE_URL if wrapped in psql command or extra quotes
def clean_database_url(url: str) -> str:
    if not url:
        return ""
    # Extract string inside quotes if format is: psql 'postgresql://...'
    match = re.search(r"postgresql://[^\s'\"]+", url)
    if match:
        extracted = match.group(0)
    else:
        extracted = url.strip().strip("'").strip('"')

    # Convert postgresql:// to postgresql+psycopg:// for SQLAlchemy if driver not specified
    if extracted.startswith("postgresql://"):
        extracted = extracted.replace("postgresql://", "postgresql+psycopg://", 1)
    
    return extracted

DATABASE_URL = clean_database_url(raw_url)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not configured.")

# Create SQLAlchemy engine with SSL and pool ping options suitable for Neon PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection() -> dict:
    """Test Neon database connectivity and return status details."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version(), current_database(), current_user;")).fetchone()
            return {
                "status": "connected",
                "version": result[0] if result else "Unknown",
                "database": result[1] if result else "Unknown",
                "user": result[2] if result else "Unknown",
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }

if __name__ == "__main__":
    print("Testing connection to Neon PostgreSQL...")
    res = test_connection()
    print("Result:", res)
