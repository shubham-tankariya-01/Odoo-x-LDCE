from typing import List, Dict, Any, Optional
from uuid import UUID
import re

from backend.schemas.recommendation import (
    TravelPreferenceRequest,
    DestinationRecommendation,
    RecommendedActivity,
)


class HeuristicRecommendationEngine:
    """
    Deterministic multi-factor recommendation engine.
    Used for Tier 2 evaluation and as a guaranteed fallback when LLM is unavailable.
    """

    STYLE_KEYWORD_MAP = {
        "adventure": ["trek", "hike", "rafting", "outdoor", "safari", "nature", "mountain", "sports"],
        "cultural": ["palace", "fort", "museum", "temple", "heritage", "history", "monument", "art", "dance"],
        "relaxation": ["beach", "lake", "spa", "resort", "sunset", "cruise", "gardens", "quiet", "view"],
        "romantic": ["sunset", "cruise", "dinner", "candlelight", "lake", "view", "palace", "resort"],
        "family": ["park", "gardens", "zoo", "museum", "tour", "bazaar", "sightseeing"],
        "budget": ["bazaar", "walk", "street food", "heritage", "free"],
        "luxury": ["resort", "palace", "boutique", "fine dining", "private", "grand"],
    }

    def _calculate_estimated_cost(
        self,
        cost_index: Optional[float],
        duration_days: int,
        num_travelers: int,
    ) -> float:
        # Cost index is typically on a 1-100 or 1-10 scale in database
        idx = float(cost_index or 5.0)
        # Normalize index to realistic daily expenditure per person
        if idx <= 10.0:
            daily_per_person = idx * 25.0
        else:
            daily_per_person = idx * 2.5
        
        return round(daily_per_person * duration_days * num_travelers, 2)

    def evaluate_candidates(
        self,
        preferences: TravelPreferenceRequest,
        candidates: List[Dict[str, Any]],
        limit: int = 5,
    ) -> List[DestinationRecommendation]:
        if not candidates:
            return []

        scored_candidates = []
        duration = preferences.trip_duration_days or 4
        num_travelers = preferences.num_travelers or 1

        # Extract user interest keywords
        user_keywords = set()
        if preferences.interests:
            for item in preferences.interests:
                user_keywords.update(re.findall(r"\w+", item.lower()))
        if preferences.activities:
            for item in preferences.activities:
                user_keywords.update(re.findall(r"\w+", item.lower()))
        if preferences.notes:
            user_keywords.update(re.findall(r"\w+", preferences.notes.lower()))

        travel_style = (preferences.travel_style or "").strip().lower()
        style_keywords = self.STYLE_KEYWORD_MAP.get(travel_style, [])
        for kw in style_keywords:
            user_keywords.add(kw)

        for cand in candidates:
            score = 40.0  # Baseline score
            reasons = []
            matching_activities = []
            
            city_name = cand.get("name", "")
            country = cand.get("country") or ""
            cost_index = float(cand.get("cost_index") or 5.0)
            pop_score = int(cand.get("popularity_score") or 50)
            activities = cand.get("activities", [])

            # 1. Preferred Country / Location match
            pref_country = (preferences.preferred_country or "").strip().lower()
            pref_loc = (preferences.preferred_location or "").strip().lower()
            if pref_country and pref_country in country.lower():
                score += 25.0
                reasons.append(f"Located in your preferred country ({country})")
            if pref_loc and (pref_loc in city_name.lower() or pref_loc in country.lower()):
                score += 20.0
                reasons.append(f"Matches preferred location '{preferences.preferred_location}'")

            # 2. Budget Scoring
            est_cost = self._calculate_estimated_cost(cost_index, duration, num_travelers)
            if preferences.budget is not None and preferences.budget > 0:
                if est_cost <= preferences.budget:
                    score += 20.0
                    reasons.append(f"Well within your budget of {preferences.budget:.0f} (est. {est_cost:.0f})")
                elif est_cost <= preferences.budget * 1.2:
                    score += 10.0
                    reasons.append(f"Near target budget (est. {est_cost:.0f})")
                else:
                    score -= 15.0
            else:
                # Slight boost for popular cost-effective destinations if no budget given
                score += min(cost_index * 1.5, 15.0)

            # 3. Interest & Activity Matching
            activity_match_count = 0
            for act in activities:
                act_text = f"{act.get('name', '')} {act.get('category', '')} {act.get('description', '')}".lower()
                matched = any(kw in act_text for kw in user_keywords if len(kw) > 2)
                if matched:
                    activity_match_count += 1
                    matching_activities.append(act)

            if activity_match_count > 0:
                score += min(activity_match_count * 6.0, 25.0)
                reasons.append(f"Offers {activity_match_count} activities matching your interests")

            # 4. Travel Style Alignment
            if travel_style:
                if travel_style == "budget" and cost_index <= 5.0:
                    score += 15.0
                    reasons.append("Great budget-friendly destination")
                elif travel_style == "luxury" and cost_index >= 6.0:
                    score += 15.0
                    reasons.append("Premier luxury and high-end experience")
                elif travel_style in ["adventure", "cultural", "relaxation", "romantic", "family"] and activity_match_count > 0:
                    score += 12.0
                    reasons.append(f"Highly rated for {travel_style.capitalize()} trips")

            # 5. Base Popularity
            score += min(pop_score * 0.1, 10.0)

            # Clamp score between 10 and 99
            final_score = round(max(min(score, 99.0), 10.0), 1)

            # Build match reason summary
            if reasons:
                match_reason = ". ".join(reasons) + "."
            else:
                match_reason = f"Top-rated destination with rich attractions and great suitability for a {duration}-day trip."

            # Pick suggested activities (matching first, then top popular)
            suggested_raw = matching_activities[:3]
            if len(suggested_raw) < 3:
                for act in activities:
                    if act not in suggested_raw:
                        suggested_raw.append(act)
                    if len(suggested_raw) >= 3:
                        break

            suggested_activities = [
                RecommendedActivity(
                    id=UUID(a["id"]) if isinstance(a.get("id"), str) else a.get("id"),
                    name=a.get("name", "Activity"),
                    category=a.get("category"),
                    cost=float(a["cost"]) if a.get("cost") is not None else None,
                    duration_mins=a.get("duration_mins"),
                    description=a.get("description"),
                    image_url=a.get("image_url"),
                )
                for a in suggested_raw
            ]

            highlights = [a.name for a in suggested_activities[:3]]
            if not highlights:
                highlights = [f"Sightseeing in {city_name}", f"Explore {country}"]

            scored_candidates.append({
                "city_id": UUID(cand["id"]) if isinstance(cand.get("id"), str) else cand.get("id"),
                "city_name": city_name,
                "country": country,
                "match_score": final_score,
                "estimated_cost": est_cost,
                "recommended_duration_days": duration,
                "match_reason": match_reason,
                "highlights": highlights,
                "suggested_activities": suggested_activities,
                "weather_summary": cand.get("weather_summary") or "Optimal seasonal travel conditions",
                "crowd_level": "Moderate",
                "image_url": cand.get("image_url"),
            })

        # Sort descending by match score
        scored_candidates.sort(key=lambda x: x["match_score"], reverse=True)

        # Build output objects with proper ranks
        results = []
        for rank, item in enumerate(scored_candidates[:limit], start=1):
            results.append(
                DestinationRecommendation(
                    city_id=item["city_id"],
                    city_name=item["city_name"],
                    country=item["country"],
                    rank=rank,
                    match_score=item["match_score"],
                    estimated_cost=item["estimated_cost"],
                    recommended_duration_days=item["recommended_duration_days"],
                    match_reason=item["match_reason"],
                    highlights=item["highlights"],
                    suggested_activities=item["suggested_activities"],
                    weather_summary=item["weather_summary"],
                    crowd_level=item["crowd_level"],
                    image_url=item["image_url"],
                )
            )

        return results
