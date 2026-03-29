import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators'

const sanitizeExercises = (raw: any) => Array.isArray(raw) ? raw : []
const sanitizeSupps = (raw: any) => Array.isArray(raw) ? raw : []
const sanitizeItems = (raw: any) => Array.isArray(raw) ? raw : []

export class User extends Model {
  static table = 'users'
  @field('email') email!: string
  @field('name') name!: string
  @field('age') age?: number
  @field('weight') weight?: number
  @field('height') height?: number
  @field('gender') gender?: string
}

export class Workout extends Model {
  static table = 'workouts'
  @field('user_id') userId!: string
  @date('date') date!: Date
  @json('exercises', sanitizeExercises) exercises!: any[]
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

export class Cardio extends Model {
  static table = 'cardio'
  @field('user_id') userId!: string
  @date('date') date!: Date
  @field('duration_minutes') durationMinutes!: number
  @field('distance_km') distanceKm!: number
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

export class Sleep extends Model {
  static table = 'sleep'
  @field('user_id') userId!: string
  @date('date') date!: Date
  @field('duration_hours') durationHours!: number
  @field('quality') quality?: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

export class Diet extends Model {
  static table = 'diet'
  @field('user_id') userId!: string
  @date('date') date!: Date
  @field('meal_name') mealName!: string
  @field('calories') calories!: number
  @field('protein_g') proteinG?: number
  @field('carbs_g') carbsG?: number
  @field('fat_g') fatG?: number
  @field('water_ml') waterMl?: number
  @json('supplements', sanitizeSupps) supplements!: string[]
  @json('items_json', sanitizeItems) itemsJson!: any[]
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

export class FoodItem extends Model {
  static table = 'food_items'
  @field('user_id') userId!: string
  @field('name') name!: string
  @field('calories_per_100g') caloriesPer100g!: number
  @field('protein_per_100g') proteinPer100g!: number
  @field('carbs_per_100g') carbsPer100g!: number
  @field('fat_per_100g') fatPer100g!: number
  @field('is_staple') isStaple!: boolean
  @field('meal_context') mealContext?: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

export class DailyGoal extends Model {
  static table = 'daily_goals'
  @field('user_id') userId!: string
  @field('metric_type') metricType!: string
  @field('target_value') targetValue!: number
  @field('frequency') frequency!: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
