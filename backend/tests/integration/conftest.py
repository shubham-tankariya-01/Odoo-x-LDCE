"""
Live database integration test fixtures.

Uses the real Neon PostgreSQL database with per-request transaction
isolation: every test runs inside a transaction that is rolled back
after the test completes, so no test data persists.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool
from httpx import AsyncClient, ASGITransport

from backend.database import get_db
from backend.database.connection import DATABASE_URL
from backend.main import app
from backend.core.security import get_current_user, hash_password, create_access_token
from backend.models.user import User

import ssl
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

test_engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": ssl_context},
    poolclass=NullPool
)

@pytest_asyncio.fixture
async def db_session():
    """
    Creates a single database connection and transaction for the duration of a test.
    Rolls back the transaction after the test completes.
    """
    async with test_engine.connect() as connection:
        transaction = await connection.begin()
        # Create a single session that will be used for all requests in the test
        # join_transaction_mode="create_savepoint" ensures that app-level commits
        # create savepoints instead of committing the actual transaction.
        session = AsyncSession(
            bind=connection,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint"
        )
        yield session
        await session.close()
        await transaction.rollback()

@pytest_asyncio.fixture
async def live_client(db_session):
    """
    An AsyncClient that overrides get_db to use the real Neon database.
    It uses a single test-scoped transaction so data persists across requests
    within the same test, but rolls back entirely after the test finishes.
    """
    mock_user = User(
        id=uuid4(),
        first_name="LiveTest",
        last_name="User",
        email="livetest@example.com",
        password_hash=hash_password("testpassword"),
        is_admin=True,
        created_at=datetime.now(timezone.utc)
    )

    # Insert the mock_user into the live DB transaction so Foreign Key constraints pass!
    db_session.add(mock_user)
    await db_session.flush()

    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def live_client_nonadmin(db_session):
    """
    An AsyncClient that overrides get_db and get_current_user with a NON-admin user.
    Used for testing admin route guards (should return 403).
    """
    nonadmin_user = User(
        id=uuid4(),
        first_name="Regular",
        last_name="User",
        email="nonadmin@example.com",
        password_hash=hash_password("testpassword"),
        is_admin=False,
        created_at=datetime.now(timezone.utc)
    )

    db_session.add(nonadmin_user)
    await db_session.flush()

    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return nonadmin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
