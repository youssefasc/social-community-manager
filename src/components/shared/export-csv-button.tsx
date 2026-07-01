"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];

function toCsv(communities: Community[]): string {
  const header = ["Name", "URL", "Platform", "Privacy", "Members", "Tags"];
  const rows = communities.map((c) => [
    c.name,
    c.url,
    c.platform,
    c.privacy,
    c.member_count?.toString() ?? "",
    c.tags.join("; "),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export function ExportCsvButton({ communities }: { communities: Community[] }) {
  function handleExport() {
    const csv = toCsv(communities);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `communities-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={communities.length === 0}>
      <Download className="size-4" /> Export CSV
    </Button>
  );
}
