from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserRead(BaseModel):
    id: UUID
    first_name: str | None
    last_name: str | None
    email: str
    phone_number: str | None
    city: str | None
    country: str | None
    photo_url: str | None
    additional_info: str | None
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    city: str | None = None
    country: str | None = None
    additional_info: str | None = None
