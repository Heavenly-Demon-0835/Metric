from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
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
    effort: str  # "Near Failure", "Failure", "Reps in Reserve"


class ExerciseLog(BaseModel):
    name: str
    sets: List[WorkoutSet]


class WorkoutSession(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=datetime.utcnow)
    exercises: List[ExerciseLog] = []


class CardioSession(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=datetime.utcnow)
    duration_minutes: int = 0
    distance_km: float = 0.0
    activity_type: Optional[str] = None  # "Walking", "Running"
    route_coords: List = []  # [[lat, lng], ...]


class SleepLog(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=datetime.utcnow)
    duration_hours: float = 0.0
    quality: Optional[str] = None


class DietLog(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=datetime.utcnow)
    meal_name: str = ""
    calories: int = 0
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    water_ml: Optional[int] = None
    supplements: List[str] = []
