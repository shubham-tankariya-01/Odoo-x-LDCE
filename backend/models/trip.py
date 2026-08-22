from sqlalchemy import Column, String, Date, Text, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.models import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    description = Column(Text)
    cover_photo_url = Column(Text)
    status = Column(String(20), server_default=text("'upcoming'"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    # Relationships
    sections = relationship("Section", back_populates="trip", cascade="all, delete-orphan", order_by="Section.order_index")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
