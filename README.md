# Social Community Manager

Organize and manage content you publish to communities and groups you administer or are authorized to post in.

Built with Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase, and Playwright, following Clean Architecture.

## Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui (hand-configured — the shadcn registry was unreachable from the build sandbox, so components were authored directly from the same source)
- **Backend:** Supabase (Postgres + Auth + Storage), fully typed against the applied schema
- **Automation:** Playwright, used only to *reuse* a manually-captured browser session — never to automate a login
- **Rich text:** Tiptap
- **Deployment:** Docker (multi-stage, `output: standalone`) or Vercel

## Architecture

```
src/
  app/                    # Next.js routes (App Router)
    (app)/                # Authenticated shell: dashboard, accounts, finder, communities,
                           # content, scheduler, media, activity, settings
    login/ signup/ auth/  # Public auth routes
    api/                  # Route handlers (e.g. finder search)
  domain/                 # Entities, repository interfaces, value objects
  application/
    use-cases/            # One folder per module; pure functions taking a Supabase client
  infrastructure/
    supabase/              # browser/server/middleware/admin clients
    automation/             # Playwright publishing worker + platform adapter interface
    finder/                  # Community search integration point
    repositories/
  components/
    ui/                    # shadcn primitives
    layout/                # Sidebar, topbar, theme toggle
    shared/                 # Feature components (dialogs, forms, cards)
  types/database.types.ts  # Hand-authored types matching the live schema exactly
```

Each use-case takes a Supabase client and plain arguments — no framework coupling — so the application layer can be tested or reused outside Next.js.

## Supabase project

- **Name:** `social-community-manager`
- **Project ref:** `kygnenyfetbzgzuqhddc`
- **Region:** `eu-central-1`
- Dashboard: https://supabase.com/dashboard/project/kygnenyfetbzgzuqhddc

Schema (live, applied during this build):

| Table | Purpose |
|---|---|
| `profiles` | Role, theme, notification prefs (auto-created on signup) |
| `connected_accounts` | Platform accounts + a reference to a stored browser session |
| `communities` | Saved communities/groups, tags, privacy, member count |
| `content_items` | Drafts, ready posts, and templates (rich HTML + plain text) |
| `media_items` | Uploaded images/videos (Supabase Storage) |
| `scheduled_posts` | Queue linking content -> community -> account -> time |
| `activity_logs` | Full audit trail (info/success/warning/error) |

All tables have row-level security scoped to `auth.uid()`. Storage has two private buckets: `media` and `sessions`, each isolated per user by folder prefix.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase keys
npm run dev
```

Required env vars (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, needed for the scheduler worker
```

## Docker

```bash
docker compose up app                     # web app only
docker compose --profile worker up        # web app + scheduler worker
```

Or build directly:

```bash
docker build -t social-community-manager .
docker run -p 3000:3000 --env-file .env.local social-community-manager
```

## Connected Accounts & the Scheduler — how automation is scoped

This app **never automates a login, join, follow, or any action you didn't explicitly request.** For Connected Accounts:

1. Run `node scripts/capture-session.js <platform-login-url>` — a real, visible browser opens.
2. Log in yourself, including any 2FA/captcha.
3. Press Enter in the terminal; Playwright saves `storageState` (cookies/local storage) to `session-output.json`.
4. Upload that file to the private `sessions` Storage bucket under `${user_id}/${account_id}.json`, and set `connected_accounts.storage_state_ref` to that path.

The scheduler queue (`src/infrastructure/automation/publisher.ts`) only ever **reuses** that already-authenticated session to submit content you scheduled. Per-platform "submit a post" logic is intentionally left as a `PlatformAdapter` you implement and register — review each platform's terms for automated posting on accounts you administer before enabling one.

Run the worker that drains the queue:

```bash
node scripts/run-scheduler-worker.js
```

or trigger `drainDueQueueUseCase` from a platform cron (e.g. Vercel Cron -> a protected API route) instead of a standalone process.

## Community Finder — Facebook & Telegram groups

`src/infrastructure/finder/community-finder.ts` searches **publicly indexed web
results** for Facebook and Telegram groups matching a keyword, restricted to
`site:facebook.com/groups` and `site:t.me`. It tries **Google Programmable
Search Engine first** (100 free queries/day); once that daily quota is
exhausted, it **automatically falls back to Bing Web Search API** for the rest
of the day, so search keeps working without any manual switching. If neither
key is set, it returns `[]` — no fabricated data.

**Google setup** (primary, free tier: 100 queries/day):
1. https://programmablesearchengine.google.com/ → create a search engine → enable "Search the entire web"
2. Copy its **Search engine ID** into `GOOGLE_SEARCH_ENGINE_ID`
3. https://console.cloud.google.com/apis/credentials → enable "Custom Search API" → create an API key
4. Copy it into `GOOGLE_SEARCH_API_KEY`

**Bing setup** (optional fallback, free tier: 1,000 calls/month):
1. https://portal.azure.com → create a "Bing Search v7" resource
2. Copy its key into `BING_SEARCH_API_KEY`

**"Join" always just opens the group's URL in a new tab** — the user joins with
their own account. This app never automates joining, requesting access, or
any action on a community/group beyond opening it. Facebook's own Groups API
has been closed to third-party posting/joining automation since 2018 — this
is a platform-level restriction, not a limitation of this codebase, and it
applies regardless of how a request is framed.

## Module status

| Module | Status |
|---|---|
| Auth (login/signup/logout, protected routes) | Complete |
| Dashboard | Complete, live data |
| Connected Accounts | Complete (manual session capture, see above) |
| Community Finder | UI + manual save complete; search provider is a documented integration point |
| Community Manager | Complete (search, filter, tags, CSV export) |
| Content Library | Complete (rich text, templates, drafts) |
| Scheduler | Complete (queue + calendar view); live publishing needs a `PlatformAdapter` |
| Media Library | Complete (upload, search, categories, signed URLs) |
| Activity Logs | Complete |
| Settings | Complete |
| Docker | Multi-stage build + compose |

## Type generation

`src/types/database.types.ts` is hand-authored to exactly match the applied schema. If you have the Supabase CLI locally, you can regenerate it instead:

```bash
supabase gen types typescript --project-id wnxsfcclkjsgerjqmnrl > src/types/database.types.ts
```
