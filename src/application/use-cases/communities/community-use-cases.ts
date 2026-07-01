import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type CommunityRow = Database["public"]["Tables"]["communities"]["Row"];
type CommunityInsert = Database["public"]["Tables"]["communities"]["Insert"];

export interface CommunityFilters {
  search?: string;
  tag?: string;
  platform?: string;
}

export async function listCommunitiesUseCase(
  client: Client,
  userId: string,
  filters: CommunityFilters = {}
): Promise<CommunityRow[]> {
  let query = client
    .from("communities")
    .select("*")
    .eq("user_id", userId)
    .eq("is_saved", true)
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }
  if (filters.platform && filters.platform !== "all") {
    query = query.eq("platform", filters.platform as CommunityRow["platform"]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function saveCommunityUseCase(
  client: Client,
  input: CommunityInsert
): Promise<CommunityRow> {
  const { data, error } = await client
    .from("communities")
    .upsert({ ...input, is_saved: true }, { onConflict: "user_id,url" })
    .select("*")
    .single();
  if (error) throw error;

  await client.from("activity_logs").insert({
    user_id: input.user_id,
    level: "success",
    action: "community.saved",
    entity_type: "communities",
    entity_id: data.id,
    message: `Saved community "${input.name}" to workspace`,
  });

  return data;
}

export async function updateCommunityTagsUseCase(
  client: Client,
  userId: string,
  communityId: string,
  tags: string[]
) {
  const { error } = await client
    .from("communities")
    .update({ tags })
    .eq("id", communityId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteCommunityUseCase(client: Client, userId: string, communityId: string) {
  const { error } = await client.from("communities").delete().eq("id", communityId).eq("user_id", userId);
  if (error) throw error;
}

/**
 * Builds CSV text (client can trigger a download) from saved communities.
 */
export function communitiesToCsv(communities: CommunityRow[]): string {
  const header = ["Name", "URL", "Platform", "Privacy", "Members", "Tags"];
  const rows = communities.map((c) => [
    c.name,
    c.url,
    c.platform,
    c.privacy,
    c.member_count?.toString() ?? "",
    c.tags.join("; "),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
