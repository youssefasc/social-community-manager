"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { createContentAction, updateContentAction } from "@/app/(app)/content/actions";
import type { Database } from "@/types/database.types";

type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];

export function ContentEditorForm({ item }: { item?: ContentItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body_html ?? "");
  const [status, setStatus] = useState<ContentItem["status"]>(item?.status ?? "draft");
  const [isTemplate, setIsTemplate] = useState(item?.is_template ?? false);
  const [templateName, setTemplateName] = useState(item?.template_name ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("title", title);
    formData.set("bodyHtml", body);
    formData.set("status", status);
    if (isTemplate) formData.set("isTemplate", "on");
    formData.set("templateName", templateName);

    startTransition(async () => {
      try {
        if (item) {
          await updateContentAction(item.id, formData);
          toast.success("Saved");
          router.refresh();
        } else {
          await createContentAction(formData);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Content</Label>
        <RichTextEditor content={body} onChange={setBody} />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {item ? (
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentItem["status"])}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Switch id="isTemplate" checked={isTemplate} onCheckedChange={setIsTemplate} />
          <Label htmlFor="isTemplate">Save as reusable template</Label>
        </div>

        {isTemplate && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="templateName">Template name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Weekly promo"
              className="w-56"
            />
          </div>
        )}
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {item ? "Save changes" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
