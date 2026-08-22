from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.schemas.recommendation import (
    TravelPreferenceRequest,
    TravelRecommendationResponse,
)
from backend.services.recommendation.service import get_travel_recommendations

router = APIRouter()


@router.post("/travel", response_model=TravelRecommendationResponse)
async def get_travel_recommendation_endpoint(
    preferences: TravelPreferenceRequest = Body(default_factory=TravelPreferenceRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TravelRecommendationResponse:
    """
    Generate personalized travel destination recommendations based on user preferences.
    Uses two tiers:
    1. Tier 1 (LLM): AI reasoning grounded in real database destinations.
    2. Tier 2 (Heuristic Fallback): Deterministic multi-factor scoring algorithm.
    """
    return await get_travel_recommendations(db=db, preferences=preferences)
