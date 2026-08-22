from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from backend.database import get_db
from backend.core.security import get_current_admin_user
from backend.models.user import User
from backend.models.city import City
from backend.models.activity import Activity
from backend.models.section import Section
from backend.models.section_activity import SectionActivity
from backend.models.trip import Trip
from backend.models.community_post import CommunityPost
from backend.schemas.user import UserRead, UserUpdate
from backend.schemas.admin import UserPaginatedRead, PopularCityMetric, PopularActivityMetric, TrendMetrics

router = APIRouter(dependencies=[Depends(get_current_admin_user)])

@router.get("/users", response_model=UserPaginatedRead)
async def list_users(
    skip: int = 0, 
    limit: int = 10, 
    db: AsyncSession = Depends(get_db)
):
    total_res = await db.execute(select(func.count(User.id)))
    total = total_res.scalar() or 0
    
    users_res = await db.execute(select(User).offset(skip).limit(limit))
    users = users_res.scalars().all()
    
    return UserPaginatedRead(
        items=users,
        total=total,
        page=(skip // limit) + 1 if limit > 0 else 1,
        size=limit
    )

@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user_status(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()

@router.get("/analytics/popular-cities", response_model=List[PopularCityMetric])
async def get_popular_cities(db: AsyncSession = Depends(get_db)):
    # SELECT c.name, COUNT(s.id) FROM cities c JOIN sections s ON s.city_id = c.id GROUP BY c.id ORDER BY count DESC LIMIT 10
    stmt = (
        select(City.name, func.count(Section.id).label("count"))
        .join(Section, Section.city_id == City.id)
        .group_by(City.id)
        .order_by(func.count(Section.id).desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return [PopularCityMetric(city_name=row.name, section_count=row.count) for row in rows]

@router.get("/analytics/popular-activities", response_model=List[PopularActivityMetric])
async def get_popular_activities(db: AsyncSession = Depends(get_db)):
    # SELECT a.name, COUNT(sa.id) FROM activities a JOIN section_activities sa ON sa.activity_id = a.id GROUP BY a.id ORDER BY count DESC LIMIT 10
    stmt = (
        select(Activity.name, func.count(SectionActivity.id).label("count"))
        .join(SectionActivity, SectionActivity.activity_id == Activity.id)
        .group_by(Activity.id)
        .order_by(func.count(SectionActivity.id).desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return [PopularActivityMetric(activity_name=row.name, selection_count=row.count) for row in rows]

@router.get("/analytics/trends", response_model=TrendMetrics)
async def get_trends(db: AsyncSession = Depends(get_db)):
    users_res = await db.execute(select(func.count(User.id)))
    trips_res = await db.execute(select(func.count(Trip.id)))
    posts_res = await db.execute(select(func.count(CommunityPost.id)))
    
    return TrendMetrics(
        total_users=users_res.scalar() or 0,
        total_trips=trips_res.scalar() or 0,
        total_posts=posts_res.scalar() or 0
    )
