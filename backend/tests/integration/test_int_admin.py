import pytest
from uuid import uuid4

pytestmark = pytest.mark.integration

# ─── Existing Tests ──────────────────────────────────────────────────

async def test_live_admin_get_users(live_client):
    response = await live_client.get("/admin/users")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0
    assert "total" in data

async def test_live_admin_analytics(live_client):
    response = await live_client.get("/admin/analytics/trends")
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_trips" in data

# ─── New Tests ────────────────────────────────────────────────────────

async def test_live_admin_guard_non_admin(live_client_nonadmin):
    """Non-admin user should get 403 on admin routes."""
    response = await live_client_nonadmin.get("/admin/users")
    assert response.status_code == 403

async def test_live_admin_popular_cities(live_client):
    """GET /admin/analytics/popular-cities returns list of city metrics."""
    response = await live_client.get("/admin/analytics/popular-cities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Each item should have city_name and section_count
    if data:
        assert "city_name" in data[0]
        assert "section_count" in data[0]

async def test_live_admin_popular_activities(live_client):
    """GET /admin/analytics/popular-activities returns list of activity metrics."""
    response = await live_client.get("/admin/analytics/popular-activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "activity_name" in data[0]
        assert "selection_count" in data[0]

async def test_live_admin_update_user(live_client):
    """Admin can PATCH a user's details."""
    # First, get the list of users to find a valid user_id
    res_users = await live_client.get("/admin/users")
    users = res_users.json()["items"]
    assert len(users) > 0
    user_id = users[0]["id"]

    # Update the user's first_name
    response = await live_client.patch(
        f"/admin/users/{user_id}",
        json={"first_name": "AdminUpdated"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "AdminUpdated"

async def test_live_admin_update_user_not_found(live_client):
    """PATCH a non-existent user returns 404."""
    fake_id = str(uuid4())
    response = await live_client.patch(
        f"/admin/users/{fake_id}",
        json={"first_name": "Ghost"}
    )
    assert response.status_code == 404

async def test_live_admin_delete_user_not_found(live_client):
    """DELETE a non-existent user returns 404."""
    fake_id = str(uuid4())
    response = await live_client.delete(f"/admin/users/{fake_id}")
    assert response.status_code == 404
