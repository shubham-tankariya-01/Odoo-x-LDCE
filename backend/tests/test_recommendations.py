import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import uuid4
from decimal import Decimal

from backend.models.city import City
from backend.models.activity import Activity
from backend.schemas.recommendation import (
    TravelPreferenceRequest,
    LLMRecommendationOutput,
    LLMRecommendationItem,
)
from backend.services.recommendation.llm_provider import (
    MockLLMProvider,
    DefaultHTTPLLMProvider,
)
from backend.services.recommendation.heuristic_engine import (
    HeuristicRecommendationEngine,
)
from backend.services.recommendation.service import get_travel_recommendations


@pytest.fixture
def sample_cities_and_activities():
    city1_id = uuid4()
    city2_id = uuid4()
    city3_id = uuid4()

    c1 = City(
        id=city1_id,
        name="Paris",
        country="France",
        cost_index=Decimal("8.5"),
        popularity_score=95,
        image_url="https://example.com/paris.jpg",
    )
    c2 = City(
        id=city2_id,
        name="Manali",
        country="India",
        cost_index=Decimal("3.5"),
        popularity_score=85,
        image_url="https://example.com/manali.jpg",
    )
    c3 = City(
        id=city3_id,
        name="Tokyo",
        country="Japan",
        cost_index=Decimal("9.0"),
        popularity_score=98,
        image_url="https://example.com/tokyo.jpg",
    )

    a1 = Activity(
        id=uuid4(),
        city_id=city1_id,
        name="Louvre Museum Tour",
        category="cultural",
        cost=Decimal("25.0"),
        duration_mins=180,
        description="Famous art museum with Mona Lisa",
        image_url="https://example.com/louvre.jpg",
        popularity_score=95,
    )
    a2 = Activity(
        id=uuid4(),
        city_id=city2_id,
        name="Solang Valley Trek & Paragliding",
        category="adventure",
        cost=Decimal("40.0"),
        duration_mins=240,
        description="High altitude mountain adventure and hiking",
        image_url="https://example.com/solang.jpg",
        popularity_score=90,
    )
    a3 = Activity(
        id=uuid4(),
        city_id=city3_id,
        name="Shibuya Crossing & Food Tour",
        category="food",
        cost=Decimal("50.0"),
        duration_mins=120,
        description="Iconic Tokyo crossing and street ramen tasting",
        image_url="https://example.com/shibuya.jpg",
        popularity_score=98,
    )

    return [c1, c2, c3], [a1, a2, a3]


# ─── Endpoint Unit Tests via TestClient ──────────────────────────────

def test_endpoint_recommendations_empty_preferences(client, mock_db_session, sample_cities_and_activities):
    cities, activities = sample_cities_and_activities

    mock_res_cities = MagicMock()
    mock_res_cities.scalars.return_value.all.return_value = cities

    mock_res_acts = MagicMock()
    mock_res_acts.scalars.return_value.all.return_value = activities

    mock_db_session.execute = AsyncMock(side_effect=[mock_res_cities, mock_res_acts])

    response = client.post("/recommendations/travel", json={})
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "strategy_used" in data
    assert data["strategy_used"] in ["heuristic", "fallback"]
    assert len(data["recommendations"]) == 3
    assert data["total_candidates_analyzed"] == 3


def test_endpoint_recommendations_with_filters(client, mock_db_session, sample_cities_and_activities):
    cities, activities = sample_cities_and_activities
    # Query with preferred_country="France"
    france_cities = [c for c in cities if c.country == "France"]
    france_acts = [a for a in activities if a.city_id == france_cities[0].id]

    mock_res_cities = MagicMock()
    mock_res_cities.scalars.return_value.all.return_value = france_cities

    mock_res_acts = MagicMock()
    mock_res_acts.scalars.return_value.all.return_value = france_acts

    mock_db_session.execute = AsyncMock(side_effect=[mock_res_cities, mock_res_acts])

    payload = {
        "preferred_country": "France",
        "travel_style": "cultural",
        "budget": 1000.0,
        "trip_duration_days": 5,
        "num_travelers": 2,
        "interests": ["art", "museum"],
    }
    response = client.post("/recommendations/travel", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) >= 1
    top = data["recommendations"][0]
    assert top["city_name"] == "Paris"
    assert top["rank"] == 1
    assert "France" in top["match_reason"] or "budget" in top["match_reason"]
    assert top["estimated_cost"] is not None


# ─── Heuristic Engine Isolated Tests ─────────────────────────────────

def test_heuristic_scoring_adventure_preference():
    engine = HeuristicRecommendationEngine()
    pref = TravelPreferenceRequest(
        travel_style="adventure",
        interests=["trek", "hiking", "nature"],
        budget=500.0,
        trip_duration_days=3,
    )
    candidates = [
        {
            "id": str(uuid4()),
            "name": "Manali",
            "country": "India",
            "cost_index": 3.0,
            "popularity_score": 85,
            "activities": [
                {"id": str(uuid4()), "name": "Mountain Hiking", "category": "adventure", "description": "Trek through valleys"}
            ],
        },
        {
            "id": str(uuid4()),
            "name": "Monaco",
            "country": "Monaco",
            "cost_index": 10.0,
            "popularity_score": 70,
            "activities": [
                {"id": str(uuid4()), "name": "Casino Visit", "category": "luxury", "description": "Luxury casino"}
            ],
        },
    ]

    results = engine.evaluate_candidates(pref, candidates)
    assert len(results) == 2
    assert results[0].city_name == "Manali"
    assert results[0].rank == 1
    assert results[0].match_score > results[1].match_score


# ─── Two-Tier Service Unit Tests (LLM + Fallback) ────────────────────

@pytest.mark.asyncio
async def test_service_llm_tier_success(sample_cities_and_activities):
    cities, activities = sample_cities_and_activities
    db = AsyncMock()

    mock_res_cities = MagicMock()
    mock_res_cities.scalars.return_value.all.return_value = cities

    mock_res_acts = MagicMock()
    mock_res_acts.scalars.return_value.all.return_value = activities

    db.execute = AsyncMock(side_effect=[mock_res_cities, mock_res_acts])

    mock_llm_output = LLMRecommendationOutput(
        recommendations=[
            LLMRecommendationItem(
                city_name="Tokyo",
                rank=1,
                match_score=96.0,
                match_reason="Best fit for high-tech culture and incredible street food.",
                highlights=["Shibuya Crossing", "Ramen streets"],
                suggested_activity_names=["Shibuya Crossing & Food Tour"],
                weather_summary="Sunny 20C",
                crowd_level="Moderate",
            )
        ],
        summary="AI curated recommendation for your trip.",
    )
    mock_provider = MockLLMProvider(mock_output=mock_llm_output)

    pref = TravelPreferenceRequest(interests=["food", "technology"], travel_style="cultural")
    res = await get_travel_recommendations(db, pref, llm_provider=mock_provider)

    assert res.strategy_used == "llm"
    assert len(res.recommendations) == 1
    assert res.recommendations[0].city_name == "Tokyo"
    assert res.recommendations[0].rank == 1
    assert res.recommendations[0].match_score == 96.0
    assert len(res.recommendations[0].suggested_activities) == 1
    assert res.recommendations[0].suggested_activities[0].name == "Shibuya Crossing & Food Tour"


@pytest.mark.asyncio
async def test_service_llm_tier_timeout_fallback(sample_cities_and_activities):
    cities, activities = sample_cities_and_activities
    db = AsyncMock()

    mock_res_cities = MagicMock()
    mock_res_cities.scalars.return_value.all.return_value = cities

    mock_res_acts = MagicMock()
    mock_res_acts.scalars.return_value.all.return_value = activities

    db.execute = AsyncMock(side_effect=[mock_res_cities, mock_res_acts])

    # Provider configured to timeout
    mock_provider = MockLLMProvider(should_timeout=True)

    pref = TravelPreferenceRequest(interests=["hiking"], travel_style="adventure")
    res = await get_travel_recommendations(db, pref, llm_provider=mock_provider)

    # Must cleanly fallback to heuristic without raising error
    assert res.strategy_used == "fallback"
    assert len(res.recommendations) == 3
    assert res.total_candidates_analyzed == 3


@pytest.mark.asyncio
async def test_service_empty_db():
    db = AsyncMock()
    mock_res_cities = MagicMock()
    mock_res_cities.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_res_cities)

    pref = TravelPreferenceRequest()
    res = await get_travel_recommendations(db, pref)
    assert res.recommendations == []
    assert res.total_candidates_analyzed == 0
