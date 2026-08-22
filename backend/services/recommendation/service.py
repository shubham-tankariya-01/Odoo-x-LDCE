from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from backend.models.city import City
from backend.models.activity import Activity
from backend.schemas.recommendation import (
    TravelPreferenceRequest,
    TravelRecommendationResponse,
    DestinationRecommendation,
    RecommendedActivity,
    LLMRecommendationOutput,
)
from backend.services.recommendation.llm_provider import (
    BaseLLMProvider,
    DefaultHTTPLLMProvider,
)
from backend.services.recommendation.heuristic_engine import (
    HeuristicRecommendationEngine,
)

logger = logging.getLogger(__name__)


async def fetch_candidate_destinations(
    db: AsyncSession,
    preferences: TravelPreferenceRequest,
) -> List[Dict[str, Any]]:
    """
    Fetch real City and Activity records from the database to serve as grounded candidates.
    """
    # 1. Base query for cities
    city_stmt = select(City)
    if preferences.preferred_country:
        city_stmt = city_stmt.where(City.country.ilike(f"%{preferences.preferred_country.strip()}%"))

    result = await db.execute(city_stmt)
    cities = result.scalars().all()

    # Fallback to all cities if strict country query returned empty
    if not cities and preferences.preferred_country:
        all_cities_res = await db.execute(select(City))
        cities = all_cities_res.scalars().all()

    if not cities:
        return []

    # 2. Fetch activities for these cities
    city_ids = [c.id for c in cities]
    act_stmt = select(Activity).where(Activity.city_id.in_(city_ids)).order_by(Activity.popularity_score.desc())
    act_result = await db.execute(act_stmt)
    activities = act_result.scalars().all()

    # Group activities by city_id
    city_activities_map: Dict[UUID, List[Dict[str, Any]]] = {c.id: [] for c in cities}
    for a in activities:
        if a.city_id in city_activities_map:
            city_activities_map[a.city_id].append({
                "id": str(a.id),
                "name": a.name,
                "category": a.category,
                "cost": float(a.cost) if a.cost is not None else None,
                "duration_mins": a.duration_mins,
                "description": a.description,
                "image_url": a.image_url,
                "popularity_score": a.popularity_score or 0,
            })

    # Assemble candidates
    candidates = []
    for c in cities:
        candidates.append({
            "id": str(c.id),
            "name": c.name,
            "country": c.country,
            "cost_index": float(c.cost_index) if c.cost_index is not None else 5.0,
            "popularity_score": c.popularity_score or 50,
            "image_url": c.image_url,
            "activities": city_activities_map.get(c.id, []),
        })

    return candidates


def _merge_llm_with_db_data(
    llm_output: LLMRecommendationOutput,
    candidates: List[Dict[str, Any]],
    preferences: TravelPreferenceRequest,
    heuristic_engine: HeuristicRecommendationEngine,
) -> List[DestinationRecommendation]:
    """
    Merge the validated LLM output with real database identifiers and activity objects.
    Ensures LLM output is grounded in actual DB records.
    """
    cand_by_name = {c["name"].strip().lower(): c for c in candidates}
    duration = preferences.trip_duration_days or 4
    num_travelers = preferences.num_travelers or 1

    recommendations: List[DestinationRecommendation] = []

    for item in llm_output.recommendations:
        matched_cand = cand_by_name.get(item.city_name.strip().lower())
        if not matched_cand:
            continue

        city_id = UUID(matched_cand["id"]) if isinstance(matched_cand.get("id"), str) else matched_cand.get("id")
        est_cost = heuristic_engine._calculate_estimated_cost(
            matched_cand.get("cost_index"), duration, num_travelers
        )

        # Match suggested activity names with actual DB activity objects
        available_acts = matched_cand.get("activities", [])
        act_by_name = {a["name"].strip().lower(): a for a in available_acts}

        selected_activities = []
        for name in item.suggested_activity_names:
            act_data = act_by_name.get(name.strip().lower())
            if act_data:
                selected_activities.append(
                    RecommendedActivity(
                        id=UUID(act_data["id"]) if isinstance(act_data.get("id"), str) else act_data.get("id"),
                        name=act_data["name"],
                        category=act_data.get("category"),
                        cost=float(act_data["cost"]) if act_data.get("cost") is not None else None,
                        duration_mins=act_data.get("duration_mins"),
                        description=act_data.get("description"),
                        image_url=act_data.get("image_url"),
                    )
                )

        # If LLM activity names didn't match, pick top activities from DB
        if not selected_activities and available_acts:
            for a in available_acts[:3]:
                selected_activities.append(
                    RecommendedActivity(
                        id=UUID(a["id"]) if isinstance(a.get("id"), str) else a.get("id"),
                        name=a["name"],
                        category=a.get("category"),
                        cost=float(a["cost"]) if a.get("cost") is not None else None,
                        duration_mins=a.get("duration_mins"),
                        description=a.get("description"),
                        image_url=a.get("image_url"),
                    )
                )

        highlights = item.highlights or [a.name for a in selected_activities[:2]]
        if not highlights:
            highlights = [f"Discover {matched_cand['name']}", f"Visit {matched_cand.get('country', '')}"]

        recommendations.append(
            DestinationRecommendation(
                city_id=city_id,
                city_name=matched_cand["name"],
                country=matched_cand.get("country"),
                rank=item.rank,
                match_score=float(item.match_score),
                estimated_cost=est_cost,
                recommended_duration_days=duration,
                match_reason=item.match_reason,
                highlights=highlights,
                suggested_activities=selected_activities,
                weather_summary=item.weather_summary or "Favorable seasonal climate",
                crowd_level=item.crowd_level or "Moderate",
                image_url=matched_cand.get("image_url"),
            )
        )

    # Sort by rank
    recommendations.sort(key=lambda x: x.rank)
    return recommendations


async def get_travel_recommendations(
    db: AsyncSession,
    preferences: TravelPreferenceRequest,
    llm_provider: Optional[BaseLLMProvider] = None,
) -> TravelRecommendationResponse:
    """
    Two-tier recommendation orchestrator:
    1. Fetch real DB candidates
    2. Try Tier 1 (LLM provider)
    3. Fallback to Tier 2 (Deterministic Heuristic Engine) on failure/timeout/absence.
    """
    candidates = await fetch_candidate_destinations(db, preferences)
    heuristic_engine = HeuristicRecommendationEngine()

    if not candidates:
        return TravelRecommendationResponse(
            recommendations=[],
            strategy_used="heuristic",
            total_candidates_analyzed=0,
            user_preferences_summary="No destinations available in the database to analyze.",
        )

    # Determine provider
    provider = llm_provider or DefaultHTTPLLMProvider()
    strategy_used = "heuristic"
    llm_attempted = False

    if provider is not None and getattr(provider, "is_configured", lambda: True)():
        llm_attempted = True
        try:
            llm_output = await provider.generate_recommendations(preferences, candidates)
            if llm_output and llm_output.recommendations:
                merged_recs = _merge_llm_with_db_data(
                    llm_output, candidates, preferences, heuristic_engine
                )
                if merged_recs:
                    return TravelRecommendationResponse(
                        recommendations=merged_recs,
                        strategy_used="llm",
                        total_candidates_analyzed=len(candidates),
                        user_preferences_summary=llm_output.summary or "Personalized AI recommendations.",
                    )
        except Exception as exc:
            logger.warning(f"Error during LLM recommendation tier: {exc}. Engaging heuristic fallback.")

    # Tier 2 Heuristic Fallback
    strategy_used = "fallback" if llm_attempted else "heuristic"
    heuristic_recs = heuristic_engine.evaluate_candidates(preferences, candidates, limit=5)

    summary_parts = []
    if preferences.preferred_country:
        summary_parts.append(f"Country: {preferences.preferred_country}")
    if preferences.travel_style:
        summary_parts.append(f"Style: {preferences.travel_style}")
    if preferences.budget:
        summary_parts.append(f"Budget: {preferences.budget:.0f}")
    if preferences.interests:
        summary_parts.append(f"Interests: {', '.join(preferences.interests)}")
    pref_summary = " | ".join(summary_parts) if summary_parts else "General destination recommendations."

    return TravelRecommendationResponse(
        recommendations=heuristic_recs,
        strategy_used=strategy_used,
        total_candidates_analyzed=len(candidates),
        user_preferences_summary=pref_summary,
    )
