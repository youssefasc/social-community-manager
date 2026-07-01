import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type ContentInsert = Database["public"]["Tables"]["content_items"]["Insert"];
type ContentUpdate = Database["public"]["Tables"]["content_items"]["Update"];

export async function listContentUseCase(
  client: Client,
  userId: string,
  opts: { templatesOnly?: boolean; status?: ContentRow["status"] } = {}
): Promise<ContentRow[]> {
  let query = client.from("content_items").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (opts.templatesOnly) query = query.eq("is_template", true);
  if (opts.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getContentUseCase(client: Client, userId: string, id: string): Promise<ContentRow | null> {
  const { data, error } = await client.from("content_items").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createContentUseCase(client: Client, input: ContentInsert): Promise<ContentRow> {
  const { data, error } = await client.from("content_items").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateContentUseCase(
  client: Client,
  userId: string,
  id: string,
  input: ContentUpdate
): Promise<ContentRow> {
  const { data, error } = await client
    .from("content_items")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContentUseCase(client: Client, userId: string, id: string) {
  const { error } = await client.from("content_items").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
