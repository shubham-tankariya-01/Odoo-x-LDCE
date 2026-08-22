from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas.user import UserRead, UserUpdate
from backend.models.user import User
from backend.core.security import get_current_user
from backend.services.user_service import update_user, upload_photo

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserRead)
async def patch_me(user_in: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await update_user(db, current_user, user_in)

@router.post("/me/photo")
async def post_photo(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await upload_photo(db, current_user, file)
