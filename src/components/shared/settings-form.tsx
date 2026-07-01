"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateProfileAction } from "@/app/(app)/settings/actions";

interface SettingsFormProps {
  fullName: string;
  email: string;
  initialTheme: "light" | "dark" | "system";
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export function SettingsForm({
  fullName: initialFullName,
  email,
  initialTheme,
  emailNotifications: initialEmailNotif,
  inAppNotifications: initialInAppNotif,
}: SettingsFormProps) {
  const { setTheme } = useTheme();
  const [fullName, setFullName] = useState(initialFullName);
  const [theme, setThemeValue] = useState(initialTheme);
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotif);
  const [inAppNotifications, setInAppNotifications] = useState(initialInAppNotif);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("theme", theme);
    if (emailNotifications) formData.set("emailNotifications", "on");
    if (inAppNotifications) formData.set("inAppNotifications", "on");

    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        setTheme(theme);
        toast.success("Settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card id="profile">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setThemeValue(v as typeof theme)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-sm text-muted-foreground">Updates about scheduled posts and errors</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">In-app notifications</p>
              <p className="text-sm text-muted-foreground">Toasts for actions taken in the app</p>
            </div>
            <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
