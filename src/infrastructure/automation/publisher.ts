/**
 * Publishing worker — the execution engine behind the Scheduler.
 *
 * Design: every connected account's session is captured ONCE by the
 * user logging in manually in a real, visible browser window. Playwright
 * then persists that session as `storageState` JSON, uploaded to the
 * private "sessions" Supabase Storage bucket. This module only ever
 * *reuses* that already-authenticated session to submit content the
 * user explicitly scheduled — it never performs a login, never solves
 * a captcha, and never joins/follows/friends anything on the user's
 * behalf. That keeps this firmly in "assistant with a saved browser
 * profile" territory rather than credential automation.
 *
 * This file defines the interface and the queue-draining loop; the
 * actual per-platform "submit a post" step is intentionally left as a
 * small, platform-specific adapter you implement once you've reviewed
 * that platform's terms for what's allowed for accounts you administer.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export interface PublishJob {
  scheduledPostId: string;
  contentHtml: string;
  communityUrl: string;
  storageStateRef: string; // path in the "sessions" bucket
}

export interface PublishResult {
  success: boolean;
  error?: string;
}

/**
 * Platform-specific adapters implement this. Register one per
 * `account_platform` value before enabling live publishing.
 */
export type PlatformAdapter = (job: PublishJob) => Promise<PublishResult>;

const _adapters: Partial<Record<Database["public"]["Tables"]["connected_accounts"]["Row"]["platform"], PlatformAdapter>> = {
  // "facebook": facebookAdapter,
  // "linkedin": linkedinAdapter,
  // Add adapters here once implemented and reviewed against each platform's ToS.
};

/**
 * Picks up due, "scheduled" posts and attempts to publish them one at a
 * time via the matching platform adapter. Intended to run from a cron
 * job / background worker (e.g. a Vercel Cron hitting an API route, or
 * a small Node worker process) — NOT on every page load.
 */
export async function drainDueQueueUseCase(client: Client, nowIso = new Date().toISOString()) {
  const { data: due, error } = await client
    .from("scheduled_posts")
    .select("*, content_items(body_html), communities(url, platform), connected_accounts(storage_state_ref, platform)")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .limit(10);

  if (error) throw error;

  for (const post of due ?? []) {
    await client.from("scheduled_posts").update({ status: "publishing" }).eq("id", (post as { id: string }).id);
    // Adapter dispatch intentionally omitted until a platform adapter is
    // registered above — see PlatformAdapter and the README.
  }

  return { processed: due?.length ?? 0 };
}
