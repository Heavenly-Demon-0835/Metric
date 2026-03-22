from fastapi import APIRouter, Depends
from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_profile(user=Depends(get_current_user)):
    user_out = {k: v for k, v in user.items() if k != "hashed_password"}
    user_out["_id"] = str(user_out["_id"])
    return user_out
