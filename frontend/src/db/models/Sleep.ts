import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Sleep extends Model {
  static table = 'sleep'

  @field('user_id') userId!: string
  @date('date') date!: Date
  @field('duration_hours') durationHours!: number
  @field('quality') quality?: string
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
