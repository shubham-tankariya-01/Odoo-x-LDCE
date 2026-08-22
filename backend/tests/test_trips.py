import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from uuid import uuid4

# We mock the get_current_user and get_db to run some basic routing tests.
# These tests verify the route structures and input validations.

@pytest.mark.asyncio
async def test_create_trip_invalid_dates():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # We need a mocked token or to mock the dependency
        # For a full integration test we'd override get_current_user in app.dependency_overrides
        from backend.core.security import get_current_user
        from backend.models.user import User
        
        fake_user = User(id=uuid4(), email="test@test.com")
        
        def override_get_user():
            return fake_user
            
        app.dependency_overrides[get_current_user] = override_get_user
        
        response = await ac.post("/trips", json={
            "name": "Test Trip",
            "start_date": "2024-12-01",
            "end_date": "2024-11-01" # End before start
        })
        
        # We expect a 400 Bad Request due to our manual validation in the route or Pydantic (though Pydantic doesn't check this cross-field by default)
        # Wait, our trip create calls validate_trip_dates which raises 400
        assert response.status_code == 400
        assert response.json()["detail"] == "Trip end date cannot be before start date"
        
        # Clean up
        app.dependency_overrides.clear()
