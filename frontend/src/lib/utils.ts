import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string from the API as UTC.
 * MongoDB stores UTC internally but Motor serializes naive datetimes
 * without the 'Z' suffix, causing JS to treat them as local time.
 */
export function parseAPIDate(dateStr: string | number | Date): Date {
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "Z")
  }
  return new Date(dateStr as string)
}
