import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getContentUseCase } from "@/application/use-cases/content/content-use-cases";
import { ContentEditorForm } from "@/components/shared/content-editor-form";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const item = await getContentUseCase(supabase, user!.id, id);

  if (!item) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit content</h1>
        <p className="text-sm text-muted-foreground">Last updated automatically as you save.</p>
      </div>
      <ContentEditorForm item={item} />
    </div>
  );
}
