import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listScheduledPostsUseCase } from "@/application/use-cases/scheduler/scheduler-use-cases";
import { listContentUseCase } from "@/application/use-cases/content/content-use-cases";
import { listCommunitiesUseCase } from "@/application/use-cases/communities/community-use-cases";
import { listAccountsUseCase } from "@/application/use-cases/accounts/account-use-cases";
import { SchedulePostDialog } from "@/components/shared/schedule-post-dialog";
import { CancelPostButton } from "@/components/shared/cancel-post-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive"> = {
  queued: "default",
  scheduled: "default",
  publishing: "warning",
  published: "success",
  failed: "destructive",
  canceled: "default",
};

export default async function SchedulerPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const [posts, content, communities, accounts] = await Promise.all([
    listScheduledPostsUseCase(supabase, userId),
    listContentUseCase(supabase, userId),
    listCommunitiesUseCase(supabase, userId),
    listAccountsUseCase(supabase, userId),
  ]);

  const activePosts = posts.filter((p) => p.status !== "canceled");
  const byDate = new Map<string, typeof posts>();
  for (const post of activePosts) {
    const key = new Date(post.scheduled_for).toDateString();
    byDate.set(key, [...(byDate.get(key) ?? []), post]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground">Queue, calendar, and status tracking.</p>
        </div>
        <SchedulePostDialog
          contentOptions={content.map((c) => ({ id: c.id, label: c.title }))}
          communityOptions={communities.map((c) => ({ id: c.id, label: c.name }))}
          accountOptions={accounts.map((a) => ({ id: a.id, label: a.display_name }))}
        />
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {activePosts.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Nothing scheduled yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Community</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(post.scheduled_for, { timeStyle: "short" })}
                        </TableCell>
                        <TableCell>{post.content_items?.title ?? "—"}</TableCell>
                        <TableCell>{post.communities?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[post.status]} className="capitalize">
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(post.status === "queued" || post.status === "scheduled") && (
                            <CancelPostButton id={post.id} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent>
              {byDate.size === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing scheduled yet.
                </p>
              ) : (
                <div className="flex flex-col divide-y">
                  {[...byDate.entries()]
                    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                    .map(([date, dayPosts]) => (
                      <div key={date} className="flex flex-col gap-2 py-4 first:pt-0">
                        <p className="text-sm font-semibold">
                          {new Date(date).toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <div className="flex flex-col gap-1.5 pl-2">
                          {dayPosts.map((post) => (
                            <div key={post.id} className="flex items-center gap-2 text-sm">
                              <span className="w-16 shrink-0 text-muted-foreground">
                                {formatDate(post.scheduled_for, { timeStyle: "short" }).split(",").pop()}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {post.content_items?.title ?? "Untitled"} →{" "}
                                {post.communities?.name ?? "—"}
                              </span>
                              <Badge variant={STATUS_VARIANT[post.status]} className="shrink-0 capitalize">
                                {post.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
