from sqlalchemy import Column, String, text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
