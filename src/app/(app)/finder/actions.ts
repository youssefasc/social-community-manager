"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { saveCommunityUseCase } from "@/application/use-cases/communities/community-use-cases";
import type { FinderResult } from "@/infrastructure/finder/community-finder";

export async function saveCommunityAction(result: FinderResult) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await saveCommunityUseCase(supabase, {
    user_id: user.id,
    name: result.name,
    url: result.url,
    platform: result.platform,
    privacy: result.privacy,
    member_count: result.memberCount ?? null,
    description: result.description ?? null,
    source: "finder",
  });

  revalidatePath("/communities");
}

export async function saveManualCommunityAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const platform: "facebook" | "telegram" | "other" = /facebook\.com/i.test(url)
    ? "facebook"
    : /t\.me/i.test(url)
      ? "telegram"
      : "other";

  if (!name || !url) throw new Error("Name and URL are required");

  await saveCommunityUseCase(supabase, {
    user_id: user.id,
    name,
    url,
    platform,
    privacy: "unknown",
    source: "manual",
  });

  revalidatePath("/communities");
}
