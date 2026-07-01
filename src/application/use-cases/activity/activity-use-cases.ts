import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type ActivityRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export interface ActivityFilters {
  level?: ActivityRow["level"] | "all";
}

export async function listActivityUseCase(
  client: Client,
  userId: string,
  filters: ActivityFilters = {}
): Promise<ActivityRow[]> {
  let query = client
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.level && filters.level !== "all") {
    query = query.eq("level", filters.level);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
