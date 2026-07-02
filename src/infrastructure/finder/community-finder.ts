/**
 * Community Finder — searches PUBLICLY INDEXED web results for
 * Facebook and Telegram groups matching a keyword.
 *
 * Provider strategy, in order:
 *  1. Google Programmable Search Engine, if GOOGLE_SEARCH_API_KEY +
 *     GOOGLE_SEARCH_ENGINE_ID are set (100 free queries/day, requires
 *     a billing account linked on the Google Cloud project).
 *  2. Bing Web Search API, if BING_SEARCH_API_KEY is set — used as a
 *     fallback once Google's daily quota is exhausted, or directly if
 *     Google isn't configured at all.
 *  3. SearXNG — a free, open-source metasearch engine with no signup,
 *     no API key, and no billing account required. Public instances
 *     are run by volunteers, so availability isn't guaranteed the way
 *     a paid API is; several instances are tried in sequence. This is
 *     the default with zero configuration.
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

// Public SearXNG instances that support JSON output. Tried in order;
// the first one that responds successfully wins. See https://searx.space
// for a live list if these ever go offline — swap them in here.
const SEARX_INSTANCES = [
  "https://searx.be",
  "https://search.sapti.me",
  "https://searx.tiekoetter.com",
  "https://priv.au",
];

async function googleSearch(query: string): Promise<NormalizedItem[] | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return [];

  const params = new URLSearchParams({ key: apiKey, cx, q: query, num: "10" });
  const res = await fetch(`${GOOGLE_ENDPOINT}?${params.toString()}`, { cache: "no-store" });

  if (res.status === 429) return null; // quota exhausted -> fall back

  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    const reason: string | undefined = body?.error?.errors?.[0]?.reason;
    console.error("[finder] Google 403:", JSON.stringify(body?.error ?? body));
    if (reason === "rateLimitExceeded" || reason === "dailyLimitExceeded" || reason === "quotaExceeded") {
      return null; // quota exhausted -> fall back
    }
    return [];
  }

  if (!res.ok) return [];

  const data = await res.json();
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

async function searxSearch(query: string): Promise<NormalizedItem[]> {
  for (const instance of SEARX_INSTANCES) {
    try {
      const params = new URLSearchParams({ q: query, format: "json" });
      const res = await fetch(`${instance}/search?${params.toString()}`, {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CommunityFinder/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data?.results ?? []) as { title: string; url: string; content?: string }[];
      if (items.length > 0) {
        return items.map((i) => ({ title: i.title, url: i.url, snippet: i.content ?? "" }));
      }
    } catch {
      continue; // try the next instance
    }
  }
  return [];
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
 * Tries Google first (if configured), then Bing (if configured), then
 * falls back to free SearXNG instances — so this works with zero setup
 * out of the box, and upgrades automatically if paid API keys are added.
 */
async function search(query: string): Promise<NormalizedItem[]> {
  const googleResults = await googleSearch(query);
  if (googleResults !== null && googleResults.length > 0) return googleResults;

  const bingResults = await bingSearch(query);
  if (bingResults.length > 0) return bingResults;

  return searxSearch(query);
}

/**
 * Searches public web results for Facebook and Telegram groups
 * matching the keyword.
 */
export async function searchCommunitiesUseCase(keyword: string): Promise<FinderResult[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const [fbItems, tgItems] = await Promise.all([
    search(`${trimmed} site:facebook.com/groups`),
    search(`${trimmed} site:t.me`),
  ]);

  const results = [
    ...fbItems.map((i) => toResult(i, "facebook")),
    ...tgItems.map((i) => toResult(i, "telegram")),
  ];

  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
}
