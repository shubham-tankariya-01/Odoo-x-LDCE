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

@router.get("/countries", response_model=List[str])
async def get_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(City.country).distinct().where(City.country.isnot(None)).order_by(City.country.asc())
    )
    return [c for c in result.scalars().all() if c]

@router.get("/cities/popular", response_model=List[CityRead])
async def get_popular_cities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(City).order_by(City.popularity_score.desc()).limit(12))
    return result.scalars().all()

@router.get("/cities", response_model=List[CityRead])
async def get_cities(
    search: str | None = None,
    country: str | None = None,
    filter: str | None = None,
    sort_by: str | None = None,
    min_cost: float | None = None,
    max_cost: float | None = None,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import or_

    query = select(City)
    if search:
        query = query.where(
            or_(
                City.name.ilike(f"%{search}%"),
                City.country.ilike(f"%{search}%")
            )
        )
    
    country_filter = country or filter
    if country_filter and country_filter != 'all':
        query = query.where(City.country.ilike(country_filter))
        
    if min_cost is not None:
        query = query.where(City.cost_index >= min_cost)
    if max_cost is not None:
        query = query.where(City.cost_index <= max_cost)
        
    if sort_by == "name":
        query = query.order_by(City.name.asc())
    elif sort_by in ("cost_low", "cost_asc", "cost_index"):
        query = query.order_by(City.cost_index.asc())
    elif sort_by in ("cost_high", "cost_desc"):
        query = query.order_by(City.cost_index.desc())
    else:
        # Default by popularity
        query = query.order_by(City.popularity_score.desc(), City.name.asc())
        
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/cities/{id}", response_model=CityRead)
async def get_city(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(City).where(City.id == id))
    city = result.scalars().first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@router.get("/cities/{id}/suggestions", response_model=List[ActivityRead])
async def get_city_suggestions(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.city_id == id).order_by(Activity.popularity_score.desc()))
    return result.scalars().all()

@router.get("/activities", response_model=List[ActivityRead])
async def get_activities(
    search: str | None = None,
    category: str | None = None,
    group_by: str | None = None,
    sort_by: str | None = None,
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
async def get_activity(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.id == id))
    activity = result.scalars().first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    city_result = await db.execute(select(City).where(City.id == activity.city_id))
    city = city_result.scalars().first()
    
    activity.city = city
    return activity
