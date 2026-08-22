from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.models.city import City
from backend.schemas.search import SearchResults
from backend.services.trip_service import search_public_trips

router = APIRouter()

@router.get("", response_model=SearchResults)
async def search(q: str, db: AsyncSession = Depends(get_db)):
    query = select(City).where(City.name.ilike(f"%{q}%"))
    result = await db.execute(query)
    cities = result.scalars().all()
    
    trips = await search_public_trips(db, q)
    
    return SearchResults(cities=cities, trips=trips)
