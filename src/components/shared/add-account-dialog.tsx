"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { addAccountAction } from "@/app/(app)/accounts/actions";

const PLATFORMS = ["facebook", "linkedin", "reddit", "discord", "telegram", "other"] as const;

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("facebook");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add connected account</DialogTitle>
          <DialogDescription>
            Register an account you manage. To actually authorize posting,
            you&apos;ll log in manually in a real browser window — this app
            never automates a login for you.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await addAccountAction(formData);
                toast.success("Account added");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to add account");
              }
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
              <SelectTrigger id="platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="platform" value={platform} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" placeholder="e.g. CasYou Page Admin" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profileUrl">Profile / page URL (optional)</Label>
            <Input id="profileUrl" name="profileUrl" placeholder="https://facebook.com/..." />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
