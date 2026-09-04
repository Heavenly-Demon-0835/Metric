from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError, PyMongoError
import jwt

from database import db
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    validate_password,
)
from ratelimit import client_ip, rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Credential endpoints are the only unauthenticated write paths, so they get a
# window tight enough to blunt brute force but loose enough for typo retries.
LOGIN_LIMIT, LOGIN_WINDOW = 10, 300
REGISTER_LIMIT, REGISTER_WINDOW = 5, 3600


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: int | None = None
    weight: float | None = None
    height: float | None = None
    gender: str | None = None

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate, request: Request):
    rate_limit(f"register:{client_ip(request)}", REGISTER_LIMIT, REGISTER_WINDOW)

    hashed_pass = get_password_hash(user.password)

    user_dict = {
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_pass,
        "age": user.age,
        "weight": user.weight,
        "height": user.height,
        "gender": user.gender,
        # The users collection is not part of the sync contract, so this stays
        # a BSON datetime rather than the epoch-ms the synced tables use.
        "created_at": datetime.now(timezone.utc),
    }

    # Rely on the unique index rather than a read-then-write, which races when
    # two registrations for the same address arrive together.
    try:
        result = await db.users.insert_one(user_dict)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

    acc_token = create_access_token(data={"sub": str(result.inserted_id)})
    return {"access_token": acc_token, "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    rate_limit(f"login:{client_ip(request)}", LOGIN_LIMIT, LOGIN_WINDOW)

    user_data = await db.users.find_one({"email": form_data.username})
    if not user_data:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not verify_password(form_data.password, user_data["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    acc_token = create_access_token(data={"sub": str(user_data["_id"])})
    return {"access_token": acc_token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise credentials_exception

    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception

    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        raise credentials_exception

    # A database outage is not an authentication failure — reporting it as one
    # sends users to the login screen to retype a password that was fine.
    try:
        user = await db.users.find_one({"_id": object_id})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable, please retry shortly",
        )

    if user is None:
        raise credentials_exception

    return user


users_router = APIRouter(prefix="/users", tags=["users"])


@users_router.get("/me")
async def get_profile(user=Depends(get_current_user)):
    user_out = {k: v for k, v in user.items() if k != "hashed_password"}
    user_out["_id"] = str(user_out["_id"])
    return user_out
