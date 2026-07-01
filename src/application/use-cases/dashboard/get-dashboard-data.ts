import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export interface DashboardStats {
  savedCommunities: number;
  contentDrafts: number;
  scheduledUpcoming: number;
  connectedAccounts: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: Database["public"]["Tables"]["activity_logs"]["Row"][];
  upcomingPosts: Database["public"]["Tables"]["scheduled_posts"]["Row"][];
  accounts: Database["public"]["Tables"]["connected_accounts"]["Row"][];
}

/**
 * Aggregates everything the dashboard needs in parallel. Each query is
 * scoped to the current user by RLS, so no explicit user_id filter is
 * strictly required, but we pass it anyway for clarity and index usage.
 */
export async function getDashboardDataUseCase(
  client: Client,
  userId: string
): Promise<DashboardData> {
  const [
    communitiesCount,
    draftsCount,
    scheduledCount,
    accountsResult,
    activityResult,
    upcomingResult,
  ] = await Promise.all([
    client
      .from("communities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_saved", true),
    client
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "draft"),
    client
      .from("scheduled_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["queued", "scheduled"]),
    client
      .from("connected_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    client
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["queued", "scheduled"])
      .order("scheduled_for", { ascending: true })
      .limit(5),
  ]);

  return {
    stats: {
      savedCommunities: communitiesCount.count ?? 0,
      contentDrafts: draftsCount.count ?? 0,
      scheduledUpcoming: scheduledCount.count ?? 0,
      connectedAccounts: accountsResult.data?.length ?? 0,
    },
    recentActivity: activityResult.data ?? [],
    upcomingPosts: upcomingResult.data ?? [],
    accounts: accountsResult.data ?? [],
  };
}
