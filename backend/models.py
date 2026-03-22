from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise ValueError("Invalid ObjectId")
        return v

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr
    hashed_password: str
    name: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    gender: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutSet(BaseModel):
    reps: int
    effort: str # "Near Failure", "Failure", "Reps in Reserve"

class ExerciseLog(BaseModel):
    name: str
    sets: List[WorkoutSet]

class WorkoutSession(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    exercises: List[ExerciseLog]

class CardioSession(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    duration_minutes: int
    distance_km: float

class SleepLog(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    duration_hours: float
    quality: Optional[str] = None # Or other sleep metrics

class DietLog(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    meal_name: str
    calories: int
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    water_ml: Optional[int] = None
    supplements: List[str] = []
