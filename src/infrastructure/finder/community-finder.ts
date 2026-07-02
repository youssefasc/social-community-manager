/**
 * Community Finder — searches PUBLICLY INDEXED web results for
 * Facebook and Telegram groups matching a keyword.
 *
 * Provider strategy: Google Programmable Search Engine is tried first
 * (free tier: 100 queries/day). If Google reports its quota exhausted
 * (HTTP 429, or 403 with a "quota"/"rateLimitExceeded" reason), the
 * same query is retried on Bing Web Search API as a fallback so search
 * keeps working without the user having to do anything. If neither
 * provider is configured, this returns [] — no fabricated data.
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

interface NormalizedItem {
  title: string;
  url: string;
  snippet: string;
}

const GOOGLE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const BING_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search";

/**
 * Returns results from Google, or `null` specifically when the quota
 * is exhausted (so the caller knows to fall back to Bing) as opposed
 * to "not configured" or "no results", both of which return [].
 */
async function googleSearch(query: string): Promise<NormalizedItem[] | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) {
    console.error("[finder] GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID not set");
    return [];
  }

  const params = new URLSearchParams({ key: apiKey, cx, q: query, num: "10" });
  const res = await fetch(`${GOOGLE_ENDPOINT}?${params.toString()}`, { cache: "no-store" });

  if (res.status === 429) return null; // quota exhausted -> fall back to Bing

  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const reason: string | undefined = body?.error?.errors?.[0]?.reason;
    console.error("[finder] Google 403:", JSON.stringify(body?.error ?? body));
    if (reason === "rateLimitExceeded" || reason === "dailyLimitExceeded" || reason === "quotaExceeded") {
      return null; // quota exhausted -> fall back to Bing
    }
    return [];
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[finder] Google search failed: ${res.status}`, body.slice(0, 500));
    return [];
  }

  const data = await res.json();
  console.error(`[finder] Google returned ${data?.items?.length ?? 0} items for query: ${query}`);
  const items = (data?.items ?? []) as { title: string; link: string; snippet: string }[];
  return items.map((i) => ({ title: i.title, url: i.link, snippet: i.snippet }));
}

async function bingSearch(query: string): Promise<NormalizedItem[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(`${BING_ENDPOINT}?q=${encodeURIComponent(query)}&count=10`, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json();
  const items = (data?.webPages?.value ?? []) as { name: string; url: string; snippet: string }[];
  return items.map((i) => ({ title: i.name, url: i.url, snippet: i.snippet }));
}

/**
 * Tries Google first; falls back to Bing only when Google's quota is
 * specifically exhausted. If Google isn't configured at all, goes
 * straight to Bing. If neither is configured, returns [].
 */
async function searchWithFallback(query: string): Promise<NormalizedItem[]> {
  const googleResults = await googleSearch(query);
  if (googleResults !== null) return googleResults;
  return bingSearch(query);
}

function extractMemberCount(snippet: string): number | undefined {
  const match = snippet.match(/([\d,.]+)\s*(members|k members|subscribers)/i);
  if (!match) return undefined;
  const raw = match[1].replace(/,/g, "");
  const value = parseFloat(raw);
  return Number.isNaN(value) ? undefined : Math.round(value);
}

function toResult(item: NormalizedItem, platform: FinderResult["platform"]): FinderResult {
  return {
    id: item.url,
    name: item.title.replace(/\s*[-|]\s*Facebook$/i, "").trim(),
    url: item.url,
    platform,
    privacy: /private group/i.test(item.snippet)
      ? "private"
      : /public group/i.test(item.snippet)
        ? "public"
        : "unknown",
    memberCount: extractMemberCount(item.snippet),
    description: item.snippet,
  };
}

/**
 * Searches public web results for Facebook and Telegram groups
 * matching the keyword, using Google with automatic Bing fallback
 * once Google's daily quota is exhausted. Returns [] if neither
 * provider is configured — see README "Community Finder".
 */
export async function searchCommunitiesUseCase(keyword: string): Promise<FinderResult[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const [fbItems, tgItems] = await Promise.all([
    searchWithFallback(`${trimmed} site:facebook.com/groups`),
    searchWithFallback(`${trimmed} site:t.me`),
  ]);

  const results = [
    ...fbItems.map((i) => toResult(i, "facebook")),
    ...tgItems.map((i) => toResult(i, "telegram")),
  ];

  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
}
