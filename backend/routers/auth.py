from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import jwt

from database import db
from models import User
from auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: int | None = None
    weight: float | None = None
    height: float | None = None
    gender: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pass = get_password_hash(user.password)
    
    user_dict = {
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_pass,
        "age": user.age,
        "weight": user.weight,
        "height": user.height,
        "gender": user.gender,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_dict)
    
    acc_token = create_access_token(data={"sub": str(result.inserted_id)})
    return {"access_token": acc_token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
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
        # Avoid breaking if older PyJWT version signature logic changes slightly
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    # Return user dict (could parse into Pydantic model)
    return user

users_router = APIRouter(prefix="/users", tags=["users"])

@users_router.get("/me")
async def get_profile(user=Depends(get_current_user)):
    user_out = {k: v for k, v in user.items() if k != "hashed_password"}
    user_out["_id"] = str(user_out["_id"])
    return user_out
