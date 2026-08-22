from sqlalchemy import Column, String, Numeric, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class City(Base):
    __tablename__ = "cities"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(150), nullable=False)
    country = Column(String(100))
    cost_index = Column(Numeric(5, 2))
    popularity_score = Column(Integer, server_default=text("0"))
    image_url = Column(String)
