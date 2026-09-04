import { Model } from '@nozbe/watermelondb'
import type { ColumnName } from '@nozbe/watermelondb'

/**
 * These models deliberately use plain get/set accessors instead of the
 * `@field`/`@date`/`@json` decorators.
 *
 * Under Turbopack (Next's default compiler) a decorated class field such as
 * `@field('amount_ml') amountMl!: number` still emits an own instance property
 * `amountMl = undefined`, which shadows the getter the decorator installs on the
 * prototype. Every read then returns `undefined` while `_getRaw` holds the real
 * value, so all reactive views render zeros. `useDefineForClassFields: false`
 * does not fix it because Turbopack ignores that option.
 *
 * The helpers below reproduce the decorators' exact behaviour (see
 * @nozbe/watermelondb/decorators/{field,date,json}) via accessors, which live on
 * the prototype and cannot be shadowed.
 */

const raw = (model: Model, column: string) => model._getRaw(column as ColumnName)
const writeRaw = (model: Model, column: string, value: unknown) =>
  model._setRaw(column as ColumnName, value as never)

function getDate(model: Model, column: string): Date | null {
  const value = raw(model, column)
  return typeof value === 'number' ? new Date(value) : null
}

function setDate(model: Model, column: string, date: Date | null): void {
  writeRaw(model, column, date ? +new Date(date) : null)
}

function getJson<T>(model: Model, column: string, sanitize: (value: unknown) => T): T {
  const value = raw(model, column)
  let parsed: unknown
  if (value != null && value !== '') {
    try {
      parsed = JSON.parse(value as string)
    } catch {
      parsed = undefined
    }
  }
  return sanitize(parsed)
}

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : [])

export class User extends Model {
  static table = 'users'
  get email(): string { return raw(this, 'email') as string }
  set email(v: string) { writeRaw(this, 'email', v) }
  get name(): string { return raw(this, 'name') as string }
  set name(v: string) { writeRaw(this, 'name', v) }
  get age(): number | undefined { return raw(this, 'age') as number | undefined }
  set age(v: number | undefined) { writeRaw(this, 'age', v) }
  get weight(): number | undefined { return raw(this, 'weight') as number | undefined }
  set weight(v: number | undefined) { writeRaw(this, 'weight', v) }
  get height(): number | undefined { return raw(this, 'height') as number | undefined }
  set height(v: number | undefined) { writeRaw(this, 'height', v) }
  get gender(): string | undefined { return raw(this, 'gender') as string | undefined }
  set gender(v: string | undefined) { writeRaw(this, 'gender', v) }
}

export class Workout extends Model {
  static table = 'workouts'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get date(): Date | null { return getDate(this, 'date') }
  set date(v: Date | null) { setDate(this, 'date', v) }
  get exercises(): any[] { return getJson(this, 'exercises', asArray) }
  set exercises(v: any[]) { writeRaw(this, 'exercises', v != null ? JSON.stringify(asArray(v)) : null) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}

export class Cardio extends Model {
  static table = 'cardio'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get date(): Date | null { return getDate(this, 'date') }
  set date(v: Date | null) { setDate(this, 'date', v) }
  get durationMinutes(): number { return raw(this, 'duration_minutes') as number }
  set durationMinutes(v: number) { writeRaw(this, 'duration_minutes', v) }
  get distanceKm(): number { return raw(this, 'distance_km') as number }
  set distanceKm(v: number) { writeRaw(this, 'distance_km', v) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}

export class Sleep extends Model {
  static table = 'sleep'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get date(): Date | null { return getDate(this, 'date') }
  set date(v: Date | null) { setDate(this, 'date', v) }
  get durationHours(): number { return raw(this, 'duration_hours') as number }
  set durationHours(v: number) { writeRaw(this, 'duration_hours', v) }
  get quality(): string | undefined { return raw(this, 'quality') as string | undefined }
  set quality(v: string | undefined) { writeRaw(this, 'quality', v) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}

export class Diet extends Model {
  static table = 'diet'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get date(): Date | null { return getDate(this, 'date') }
  set date(v: Date | null) { setDate(this, 'date', v) }
  get mealName(): string { return raw(this, 'meal_name') as string }
  set mealName(v: string) { writeRaw(this, 'meal_name', v) }
  get calories(): number { return raw(this, 'calories') as number }
  set calories(v: number) { writeRaw(this, 'calories', v) }
  get proteinG(): number | undefined { return raw(this, 'protein_g') as number | undefined }
  set proteinG(v: number | undefined) { writeRaw(this, 'protein_g', v) }
  get carbsG(): number | undefined { return raw(this, 'carbs_g') as number | undefined }
  set carbsG(v: number | undefined) { writeRaw(this, 'carbs_g', v) }
  get fatG(): number | undefined { return raw(this, 'fat_g') as number | undefined }
  set fatG(v: number | undefined) { writeRaw(this, 'fat_g', v) }
  get waterMl(): number | undefined { return raw(this, 'water_ml') as number | undefined }
  set waterMl(v: number | undefined) { writeRaw(this, 'water_ml', v) }
  get supplements(): string[] { return getJson(this, 'supplements', asArray) }
  set supplements(v: string[]) { writeRaw(this, 'supplements', v != null ? JSON.stringify(asArray(v)) : null) }
  get itemsJson(): any[] { return getJson(this, 'items_json', asArray) }
  set itemsJson(v: any[]) { writeRaw(this, 'items_json', v != null ? JSON.stringify(asArray(v)) : null) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}

export class FoodItem extends Model {
  static table = 'food_items'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get name(): string { return raw(this, 'name') as string }
  set name(v: string) { writeRaw(this, 'name', v) }
  get caloriesPer100g(): number { return raw(this, 'calories_per_100g') as number }
  set caloriesPer100g(v: number) { writeRaw(this, 'calories_per_100g', v) }
  get proteinPer100g(): number { return raw(this, 'protein_per_100g') as number }
  set proteinPer100g(v: number) { writeRaw(this, 'protein_per_100g', v) }
  get carbsPer100g(): number { return raw(this, 'carbs_per_100g') as number }
  set carbsPer100g(v: number) { writeRaw(this, 'carbs_per_100g', v) }
  get fatPer100g(): number { return raw(this, 'fat_per_100g') as number }
  set fatPer100g(v: number) { writeRaw(this, 'fat_per_100g', v) }
  get isStaple(): boolean { return raw(this, 'is_staple') as boolean }
  set isStaple(v: boolean) { writeRaw(this, 'is_staple', v) }
  get mealContext(): string | undefined { return raw(this, 'meal_context') as string | undefined }
  set mealContext(v: string | undefined) { writeRaw(this, 'meal_context', v) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}

export class DailyGoal extends Model {
  static table = 'daily_goals'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get metricType(): string { return raw(this, 'metric_type') as string }
  set metricType(v: string) { writeRaw(this, 'metric_type', v) }
  get targetValue(): number { return raw(this, 'target_value') as number }
  set targetValue(v: number) { writeRaw(this, 'target_value', v) }
  get frequency(): string { return raw(this, 'frequency') as string }
  set frequency(v: string) { writeRaw(this, 'frequency', v) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}

export class WaterLog extends Model {
  static table = 'water_logs'
  get userId(): string { return raw(this, 'user_id') as string }
  set userId(v: string) { writeRaw(this, 'user_id', v) }
  get date(): Date | null { return getDate(this, 'date') }
  set date(v: Date | null) { setDate(this, 'date', v) }
  get amountMl(): number { return raw(this, 'amount_ml') as number }
  set amountMl(v: number) { writeRaw(this, 'amount_ml', v) }
  get createdAt(): Date | null { return getDate(this, 'created_at') }
  get updatedAt(): Date | null { return getDate(this, 'updated_at') }
}
