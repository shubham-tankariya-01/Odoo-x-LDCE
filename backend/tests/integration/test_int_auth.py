import pytest

pytestmark = pytest.mark.integration

async def test_live_register_user(live_client):
    register_data = {
        "first_name": "Integration",
        "last_name": "TestUser",
        "email": "integration_test_unique_xyz@example.com",
        "password": "securepassword123"
    }
    response = await live_client.post("/auth/register", json=register_data)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "integration_test_unique_xyz@example.com"
    
    # Verify that data persists within the same test (no per-request rollback anymore)
    response2 = await live_client.post("/auth/register", json=register_data)
    assert response2.status_code == 409
    assert "already registered" in response2.json()["detail"].lower()

async def test_live_login_user(live_client):
    # First, register a user
    register_data = {
        "first_name": "Integration",
        "last_name": "LoginUser",
        "email": "login_test@example.com",
        "password": "securepassword123"
    }
    await live_client.post("/auth/register", json=register_data)
    
    # Now try logging in with the form data (OAuth2PasswordRequestForm expects form data, not json)
    login_data = {
        "username": "login_test@example.com",
        "password": "securepassword123"
    }
    response = await live_client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
