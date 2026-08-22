from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime

class TripCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None

class TripUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    cover_photo_url: Optional[str] = None

class TripRead(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    start_date: Optional[date]
    end_date: Optional[date]
    description: Optional[str]
    cover_photo_url: Optional[str]
    status: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

# Used by Eng 1's /search endpoint — must match schemas/search.py expectation
class TripSearchResult(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    status: Optional[str]
    model_config = {"from_attributes": True}

# Full nested itinerary — used by GET /trips/{tripId}/itinerary
class SectionActivityNested(BaseModel):
    id: UUID
    activity_id: UUID
    activity_name: str
    activity_category: Optional[str]
    scheduled_date: Optional[date]
    scheduled_time: Optional[str]
    cost: Optional[float]          # cost_override if set, else activity.cost
    notes: Optional[str]
    model_config = {"from_attributes": True}

class SectionNested(BaseModel):
    id: UUID
    city_id: Optional[UUID]
    city_name: Optional[str]
    title: Optional[str]
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    budget: Optional[float]
    order_index: int
    activities: List[SectionActivityNested] = []
    model_config = {"from_attributes": True}

class TripItineraryRead(BaseModel):
    id: UUID
    name: str
    start_date: Optional[date]
    end_date: Optional[date]
    description: Optional[str]
    status: Optional[str]
    sections: List[SectionNested] = []
    model_config = {"from_attributes": True}

# Budget schemas — used by GET /trips/{tripId}/budget
class BudgetCategoryBreakdown(BaseModel):
    category: str
    total: float

class DailyBudget(BaseModel):
    date: date
    total: float

class SectionBudgetBreakdown(BaseModel):
    section_id: UUID
    title: str
    city_name: Optional[str] = None
    budget: float = 0.0
    total_spent: float = 0.0
    activities_count: int = 0

class TripBudgetRead(BaseModel):
    trip_id: UUID
    total: float
    allocated_budget: float = 0.0
    by_category: List[BudgetCategoryBreakdown] = []
    by_day: List[DailyBudget] = []
    by_section: List[SectionBudgetBreakdown] = []
    average_daily: float = 0.0

