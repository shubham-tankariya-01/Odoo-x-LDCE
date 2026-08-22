from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4
from backend.tests.test_catalog import setup_mock_db_result

def test_global_search(client, mock_db_session):
    mock_city = MagicMock()
    mock_city.id = uuid4()
    mock_city.name = "Tokyo"
    mock_city.country = "Japan"
    mock_city.cost_index = 9.0
    mock_city.popularity_score = 95
    mock_city.image_url = "tokyo.jpg"

    # First call: city search (scalars().all())
    mock_result_cities = MagicMock()
    mock_scalars_cities = MagicMock()
    mock_scalars_cities.all.return_value = [mock_city]
    mock_result_cities.scalars.return_value = mock_scalars_cities

    # Second call: trip search (scalars().all())
    mock_result_trips = MagicMock()
    mock_scalars_trips = MagicMock()
    mock_scalars_trips.all.return_value = []
    mock_result_trips.scalars.return_value = mock_scalars_trips

    mock_db_session.execute = AsyncMock(side_effect=[mock_result_cities, mock_result_trips])

    response = client.get("/search?q=tokyo")
    assert response.status_code == 200
    data = response.json()

    assert "cities" in data
    assert "trips" in data
    assert len(data["cities"]) == 1
    assert data["cities"][0]["name"] == "Tokyo"
    assert data["trips"] == []
