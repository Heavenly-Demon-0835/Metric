import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Cardio extends Model {
  static table = 'cardio'

  @field('user_id') userId!: string
  @date('date') date!: Date
  @field('duration_minutes') durationMinutes!: number
  @field('distance_km') distanceKm!: number
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
