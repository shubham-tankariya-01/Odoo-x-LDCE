from sqlalchemy import Column, text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_like_user'),
    )
