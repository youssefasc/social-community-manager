import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Signs a user in with email/password credentials.
 */
export async function signInUseCase(
  client: Client,
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Registers a new user. The `handle_new_user` DB trigger automatically
 * creates the matching `profiles` row with role "owner".
 */
export async function signUpUseCase(
  client: Client,
  fullName: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Signs the current user out, clearing their session cookie.
 */
export async function signOutUseCase(client: Client): Promise<AuthResult> {
  const { error } = await client.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}
