from pydantic import BaseModel
from backend.schemas.catalog import CityRead
from typing import List, Any

class SearchResults(BaseModel):
    cities: List[CityRead]
    trips: List[Any]  # Will be List[TripSearchResult] after integration
