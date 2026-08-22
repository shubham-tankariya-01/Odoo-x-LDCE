from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class CityRead(BaseModel):
    id: UUID
    name: str
    country: str | None
    cost_index: float | None
    popularity_score: int
    image_url: str | None

    model_config = {"from_attributes": True}

class ActivityRead(BaseModel):
    id: UUID
    city_id: UUID
    name: str
    category: str | None
    cost: float | None
    duration_mins: int | None
    description: str | None
    image_url: str | None
    popularity_score: int

    model_config = {"from_attributes": True}

class ActivityDetailRead(ActivityRead):
    city: CityRead

    model_config = {"from_attributes": True}
