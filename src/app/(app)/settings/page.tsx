import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SettingsForm } from "@/components/shared/settings-form";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, theme, notification_prefs")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Theme, notifications, and account preferences.</p>
      </div>
      <SettingsForm
        fullName={profile?.full_name ?? ""}
        email={user!.email ?? ""}
        initialTheme={profile?.theme ?? "system"}
        emailNotifications={profile?.notification_prefs?.email ?? true}
        inAppNotifications={profile?.notification_prefs?.in_app ?? true}
      />
    </div>
  );
}
