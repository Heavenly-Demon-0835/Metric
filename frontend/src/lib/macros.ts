export interface FoodMacros {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface FoodItemData {
  _id?: string
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  is_staple?: boolean
  meal_context?: string | null
}

/**
 * Calculate macros for a given food item at a specific weight.
 * Pure client-side — no API calls.
 */
export function calculateMacros(food: FoodItemData, weightGrams: number): FoodMacros {
  const factor = weightGrams / 100
  return {
    calories: Math.round(food.calories_per_100g * factor),
    protein: Math.round(food.protein_per_100g * factor * 10) / 10,
    carbs: Math.round(food.carbs_per_100g * factor * 10) / 10,
    fat: Math.round(food.fat_per_100g * factor * 10) / 10,
  }
}

/**
 * Evaluate a simple arithmetic expression from the weight input.
 * Strict regex: strips everything except digits, decimal points, and +-/*
 * Returns 0 on invalid input.
 */
export function evaluateWeightExpression(expr: string): number {
  // Strip everything except numbers, decimals, and basic operators
  const sanitized = expr.replace(/[^0-9.+\-*/]/g, '')
  if (!sanitized || !/\d/.test(sanitized)) return 0

  try {
    // Validate structure: must start and end with a number, operators only between numbers
    if (!/^\d[\d.+\-*/]*\d$/.test(sanitized) && !/^\d+\.?\d*$/.test(sanitized)) return 0
    const result = Function(`"use strict"; return (${sanitized})`)()
    const num = Number(result)
    return Number.isFinite(num) && num >= 0 ? Math.round(num * 10) / 10 : 0
  } catch {
    return 0
  }
}

/**
 * Get the meal context based on current hour for staple filtering.
 */
export function getMealContext(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}
