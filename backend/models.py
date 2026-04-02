from datetime import datetime, timezone
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkoutSet(BaseModel):
    reps: int
    weight: Optional[float] = None
    effort: str  # "Near Failure", "Failure", "Reps in Reserve"


class ExerciseLog(BaseModel):
    name: str
    sets: List[WorkoutSet]


class WorkoutSession(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    exercises: List[ExerciseLog] = []


class CardioSession(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    duration_minutes: int = 0
    distance_km: float = 0.0
    activity_type: Optional[str] = None  # "Walking", "Running"
    route_coords: List = []  # [[lat, lng], ...]


class SleepLog(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    duration_hours: float = 0.0
    quality: Optional[str] = None


class FoodItem(BaseModel):
    user_id: str = ""
    name: str
    calories_per_100g: float
    protein_per_100g: float = 0
    carbs_per_100g: float = 0
    fat_per_100g: float = 0
    is_staple: bool = False
    meal_context: Optional[str] = None  # "breakfast" | "lunch" | "dinner" | "snack"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DailyGoal(BaseModel):
    user_id: str = ""
    metric_type: str  # "calories" | "protein" | "water" | "workout"
    target_value: float
    frequency: str = "daily"


class DietLogItem(BaseModel):
    food_id: Optional[str] = None
    food_name: str = ""
    weight_g: float = 100
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0


class DietLog(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    meal_name: str = ""
    calories: int = 0
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    supplements: List[str] = []
    items: List[DietLogItem] = []


class WaterLog(BaseModel):
    user_id: str = ""
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    amount_ml: int = 0

