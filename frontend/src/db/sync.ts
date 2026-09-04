import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'
import { apiFetch, getToken } from '@/lib/api'

// Guards against overlapping runs — the interval, focus and online triggers can
// otherwise fire synchronize() concurrently, which WatermelonDB rejects.
let syncing = false

export async function syncDatabase() {
  if (!database) {
    console.log('[Sync] Database not initialized, skipping sync.')
    return
  }

  if (!getToken()) {
    console.log('[Sync] No auth token found, skipping sync.')
    return
  }

  if (syncing) return
  syncing = true

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        // skipAuthRedirect: a background 401 shouldn't yank the user out of
        // whatever they're doing — the next page-level request handles it.
        const response = await apiFetch(`/sync?last_pulled_at=${lastPulledAt || 0}`, {
          skipAuthRedirect: true,
        })

        if (!response.ok) {
          throw new Error(`Pull failed: ${await response.text()}`)
        }

        const { changes, timestamp } = await response.json()
        return { changes, timestamp }
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        const response = await apiFetch(`/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes, lastPulledAt }),
          skipAuthRedirect: true,
        })

        if (!response.ok) {
          throw new Error(`Push failed: ${await response.text()}`)
        }
      },
      // migrationsEnabledAtVersion is intentionally omitted: the LokiJS adapter
      // in db/index.ts is created without a migrations spec, and WatermelonDB
      // rejects migration syncs unless the database supports migrations. If
      // schema migrations are added later, configure them there and re-enable.
    })
    console.log('[Sync] Synchronization successful.')
  } catch (error) {
    console.error('[Sync] Synchronization failed:', error)
  } finally {
    syncing = false
  }
}
