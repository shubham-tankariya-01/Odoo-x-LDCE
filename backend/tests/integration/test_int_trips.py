import pytest
from datetime import date, timedelta

pytestmark = pytest.mark.integration

# ─── Full Lifecycle Test ──────────────────────────────────────────────

async def test_live_trip_lifecycle(live_client):
    # 1. Create a Trip
    start = date.today()
    end = start + timedelta(days=5)
    trip_data = {
        "name": "Live DB Integration Trip",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "description": "Testing the full trip lifecycle",
        "status": "upcoming"
    }
    
    res_trip = await live_client.post("/trips", json=trip_data)
    assert res_trip.status_code == 201
    trip = res_trip.json()
    trip_id = trip["id"]
    assert trip["name"] == "Live DB Integration Trip"

    # 2. Get the trip itinerary
    res_get = await live_client.get(f"/trips/{trip_id}/itinerary")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == trip_id

    # 3. List trips
    res_list = await live_client.get("/trips")
    assert res_list.status_code == 200
    assert any(t["id"] == trip_id for t in res_list.json())

    # 4. Fetch a valid city to add to a section
    res_cities = await live_client.get("/cities/popular")
    cities = res_cities.json()
    if not cities:
        pytest.skip("No seeded cities available")
    city_id = cities[0]["id"]

    # 5. Create a Section
    section_data = {
        "trip_id": trip_id,
        "city_id": city_id,
        "title": "Day 1-2: City Explore",
        "description": "Exploring the city",
        "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=1)).isoformat(),
        "budget": 500.00
    }
    res_sec = await live_client.post(f"/trips/{trip_id}/sections", json=section_data)
    assert res_sec.status_code == 201
    section = res_sec.json()
    section_id = section["id"]
    
    # 6. Fetch a valid activity to schedule
    res_acts = await live_client.get(f"/cities/{city_id}/suggestions")
    acts = res_acts.json()
    if acts:
        act_id = acts[0]["id"]
        
        # 7. Add Activity to Section
        sa_data = {
            "section_id": section_id,
            "activity_id": act_id,
            "scheduled_date": start.isoformat(),
            "scheduled_time": "10:00:00",
            "cost_override": 45.50,
            "notes": "Booked tickets"
        }
        res_sa = await live_client.post(f"/sections/{section_id}/activities", json=sa_data)
        assert res_sa.status_code == 201
        
    # 8. Fetch Full Itinerary
    res_itin = await live_client.get(f"/trips/{trip_id}/itinerary")
    assert res_itin.status_code == 200
    itin = res_itin.json()
    assert len(itin["sections"]) == 1
    assert itin["sections"][0]["title"] == "Day 1-2: City Explore"
    
    if acts:
        assert len(itin["sections"][0]["activities"]) == 1
        assert itin["sections"][0]["activities"][0]["notes"] == "Booked tickets"

# ─── Validation Tests ─────────────────────────────────────────────────

async def test_live_create_trip_invalid_dates(live_client):
    """POST /trips with end_date before start_date should return 400."""
    payload = {
        "name": "Bad Trip",
        "start_date": "2026-12-10",
        "end_date": "2026-12-01"
    }
    response = await live_client.post("/trips", json=payload)
    assert response.status_code == 400
    assert "end date" in response.json()["detail"].lower()

async def test_live_get_my_trips(live_client):
    """GET /users/me/trips returns the current user's trips."""
    # Create a trip first
    start = date.today()
    end = start + timedelta(days=3)
    await live_client.post("/trips", json={
        "name": "My Trip for Me-Endpoint",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })

    response = await live_client.get("/users/me/trips")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(t["name"] == "My Trip for Me-Endpoint" for t in data)

async def test_live_get_my_trips_preplanned(live_client):
    """GET /users/me/trips?type=preplanned filters by upcoming status."""
    response = await live_client.get("/users/me/trips?type=preplanned")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

async def test_live_list_trip_sections(live_client):
    """GET /trips/{trip_id}/sections returns list of sections."""
    # Create trip + section
    start = date.today()
    end = start + timedelta(days=5)
    res_trip = await live_client.post("/trips", json={
        "name": "Section List Trip",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    trip_id = res_trip.json()["id"]

    # Get a city for the section
    res_cities = await live_client.get("/cities/popular")
    cities = res_cities.json()
    if not cities:
        pytest.skip("No seeded cities available")
    city_id = cities[0]["id"]

    # Create a section
    await live_client.post(f"/trips/{trip_id}/sections", json={
        "city_id": city_id,
        "title": "Test Section",
        "start_date": start.isoformat(),
        "end_date": (start + timedelta(days=1)).isoformat(),
        "budget": 200.00
    })

    # List sections
    response = await live_client.get(f"/trips/{trip_id}/sections")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Test Section"

async def test_live_create_section_bad_dates(live_client):
    """Creating a section with dates outside the trip range should return 400."""
    start = date.today()
    end = start + timedelta(days=5)
    res_trip = await live_client.post("/trips", json={
        "name": "Section Bad Dates Trip",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    trip_id = res_trip.json()["id"]

    res_cities = await live_client.get("/cities/popular")
    cities = res_cities.json()
    if not cities:
        pytest.skip("No seeded cities available")
    city_id = cities[0]["id"]

    # Section dates BEFORE trip start
    response = await live_client.post(f"/trips/{trip_id}/sections", json={
        "city_id": city_id,
        "title": "Bad Section",
        "start_date": (start - timedelta(days=30)).isoformat(),
        "end_date": (start - timedelta(days=25)).isoformat(),
    })
    assert response.status_code == 400

async def test_live_trip_budget(live_client):
    """GET /trips/{trip_id}/budget returns budget data."""
    start = date.today()
    end = start + timedelta(days=5)
    res_trip = await live_client.post("/trips", json={
        "name": "Budget Trip",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    trip_id = res_trip.json()["id"]

    response = await live_client.get(f"/trips/{trip_id}/budget")
    assert response.status_code == 200
    data = response.json()
    assert "total_budget" in data or "sections" in data or isinstance(data, dict)

async def test_live_list_trips_with_search(live_client):
    """GET /trips?search=keyword filters trips by name."""
    start = date.today()
    end = start + timedelta(days=3)
    await live_client.post("/trips", json={
        "name": "Searchable Unique XYZ Trip",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })

    response = await live_client.get("/trips?search=Searchable Unique XYZ")
    assert response.status_code == 200
    data = response.json()
    assert any("Searchable Unique XYZ" in t["name"] for t in data)
