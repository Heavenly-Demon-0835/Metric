import { useEffect, useState } from "react";
import { database } from "./index";

/**
 * Subscribe a component to all rows of a WatermelonDB table.
 *
 * Why not just `query.observe().subscribe()` directly: with the LokiJS adapter,
 * `observe()` emits its initial (empty) result synchronously at subscribe time,
 * which — on a cold page load — happens before the adapter has finished reading
 * from IndexedDB, and it does not re-emit once that async load completes. The
 * view would then stay empty despite the data being present.
 *
 * `fetch()` queues until the adapter is ready, so it seeds the real data once
 * available; `observe()` then keeps it live for subsequent writes and syncs.
 */
export function useLiveQuery<T = unknown>(table: string): T[] {
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    if (!database) return;

    let active = true;
    const query = database.collections.get(table).query();

    query.fetch().then((initial) => {
      if (active) setRows(initial as T[]);
    });

    const sub = query.observe().subscribe((next) => setRows(next as T[]));

    return () => {
      active = false;
      sub.unsubscribe();
    };
  }, [table]);

  return rows;
}
