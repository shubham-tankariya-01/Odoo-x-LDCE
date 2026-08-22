from sqlalchemy import Column, Date, Time, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class SectionActivity(Base):
    __tablename__ = "section_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"))
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id"))
    # ... Engineer 2 will add the rest of the fields
