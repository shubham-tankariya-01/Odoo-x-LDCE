from sqlalchemy import Column, Date, Time, Numeric, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.models import Base

class SectionActivity(Base):
    __tablename__ = "section_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id"), nullable=False)
    scheduled_date = Column(Date)
    scheduled_time = Column(Time)
    cost_override = Column(Numeric(10, 2))
    notes = Column(Text)

    # Relationships
    section = relationship("Section", back_populates="activities")
    activity = relationship("Activity")
