import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type ScheduledPostRow = Database["public"]["Tables"]["scheduled_posts"]["Row"];
type ScheduledPostInsert = Database["public"]["Tables"]["scheduled_posts"]["Insert"];

export interface ScheduledPostWithRelations extends ScheduledPostRow {
  content_items: { title: string } | null;
  communities: { name: string } | null;
  connected_accounts: { display_name: string } | null;
}

export async function listScheduledPostsUseCase(
  client: Client,
  userId: string
): Promise<ScheduledPostWithRelations[]> {
  const { data, error } = await client
    .from("scheduled_posts")
    .select("*, content_items(title), communities(name), connected_accounts(display_name)")
    .eq("user_id", userId)
    .order("scheduled_for", { ascending: true });
  if (error) throw error;
  return data as unknown as ScheduledPostWithRelations[];
}

export async function createScheduledPostUseCase(
  client: Client,
  input: ScheduledPostInsert
): Promise<ScheduledPostRow> {
  const { data, error } = await client
    .from("scheduled_posts")
    .insert({ ...input, status: "scheduled" })
    .select("*")
    .single();
  if (error) throw error;

  await client.from("activity_logs").insert({
    user_id: input.user_id,
    level: "info",
    action: "post.scheduled",
    entity_type: "scheduled_posts",
    entity_id: data.id,
    message: `Post scheduled for ${new Date(input.scheduled_for).toLocaleString()}`,
  });

  return data;
}

export async function cancelScheduledPostUseCase(client: Client, userId: string, id: string) {
  const { error } = await client
    .from("scheduled_posts")
    .update({ status: "canceled" })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
