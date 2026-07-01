import Link from "next/link";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listActivityUseCase } from "@/application/use-cases/activity/activity-use-cases";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { ScrollText } from "lucide-react";

const LEVEL_VARIANT: Record<string, "default" | "success" | "warning" | "destructive"> = {
  info: "default",
  success: "success",
  warning: "warning",
  error: "destructive",
};

const LEVELS = ["all", "info", "success", "warning", "error"] as const;

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const params = await searchParams;
  const level = (params.level ?? "all") as (typeof LEVELS)[number];

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const logs = await listActivityUseCase(supabase, user!.id, { level });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Complete audit trail of actions in your workspace.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <Button key={l} variant={level === l ? "default" : "outline"} size="sm" asChild>
            <Link href={l === "all" ? "/activity" : `/activity?level=${l}`} className="capitalize">
              {l}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ScrollText className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={LEVEL_VARIANT[log.level]} className="capitalize">
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.action}</TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatDate(log.created_at, { timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
