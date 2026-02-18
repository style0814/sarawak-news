# Sarawak News - Full Codebase Study Guide

A phased guide to understanding every file in the project, from foundation to advanced features.

---

## Phase 1: Foundation (Config & Database)

Read these first — everything else depends on them.

| File | What It Does |
|------|-------------|
| `package.json` | All dependencies — see what libraries the project uses |
| `next.config.ts` | Next.js config (Turbopack, Sentry, image domains) |
| `tsconfig.json` | TypeScript config (`@/` path alias maps to project root) |
| `.env.local` | Environment variables (API keys, secrets) — not in git |

**Persistence note:** SQLite file path is controlled by `DATABASE_PATH` (default `./data/news.db`). In container hosting (e.g. Railway), use a persistent volume path like `/data/news.db` to avoid data loss on redeploy/restart.

### `lib/db.ts` — The heart of the backend

This is the **single most important file**. Every feature reads/writes through here (~1800 lines).

- **`getDb()`** (~line 9) — Singleton pattern. Creates ONE database connection, reuses it everywhere. Calls `initializeDb()` on first connection
- **`initializeDb()`** (~line 18) — Creates all tables with `CREATE TABLE IF NOT EXISTS`. Uses `try/catch ALTER TABLE` for migrations (adding columns to existing tables)
- **Table functions** — The rest of the file is exported functions grouped by feature:
  - `getMetadata()` / `setMetadata()` — Key-value store for app settings
  - `createUser()` / `getUserByEmail()` — User CRUD
  - `getAllNews()` / `addNews()` / `incrementClicks()` — News CRUD + ranking
  - `getComments()` / `addComment()` / `likeComment()` — Comments
  - `getBookmarks()` / `addBookmark()` — Bookmarks
  - `getNewsSummary()` / `saveNewsSummary()` — AI summary cache
  - `searchNews()` — Full-text search
  - Admin functions, RSS feed management, error logging, audit log, etc.

**Key pattern**: All DB functions are **synchronous** (better-sqlite3 is sync). Only bcrypt operations are async.

### `lib/i18n.ts` — Translations & helpers

- `translations` object with keys for `en`, `zh`, `ms` — every UI string in 3 languages
- `getTimeAgo(date, lang)` — "5 minutes ago" in 3 languages
- `getDomain(url)` — Extracts domain from URL for display

### `lib/auth.ts` — NextAuth configuration

- Credentials provider (username/password login)
- Session callbacks (attach userId to session)
- Uses bcrypt to verify passwords against `users` table

### `lib/adminAuth.ts` — Separate admin auth

- Cookie-based auth (not NextAuth — completely separate system)
- `getAdminSession()` — Reads admin cookie, returns `{ userId, username }` or null
- Admin login creates a signed cookie with `ADMIN_SESSION_SECRET`

---

## Phase 2: Layout & Providers (App Shell)

These wrap every page. Understand them before reading any page component.

### `app/layout.tsx` — Root layout

- Sets global metadata (title, description, OG tags, favicon)
- Wraps all children in `<Providers>` for session, theme, language
- Injects Google AdSense script in `<head>` when configured
- Every page in the app renders inside this layout

### `components/Providers.tsx` — Provider stack

Nests multiple React Context providers:
- `SessionProvider` (NextAuth) — makes `useSession()` available
- `ThemeProvider` — dark/light mode state
- `LanguageProvider` — current language state
- `PremiumProvider` — subscription status

### `components/ThemeProvider.tsx` — Dark mode system

- Reads/saves preference to `localStorage` key `sarawak-news-theme`
- Provides `isDark` boolean and `toggleTheme()` via React Context
- Syncs across browser tabs via `storage` event listener
- Also saves to DB for authenticated users via `/api/preferences`

### `components/LanguageProvider.tsx` — Language system

- Reads/saves language (`en`/`zh`/`ms`) to `localStorage`
- Provides `lang` and `setLanguage()` via React Context
- Syncs across browser tabs

### `components/Header.tsx` — Top navigation bar

- Site logo (`HornbillLogo` component), site title
- Contains `LanguageSwitcher` and `DarkModeToggle`
- Shows "last updated" timestamp

### `components/HornbillLogo.tsx` — SVG logo

- Rhinoceros Hornbill side-profile SVG icon
- Configurable sizes: `sm` (20px), `md` (28px), `lg` (40px), `xl` (64px), `hero` (80px)
- Uses `currentColor` so it inherits text color from parent

---

## Phase 3: Main Pages (Home + News Detail)

### Homepage — Server + Client split

**`app/page.tsx`** — Server Component (~20 lines)
- Calls `getAllNews(1, 20)` directly from `lib/db.ts` (no API call)
- Calls `getMetadata('last_refresh')` for countdown timer
- Passes everything as props to `HomeClient`
- **Why split?** So Google's crawler sees 20 news articles in raw HTML (not "Loading...")

**`components/HomeClient.tsx`** — Client Component (~280 lines)
- Receives SSR data as props, starts with `loading: false` (no spinner on first load)
- **State**: `news[]`, `pagination`, `selectedCategory`, `searchQuery`, `nextRefreshIn`, `isRefreshing`, etc.
- **Key effects**:
  - Empty DB detection → triggers `POST /api/refresh` to fetch RSS feeds
  - Countdown timer (1-second interval, counts down from 10 minutes)
  - Auto-refresh when countdown hits 0 → calls `/api/refresh` then re-fetches news
  - Category change → re-fetches via `/api/news?category=X`
- **Handlers**: `handlePageChange`, `handleCategoryChange`, `handleSearch`, `handleClearSearch`, `handleItemClick`, `handleDiscussClick`
- **Renders**: status bar (LIVE indicator + countdown), search bar, category filter, news list, pagination, ad banner, footer, listen-all player

**`components/NewsList.tsx`** — Maps over `news[]` array, renders loading skeleton or list of `NewsItem`
**`components/NewsItem.tsx`** — Single news row: rank number, title (translated by language), source name, time ago, clicks, comment count, AI summary button, share buttons
**`components/Pagination.tsx`** — Page number buttons with prev/next navigation
**`components/CategoryFilter.tsx`** — Horizontal scrollable pills for category filtering
**`components/SearchBar.tsx`** — Search input with debounced autocomplete suggestions

### News Detail Page

**`app/news/[id]/page.tsx`** — Server Component
- `generateMetadata()` — Dynamic SEO metadata: title, description (uses AI summary if available), Open Graph tags, Twitter cards
- `NewsDetailPage()` — Fetches news item + AI summary from DB, builds JSON-LD NewsArticle schema, passes everything to `NewsDetail`
- `incrementClicks()` runs server-side on every page view

**`components/NewsDetail.tsx`** — Client Component
- Header with back button and language switcher
- Article card: title (translated), source name + domain, time ago, click count, category badge
- "Read More" button (links to original source)
- Share buttons (Facebook, Twitter, WhatsApp, etc.)
- **AI Summary section** — Language-aware, appears between article card and comments. Shows `summary_en`, `summary_zh`, or `summary_ms` based on user's language
- `CommentSection` at bottom

---

## Phase 4: User Features

### Authentication Pages

**`app/auth/login/page.tsx`** — Login form with username/email + password. Calls `signIn('credentials', ...)` from NextAuth
**`app/auth/register/page.tsx`** — Registration form. Calls `POST /api/auth/register`

### Auth Backend

**`app/api/auth/register/route.ts`** — Validates input, hashes password with bcrypt, calls `createUser()`
**`app/api/auth/[...nextauth]/route.ts`** — NextAuth catch-all route, exports GET/POST handlers configured in `lib/auth.ts`

### User Pages

**`app/profile/page.tsx`** — Edit display name, change password, view stats (articles read, comments posted, bookmarks saved)
**`app/bookmarks/page.tsx`** — List of saved articles with remove button
**`app/comments/page.tsx`** — User's comment history across all articles

### Comment System

**`components/CommentSection.tsx`** — Full threaded comment system:
- Fetches comments via `GET /api/comments?newsId=X`
- Nested/threaded replies (recursive component rendering)
- Like button with optimistic updates
- Reply form (inline, appears below comment)
- Login prompt for non-authenticated users

### Social Sharing

**`components/ShareButtons.tsx`** — Share to Facebook, Twitter/X, WhatsApp, Telegram, copy link. Uses native `navigator.share` API on mobile when available

---

## Phase 5: API Routes (Backend)

All backend endpoints live in `app/api/`. Each `route.ts` file exports `GET`, `POST`, `PUT`, or `DELETE` async functions.

### News & Content

| Route | Method | What It Does |
|-------|--------|-------------|
| `/api/news` | GET | Paginated news list with category filter, ranking scores, last refresh time |
| `/api/news/[id]` | GET | Single news item by ID |
| `/api/news/[id]/click` | POST | Increment click counter |
| `/api/news/[id]/summary-view` | POST | Track when user views an AI summary |
| `/api/news/[id]/tts-listen` | POST | Track when user listens to TTS |
| `/api/search` | GET | Full-text search with pagination, category/source/date filters |
| `/api/refresh` | POST | Trigger RSS feed fetch + title translation |
| `/api/cron/refresh` | GET | Same as refresh but for cron jobs (requires Bearer token) |
| `/api/translate` | POST | Translate untranslated stored news titles to zh/ms |
| `/api/cleanup` | POST | Remove old news articles |

### User Features

| Route | Method | What It Does |
|-------|--------|-------------|
| `/api/comments` | GET/POST | Get comments for a news item / Add a comment |
| `/api/comments/[id]/like` | POST | Like or unlike a comment |
| `/api/bookmarks` | GET/POST | Fetch bookmarks + toggle bookmark |
| `/api/preferences` | GET/POST | User language/theme preferences |
| `/api/user/profile` | GET/PUT | Read or update user profile |
| `/api/user/comments` | GET | User's comment history |

### AI Features

| Route | Method | What It Does |
|-------|--------|-------------|
| `/api/summary` | POST | Generate AI summary via Groq API (with caching) |
| `/api/tts` | POST | Text-to-speech generation |
| `/api/feedback` | POST | Submit AI feature feedback |

### Auth & Admin

| Route | Method | What It Does |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth session management |
| `/api/auth/register` | POST | User registration |
| `/api/setup` | POST | One-time admin account setup for fresh deploys |
| `/api/admin` | GET | Dashboard data (uses `tab` query param) |
| `/api/admin` | POST | Admin actions (uses `action` body param) |
| `/api/admin/auth` | GET/POST/DELETE | Admin login, logout, session check |
| `/api/admin/delete` | POST | Delete news articles or comments |

### Payment

| Route | Method | What It Does |
|-------|--------|-------------|
| `/api/payment` | GET/POST | Payment submission history / Submit new payment |
| `/api/subscription` | GET | Check user's subscription status |

### Key backend files

**`lib/rss.ts`** — RSS feed engine:
- Database-driven feed list (managed via admin panel)
- `fetchAllFeeds()` — Fetches all active RSS feeds, filters for Sarawak-related articles, inserts into DB
- `translateUntranslatedNews()` — Finds news without zh/ms titles, translates them via MyMemory API
- Called by `/api/refresh` and `/api/cron/refresh`

**`lib/translate.ts`** — MyMemory translation API wrapper used for title translation

**`lib/articleExtractor.ts`** — Fetches article HTML from source URL, strips ads/scripts/navigation, extracts main text content. Used by `/api/summary` to provide article body to Groq AI

**`lib/errorLogger.ts`** — Logs errors to `error_logs` DB table with level, type, message, and stack trace

---

## Phase 6: Advanced Features

### AI Summary System

**`app/api/summary/route.ts`** — The AI pipeline:
1. Check if cached summary exists in `news_summaries` table for requested language
2. If not, extract article content via `lib/articleExtractor.ts`
3. Send to Groq API (Llama 3.3 70B model) with system prompt
4. Cache result in DB by language column (summary_en / summary_zh / summary_ms)
5. Return summary to client

**On detail pages**: Summaries are also fetched server-side in `app/news/[id]/page.tsx` and:
- Used in meta description and OG tags
- Added as `articleBody` in JSON-LD schema
- Passed to `NewsDetail` component for visible display

### Text-to-Speech

**`hooks/useSpeechSynthesis.ts`** — Custom React hook wrapping the browser `SpeechSynthesis` API
**`components/ListenAllPlayer.tsx`** — Floating player bar at bottom of homepage. Sequential playback of all news titles with play/pause/skip controls

### Admin Panel

**`app/admin/login/page.tsx`** — Admin login form (separate from user auth, uses cookie-based admin session)
**`app/admin/page.tsx`** — Redirect handler: checks admin auth, sends to dashboard or login
**`app/admin/dashboard/page.tsx`** — Very large file (~2200+ lines), tab-based UI with 9 tabs:

| Tab | What It Shows |
|-----|-------------|
| Dashboard | Stats cards, RSS refresh controls, top news/sources, and summary charts |
| Analytics | Search analytics, source/category engagement, user activity metrics |
| Users | User management table (toggle admin, delete) |
| News | News management with search/filter/delete |
| Comments | Moderation tools (flag, hide, delete comments) |
| Errors | Error logs with charts and resolution workflow |
| RSS Feeds | Add, enable/disable, delete RSS feed sources |
| Payments | Payment verification queue and subscription stats |
| Audit Log | Admin action history for accountability |

**`components/charts/DashboardCharts.tsx`** — Recharts-based analytics visualizations
**`components/charts/ErrorCharts.tsx`** — Error monitoring charts (errors over time, by type, by level)

### AdSense Integration

**`components/AdBanner.tsx`** — Google AdSense ad component:
- Configurable ad slots and formats (auto, horizontal, vertical, rectangle)
- Responsive sizing
- Uses `NEXT_PUBLIC_ADSENSE_PUB_ID` and `NEXT_PUBLIC_ADSENSE_SLOT_*` env vars
- Shows placeholder when ads not configured

### Static / Compliance Pages

| File | Purpose |
|------|---------|
| `app/about/page.tsx` | About page — mission, features, coverage, sources, contact |
| `app/privacy/page.tsx` | Privacy policy (AdSense compliance) |
| `app/terms/page.tsx` | Terms of service (AdSense compliance) |
| `app/donate/page.tsx` | Donation page with DuitNow and Sarawak Pay QR codes |
| `app/pricing/page.tsx` | Features page — shows everything is free (RM 0/forever) |
| `app/ai-features/page.tsx` | AI feedback collection page |

---

## Phase 7: SEO & Infrastructure

### SEO Files

**`app/robots.ts`** — Generates `/robots.txt`. Allows `/`, disallows `/admin/`, `/api/`, `/auth/`
**`app/sitemap.ts`** — Dynamic XML sitemap with all news article URLs + static pages
**`app/opengraph-image.tsx`** — Dynamic OG image generation for social sharing

### Error Tracking

**`lib/errorLogger.ts`** — Logs errors to `error_logs` DB table with level, type, message, stack
**`sentry.client.config.ts`** / **`sentry.server.config.ts`** / **`sentry.edge.config.ts`** — Sentry integration for production error tracking

### Styling

**`app/globals.css`** — Tailwind CSS imports + custom scrollbar styles
**`components/HornbillLogo.tsx`** — Rhinoceros Hornbill SVG logo (used site-wide in headers, footers, auth pages)

---

## Suggested Study Order

1. **Phase 1** — `lib/db.ts` (skim table creation, read 3-4 functions closely like `getAllNews`, `getComments`, `createUser`)
2. **Phase 2** — `app/layout.tsx` → `Providers.tsx` → `ThemeProvider.tsx` → `LanguageProvider.tsx` (understand the wrapper stack)
3. **Phase 3** — `app/page.tsx` → `HomeClient.tsx` → `NewsList.tsx` → `NewsItem.tsx` (follow the data flow from server to screen)
4. **Phase 5** — Pick 2-3 API routes to read (start with `/api/news/route.ts` and `/api/comments/route.ts`)
5. **Phase 4** — Auth flow: `register/page.tsx` → `/api/auth/register` → `lib/auth.ts` → `login/page.tsx` → `profile/page.tsx`
6. **Phase 6** — AI summary pipeline (`/api/summary` → `articleExtractor.ts` → `NewsDetail.tsx`), then skim admin dashboard
7. **Phase 7** — SEO files last (small and self-contained)

---

## Quick Reference: All Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (username, email, password hash) |
| `news` | News articles with translations and stats |
| `comments` | Nested comments with moderation fields |
| `comment_likes` | Prevents duplicate likes (one per user per comment) |
| `bookmarks` | User saved articles |
| `error_logs` | Error tracking with level/type/resolution |
| `user_preferences` | Language and theme preferences per user |
| `rss_feeds` | Configurable RSS feed sources |
| `subscriptions` | Premium subscription records |
| `payment_submissions` | Payment verification queue |
| `news_summaries` | Cached AI summaries (en/zh/ms per article) |
| `app_metadata` | Key-value store (e.g., `last_refresh` timestamp) |
| `user_feedback` | AI feature feedback submissions |
| `admin_audit_log` | Admin action history |
| `search_logs` | Search query tracking for analytics |
