import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class DailyGoal extends Model {
  static table = 'daily_goals'

  @field('user_id') userId!: string
  @field('metric_type') metricType!: string
  @field('target_value') targetValue!: number
  @field('frequency') frequency!: string

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
