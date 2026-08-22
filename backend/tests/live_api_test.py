import requests
import uuid
import sys
import json
from time import sleep

BASE_URL = "http://localhost:8000"
test_id = str(uuid.uuid4())[:8]

# Data trackers
token = None
headers = {}
city_id = None
catalog_activity_id = None
trip_id = None
section_id = None
trip_activity_id = None

results = []

def log_result(endpoint: str, success: bool, msg: str = ""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {endpoint} | {msg}")
    results.append({"endpoint": endpoint, "success": success, "msg": msg})

def run_tests():
    global token, headers, city_id, catalog_activity_id, trip_id, section_id, trip_activity_id
    
    print("🚀 Starting Live API Integration Tests...\n")
    
    # 1. Register User
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "first_name": "Test",
            "last_name": "User",
            "email": f"test_{test_id}@example.com",
            "password": "Password@123"
        })
        if resp.status_code == 201:
            token = resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            log_result("POST /auth/register", True)
        else:
            log_result("POST /auth/register", False, f"Status {resp.status_code}: {resp.text}")
            return
    except Exception as e:
        log_result("POST /auth/register", False, str(e))
        return

    # 2. Get Profile
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if resp.status_code == 200:
        log_result("GET /users/me", True)
    else:
        log_result("GET /users/me", False, resp.text)

    # 3. Patch Profile
    resp = requests.patch(f"{BASE_URL}/users/me", headers=headers, json={"city": "New York"})
    if resp.status_code == 200:
        log_result("PATCH /users/me", True)
    else:
        log_result("PATCH /users/me", False, resp.text)

    # 4. Catalog - Popular Cities
    resp = requests.get(f"{BASE_URL}/cities/popular", headers=headers)
    if resp.status_code == 200:
        cities = resp.json()
        log_result("GET /cities/popular", True, f"Found {len(cities)} cities")
        if cities:
            city_id = cities[0]["id"]
    else:
        log_result("GET /cities/popular", False, resp.text)

    # 5. Catalog - City Suggestions
    if city_id:
        resp = requests.get(f"{BASE_URL}/cities/{city_id}/suggestions", headers=headers)
        if resp.status_code == 200:
            acts = resp.json()
            log_result("GET /cities/{id}/suggestions", True, f"Found {len(acts)} activities")
            if acts:
                catalog_activity_id = acts[0]["id"]
        else:
            log_result("GET /cities/{id}/suggestions", False, resp.text)

    # 6. Create Trip
    resp = requests.post(f"{BASE_URL}/trips", headers=headers, json={
        "name": "Live Test Trip",
        "start_date": "2025-01-01",
        "end_date": "2025-01-10",
        "description": "Integration test trip"
    })
    if resp.status_code == 201:
        trip_id = resp.json()["id"]
        log_result("POST /trips", True)
    else:
        log_result("POST /trips", False, resp.text)

    if not trip_id:
        return

    # 7. Create Section
    section_payload = {
        "title": "Leg 1",
        "start_date": "2025-01-01",
        "end_date": "2025-01-05",
        "budget": 500.0
    }
    if city_id:
        section_payload["city_id"] = city_id

    resp = requests.post(f"{BASE_URL}/trips/{trip_id}/sections", headers=headers, json=section_payload)
    if resp.status_code == 201:
        section_id = resp.json()["id"]
        log_result("POST /trips/{id}/sections", True)
    else:
        log_result("POST /trips/{id}/sections", False, resp.text)

    # 8. Create Trip Activity
    if section_id and catalog_activity_id:
        resp = requests.post(f"{BASE_URL}/sections/{section_id}/activities", headers=headers, json={
            "activity_id": catalog_activity_id,
            "scheduled_date": "2025-01-02",
            "scheduled_time": "14:00:00",
            "notes": "Test activity"
        })
        if resp.status_code == 201:
            trip_activity_id = resp.json()["id"]
            log_result("POST /sections/{id}/activities", True)
        else:
            log_result("POST /sections/{id}/activities", False, resp.text)
    elif section_id:
        log_result("POST /sections/{id}/activities", False, "Skipped — No catalog_activity_id found in DB")

    # 9. Get Trip Itinerary
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}/itinerary", headers=headers)
    if resp.status_code == 200:
        log_result("GET /trips/{id}/itinerary", True)
    else:
        log_result("GET /trips/{id}/itinerary", False, resp.text)

    # 10. Get Trip Budget
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}/budget", headers=headers)
    if resp.status_code == 200:
        log_result("GET /trips/{id}/budget", True)
    else:
        log_result("GET /trips/{id}/budget", False, resp.text)

    # 11. Search
    resp = requests.get(f"{BASE_URL}/search?q=test")
    if resp.status_code == 200:
        log_result("GET /search", True)
    else:
        log_result("GET /search", False, resp.text)

    # 12. List My Trips
    resp = requests.get(f"{BASE_URL}/trips", headers=headers)
    if resp.status_code == 200:
        log_result("GET /trips", True)
    else:
        log_result("GET /trips", False, resp.text)
        
    # 13. Delete Activity
    if trip_activity_id:
        resp = requests.delete(f"{BASE_URL}/trip-activities/{trip_activity_id}", headers=headers)
        if resp.status_code == 204:
            log_result("DELETE /trip-activities/{id}", True)
        else:
            log_result("DELETE /trip-activities/{id}", False, resp.text)

    # 14. Delete Section
    if section_id:
        resp = requests.delete(f"{BASE_URL}/sections/{section_id}", headers=headers)
        if resp.status_code == 204:
            log_result("DELETE /sections/{id}", True)
        else:
            log_result("DELETE /sections/{id}", False, resp.text)

    print("\n" + "="*50)
    print("FINAL REPORT:")
    failed = [r for r in results if not r["success"]]
    if failed:
        print(f"❌ {len(failed)} endpoints failed:")
        for f in failed:
            print(f"  - {f['endpoint']}: {f['msg']}")
    else:
        print("✅ ALL TESTED ENDPOINTS PASSED SUCCESSFULLY!")
    print("="*50)

if __name__ == "__main__":
    run_tests()
