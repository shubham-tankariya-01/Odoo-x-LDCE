"""
Live database integration test fixtures.

Uses the real Neon PostgreSQL database with SAVEPOINT-based transaction
isolation: every test runs inside a nested transaction that is rolled back
after the test completes, so no test data persists in the database.

Strategy:
  Instead of managing our own event loop (which conflicts with TestClient's
  internal anyio loop), we override `get_db` with an async generator that:
    1. Acquires a connection from the real engine.
    2. Begins a transaction.
    3. Creates a SAVEPOINT (begin_nested).
    4. Binds an AsyncSession to the connection.
    5. Yields the session to the route handler.
    6. After the route completes, rolls back the transaction.

  This means EVERY request gets its own transaction that is rolled back.
  For read-only tests, this is transparent. For write tests (like register),
  the route's `session.commit()` commits the SAVEPOINT, but the outer
  transaction is rolled back in the `finally` block.
"""

import pytest
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool
from fastapi.testclient import TestClient

from backend.database import get_db
from backend.database.connection import DATABASE_URL
from backend.main import app
from backend.core.security import get_current_user, hash_password, create_access_token
from backend.models.user import User

# Create a test-specific engine with NullPool to prevent connection pooling 
# issues when TestClient's internal event loops close.
import ssl
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

test_engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": ssl_context},
    poolclass=NullPool
)


@pytest.fixture
def live_client():
    """
    A TestClient that overrides get_db to use the real Neon database
    with per-request transaction rollback for isolation.
    
    Also overrides get_current_user with a real user object (using a
    deterministic test UUID so we don't need to INSERT a user first
    for auth-protected read endpoints).
    """
    # Create a mock user for auth-protected endpoints.
    # This user object is NOT inserted into the DB — it's injected
    # directly into the dependency. For tests that need a real DB user
    # (like register), the test itself handles insertion.
    mock_user = User(
        id=uuid4(),
        first_name="LiveTest",
        last_name="User",
        email="livetest@example.com",
        password_hash=hash_password("testpassword"),
        is_admin=False,
    )

    async def override_get_db():
        """
        Each call acquires a real connection, begins a transaction,
        yields the session, then rolls back everything.
        """
        async with test_engine.connect() as connection:
            transaction = await connection.begin()
            try:
                session = AsyncSession(bind=connection, expire_on_commit=False)
                try:
                    yield session
                finally:
                    await session.close()
            finally:
                # ALWAYS rollback — even if the route called session.commit().
                # session.commit() flushes to the connection but does NOT
                # commit the connection-level transaction. We control that here.
                await transaction.rollback()

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
