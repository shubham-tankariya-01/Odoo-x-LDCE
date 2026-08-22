from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from datetime import timedelta

from backend.models.user import User
from backend.schemas.auth import UserRegister, AuthResponse
from backend.core.security import hash_password, verify_password, create_access_token
from backend.config import settings

async def register_user(db: AsyncSession, user_in: UserRegister) -> AuthResponse:
    # Check email uniqueness
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Create user
    new_user = User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        phone_number=user_in.phone_number,
        city=user_in.city,
        country=user_in.country,
        additional_info=user_in.additional_info,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )

    return AuthResponse(access_token=access_token, user=new_user)

async def authenticate_user(db: AsyncSession, identifier: str, password: str) -> AuthResponse:
    from sqlalchemy import func
    # Case-insensitive email lookup
    result = await db.execute(select(User).where(func.lower(User.email) == identifier.strip().lower()))
    user = result.scalars().first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return AuthResponse(access_token=access_token, user=user)

