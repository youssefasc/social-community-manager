import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type MediaRow = Database["public"]["Tables"]["media_items"]["Row"];
type MediaInsert = Database["public"]["Tables"]["media_items"]["Insert"];

export interface MediaFilters {
  search?: string;
  category?: string;
}

export async function listMediaUseCase(client: Client, userId: string, filters: MediaFilters = {}): Promise<MediaRow[]> {
  let query = client.from("media_items").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (filters.search) query = query.ilike("file_name", `%${filters.search}%`);
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMediaRecordUseCase(client: Client, input: MediaInsert): Promise<MediaRow> {
  const { data, error } = await client.from("media_items").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteMediaUseCase(client: Client, userId: string, id: string, storagePath: string) {
  await client.storage.from("media").remove([storagePath]);
  const { error } = await client.from("media_items").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
