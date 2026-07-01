"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  createAccountUseCase,
  deleteAccountUseCase,
} from "@/application/use-cases/accounts/account-use-cases";
import type { Database } from "@/types/database.types";

export async function addAccountAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const platform = formData.get("platform") as Database["public"]["Tables"]["connected_accounts"]["Row"]["platform"];
  const displayName = String(formData.get("displayName") ?? "").trim();
  const profileUrl = String(formData.get("profileUrl") ?? "").trim();

  if (!displayName) throw new Error("Display name is required");

  await createAccountUseCase(supabase, {
    user_id: user.id,
    platform,
    display_name: displayName,
    profile_url: profileUrl || null,
    status: "disconnected",
  });

  revalidatePath("/accounts");
}

export async function deleteAccountAction(accountId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await deleteAccountUseCase(supabase, user.id, accountId);
  revalidatePath("/accounts");
}
