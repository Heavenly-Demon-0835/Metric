import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators'

const sanitizeSupps = (raw: any) => Array.isArray(raw) ? raw : []
const sanitizeItems = (raw: any) => Array.isArray(raw) ? raw : []

export default class Diet extends Model {
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
