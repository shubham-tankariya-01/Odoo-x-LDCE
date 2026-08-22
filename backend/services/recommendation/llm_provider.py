from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import os
import json
import logging
import httpx
from pydantic import ValidationError

from backend.schemas.recommendation import (
    TravelPreferenceRequest,
    LLMRecommendationOutput,
)

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Abstract interface for LLM recommendation providers."""

    @abstractmethod
    async def generate_recommendations(
        self,
        preferences: TravelPreferenceRequest,
        candidate_data: List[Dict[str, Any]],
    ) -> Optional[LLMRecommendationOutput]:
        """
        Generate recommendations by analyzing user preferences against grounded candidate data.
        Returns validated LLMRecommendationOutput, or None if unavailable/failed.
        """
        pass


class DefaultHTTPLLMProvider(BaseLLMProvider):
    """
    Standard, pluggable HTTP LLM provider compatible with OpenAI, Groq, Gemini, Ollama,
    or any standard ChatCompletion endpoint.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: float = 8.0,
    ):
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")
        llm_key = os.getenv("LLM_API_KEY")

        if api_key:
            self.api_key = api_key
        elif groq_key:
            self.api_key = groq_key.strip().strip('"').strip("'")
        elif openai_key:
            self.api_key = openai_key.strip().strip('"').strip("'")
        elif gemini_key:
            self.api_key = gemini_key.strip().strip('"').strip("'")
        elif llm_key:
            self.api_key = llm_key.strip().strip('"').strip("'")
        else:
            self.api_key = None

        if api_base_url:
            self.api_base_url = api_base_url.rstrip("/")
        elif os.getenv("LLM_API_BASE_URL"):
            self.api_base_url = os.getenv("LLM_API_BASE_URL").rstrip("/")
        elif self.api_key and (self.api_key.startswith("gsk_") or groq_key):
            self.api_base_url = "https://api.groq.com/openai/v1"
        elif self.api_key and (self.api_key.startswith("AIza") or gemini_key):
            self.api_base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
        else:
            self.api_base_url = "https://api.openai.com/v1"

        if model:
            self.model = model
        elif os.getenv("LLM_MODEL"):
            self.model = os.getenv("LLM_MODEL")
        elif self.api_base_url and "groq.com" in self.api_base_url:
            self.model = "llama-3.3-70b-versatile"
        elif self.api_base_url and "generativelanguage.googleapis.com" in self.api_base_url:
            self.model = "gemini-2.0-flash"
        else:
            self.model = "gpt-4o-mini"

        self.timeout_seconds = timeout_seconds

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _build_prompt(
        self,
        preferences: TravelPreferenceRequest,
        candidate_data: List[Dict[str, Any]],
    ) -> tuple[str, str]:
        system_prompt = (
            "You are an expert travel recommendation assistant for the GlobeTrotter platform.\n"
            "CRITICAL RULES:\n"
            "1. Ground your recommendations ONLY in the provided candidate destinations and activities.\n"
            "2. DO NOT invent fake destinations, cities, or activities that are not in the candidate list.\n"
            "3. Select the best 3-5 destinations that fit the user's travel preferences.\n"
            "4. For each destination, provide a personalized match reason, highlights, and select 2-4 suggested activities from its available activities.\n"
            "5. Return output strictly in valid JSON matching this schema:\n"
            "{\n"
            '  "recommendations": [\n'
            "    {\n"
            '      "city_name": "<exact name from candidates>",\n'
            '      "rank": <integer rank starting from 1>,\n'
            '      "match_score": <float between 0 and 100>,\n'
            '      "match_reason": "<concise personalized explanation>",\n'
            '      "highlights": ["<highlight 1>", "<highlight 2>"],\n'
            '      "suggested_activity_names": ["<exact activity name 1>", "<exact activity name 2>"],\n'
            '      "weather_summary": "<brief weather note>",\n'
            '      "crowd_level": "<Low | Moderate | High>"\n'
            "    }\n"
            "  ],\n"
            '  "summary": "<brief overview of recommendations for user>"\n'
            "}"
        )

        user_content = {
            "user_preferences": preferences.model_dump(exclude_none=True),
            "available_candidates": candidate_data,
        }
        return system_prompt, json.dumps(user_content, default=str)

    async def generate_recommendations(
        self,
        preferences: TravelPreferenceRequest,
        candidate_data: List[Dict[str, Any]],
    ) -> Optional[LLMRecommendationOutput]:
        if not self.is_configured() or not candidate_data:
            logger.info("LLM provider not configured or no candidates provided. Using fallback.")
            return None

        system_prompt, user_prompt = self._build_prompt(preferences, candidate_data)

        endpoint = f"{self.api_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(endpoint, json=payload, headers=headers)
                if response.status_code != 200:
                    logger.warning(
                        f"LLM API returned status {response.status_code}: {response.text}"
                    )
                    return None

                data = response.json()
                raw_content = data["choices"][0]["message"]["content"]
                parsed_output = LLMRecommendationOutput.model_validate_json(raw_content)

                # Validate that city names in recommendations actually exist in candidates
                candidate_city_names = {c["name"].strip().lower() for c in candidate_data}
                valid_items = [
                    item for item in parsed_output.recommendations
                    if item.city_name.strip().lower() in candidate_city_names
                ]

                if not valid_items:
                    logger.warning("LLM returned recommendations with unknown cities. Falling back.")
                    return None

                parsed_output.recommendations = valid_items
                return parsed_output

        except (httpx.RequestError, httpx.TimeoutException) as exc:
            logger.warning(f"LLM request failed or timed out: {exc}")
            return None
        except (ValidationError, KeyError, json.JSONDecodeError) as exc:
            logger.warning(f"LLM response validation failed: {exc}")
            return None
        except Exception as exc:
            logger.warning(f"Unexpected error in LLM provider: {exc}")
            return None


class MockLLMProvider(BaseLLMProvider):
    """Mock LLM provider for testing without external network calls."""

    def __init__(
        self,
        mock_output: Optional[LLMRecommendationOutput] = None,
        should_fail: bool = False,
        should_timeout: bool = False,
    ):
        self.mock_output = mock_output
        self.should_fail = should_fail
        self.should_timeout = should_timeout

    async def generate_recommendations(
        self,
        preferences: TravelPreferenceRequest,
        candidate_data: List[Dict[str, Any]],
    ) -> Optional[LLMRecommendationOutput]:
        if self.should_timeout:
            raise httpx.TimeoutException("Mock LLM timeout")
        if self.should_fail:
            return None
        if self.mock_output is not None:
            return self.mock_output

        # Default smart mock: Pick top 2 candidates and generate structured response
        if not candidate_data:
            return None

        from backend.schemas.recommendation import LLMRecommendationItem

        items = []
        for rank, cand in enumerate(candidate_data[:3], start=1):
            act_names = [a["name"] for a in cand.get("activities", [])[:3]]
            items.append(
                LLMRecommendationItem(
                    city_name=cand["name"],
                    rank=rank,
                    match_score=max(95.0 - (rank - 1) * 7.0, 60.0),
                    match_reason=(
                        f"Personalized match for your {preferences.travel_style or 'vacation'} trip "
                        f"featuring rich local culture and top rated attractions."
                    ),
                    highlights=[f"Explore {cand['name']}", "Scenic tours & local food"],
                    suggested_activity_names=act_names,
                    weather_summary="Pleasant and sunny",
                    crowd_level="Moderate",
                )
            )

        return LLMRecommendationOutput(
            recommendations=items,
            summary="Personalized recommendations curated by GlobeTrotter AI.",
        )
