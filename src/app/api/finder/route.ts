import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { searchCommunitiesUseCase } from "@/infrastructure/finder/community-finder";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("q") ?? "";

  const results = await searchCommunitiesUseCase(keyword);
  return NextResponse.json({ results });
}
