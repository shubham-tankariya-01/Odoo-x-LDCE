from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, time
from decimal import Decimal

class TripActivityCreate(BaseModel):
    activity_id: UUID
    scheduled_date: date
    scheduled_time: Optional[time] = None
    cost_override: Optional[Decimal] = None
    notes: Optional[str] = None

class TripActivityUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    cost_override: Optional[Decimal] = None
    notes: Optional[str] = None

class TripActivityRead(BaseModel):
    id: UUID
    section_id: UUID
    activity_id: UUID
    scheduled_date: Optional[date]
    scheduled_time: Optional[time]
    cost_override: Optional[float]
    notes: Optional[str]
    model_config = {"from_attributes": True}
