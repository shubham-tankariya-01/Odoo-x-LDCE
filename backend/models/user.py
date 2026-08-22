from sqlalchemy import Column, String, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(20))
    city = Column(String(100))
    country = Column(String(100))
    photo_url = Column(String)
    additional_info = Column(String)
    is_admin = Column(Boolean, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
