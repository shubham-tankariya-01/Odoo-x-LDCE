import pytest

pytestmark = pytest.mark.integration

async def test_live_search_cities(live_client):
    cities_response = await live_client.get("/cities/popular")
    assert cities_response.status_code == 200
    cities = cities_response.json()
    if not cities:
        pytest.skip("No seeded cities found in the DB")

    target_city = cities[0]["name"]
    search_term = target_city[:3]

    response = await live_client.get(f"/search?q={search_term}")
    assert response.status_code == 200

    data = response.json()
    assert "cities" in data
    assert "trips" in data
    
    city_names = [c["name"] for c in data["cities"]]
    matching = [n for n in city_names if search_term.lower() in n.lower()]
    assert len(matching) > 0
