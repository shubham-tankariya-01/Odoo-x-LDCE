from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from backend.schemas.user import UserRead

class CommentCreate(BaseModel):
    content: str

class CommentRead(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

class LikeRead(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    
    model_config = {"from_attributes": True}

class PostCreate(BaseModel):
    content: str
    trip_id: Optional[UUID] = None
    activity_id: Optional[UUID] = None
    image_url: Optional[str] = None

class PostRead(BaseModel):
    id: UUID
    user_id: UUID
    trip_id: Optional[UUID] = None
    activity_id: Optional[UUID] = None
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    
    # We can nest counts or full objects if needed, but keeping it simple
    # comments: List[CommentRead] = []
    # likes: List[LikeRead] = []
    
    model_config = {"from_attributes": True}
