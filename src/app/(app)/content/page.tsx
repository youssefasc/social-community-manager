import Link from "next/link";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listContentUseCase } from "@/application/use-cases/content/content-use-cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning"> = {
  draft: "warning",
  ready: "success",
  archived: "default",
};

export default async function ContentLibraryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const items = await listContentUseCase(supabase, user!.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Library</h1>
          <p className="text-sm text-muted-foreground">Drafts, ready posts, and reusable templates.</p>
        </div>
        <Button asChild>
          <Link href="/content/new">
            <Plus className="size-4" /> New content
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No content yet. Create your first draft to get started.
            </p>
            <Button asChild>
              <Link href="/content/new">
                <Plus className="size-4" /> New content
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/content/${item.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant={STATUS_VARIANT[item.status]} className="shrink-0 capitalize">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {item.body_text ? truncate(item.body_text, 140) : "No content yet"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(item.updated_at)}</span>
                    {item.is_template && <Badge variant="outline">Template</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
