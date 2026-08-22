import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.main import app
from backend.database import get_db

@pytest.fixture
def anyio_backend():
    return "asyncio"

# We won't actually hit a real DB for these tests since the DB engineer hasn't set it up.
# We'll mock the get_db dependency in specific tests.
