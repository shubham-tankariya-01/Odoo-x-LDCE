from pydantic import BaseModel, EmailStr
from backend.schemas.user import UserRead

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone_number: str | None = None
    city: str | None = None
    country: str | None = None
    additional_info: str | None = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
