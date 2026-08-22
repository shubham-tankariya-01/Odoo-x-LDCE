from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CommentCreate(BaseModel):
    content: str

class CommentRead(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    user_name: Optional[str] = "Traveler"
    user_avatar: Optional[str] = None
    content: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

class LikeRead(BaseModel):
    id: Optional[UUID] = None
    post_id: UUID
    user_id: UUID
    is_liked: bool = True
    likes_count: int = 0
    
    model_config = {"from_attributes": True}

class PostCreate(BaseModel):
    content: str
    trip_id: Optional[UUID] = None
    activity_id: Optional[UUID] = None
    image_url: Optional[str] = None

class PostRead(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str] = "Traveler"
    user_avatar: Optional[str] = None
    trip_id: Optional[UUID] = None
    activity_id: Optional[UUID] = None
    trip_name: Optional[str] = None
    activity_name: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    likes_count: int = 0
    is_liked: bool = False
    comments: List[CommentRead] = []
    
    model_config = {"from_attributes": True}

