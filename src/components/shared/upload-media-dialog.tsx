"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadMediaAction } from "@/app/(app)/media/actions";

export function UploadMediaDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload media</DialogTitle>
          <DialogDescription>Images or videos, stored privately in your workspace.</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          action={(formData) => {
            startTransition(async () => {
              try {
                await uploadMediaAction(formData);
                toast.success("Uploaded");
                setOpen(false);
                formRef.current?.reset();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed");
              }
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">File</Label>
            <Input id="file" name="file" type="file" accept="image/*,video/*" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input id="category" name="category" placeholder="e.g. product-shots" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
