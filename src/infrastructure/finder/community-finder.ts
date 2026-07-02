/**
 * Community Finder — searches PUBLICLY INDEXED web results for
 * Facebook and Telegram groups matching a keyword, using the Bing Web
 * Search API restricted to facebook.com/groups and t.me links.
 *
 * This intentionally does NOT:
 *  - call any authenticated/private platform API
 *  - join, request to join, or follow anything
 *  - scrape logged-in-only pages
 *
 * It only surfaces what a normal web search would show, so the user
 * can review and open the link themselves to join with their own
 * account and judgment.
 */

export interface FinderResult {
  id: string;
  name: string;
  url: string;
  platform: "facebook" | "telegram" | "other";
  privacy: "public" | "private" | "unknown";
  memberCount?: number;
  description?: string;
}

interface BingWebPage {
  name: string;
  url: string;
  snippet: string;
}

const BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search";

async function bingSearch(query: string): Promise<BingWebPage[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(`${BING_ENDPOINT}?q=${encodeURIComponent(query)}&count=10`, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    // Bing results change; never cache stale group listings
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data?.webPages?.value ?? []) as BingWebPage[];
}

function extractMemberCount(snippet: string): number | undefined {
  const match = snippet.match(/([\d,.]+)\s*(members|k members|subscribers)/i);
  if (!match) return undefined;
  const raw = match[1].replace(/,/g, "");
  const value = parseFloat(raw);
  return Number.isNaN(value) ? undefined : Math.round(value);
}

function toResult(page: BingWebPage, platform: FinderResult["platform"]): FinderResult {
  return {
    id: page.url,
    name: page.name.replace(/\s*[-|]\s*Facebook$/i, "").trim(),
    url: page.url,
    platform,
    privacy: /private group/i.test(page.snippet)
      ? "private"
      : /public group/i.test(page.snippet)
        ? "public"
        : "unknown",
    memberCount: extractMemberCount(page.snippet),
    description: page.snippet,
  };
}

/**
 * Searches public web results for Facebook and Telegram groups
 * matching the keyword. Returns [] (no fabricated data) if
 * BING_SEARCH_API_KEY isn't configured — see README "Community Finder".
 */
export async function searchCommunitiesUseCase(keyword: string): Promise<FinderResult[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const [fbPages, tgPages] = await Promise.all([
    bingSearch(`${trimmed} site:facebook.com/groups`),
    bingSearch(`${trimmed} site:t.me`),
  ]);

  const results = [
    ...fbPages.map((p) => toResult(p, "facebook")),
    ...tgPages.map((p) => toResult(p, "telegram")),
  ];

  // De-dupe by URL in case both queries somehow overlap
  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
}
