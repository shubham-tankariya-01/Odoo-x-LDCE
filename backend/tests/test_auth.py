import pytest
from datetime import timedelta
from backend.core.security import hash_password, verify_password, create_access_token

def test_password_hashing():
    plain = "secret123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_jwt_creation():
    token = create_access_token(data={"sub": "123"})
    assert isinstance(token, str)
    assert len(token) > 20
