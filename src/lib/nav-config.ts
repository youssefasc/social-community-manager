import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Link2,
  Search,
  Users,
  FileText,
  CalendarClock,
  Image as ImageIcon,
  ScrollText,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & activity" },
  { title: "Connected Accounts", href: "/accounts", icon: Link2, description: "Manage browser sessions" },
  { title: "Community Finder", href: "/finder", icon: Search, description: "Discover communities" },
  { title: "Community Manager", href: "/communities", icon: Users, description: "Organize saved communities" },
  { title: "Content Library", href: "/content", icon: FileText, description: "Drafts & templates" },
  { title: "Scheduler", href: "/scheduler", icon: CalendarClock, description: "Queue & calendar" },
  { title: "Media Library", href: "/media", icon: ImageIcon, description: "Uploaded files" },
  { title: "Activity Logs", href: "/activity", icon: ScrollText, description: "Audit trail" },
  { title: "Settings", href: "/settings", icon: Settings, description: "Preferences" },
];
