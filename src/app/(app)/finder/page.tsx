import { FinderSearch } from "@/components/shared/finder-search";

export default function FinderPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community Finder</h1>
        <p className="text-sm text-muted-foreground">
          Search for communities by keyword and save the ones worth tracking.
        </p>
      </div>
      <FinderSearch />
    </div>
  );
}
