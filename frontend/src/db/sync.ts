import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'

const API_BASE = 'http://127.0.0.1:8000'

export async function syncDatabase() {
  if (!database) {
    console.log('[Sync] Database not initialized, skipping sync.')
    return
  }
  
  const token = localStorage.getItem("token")
  if (!token) {
    console.log('[Sync] No auth token found, skipping sync.')
    return
  }

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        const response = await fetch(`${API_BASE}/sync?last_pulled_at=${lastPulledAt || 0}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          throw new Error(`Pull failed: ${await response.text()}`)
        }
        
        const { changes, timestamp } = await response.json()
        return { changes, timestamp }
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        const response = await fetch(`${API_BASE}/sync`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ changes, lastPulledAt }),
        })
        
        if (!response.ok) {
          throw new Error(`Push failed: ${await response.text()}`)
        }
      },
      migrationsEnabledAtVersion: 1,
    })
    console.log('[Sync] Synchronization successful.')
  } catch (error) {
    console.error('[Sync] Synchronization failed:', error)
  }
}
