from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from backend.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.trip import Trip
from backend.models.section import Section
from backend.models.section_activity import SectionActivity
from backend.schemas.trip_activity import TripActivityCreate, TripActivityUpdate, TripActivityRead
from backend.services.trip_service import get_trip_or_404, assert_trip_owner, validate_activity_date

router = APIRouter()

@router.post("/sections/{section_id}/activities", response_model=TripActivityRead, status_code=status.HTTP_201_CREATED)
async def create_activity(section_id: UUID, activity_in: TripActivityCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Section).where(Section.id == section_id)
    res = await db.execute(stmt)
    section = res.scalars().first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
        
    trip = await get_trip_or_404(db, section.trip_id)
    assert_trip_owner(trip, current_user.id)
    
    validate_activity_date(activity_in.scheduled_date, section)
    
    section_activity = SectionActivity(
        section_id=section_id,
        activity_id=activity_in.activity_id,
        scheduled_date=activity_in.scheduled_date,
        scheduled_time=activity_in.scheduled_time,
        cost_override=activity_in.cost_override,
        notes=activity_in.notes
    )
    db.add(section_activity)
    await db.commit()
    await db.refresh(section_activity)
    return section_activity

@router.patch("/trip-activities/{id}", response_model=TripActivityRead)
async def update_activity(id: UUID, activity_in: TripActivityUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(SectionActivity).where(SectionActivity.id == id)
    res = await db.execute(stmt)
    section_activity = res.scalars().first()
    if not section_activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
    section_stmt = select(Section).where(Section.id == section_activity.section_id)
    section_res = await db.execute(section_stmt)
    section = section_res.scalars().first()
    
    trip = await get_trip_or_404(db, section.trip_id)
    assert_trip_owner(trip, current_user.id)
    
    if activity_in.scheduled_date:
        validate_activity_date(activity_in.scheduled_date, section)
        
    update_data = activity_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(section_activity, key, value)
        
    await db.commit()
    await db.refresh(section_activity)
    return section_activity

@router.delete("/trip-activities/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(SectionActivity).where(SectionActivity.id == id)
    res = await db.execute(stmt)
    section_activity = res.scalars().first()
    if not section_activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
    section_stmt = select(Section).where(Section.id == section_activity.section_id)
    section_res = await db.execute(section_stmt)
    section = section_res.scalars().first()
    
    trip = await get_trip_or_404(db, section.trip_id)
    assert_trip_owner(trip, current_user.id)
    
    await db.delete(section_activity)
    await db.commit()
