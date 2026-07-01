"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  updateCommunityTagsUseCase,
  deleteCommunityUseCase,
} from "@/application/use-cases/communities/community-use-cases";

export async function updateTagsAction(communityId: string, tags: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await updateCommunityTagsUseCase(supabase, user.id, communityId, tags);
  revalidatePath("/communities");
}

export async function deleteCommunityAction(communityId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await deleteCommunityUseCase(supabase, user.id, communityId);
  revalidatePath("/communities");
}
