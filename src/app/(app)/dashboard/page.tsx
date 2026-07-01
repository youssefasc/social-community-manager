import Link from "next/link";
import {
  Users,
  FileText,
  CalendarClock,
  Link2,
  ArrowRight,
  Circle,
} from "lucide-react";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDashboardDataUseCase } from "@/application/use-cases/dashboard/get-dashboard-data";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const LEVEL_BADGE: Record<string, "default" | "success" | "warning" | "destructive"> = {
  info: "default",
  success: "success",
  warning: "warning",
  error: "destructive",
};

const ACCOUNT_STATUS_COLOR: Record<string, string> = {
  active: "text-success",
  expired: "text-warning",
  error: "text-destructive",
  disconnected: "text-muted-foreground",
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { stats, recentActivity, upcomingPosts, accounts } =
    await getDashboardDataUseCase(supabase, user!.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A quick overview of your communities, content, and schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saved communities" value={stats.savedCommunities} icon={Users} />
        <StatCard label="Content drafts" value={stats.contentDrafts} icon={FileText} accent="warning" />
        <StatCard label="Upcoming scheduled posts" value={stats.scheduledUpcoming} icon={CalendarClock} accent="success" />
        <StatCard label="Connected accounts" value={stats.connectedAccounts} icon={Link2} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/activity">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No activity yet. Actions you take will show up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 text-sm">
                    <Badge variant={LEVEL_BADGE[entry.level]} className="mt-0.5 shrink-0">
                      {entry.level}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{entry.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.created_at, { timeStyle: "short" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Connected accounts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Connected accounts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">
                Manage <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="py-6 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  No accounts connected yet.
                </p>
                <Button size="sm" asChild>
                  <Link href="/accounts">Add account</Link>
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {accounts.slice(0, 6).map((account) => (
                  <li key={account.id} className="flex items-center gap-2 text-sm">
                    <Circle
                      className={`size-2 shrink-0 fill-current ${ACCOUNT_STATUS_COLOR[account.status]}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{account.display_name}</span>
                    <Badge variant="outline" className="capitalize">
                      {account.platform}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled posts */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Scheduled posts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/scheduler">
              Open scheduler <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing scheduled yet.{" "}
              <Link href="/scheduler" className="underline underline-offset-4">
                Schedule your first post
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {upcomingPosts.map((post) => (
                <li key={post.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-muted-foreground">
                    {formatDate(post.scheduled_for, { timeStyle: "short" })}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {post.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
