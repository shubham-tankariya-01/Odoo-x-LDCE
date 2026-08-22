import pytest

pytestmark = pytest.mark.integration

async def test_live_get_current_user_profile(live_client):
    response = await live_client.get("/users/me")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["email"] == "livetest@example.com"
    assert data["first_name"] == "LiveTest"

async def test_live_update_user_profile(live_client):
    update_data = {
        "first_name": "Updated",
        "last_name": "Name",
        "phone_number": "+1234567890",
        "city": "TestCity",
        "country": "TestCountry"
    }
    
    response = await live_client.patch("/users/me", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["city"] == "TestCity"

async def test_live_upload_profile_photo(live_client):
    import base64
    # Real 1x1 PNG transparent pixel binary bytes
    real_png_bytes = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )
    files = {"file": ("test.png", real_png_bytes, "image/png")}
    response = await live_client.post("/users/me/photo", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "photo_url" in data
    # Cloudinary URLs usually contain res.cloudinary.com
    assert "cloudinary.com" in data["photo_url"]

