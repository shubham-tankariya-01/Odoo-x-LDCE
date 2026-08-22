from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
import os

import cloudinary
import cloudinary.uploader

from backend.models.user import User
from backend.schemas.user import UserUpdate

# Configure Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def upload_photo(db: AsyncSession, user: User, file: UploadFile) -> dict:
    # Read file content
    content = await file.read()

    # Upload to Cloudinary under 'globetrotter/users/' folder
    result = cloudinary.uploader.upload(
        content,
        folder="globetrotter/users",
        public_id=f"user_{user.id}",
        overwrite=True,
        resource_type="image",
    )

    # Save the secure Cloudinary URL to users.photo_url
    photo_url = result.get("secure_url")
    user.photo_url = photo_url

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"photo_url": photo_url}
