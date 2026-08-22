from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from backend.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.trip import Trip
from backend.schemas.trip import TripCreate, TripUpdate, TripRead, TripItineraryRead, TripBudgetRead
from backend.services.trip_service import get_trip_or_404, assert_trip_owner, validate_trip_dates, build_nested_itinerary
from backend.services.budget_service import get_trip_budget

router = APIRouter()

@router.post("/trips", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(trip_in: TripCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    validate_trip_dates(trip_in.start_date, trip_in.end_date)
    
    trip = Trip(
        user_id=current_user.id,
        name=trip_in.name,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        description=trip_in.description,
        cover_photo_url=trip_in.cover_photo_url
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip

@router.get("/trips", response_model=List[TripRead])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = None,
    sort_by: Optional[str] = Query(None),
    search: Optional[str] = None,
    limit: int = 100
):
    stmt = select(Trip).where(Trip.user_id == current_user.id)
    if status:
        stmt = stmt.where(Trip.status == status)
    if search:
        stmt = stmt.where(Trip.name.ilike(f"%{search}%"))
        
    if sort_by == "recent":
        stmt = stmt.order_by(Trip.created_at.desc())
        
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/users/me/trips", response_model=List[TripRead])
async def get_my_trips(
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # This route is /users/me/trips since trips router has no prefix in main.py
    stmt = select(Trip).where(Trip.user_id == current_user.id)
    if type == "preplanned":
        stmt = stmt.where(Trip.status == "upcoming")
    elif type == "previous":
        stmt = stmt.where(Trip.status == "completed")
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{trip_id}/itinerary", response_model=TripItineraryRead)
async def get_trip_itinerary(trip_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await build_nested_itinerary(db, trip_id, current_user.id)

@router.get("/{trip_id}/budget", response_model=TripBudgetRead)
async def get_trip_budget_endpoint(trip_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = await get_trip_or_404(db, trip_id)
    assert_trip_owner(trip, current_user.id)
    return await get_trip_budget(db, trip_id)
