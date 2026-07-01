import Link from "next/link";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listCommunitiesUseCase } from "@/application/use-cases/communities/community-use-cases";
import { CommunityRow } from "@/components/shared/community-row";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; platform?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const communities = await listCommunitiesUseCase(supabase, user!.id, {
    search: params.q,
    tag: params.tag,
    platform: params.platform,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Community Manager</h1>
          <p className="text-sm text-muted-foreground">
            Organize, tag, and export the communities you&apos;ve saved.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton communities={communities} />
          <Button asChild>
            <Link href="/finder">Find more</Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap gap-2" action="/communities">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input name="q" defaultValue={params.q} placeholder="Search by name..." className="pl-8" />
        </div>
        <Input name="tag" defaultValue={params.tag} placeholder="Filter by tag..." className="w-40" />
        <Button type="submit" variant="secondary">Filter</Button>
        {(params.q || params.tag) && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/communities">Clear</Link>
          </Button>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {communities.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No saved communities yet.{" "}
              <Link href="/finder" className="underline underline-offset-4">
                Search the Community Finder
              </Link>{" "}
              to save some.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communities.map((c) => (
                  <CommunityRow key={c.id} community={c} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
