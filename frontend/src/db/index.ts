import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import schema from './schema'
import { User, Workout, Cardio, Sleep, Diet, FoodItem, DailyGoal, WaterLog } from './models'

let database: Database | null = null

// Ensure we only initialize LokiJS and IndexedDB in the browser, failing gracefully on the Next.js server runtime
if (typeof window !== 'undefined') {
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false, // Keep it simple for now, can move to worker later
    useIncrementalIndexedDB: true,
    onQuotaExceededError: (error) => {
      console.error('[WatermelonDB] Quota exceeded:', error)
    },
    onSetUpError: (error) => {
      console.error('[WatermelonDB] Setup failed:', error)
    },
    extraLokiOptions: {
      autosave: true,
    },
  })

  database = new Database({
    adapter,
    modelClasses: [
      User,
      Workout,
      Cardio,
      Sleep,
      Diet,
      FoodItem,
      DailyGoal,
      WaterLog,
    ],
  })
}

export { database }
