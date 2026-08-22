from sqlalchemy import Column, String, text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="SET NULL"))
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id", ondelete="SET NULL"))
    content = Column(String, nullable=False)
    image_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
