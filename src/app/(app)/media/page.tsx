import Link from "next/link";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listMediaUseCase } from "@/application/use-cases/media/media-use-cases";
import { UploadMediaDialog } from "@/components/shared/upload-media-dialog";
import { MediaItemCard } from "@/components/shared/media-item-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ImageOff } from "lucide-react";

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const items = await listMediaUseCase(supabase, user!.id, {
    search: params.q,
    category: params.category,
  });

  const itemsWithUrls = await Promise.all(
    items.map(async (item) => {
      if (item.media_type !== "image") return { ...item, previewUrl: null };
      const { data } = await supabase.storage.from("media").createSignedUrl(item.storage_path, 60 * 60);
      return { ...item, previewUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">Images and videos for your content.</p>
        </div>
        <UploadMediaDialog />
      </div>

      <form className="flex gap-2" action="/media">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input name="q" defaultValue={params.q} placeholder="Search files..." className="pl-8" />
        </div>
        <Input name="category" defaultValue={params.category} placeholder="Category..." className="w-40" />
        <Button type="submit" variant="secondary">Filter</Button>
        {(params.q || params.category) && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/media">Clear</Link>
          </Button>
        )}
      </form>

      {itemsWithUrls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ImageOff className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {itemsWithUrls.map((item) => (
            <MediaItemCard
              key={item.id}
              id={item.id}
              fileName={item.file_name}
              storagePath={item.storage_path}
              mediaType={item.media_type}
              previewUrl={item.previewUrl}
              category={item.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
