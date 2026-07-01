"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  createContentUseCase,
  updateContentUseCase,
  deleteContentUseCase,
} from "@/application/use-cases/content/content-use-cases";

function extractText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function createContentAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = String(formData.get("title") ?? "Untitled");
  const bodyHtml = String(formData.get("bodyHtml") ?? "");
  const isTemplate = formData.get("isTemplate") === "on";
  const templateName = String(formData.get("templateName") ?? "") || null;

  const item = await createContentUseCase(supabase, {
    user_id: user.id,
    title,
    body_html: bodyHtml,
    body_text: extractText(bodyHtml),
    status: "draft",
    is_template: isTemplate,
    template_name: templateName,
  });

  revalidatePath("/content");
  redirect(`/content/${item.id}`);
}

export async function updateContentAction(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = String(formData.get("title") ?? "Untitled");
  const bodyHtml = String(formData.get("bodyHtml") ?? "");
  const status = String(formData.get("status") ?? "draft") as "draft" | "ready" | "archived";

  await updateContentUseCase(supabase, user.id, id, {
    title,
    body_html: bodyHtml,
    body_text: extractText(bodyHtml),
    status,
  });

  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
}

export async function deleteContentAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await deleteContentUseCase(supabase, user.id, id);
  revalidatePath("/content");
}
