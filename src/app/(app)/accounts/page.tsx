import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listAccountsUseCase } from "@/application/use-cases/accounts/account-use-cases";
import { AddAccountDialog } from "@/components/shared/add-account-dialog";
import { AccountRowActions } from "@/components/shared/account-row-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive"> = {
  active: "success",
  expired: "warning",
  error: "destructive",
  disconnected: "default",
};

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const accounts = await listAccountsUseCase(supabase, user!.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Connected Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Accounts you administer or are authorized to post in.
          </p>
        </div>
        <AddAccountDialog />
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm text-muted-foreground">
            Sessions are captured by logging in manually in a real browser window
            (never automated). The saved session is only used to publish content
            you explicitly schedule — this app does not join groups, follow
            accounts, or take any action you didn&apos;t request.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {accounts.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No accounts yet. Add your first one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.display_name}</TableCell>
                    <TableCell className="capitalize">{account.platform}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[account.status]} className="capitalize">
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.last_verified_at ? formatDate(account.last_verified_at) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AccountRowActions accountId={account.id} profileUrl={account.profile_url} />
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
