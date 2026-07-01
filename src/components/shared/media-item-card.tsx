"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, FileVideo, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMediaAction } from "@/app/(app)/media/actions";

interface MediaItemCardProps {
  id: string;
  fileName: string;
  storagePath: string;
  mediaType: "image" | "video" | "other";
  previewUrl: string | null;
  category: string | null;
}

export function MediaItemCard({ id, fileName, storagePath, mediaType, previewUrl, category }: MediaItemCardProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="flex aspect-square items-center justify-center bg-muted">
        {mediaType === "image" && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={fileName} className="size-full object-cover" />
        ) : mediaType === "video" ? (
          <FileVideo className="size-10 text-muted-foreground" />
        ) : (
          <FileIcon className="size-10 text-muted-foreground" />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{fileName}</p>
          {category ? <Badge variant="outline" className="mt-1 text-[10px]">{category}</Badge> : null}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Delete">
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this file?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteMediaAction(id, storagePath);
                      toast.success("Deleted");
                    } catch {
                      toast.error("Failed to delete");
                    }
                  })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
