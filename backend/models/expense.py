from sqlalchemy import Column, String, Numeric, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from backend.models import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"))
    section_id = Column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="SET NULL"))
    # ... Engineer 2 will add the rest of the fields
