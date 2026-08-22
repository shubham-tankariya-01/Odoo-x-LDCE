"""
Live database integration tests.

These 3 representative tests run against the real Neon PostgreSQL database
using per-request transaction rollback for isolation. No test data persists.

Tests:
  1. test_live_get_popular_cities — reads seeded cities from the real DB
  2. test_live_register_user — INSERTs a user via the /auth/register endpoint
  3. test_live_search_cities — E2E search against real seeded data
"""

import pytest
from backend.tests.conftest_live import live_client


# ---------------------------------------------------------------------------
# Test 1: Read seeded catalog data from the live database
# ---------------------------------------------------------------------------
def test_live_get_popular_cities(live_client):
    """
    The Neon DB has 18 seeded cities. This test verifies that
    GET /cities/popular actually returns real City rows from Postgres,
    not mocked objects.
    """
    response = live_client.get("/cities/popular")
    assert response.status_code == 200

    data = response.json()
    # The DB has 18 cities; popular returns top 10
    assert isinstance(data, list)
    assert len(data) > 0
    assert len(data) <= 10

    # Verify the response contains real fields with correct types
    city = data[0]
    assert "id" in city
    assert "name" in city
    assert "country" in city
    assert isinstance(city["name"], str)
    assert len(city["name"]) > 0

    # Verify sorting: popularity_score should be descending
    scores = [c.get("popularity_score", 0) for c in data]
    assert scores == sorted(scores, reverse=True), "Cities should be sorted by popularity descending"

    print(f"\n  [OK] Got {len(data)} real cities from Neon DB")
    print(f"  Top city: {data[0]['name']} ({data[0]['country']}) — popularity: {data[0]['popularity_score']}")


# ---------------------------------------------------------------------------
# Test 2: Register a new user (INSERT against real DB, with rollback)
# ---------------------------------------------------------------------------
def test_live_register_user(live_client):
    """
    POST /auth/register creates a real User row in the database.
    This test verifies that:
    - The INSERT executes valid SQL against the real schema.
    - The response includes a valid JWT and user fields.
    - After the request, the transaction is rolled back (no user persists).
    """
    register_data = {
        "first_name": "Integration",
        "last_name": "TestUser",
        "email": "integration_test_unique_xyz@example.com",
        "password": "securepassword123"
    }
    response = live_client.post("/auth/register", json=register_data)

    assert response.status_code == 201, f"Registration failed: {response.text}"
    data = response.json()

    # Verify JWT was returned
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Verify user data
    assert data["user"]["email"] == "integration_test_unique_xyz@example.com"
    assert data["user"]["first_name"] == "Integration"
    assert "id" in data["user"]

    print(f"\n  [OK] Registered user with real UUID: {data['user']['id']}")
    print(f"  JWT token length: {len(data['access_token'])} chars")

    # Now verify the user does NOT persist — try registering again with same email.
    # If rollback worked, this should succeed (email not already taken).
    response2 = live_client.post("/auth/register", json=register_data)
    assert response2.status_code == 201, (
        f"Second registration with same email failed ({response2.status_code}), "
        f"which means the first registration's data was NOT rolled back! "
        f"Response: {response2.text}"
    )
    print("  [OK] Rollback verified: same email registered twice without conflict")


# ---------------------------------------------------------------------------
# Test 3: E2E search against real seeded data
# ---------------------------------------------------------------------------
def test_live_search_cities(live_client):
    """
    GET /search?q= hits the real database and returns matching cities
    and trips. The Neon DB has 18 seeded cities, so searching for a
    common substring should return results.
    """
    # First, get a city name to search for
    cities_response = live_client.get("/cities/popular")
    assert cities_response.status_code == 200
    cities = cities_response.json()
    assert len(cities) > 0

    # Pick the first city and search for a substring of its name
    target_city = cities[0]["name"]
    search_term = target_city[:3]  # e.g. "Par" from "Paris"

    response = live_client.get(f"/search?q={search_term}")
    assert response.status_code == 200

    data = response.json()
    assert "cities" in data
    assert "trips" in data
    assert isinstance(data["cities"], list)
    assert isinstance(data["trips"], list)

    # We should find at least the city we searched for
    city_names = [c["name"] for c in data["cities"]]
    matching = [n for n in city_names if search_term.lower() in n.lower()]
    assert len(matching) > 0, f"Expected to find cities matching '{search_term}', got: {city_names}"

    print(f"\n  [OK] Search for '{search_term}' returned {len(data['cities'])} cities and {len(data['trips'])} trips")
    print(f"  Matching cities: {matching}")
