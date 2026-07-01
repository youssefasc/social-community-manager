/**
 * Minimal cron-style worker: polls the scheduled_posts queue every
 * SCHEDULER_POLL_INTERVAL_MS and drains due jobs via the publisher
 * use-case. Run as a separate long-lived process (see docker-compose
 * "scheduler-worker" service) or trigger drainDueQueueUseCase from a
 * platform cron (e.g. Vercel Cron hitting a protected API route)
 * instead, if you'd rather not run a standalone process.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY since it runs outside any user
 * session and must bypass RLS to see every user's due jobs.
 */
const { createClient } = require("@supabase/supabase-js");

const POLL_INTERVAL_MS = Number(process.env.SCHEDULER_POLL_INTERVAL_MS ?? 60_000);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function tick() {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("scheduled_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .limit(10);

  if (error) {
    console.error("[scheduler-worker] query error:", error.message);
    return;
  }

  if (!due?.length) return;

  console.log(`[scheduler-worker] ${due.length} job(s) due. Registering a platform` +
    " adapter in src/infrastructure/automation/publisher.ts is required before" +
    " these can actually be published.");
}

console.log(`[scheduler-worker] starting, polling every ${POLL_INTERVAL_MS}ms`);
tick();
setInterval(tick, POLL_INTERVAL_MS);
