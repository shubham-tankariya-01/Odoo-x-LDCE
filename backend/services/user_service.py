from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
import os
import uuid

from backend.models.user import User
from backend.schemas.user import UserUpdate

async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def upload_photo(db: AsyncSession, user: User, file: UploadFile) -> dict:
    os.makedirs("uploads", exist_ok=True)
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join("uploads", filename)
    
    # Read the file content synchronously or correctly if async
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
        
    user.photo_url = f"/uploads/{filename}"
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"photo_url": user.photo_url}
