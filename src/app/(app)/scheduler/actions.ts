"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  createScheduledPostUseCase,
  cancelScheduledPostUseCase,
} from "@/application/use-cases/scheduler/scheduler-use-cases";

export async function scheduleContentAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const contentId = String(formData.get("contentId") ?? "");
  const communityId = String(formData.get("communityId") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const scheduledFor = String(formData.get("scheduledFor") ?? "");

  if (!contentId || !communityId || !scheduledFor) {
    throw new Error("Content, community, and date/time are required");
  }

  await createScheduledPostUseCase(supabase, {
    user_id: user.id,
    content_id: contentId,
    community_id: communityId,
    account_id: accountId || null,
    scheduled_for: new Date(scheduledFor).toISOString(),
  });

  revalidatePath("/scheduler");
}

export async function cancelScheduledPostAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await cancelScheduledPostUseCase(supabase, user.id, id);
  revalidatePath("/scheduler");
}
