import pytest

pytestmark = pytest.mark.integration

async def test_live_get_popular_cities(live_client):
    response = await live_client.get("/cities/popular")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert len(data) <= 10
        city = data[0]
        assert "id" in city
        assert "name" in city
        assert "country" in city

        scores = [c.get("popularity_score", 0) for c in data]
        assert scores == sorted(scores, reverse=True)

async def test_live_get_cities_with_search(live_client):
    # Find a city to search for
    pop_response = await live_client.get("/cities/popular")
    cities = pop_response.json()
    if not cities:
        pytest.skip("No seeded cities found in the DB")
        
    target_city = cities[0]["name"]
    search_term = target_city[:3]
    
    response = await live_client.get(f"/cities?search={search_term}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(target_city in c["name"] for c in data)

async def test_live_get_city_by_id(live_client):
    pop_response = await live_client.get("/cities/popular")
    cities = pop_response.json()
    if not cities:
        pytest.skip("No seeded cities found in the DB")
        
    city_id = cities[0]["id"]
    response = await live_client.get(f"/cities/{city_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == city_id

async def test_live_get_city_not_found(live_client):
    import uuid
    response = await live_client.get(f"/cities/{uuid.uuid4()}")
    assert response.status_code == 404

async def test_live_get_activities(live_client):
    response = await live_client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "name" in data[0]
        assert "cost" in data[0]

async def test_live_get_activity_by_id(live_client):
    acts_response = await live_client.get("/activities")
    acts = acts_response.json()
    if not acts:
        pytest.skip("No seeded activities found in the DB")
        
    act_id = acts[0]["id"]
    response = await live_client.get(f"/activities/{act_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == act_id
    assert "city" in data # ActivityDetailRead includes city
