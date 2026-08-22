from sqlalchemy import Column, String, Numeric, Integer, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"))
    name = Column(String(200), nullable=False)
    category = Column(String(50))
    cost = Column(Numeric(10, 2))
    duration_mins = Column(Integer)
    description = Column(String)
    image_url = Column(String)
    popularity_score = Column(Integer, server_default=text("0"))
