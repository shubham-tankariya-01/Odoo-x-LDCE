import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

from backend.main import app
from backend.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture
def mock_db_session():
    """Mock database session for overriding get_db dependency."""
    session = MagicMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    return session

@pytest.fixture
def mock_current_user():
    """Returns a mock User instance."""
    user = User(
        id=uuid4(),
        first_name="Test",
        last_name="User",
        email="test@example.com",
        password_hash="hashed_password",
        is_admin=False,
        created_at=datetime.now(timezone.utc)
    )
    return user

@pytest.fixture
def client(mock_db_session, mock_current_user):
    """TestClient with overridden dependencies."""
    def override_get_db():
        yield mock_db_session

    def override_get_current_user():
        return mock_current_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
