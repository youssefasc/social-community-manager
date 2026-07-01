"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const theme = String(formData.get("theme") ?? "system") as "light" | "dark" | "system";
  const emailNotifications = formData.get("emailNotifications") === "on";
  const inAppNotifications = formData.get("inAppNotifications") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      theme,
      notification_prefs: { email: emailNotifications, in_app: inAppNotifications },
    })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
}
