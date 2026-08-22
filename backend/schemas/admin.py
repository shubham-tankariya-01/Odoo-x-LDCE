from pydantic import BaseModel
from typing import List
from uuid import UUID
from backend.schemas.user import UserRead

class UserPaginatedRead(BaseModel):
    items: List[UserRead]
    total: int
    page: int
    size: int

class PopularCityMetric(BaseModel):
    city_name: str
    section_count: int

class PopularActivityMetric(BaseModel):
    activity_name: str
    selection_count: int

class TrendMetrics(BaseModel):
    total_users: int
    total_trips: int
    total_posts: int
