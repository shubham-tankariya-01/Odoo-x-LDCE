from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime, timezone
from backend.tests.test_catalog import setup_mock_db_result

# To test admin routes we need an admin user
import pytest
from backend.models.user import User

@pytest.fixture
def mock_admin_user():
    user = User(
        id=uuid4(),
        first_name="Admin",
        last_name="User",
        email="admin@example.com",
        password_hash="hashed_password",
        is_admin=True,
        created_at=datetime.now(timezone.utc)
    )
    return user

@pytest.fixture
def admin_client(client, mock_admin_user):
    from backend.main import app
    from backend.core.security import get_current_user
    
    def override_get_current_user():
        return mock_admin_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    yield client
    # Clean up is handled by the base client fixture's teardown, 
    # but we can also do it here if needed.

def test_admin_guard_non_admin(client):
    # The default client uses a non-admin user
    response = client.get("/admin/users")
    assert response.status_code == 403

def test_list_users(admin_client, mock_db_session):
    # First query is count, second is select
    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1
    
    mock_user = MagicMock()
    mock_user.id = uuid4()
    mock_user.email = "user@example.com"
    mock_user.is_admin = False
    mock_user.created_at = datetime.now(timezone.utc)
    mock_user.first_name = "User"
    mock_user.last_name = "Name"
    mock_user.phone_number = None
    mock_user.city = None
    mock_user.country = None
    mock_user.photo_url = None
    mock_user.additional_info = None
    
    mock_users_res = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_user]
    mock_users_res.scalars.return_value = mock_scalars
    
    mock_db_session.execute.side_effect = [mock_count_res, mock_users_res]
    
    response = admin_client.get("/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["email"] == "user@example.com"

def test_update_user_status(admin_client, mock_db_session):
    user_id = uuid4()
    mock_user = MagicMock()
    mock_user.id = user_id
    mock_user.is_admin = False
    mock_user.first_name = "User"
    mock_user.last_name = "Name"
    mock_user.email = "user@example.com"
    mock_user.created_at = datetime.now(timezone.utc)
    mock_user.phone_number = None
    mock_user.city = None
    mock_user.country = None
    mock_user.photo_url = None
    mock_user.additional_info = None
    
    setup_mock_db_result(mock_db_session, mock_user, is_scalar_first=True)
    
    async def mock_refresh(instance):
        pass
    mock_db_session.refresh.side_effect = mock_refresh
    
    response = admin_client.patch(f"/admin/users/{user_id}", json={"first_name": "Updated"})
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"

def test_delete_user(admin_client, mock_db_session):
    user_id = uuid4()
    mock_user = MagicMock()
    mock_user.id = user_id
    
    setup_mock_db_result(mock_db_session, mock_user, is_scalar_first=True)
    
    response = admin_client.delete(f"/admin/users/{user_id}")
    assert response.status_code == 204
    mock_db_session.delete.assert_called_once()
    mock_db_session.commit.assert_called_once()

def test_popular_cities(admin_client, mock_db_session):
    mock_row = MagicMock()
    mock_row.name = "Paris"
    mock_row.count = 50
    
    mock_res = MagicMock()
    mock_res.all.return_value = [mock_row]
    mock_db_session.execute.return_value = mock_res
    
    response = admin_client.get("/admin/analytics/popular-cities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["city_name"] == "Paris"
    assert data[0]["section_count"] == 50

def test_trends(admin_client, mock_db_session):
    mock_count = MagicMock()
    mock_count.scalar.return_value = 100
    
    mock_db_session.execute.return_value = mock_count
    
    response = admin_client.get("/admin/analytics/trends")
    assert response.status_code == 200
    data = response.json()
    assert data["total_users"] == 100
    assert data["total_trips"] == 100
    assert data["total_posts"] == 100
