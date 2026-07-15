/**
 * Background sync worker — runs alongside the Next.js dev server.
 * Calls /api/cron every hour (configurable via SYNC_INTERVAL_MS env var).
 * Start it with: node worker.mjs
 */

const INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS ?? "") || 60 * 60 * 1000; // 1 hour default
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function sync() {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] Running sync...`);
  try {
    const res = await fetch(`${BASE_URL}/api/cron`);
    const data = await res.json();
    console.log(`[${now}] Done — ${data.totalProducts ?? 0} products, +${data.added?.length ?? 0} added`);
  } catch (e) {
    console.error(`[${now}] Sync failed:`, e.message);
  }
}

// Run once immediately on startup
await sync();

// Then repeat on interval
console.log(`\nAuto-sync running every ${INTERVAL_MS / 60000} minutes. Press Ctrl+C to stop.\n`);
setInterval(sync, INTERVAL_MS);
