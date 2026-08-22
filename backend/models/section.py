from sqlalchemy import Column, String, Date, Text, Numeric, Integer, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.models import Base

class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id"))
    title = Column(String(200))
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Numeric(10, 2))
    order_index = Column(Integer, server_default=text("0"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    # Relationships
    trip = relationship("Trip", back_populates="sections")
    city = relationship("City")
    activities = relationship("SectionActivity", back_populates="section", cascade="all, delete-orphan", order_by="SectionActivity.scheduled_date, SectionActivity.scheduled_time")
