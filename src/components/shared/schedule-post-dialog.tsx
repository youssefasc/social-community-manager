"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { scheduleContentAction } from "@/app/(app)/scheduler/actions";

interface Option {
  id: string;
  label: string;
}

export function SchedulePostDialog({
  contentOptions,
  communityOptions,
  accountOptions,
}: {
  contentOptions: Option[];
  communityOptions: Option[];
  accountOptions: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [contentId, setContentId] = useState(contentOptions[0]?.id ?? "");
  const [communityId, setCommunityId] = useState(communityOptions[0]?.id ?? "");
  const [accountId, setAccountId] = useState(accountOptions[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const disabled = contentOptions.length === 0 || communityOptions.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <CalendarPlus className="size-4" /> Schedule post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a post</DialogTitle>
          <DialogDescription>
            Pick content, a community, and when it should go out.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await scheduleContentAction(formData);
                toast.success("Post scheduled");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to schedule");
              }
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label>Content</Label>
            <Select value={contentId} onValueChange={setContentId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {contentOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="contentId" value={contentId} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Community</Label>
            <Select value={communityId} onValueChange={setCommunityId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {communityOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="communityId" value={communityId} />
          </div>

          {accountOptions.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Account (optional)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accountOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <input type="hidden" name="accountId" value={accountId} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="scheduledFor">Date & time</Label>
            <Input id="scheduledFor" name="scheduledFor" type="datetime-local" required />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
