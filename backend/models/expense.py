from sqlalchemy import Column, String, Numeric, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.models import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(30))   # transport | stay | activity | meal | other
    amount = Column(Numeric(10, 2), nullable=False)
    note = Column(String(255))

    # Relationships
    trip = relationship("Trip", back_populates="expenses")
