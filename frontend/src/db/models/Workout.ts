import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators'

const sanitizeExercises = (raw: any) => Array.isArray(raw) ? raw : []

export default class Workout extends Model {
  static table = 'workouts'

  @field('user_id') userId!: string
  @date('date') date!: Date
  @json('exercises', sanitizeExercises) exercises!: any[]
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
