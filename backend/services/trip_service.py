from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from uuid import UUID
from datetime import date

from backend.models.trip import Trip
from backend.models.section import Section
from backend.models.section_activity import SectionActivity
from backend.models.activity import Activity
from backend.schemas.trip import TripSearchResult, TripItineraryRead, SectionNested, SectionActivityNested

async def get_trip_or_404(db: AsyncSession, trip_id: UUID) -> Trip:
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip

def assert_trip_owner(trip: Trip, user_id: UUID):
    if trip.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

def validate_trip_dates(start: date, end: date):
    if start and end and end < start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trip end date cannot be before start date")

def validate_section_dates(section_start: date, section_end: date, trip: Trip):
    if section_start and section_end and section_end < section_start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Section end date cannot be before start date")
    
    if trip.start_date and section_start and section_start < trip.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Section start date cannot be before trip start date")
        
    if trip.end_date and section_end and section_end > trip.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Section end date cannot be after trip end date")

def validate_activity_date(activity_date: date, section: Section):
    if section.start_date and activity_date and activity_date < section.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Activity date cannot be before section start date")
        
    if section.end_date and activity_date and activity_date > section.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Activity date cannot be after section end date")

async def build_nested_itinerary(db: AsyncSession, trip_id: UUID, user_id: UUID) -> TripItineraryRead:
    query = (
        select(Trip)
        .options(
            selectinload(Trip.sections).selectinload(Section.city),
            selectinload(Trip.sections).selectinload(Section.activities).selectinload(SectionActivity.activity)
        )
        .where(Trip.id == trip_id)
    )
    result = await db.execute(query)
    trip = result.scalars().first()
    
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
    assert_trip_owner(trip, user_id)
    
    sections_list = []
    
    for section in trip.sections:
        activities_list = []
        for sa in section.activities:
            activities_list.append(SectionActivityNested(
                id=sa.id,
                activity_id=sa.activity_id,
                activity_name=sa.activity.name if sa.activity else "Unknown Activity",
                activity_category=sa.activity.category if sa.activity else None,
                scheduled_date=sa.scheduled_date,
                scheduled_time=sa.scheduled_time.strftime("%H:%M") if sa.scheduled_time else None,
                cost=float(sa.cost_override) if sa.cost_override is not None else (float(sa.activity.cost) if sa.activity and sa.activity.cost is not None else None),
                notes=sa.notes
            ))
            
        sections_list.append(SectionNested(
            id=section.id,
            city_id=section.city_id,
            city_name=section.city.name if section.city else None,
            title=section.title,
            description=section.description,
            start_date=section.start_date,
            end_date=section.end_date,
            budget=float(section.budget) if section.budget is not None else None,
            order_index=section.order_index,
            activities=activities_list
        ))
        
    return TripItineraryRead(
        id=trip.id,
        name=trip.name,
        start_date=trip.start_date,
        end_date=trip.end_date,
        description=trip.description,
        status=trip.status,
        sections=sections_list
    )

async def search_public_trips(db: AsyncSession, query: str) -> list[TripSearchResult]:
    # Engineer 1 imports this
    stmt = select(Trip).where(Trip.name.ilike(f"%{query}%")).limit(20)
    result = await db.execute(stmt)
    trips = result.scalars().all()
    return [TripSearchResult.model_validate(t) for t in trips]
