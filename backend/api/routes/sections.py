from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List

from backend.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.trip import Trip
from backend.models.section import Section
from backend.schemas.section import SectionCreate, SectionUpdate, SectionRead, SectionReorderRequest
from backend.services.trip_service import get_trip_or_404, assert_trip_owner, validate_section_dates

router = APIRouter()

@router.get("/trips/{trip_id}/sections", response_model=List[SectionRead])
async def list_trip_sections(trip_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = await get_trip_or_404(db, trip_id)
    assert_trip_owner(trip, current_user.id)
    
    stmt = select(Section).where(Section.trip_id == trip_id).order_by(Section.order_index)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/trips/{trip_id}/sections", response_model=SectionRead, status_code=status.HTTP_201_CREATED)
async def create_section(trip_id: UUID, section_in: SectionCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = await get_trip_or_404(db, trip_id)
    assert_trip_owner(trip, current_user.id)
    
    validate_section_dates(section_in.start_date, section_in.end_date, trip)
    
    # Get max order_index
    max_idx_stmt = select(func.max(Section.order_index)).where(Section.trip_id == trip_id)
    max_idx_res = await db.execute(max_idx_stmt)
    max_idx = max_idx_res.scalar() or -1
    
    section = Section(
        trip_id=trip_id,
        city_id=section_in.city_id,
        title=section_in.title,
        description=section_in.description,
        start_date=section_in.start_date,
        end_date=section_in.end_date,
        budget=section_in.budget,
        order_index=max_idx + 1
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section

@router.patch("/sections/{section_id}", response_model=SectionRead)
async def update_section(section_id: UUID, section_in: SectionUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Section).where(Section.id == section_id)
    result = await db.execute(stmt)
    section = result.scalars().first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
        
    trip = await get_trip_or_404(db, section.trip_id)
    assert_trip_owner(trip, current_user.id)
    
    if section_in.start_date or section_in.end_date:
        validate_section_dates(
            section_in.start_date or section.start_date, 
            section_in.end_date or section.end_date, 
            trip
        )
        
    update_data = section_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(section, key, value)
        
    await db.commit()
    await db.refresh(section)
    return section

@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(section_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Section).where(Section.id == section_id)
    result = await db.execute(stmt)
    section = result.scalars().first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
        
    trip = await get_trip_or_404(db, section.trip_id)
    assert_trip_owner(trip, current_user.id)
    
    await db.delete(section)
    await db.commit()

@router.patch("/trips/{trip_id}/sections/reorder", response_model=List[SectionRead])
async def reorder_sections(trip_id: UUID, reorder_req: SectionReorderRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = await get_trip_or_404(db, trip_id)
    assert_trip_owner(trip, current_user.id)
    
    stmt = select(Section).where(Section.trip_id == trip_id)
    result = await db.execute(stmt)
    sections = result.scalars().all()
    
    section_map = {s.id: s for s in sections}
    for idx, sid in enumerate(reorder_req.ordered_ids):
        if sid in section_map:
            section_map[sid].order_index = idx
            
    await db.commit()
    
    stmt = select(Section).where(Section.trip_id == trip_id).order_by(Section.order_index)
    result = await db.execute(stmt)
    return result.scalars().all()
