from sqlalchemy import Column, String, Date, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    # ... Engineer 2 will add the rest of the fields
