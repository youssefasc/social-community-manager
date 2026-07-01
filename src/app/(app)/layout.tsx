import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

/**
 * Shared shell for every authenticated route: fixed sidebar on desktop,
 * slide-out drawer on mobile (handled inside Topbar), and a topbar with
 * theme toggle + user menu. Middleware already guarantees a session
 * exists here, but we still fetch the profile server-side for display.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <div className="fixed h-svh w-64">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={profile?.full_name ?? null}
          userEmail={user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
