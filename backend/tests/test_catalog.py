from unittest.mock import MagicMock
from uuid import uuid4

def setup_mock_db_result(mock_db_session, return_value, is_scalar_first=False):
    """Helper to setup mock DB execute result."""
    mock_result = MagicMock()
    mock_scalars = MagicMock()
    
    if is_scalar_first:
        mock_scalars.first.return_value = return_value
    else:
        mock_scalars.all.return_value = return_value
        
    mock_result.scalars.return_value = mock_scalars
    mock_db_session.execute.return_value = mock_result

def test_get_popular_cities(client, mock_db_session):
    # Mock data
    mock_city = MagicMock()
    mock_city.id = uuid4()
    mock_city.name = "Paris"
    mock_city.country = "France"
    mock_city.cost_index = 8.5
    mock_city.popularity_score = 100
    mock_city.image_url = "paris.jpg"
    
    setup_mock_db_result(mock_db_session, [mock_city], is_scalar_first=False)
    
    response = client.get("/cities/popular")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Paris"

def test_get_cities_with_search(client, mock_db_session):
    mock_city = MagicMock()
    mock_city.id = uuid4()
    mock_city.name = "Tokyo"
    mock_city.country = "Japan"
    mock_city.cost_index = 9.0
    mock_city.popularity_score = 95
    mock_city.image_url = "tokyo.jpg"
    
    setup_mock_db_result(mock_db_session, [mock_city], is_scalar_first=False)
    
    response = client.get("/cities?search=tok")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Tokyo"

def test_get_city_by_id(client, mock_db_session):
    city_id = uuid4()
    mock_city = MagicMock()
    mock_city.id = city_id
    mock_city.name = "London"
    mock_city.country = "UK"
    mock_city.cost_index = 9.5
    mock_city.popularity_score = 90
    mock_city.image_url = "london.jpg"
    
    setup_mock_db_result(mock_db_session, mock_city, is_scalar_first=True)
    
    response = client.get(f"/cities/{city_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "London"

def test_get_city_not_found(client, mock_db_session):
    city_id = uuid4()
    setup_mock_db_result(mock_db_session, None, is_scalar_first=True)
    
    response = client.get(f"/cities/{city_id}")
    assert response.status_code == 404
