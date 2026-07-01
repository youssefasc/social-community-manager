import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;
type AccountInsert = Database["public"]["Tables"]["connected_accounts"]["Insert"];
type AccountRow = Database["public"]["Tables"]["connected_accounts"]["Row"];

/**
 * Lists all connected accounts for a user, most recently added first.
 */
export async function listAccountsUseCase(client: Client, userId: string): Promise<AccountRow[]> {
  const { data, error } = await client
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Registers a new connected account placeholder. The actual browser
 * session (Playwright storageState) is captured separately via a
 * manual, user-driven login flow and uploaded to the "sessions"
 * storage bucket — this app never automates a login itself.
 */
export async function createAccountUseCase(
  client: Client,
  input: AccountInsert
): Promise<AccountRow> {
  const { data, error } = await client
    .from("connected_accounts")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;

  await client.from("activity_logs").insert({
    user_id: input.user_id,
    level: "success",
    action: "account.created",
    entity_type: "connected_accounts",
    entity_id: data.id,
    message: `Connected account "${input.display_name}" added`,
  });

  return data;
}

export async function deleteAccountUseCase(client: Client, userId: string, accountId: string) {
  const { error } = await client.from("connected_accounts").delete().eq("id", accountId).eq("user_id", userId);
  if (error) throw error;

  await client.from("activity_logs").insert({
    user_id: userId,
    level: "info",
    action: "account.deleted",
    entity_type: "connected_accounts",
    entity_id: accountId,
    message: "Connected account removed",
  });
}

export async function updateAccountStatusUseCase(
  client: Client,
  userId: string,
  accountId: string,
  status: AccountRow["status"],
  errorMessage?: string
) {
  const { error } = await client
    .from("connected_accounts")
    .update({
      status,
      last_verified_at: status === "active" ? new Date().toISOString() : undefined,
      last_error: errorMessage ?? null,
    })
    .eq("id", accountId)
    .eq("user_id", userId);
  if (error) throw error;
}
