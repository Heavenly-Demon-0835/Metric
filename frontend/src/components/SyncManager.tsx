"use client";

import { useEffect } from "react";
import { getToken } from "@/lib/api";
import { syncDatabase } from "@/db/sync";

// How often to reconcile the local WatermelonDB with the backend while the app
// is open. syncDatabase() is a no-op without a token, so this is cheap.
const SYNC_INTERVAL_MS = 60_000;

/**
 * Drives background synchronisation. Mounted once in the root layout.
 *
 * Nothing else calls syncDatabase(), so without this component the offline
 * layer never reconciles: data created through the REST forms never reaches
 * the reactive (WatermelonDB-backed) views, and vice versa.
 */
export default function SyncManager() {
  useEffect(() => {
    const run = () => {
      if (getToken()) void syncDatabase();
    };

    run(); // reconcile immediately on load

    // Coming back to the tab or regaining connectivity are the moments most
    // likely to have stale local data.
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    window.addEventListener("focus", run);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(run, SYNC_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", run);
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, []);

  return null;
}
