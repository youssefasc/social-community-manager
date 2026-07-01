"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelScheduledPostAction } from "@/app/(app)/scheduler/actions";

export function CancelPostButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      aria-label="Cancel scheduled post"
      onClick={() =>
        startTransition(async () => {
          try {
            await cancelScheduledPostAction(id);
            toast.success("Post canceled");
          } catch {
            toast.error("Failed to cancel");
          }
        })
      }
    >
      <X className="size-4 text-destructive" />
    </Button>
  );
}
