"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  createMediaRecordUseCase,
  deleteMediaUseCase,
} from "@/application/use-cases/media/media-use-cases";

export async function uploadMediaAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") ?? "") || null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other";
  const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  await createMediaRecordUseCase(supabase, {
    user_id: user.id,
    file_name: file.name,
    storage_path: path,
    media_type: mediaType,
    mime_type: file.type,
    size_bytes: file.size,
    category,
  });

  revalidatePath("/media");
}

export async function deleteMediaAction(id: string, storagePath: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await deleteMediaUseCase(supabase, user.id, id, storagePath);
  revalidatePath("/media");
}
