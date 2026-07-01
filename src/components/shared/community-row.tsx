"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
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
import { updateTagsAction, deleteCommunityAction } from "@/app/(app)/communities/actions";
import type { Database } from "@/types/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];

const PRIVACY_VARIANT: Record<string, "default" | "success" | "warning"> = {
  public: "success",
  private: "warning",
  unknown: "default",
};

export function CommunityRow({ community }: { community: Community }) {
  const [tags, setTags] = useState(community.tags);
  const [tagInput, setTagInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function commitTags(next: string[]) {
    setTags(next);
    startTransition(async () => {
      try {
        await updateTagsAction(community.id, next);
      } catch {
        toast.error("Failed to update tags");
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {community.name}
          <a href={community.url} target="_blank" rel="noopener noreferrer" aria-label="Open in browser">
            <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
          </a>
        </div>
      </TableCell>
      <TableCell className="capitalize text-muted-foreground">{community.platform}</TableCell>
      <TableCell>
        <Badge variant={PRIVACY_VARIANT[community.privacy]} className="capitalize">
          {community.privacy}
        </Badge>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {community.member_count?.toLocaleString() ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex max-w-56 flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              {tag}
              <button
                onClick={() => commitTags(tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = tagInput.trim();
              if (value && !tags.includes(value)) commitTags([...tags, value]);
              setTagInput("");
            }}
            className="flex items-center gap-1"
          >
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="+ tag"
              className="h-6 w-16 border-none px-1 text-xs shadow-none focus-visible:ring-0"
              disabled={isPending}
            />
          </form>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Remove community">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove &quot;{community.name}&quot;?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes it from your workspace. You can always re-save it from the Community Finder.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteCommunityAction(community.id);
                      toast.success("Removed from workspace");
                    } catch {
                      toast.error("Failed to remove");
                    }
                  })
                }
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
