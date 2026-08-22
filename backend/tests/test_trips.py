from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4
from datetime import date, datetime, timezone
from decimal import Decimal

from backend.tests.test_catalog import setup_mock_db_result
from backend.models.trip import Trip
from backend.models.section import Section
from backend.models.section_activity import SectionActivity

# ─── Helper ──────────────────────────────────────────────────────────
def make_mock_trip(user_id, **overrides):
    trip = MagicMock(spec=Trip)
    trip.id = overrides.get("id", uuid4())
    trip.user_id = user_id
    trip.name = overrides.get("name", "Europe Trip")
    trip.start_date = overrides.get("start_date", date(2024, 12, 1))
    trip.end_date = overrides.get("end_date", date(2024, 12, 10))
    trip.description = overrides.get("description", "My Euro trip")
    trip.cover_photo_url = overrides.get("cover_photo_url", None)
    trip.status = overrides.get("status", "upcoming")
    trip.created_at = overrides.get("created_at", datetime.now(timezone.utc))
    return trip

def make_mock_section(trip_id, **overrides):
    section = MagicMock(spec=Section)
    section.id = overrides.get("id", uuid4())
    section.trip_id = trip_id
    section.city_id = overrides.get("city_id", uuid4())
    section.title = overrides.get("title", "Paris Days")
    section.description = overrides.get("description", "Exploring Paris")
    section.start_date = overrides.get("start_date", date(2024, 12, 1))
    section.end_date = overrides.get("end_date", date(2024, 12, 4))
    section.budget = overrides.get("budget", Decimal("500.00"))
    section.order_index = overrides.get("order_index", 0)
    section.created_at = overrides.get("created_at", datetime.now(timezone.utc))
    return section


# ═══════════════════════════════════════════════════════════════════════
#  TRIPS
# ═══════════════════════════════════════════════════════════════════════

def test_create_trip(client, mock_db_session, mock_current_user):
    """POST /trips — 201 on valid data."""
    async def mock_refresh(instance):
        instance.id = uuid4()
        instance.status = "upcoming"
        instance.created_at = datetime.now(timezone.utc)

    mock_db_session.refresh.side_effect = mock_refresh

    payload = {
        "name": "Europe Trip",
        "start_date": "2024-12-01",
        "end_date": "2024-12-10",
        "description": "My Euro trip"
    }
    response = client.post("/trips", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Europe Trip"
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()


def test_create_trip_invalid_dates(client, mock_db_session, mock_current_user):
    """POST /trips — 400 when end_date < start_date."""
    payload = {
        "name": "Bad Trip",
        "start_date": "2024-12-10",
        "end_date": "2024-12-01"   # end before start
    }
    response = client.post("/trips", json=payload)
    assert response.status_code == 400
    assert "end date cannot be before start date" in response.json()["detail"].lower()


def test_list_trips(client, mock_db_session, mock_current_user):
    """GET /trips — 200 with list of trips."""
    mock_trip = make_mock_trip(mock_current_user.id)
    setup_mock_db_result(mock_db_session, [mock_trip], is_scalar_first=False)

    response = client.get("/trips")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Europe Trip"


def test_get_my_trips(client, mock_db_session, mock_current_user):
    """GET /users/me/trips — 200."""
    mock_trip = make_mock_trip(mock_current_user.id, status="upcoming")
    setup_mock_db_result(mock_db_session, [mock_trip], is_scalar_first=False)

    response = client.get("/users/me/trips?type=preplanned")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# ═══════════════════════════════════════════════════════════════════════
#  SECTIONS
# ═══════════════════════════════════════════════════════════════════════

def test_create_section(client, mock_db_session, mock_current_user):
    """POST /trips/{trip_id}/sections — 201."""
    trip_id = uuid4()
    mock_trip = make_mock_trip(mock_current_user.id, id=trip_id)

    # First call: get_trip_or_404 (scalars().first())
    # Second call: max order_index (scalar())
    # We need to set up the mock to return different things on successive calls
    mock_result_trip = MagicMock()
    mock_scalars_trip = MagicMock()
    mock_scalars_trip.first.return_value = mock_trip
    mock_result_trip.scalars.return_value = mock_scalars_trip

    mock_result_max = MagicMock()
    mock_result_max.scalar.return_value = 0

    mock_db_session.execute = AsyncMock(side_effect=[mock_result_trip, mock_result_max])

    async def mock_refresh(instance):
        instance.id = uuid4()
        instance.order_index = 1
        instance.created_at = datetime.now(timezone.utc)

    mock_db_session.refresh.side_effect = mock_refresh

    payload = {
        "start_date": "2024-12-01",
        "end_date": "2024-12-04",
        "title": "Paris Days",
        "budget": 500.0
    }
    response = client.post(f"/trips/{trip_id}/sections", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Paris Days"


def test_create_section_bad_dates(client, mock_db_session, mock_current_user):
    """POST /trips/{trip_id}/sections — 400 if section dates outside trip."""
    trip_id = uuid4()
    mock_trip = make_mock_trip(mock_current_user.id, id=trip_id,
                               start_date=date(2024, 12, 1), end_date=date(2024, 12, 10))

    mock_result = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.first.return_value = mock_trip
    mock_result.scalars.return_value = mock_scalars
    mock_db_session.execute = AsyncMock(return_value=mock_result)

    payload = {
        "start_date": "2024-11-01",   # Before trip start
        "end_date": "2024-11-05"
    }
    response = client.post(f"/trips/{trip_id}/sections", json=payload)
    assert response.status_code == 400


def test_list_sections(client, mock_db_session, mock_current_user):
    """GET /trips/{trip_id}/sections — 200."""
    trip_id = uuid4()
    mock_trip = make_mock_trip(mock_current_user.id, id=trip_id)
    mock_section = make_mock_section(trip_id)

    # First call: get_trip_or_404
    mock_result_trip = MagicMock()
    mock_scalars_trip = MagicMock()
    mock_scalars_trip.first.return_value = mock_trip
    mock_result_trip.scalars.return_value = mock_scalars_trip

    # Second call: list sections
    mock_result_sections = MagicMock()
    mock_scalars_sections = MagicMock()
    mock_scalars_sections.all.return_value = [mock_section]
    mock_result_sections.scalars.return_value = mock_scalars_sections

    mock_db_session.execute = AsyncMock(side_effect=[mock_result_trip, mock_result_sections])

    response = client.get(f"/trips/{trip_id}/sections")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1


# ═══════════════════════════════════════════════════════════════════════
#  TRIP ACTIVITIES
# ═══════════════════════════════════════════════════════════════════════

def test_create_trip_activity(client, mock_db_session, mock_current_user):
    """POST /sections/{section_id}/activities — 201."""
    trip_id = uuid4()
    section_id = uuid4()
    activity_id = uuid4()

    mock_section = make_mock_section(trip_id, id=section_id)
    mock_trip = make_mock_trip(mock_current_user.id, id=trip_id)

    # First call: get section
    mock_result_section = MagicMock()
    mock_scalars_section = MagicMock()
    mock_scalars_section.first.return_value = mock_section
    mock_result_section.scalars.return_value = mock_scalars_section

    # Second call: get_trip_or_404
    mock_result_trip = MagicMock()
    mock_scalars_trip = MagicMock()
    mock_scalars_trip.first.return_value = mock_trip
    mock_result_trip.scalars.return_value = mock_scalars_trip

    mock_db_session.execute = AsyncMock(side_effect=[mock_result_section, mock_result_trip])

    async def mock_refresh(instance):
        instance.id = uuid4()

    mock_db_session.refresh.side_effect = mock_refresh

    payload = {
        "activity_id": str(activity_id),
        "scheduled_date": "2024-12-02",
        "notes": "Morning visit"
    }
    response = client.post(f"/sections/{section_id}/activities", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["notes"] == "Morning visit"


def test_create_activity_bad_date(client, mock_db_session, mock_current_user):
    """POST /sections/{section_id}/activities — 400 if date outside section range."""
    trip_id = uuid4()
    section_id = uuid4()
    activity_id = uuid4()

    mock_section = make_mock_section(trip_id, id=section_id,
                                     start_date=date(2024, 12, 1), end_date=date(2024, 12, 4))
    mock_trip = make_mock_trip(mock_current_user.id, id=trip_id)

    mock_result_section = MagicMock()
    mock_scalars_section = MagicMock()
    mock_scalars_section.first.return_value = mock_section
    mock_result_section.scalars.return_value = mock_scalars_section

    mock_result_trip = MagicMock()
    mock_scalars_trip = MagicMock()
    mock_scalars_trip.first.return_value = mock_trip
    mock_result_trip.scalars.return_value = mock_scalars_trip

    mock_db_session.execute = AsyncMock(side_effect=[mock_result_section, mock_result_trip])

    payload = {
        "activity_id": str(activity_id),
        "scheduled_date": "2024-12-25"   # Way outside section
    }
    response = client.post(f"/sections/{section_id}/activities", json=payload)
    assert response.status_code == 400
