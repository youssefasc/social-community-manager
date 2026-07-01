import { ContentEditorForm } from "@/components/shared/content-editor-form";

export default function NewContentPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New content</h1>
        <p className="text-sm text-muted-foreground">Draft a post for your content library.</p>
      </div>
      <ContentEditorForm />
    </div>
  );
}
