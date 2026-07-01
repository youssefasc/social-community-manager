"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, ExternalLink, BookmarkPlus, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveCommunityAction, saveManualCommunityAction } from "@/app/(app)/finder/actions";
import type { FinderResult } from "@/infrastructure/finder/community-finder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function FinderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FinderResult[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/finder?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSave(result: FinderResult) {
    startTransition(async () => {
      try {
        await saveCommunityAction(result);
        setSavedIds((prev) => new Set(prev).add(result.id));
        toast.success(`Saved "${result.name}" to your workspace`);
      } catch {
        toast.error("Failed to save community");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword, e.g. 'iPhone accessories Egypt'"
            className="pl-8"
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
        <ManualAddDialog />
      </form>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Results show publicly available metadata only. This app never
            automates joining a community — save the ones you&apos;re
            interested in and open them yourself to request access.
          </p>
        </CardContent>
      </Card>

      {searched && !isSearching && results.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No search provider is configured yet for automated discovery.
            <br />
            Use <strong>&quot;Add manually&quot;</strong> above to save a community
            you&apos;ve already found by URL — see the README for wiring up a
            search provider (e.g. a search API) to power this box.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <Card key={result.id}>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="font-medium">{result.name}</p>
                <p className="truncate text-xs text-muted-foreground">{result.url}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="capitalize">{result.platform}</Badge>
                <Badge variant="outline" className="capitalize">{result.privacy}</Badge>
                {result.memberCount ? (
                  <Badge variant="outline">{result.memberCount.toLocaleString()} members</Badge>
                ) : null}
              </div>
              {result.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{result.description}</p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" /> Open
                  </a>
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={isPending || savedIds.has(result.id)}
                  onClick={() => handleSave(result)}
                >
                  <BookmarkPlus className="size-4" />
                  {savedIds.has(result.id) ? "Saved" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ManualAddDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          Add manually
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save a community by URL</DialogTitle>
          <DialogDescription>
            Already know the community? Add it directly to your workspace.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            startTransition(async () => {
              try {
                await saveManualCommunityAction(formData);
                toast.success("Community saved");
                setOpen(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save");
              }
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. iPhone Accessories Egypt" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" required type="url" placeholder="https://facebook.com/groups/..." />
          </div>
          <input type="hidden" name="platform" value="other" />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save to workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
