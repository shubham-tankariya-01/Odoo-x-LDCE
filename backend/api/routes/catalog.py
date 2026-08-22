from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from backend.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.models.city import City
from backend.models.activity import Activity
from backend.schemas.catalog import CityRead, ActivityRead, ActivityDetailRead

router = APIRouter()

@router.get("/cities/popular", response_model=List[CityRead])
async def get_popular_cities(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(City).order_by(City.popularity_score.desc()).limit(10))
    return result.scalars().all()

@router.get("/cities", response_model=List[CityRead])
async def get_cities(
    search: str | None = None,
    filter: str | None = None,
    sort_by: str | None = None,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    query = select(City)
    if search:
        query = query.where(City.name.ilike(f"%{search}%"))
    if filter:
        query = query.where(City.country == filter)
        
    if sort_by == "name":
        query = query.order_by(City.name.asc())
    elif sort_by == "popularity":
        query = query.order_by(City.popularity_score.desc())
    elif sort_by == "cost_index":
        query = query.order_by(City.cost_index.asc())
        
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/cities/{id}", response_model=CityRead)
async def get_city(id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(City).where(City.id == id))
    city = result.scalars().first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@router.get("/cities/{id}/suggestions", response_model=List[ActivityRead])
async def get_city_suggestions(id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.city_id == id).order_by(Activity.popularity_score.desc()))
    return result.scalars().all()

@router.get("/activities", response_model=List[ActivityRead])
async def get_activities(
    search: str | None = None,
    category: str | None = None,
    group_by: str | None = None,
    sort_by: str | None = None,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    query = select(Activity)
    if search:
        query = query.where(Activity.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Activity.category == category)
        
    if sort_by == "name":
        query = query.order_by(Activity.name.asc())
    elif sort_by == "cost":
        query = query.order_by(Activity.cost.asc())
    elif sort_by == "duration_mins":
        query = query.order_by(Activity.duration_mins.asc())
    elif sort_by == "popularity":
        query = query.order_by(Activity.popularity_score.desc())
        
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/activities/{id}", response_model=ActivityDetailRead)
async def get_activity(id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalars().first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    city_result = await db.execute(select(City).where(City.id == activity.city_id))
    city = city_result.scalars().first()
    
    activity.city = city
    return activity
