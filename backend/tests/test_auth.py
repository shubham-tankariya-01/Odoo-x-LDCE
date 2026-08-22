from datetime import timedelta, datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

from backend.models.user import User
from backend.core.security import hash_password, verify_password, create_access_token
from backend.tests.test_catalog import setup_mock_db_result

def test_password_hashing():
    plain = "secret123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_jwt_creation():
    token = create_access_token(data={"sub": "123"})
    assert isinstance(token, str)
    assert len(token) > 20

def test_register_user(client, mock_db_session):
    # Mock uniqueness check (email not found)
    setup_mock_db_result(mock_db_session, None, is_scalar_first=True)
    
    async def mock_refresh(instance):
        instance.id = uuid4()
        instance.is_admin = False
        instance.created_at = datetime.now(timezone.utc)
    
    mock_db_session.refresh.side_effect = mock_refresh
    
    register_data = {
        "first_name": "New",
        "last_name": "User",
        "email": "newuser@example.com",
        "password": "securepassword123"
    }
    response = client.post("/auth/register", json=register_data)
    
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

def test_login_user(client, mock_db_session):
    mock_user = User(
        id=uuid4(),
        first_name="Existing",
        last_name="User",
        email="existing@example.com",
        password_hash=hash_password("mypassword"),
        is_admin=False,
        created_at=datetime.now(timezone.utc)
    )
    
    setup_mock_db_result(mock_db_session, mock_user, is_scalar_first=True)
    
    login_data = {
        "username": "existing@example.com",
        "password": "mypassword"
    }
    # OAuth2 uses Form data, not JSON
    response = client.post("/auth/login", data=login_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
