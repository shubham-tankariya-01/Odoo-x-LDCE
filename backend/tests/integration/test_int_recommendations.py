import pytest
from unittest.mock import patch
import httpx

from backend.schemas.recommendation import (
    LLMRecommendationOutput,
    LLMRecommendationItem,
)

pytestmark = pytest.mark.integration


async def test_live_recommendation_empty_preferences(live_client):
    """POST /recommendations/travel with empty body works against live Neon DB."""
    response = await live_client.post("/recommendations/travel", json={})
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "strategy_used" in data
    assert data["strategy_used"] in ["heuristic", "fallback"]
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) > 0
    assert data["total_candidates_analyzed"] > 0

    first = data["recommendations"][0]
    assert "city_name" in first
    assert "rank" in first
    assert "match_score" in first
    assert "match_reason" in first
    assert isinstance(first["suggested_activities"], list)


async def test_live_recommendation_with_country_filter(live_client):
    """POST /recommendations/travel with country filter prioritizes that country."""
    payload = {
        "preferred_country": "India",
        "travel_style": "cultural",
        "trip_duration_days": 4,
        "num_travelers": 2,
    }
    response = await live_client.post("/recommendations/travel", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) > 0
    top = data["recommendations"][0]
    assert top["country"] == "India"
    assert top["rank"] == 1
    assert top["estimated_cost"] is not None


async def test_live_recommendation_budget_and_interests(live_client):
    """POST /recommendations/travel with budget and activity interests."""
    payload = {
        "budget": 600.0,
        "trip_duration_days": 3,
        "num_travelers": 1,
        "travel_style": "adventure",
        "interests": ["trek", "outdoor", "nature"],
    }
    response = await live_client.post("/recommendations/travel", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) > 0
    top = data["recommendations"][0]
    assert top["estimated_cost"] is not None
    assert top["match_score"] >= 40.0


async def test_live_recommendation_simulated_llm_success(live_client):
    """POST /recommendations/travel with active LLM returning valid grounded output."""
    # Get a real city from the DB to test grounding
    res_cities = await live_client.get("/cities/popular")
    cities = res_cities.json()
    assert len(cities) > 0
    target_city = cities[0]["name"]

    mock_llm_output = LLMRecommendationOutput(
        recommendations=[
            LLMRecommendationItem(
                city_name=target_city,
                rank=1,
                match_score=97.5,
                match_reason=f"Top AI match for {target_city} with incredible cultural heritage.",
                highlights=[f"Explore {target_city}", "Historic tours"],
                suggested_activity_names=[],
                weather_summary="Pleasant conditions",
                crowd_level="Moderate",
            )
        ],
        summary=f"Curated AI recommendation for {target_city}.",
    )

    with patch(
        "backend.services.recommendation.service.DefaultHTTPLLMProvider.generate_recommendations",
        return_value=mock_llm_output,
    ), patch(
        "backend.services.recommendation.service.DefaultHTTPLLMProvider.is_configured",
        return_value=True,
    ):
        response = await live_client.post(
            "/recommendations/travel",
            json={"travel_style": "cultural", "interests": ["art", "history"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["strategy_used"] == "llm"
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["city_name"] == target_city
        assert data["recommendations"][0]["match_score"] == 97.5


async def test_live_recommendation_llm_failure_fallback(live_client):
    """POST /recommendations/travel falls back cleanly when LLM fails or times out."""
    with patch(
        "backend.services.recommendation.service.DefaultHTTPLLMProvider.generate_recommendations",
        side_effect=httpx.TimeoutException("LLM timeout"),
    ), patch(
        "backend.services.recommendation.service.DefaultHTTPLLMProvider.is_configured",
        return_value=True,
    ):
        response = await live_client.post(
            "/recommendations/travel",
            json={"preferred_country": "India", "travel_style": "adventure"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["strategy_used"] == "fallback"
        assert len(data["recommendations"]) > 0
        assert data["total_candidates_analyzed"] > 0
