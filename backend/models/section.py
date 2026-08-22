from sqlalchemy import Column, String, Date, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"))
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id"))
    # ... Engineer 2 will add the rest of the fields
