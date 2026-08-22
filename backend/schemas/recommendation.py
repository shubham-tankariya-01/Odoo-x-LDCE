from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from datetime import date


class TravelPreferenceRequest(BaseModel):
    budget: Optional[float] = Field(None, description="Total budget in currency units", ge=0)
    source_location: Optional[str] = Field(None, description="Origin / departure location")
    preferred_country: Optional[str] = Field(None, description="Target country if preferred")
    preferred_location: Optional[str] = Field(None, description="Target city/region if preferred")
    trip_duration_days: Optional[int] = Field(None, description="Trip length in days", ge=1, le=365)
    start_date: Optional[date] = Field(None, description="Proposed start date")
    travel_month: Optional[str] = Field(None, description="Target month for travel (e.g. October)")
    travel_season: Optional[str] = Field(None, description="Season (e.g. Spring, Summer, Autumn, Winter)")
    num_travelers: Optional[int] = Field(1, description="Number of people traveling", ge=1)
    travel_style: Optional[str] = Field(
        None, 
        description="Travel style (e.g. adventure, cultural, relaxation, budget, luxury, romantic, family)"
    )
    interests: Optional[List[str]] = Field(
        default=None, 
        description="List of user interests (e.g. food, history, beaches, hiking, architecture)"
    )
    activities: Optional[List[str]] = Field(
        default=None, 
        description="Specific activity keywords requested"
    )
    accommodation_preference: Optional[str] = Field(
        None, 
        description="Preferred accommodation type (e.g. hotel, hostel, resort, apartment)"
    )
    transportation_preference: Optional[str] = Field(
        None, 
        description="Preferred mode of transportation (e.g. flight, train, drive, public transit)"
    )
    weather_preference: Optional[str] = Field(
        None, 
        description="Desired weather (e.g. warm, sunny, temperate, snowy, tropical)"
    )
    crowd_tolerance: Optional[str] = Field(
        None, 
        description="Tolerance for crowds (e.g. low, medium, high)"
    )
    additional_preferences: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Arbitrary additional key-value preferences"
    )
    notes: Optional[str] = Field(None, description="Freeform travel preference notes")

    model_config = {"extra": "ignore"}


class RecommendedActivity(BaseModel):
    id: Optional[UUID] = None
    name: str
    category: Optional[str] = None
    cost: Optional[float] = None
    duration_mins: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class DestinationRecommendation(BaseModel):
    city_id: Optional[UUID] = None
    city_name: str
    country: Optional[str] = None
    rank: int = Field(..., ge=1)
    match_score: float = Field(..., ge=0.0, le=100.0, description="Match score from 0 to 100")
    estimated_cost: Optional[float] = Field(None, description="Estimated total cost for the trip duration")
    recommended_duration_days: Optional[int] = None
    match_reason: str = Field(..., description="Personalized explanation for this recommendation")
    highlights: List[str] = Field(default_factory=list, description="Key attractions and highlights")
    suggested_activities: List[RecommendedActivity] = Field(
        default_factory=list, 
        description="Real activities available in this destination from the database"
    )
    weather_summary: Optional[str] = None
    crowd_level: Optional[str] = None
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class TravelRecommendationResponse(BaseModel):
    recommendations: List[DestinationRecommendation]
    strategy_used: Literal["llm", "heuristic", "fallback"]
    total_candidates_analyzed: int
    user_preferences_summary: Optional[str] = None


# --- Strict schema for LLM Output Validation ---

class LLMRecommendationItem(BaseModel):
    city_name: str
    rank: int = Field(..., ge=1)
    match_score: float = Field(default=85.0, ge=0.0, le=100.0)
    match_reason: str
    highlights: List[str] = Field(default_factory=list)
    suggested_activity_names: List[str] = Field(default_factory=list)
    weather_summary: Optional[str] = None
    crowd_level: Optional[str] = None


class LLMRecommendationOutput(BaseModel):
    recommendations: List[LLMRecommendationItem]
    summary: Optional[str] = None
