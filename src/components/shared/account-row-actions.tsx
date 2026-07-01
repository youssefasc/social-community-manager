"use client";

import { useTransition } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { deleteAccountAction } from "@/app/(app)/accounts/actions";

export function AccountRowActions({ accountId, profileUrl }: { accountId: string; profileUrl: string | null }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      {profileUrl ? (
        <Button variant="ghost" size="icon" asChild>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" aria-label="Open in browser">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Remove account">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the account record and its stored session reference. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteAccountAction(accountId);
                    toast.success("Account removed");
                  } catch {
                    toast.error("Failed to remove account");
                  }
                })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
