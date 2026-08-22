from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class SectionCreate(BaseModel):
    city_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: date
    end_date: date
    budget: Optional[Decimal] = None

class SectionUpdate(BaseModel):
    city_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None

class SectionRead(BaseModel):
    id: UUID
    trip_id: UUID
    city_id: Optional[UUID]
    title: Optional[str]
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    budget: Optional[float]
    order_index: int
    created_at: datetime
    model_config = {"from_attributes": True}

class SectionReorderRequest(BaseModel):
    ordered_ids: List[UUID]   # Full ordered list of section IDs
