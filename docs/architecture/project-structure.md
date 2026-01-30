# Project Structure

## Overview

```
sarawak-news/
├── app/                    # Next.js App Router (pages + API)
│   ├── layout.tsx          # Root layout (SEO metadata, providers)
│   ├── page.tsx            # Home page (/)
│   ├── globals.css         # Global styles
│   ├── robots.ts           # SEO robots.txt generator
│   ├── sitemap.ts          # SEO dynamic sitemap
│   │
│   ├── news/               # News detail pages
│   │   └── [id]/
│   │       └── page.tsx    # News detail + comments + SEO
│   │
│   ├── auth/               # User authentication pages
│   │   ├── login/
│   │   │   └── page.tsx    # User login page
│   │   └── register/
│   │       └── page.tsx    # User registration page
│   │
│   ├── admin/              # Admin panel
│   │   ├── page.tsx        # Admin redirect handler
│   │   ├── login/
│   │   │   └── page.tsx    # Admin login page
│   │   └── dashboard/
│   │       └── page.tsx    # Admin dashboard (6 tabs)
│   │
│   ├── profile/            # User profile
│   │   └── page.tsx        # Edit profile, change password
│   │
│   ├── bookmarks/          # User bookmarks
│   │   └── page.tsx        # Saved articles page
│   │
│   ├── comments/           # User comment history
│   │   └── page.tsx        # View all user's comments
│   │
│   ├── pricing/            # Premium pricing
│   │   └── page.tsx        # Pricing comparison page
│   │
│   ├── subscribe/          # Payment submission
│   │   └── page.tsx        # QR code payment page
│   │
│   └── api/                # Backend API routes
│       ├── news/
│       │   ├── route.ts    # GET /api/news (with filters)
│       │   └── [id]/
│       │       ├── route.ts     # GET/POST /api/news/:id
│       │       └── click/
│       │           └── route.ts # POST /api/news/:id/click
│       ├── search/
│       │   └── route.ts    # GET /api/search (advanced search)
│       ├── refresh/
│       │   └── route.ts    # POST /api/refresh
│       ├── translate/
│       │   └── route.ts    # POST /api/translate
│       ├── cleanup/
│       │   └── route.ts    # POST /api/cleanup
│       ├── preferences/
│       │   └── route.ts    # GET/POST /api/preferences
│       ├── bookmarks/
│       │   └── route.ts    # GET/POST/DELETE /api/bookmarks
│       ├── comments/
│       │   ├── route.ts    # GET/POST /api/comments
│       │   └── [id]/
│       │       └── like/
│       │           └── route.ts  # POST /api/comments/:id/like
│       ├── auth/
│       │   ├── register/
│       │   │   └── route.ts # POST /api/auth/register
│       │   └── [...nextauth]/
│       │       └── route.ts # NextAuth handlers
│       ├── user/
│       │   ├── profile/
│       │   │   └── route.ts # GET/PUT /api/user/profile
│       │   └── comments/
│       │       └── route.ts # GET /api/user/comments
│       ├── payment/
│       │   └── route.ts    # GET/POST /api/payment
│       ├── subscription/
│       │   └── route.ts    # GET /api/subscription
│       ├── summary/
│       │   └── route.ts    # POST /api/summary (AI summary)
│       └── admin/
│           ├── route.ts    # GET/POST /api/admin
│           ├── auth/
│           │   └── route.ts # Admin auth endpoints
│           └── delete/
│               └── route.ts # Delete news/comments
│
├── components/             # Reusable React components
│   ├── Header.tsx          # Top navigation bar
│   ├── NewsList.tsx        # List of news items
│   ├── NewsItem.tsx        # Single news item row
│   ├── NewsDetail.tsx      # News detail client component
│   ├── LanguageSwitcher.tsx # EN/中文/BM toggle
│   ├── LanguageProvider.tsx # Language state context
│   ├── CommentSection.tsx  # Comment system
│   ├── CategoryFilter.tsx  # Category filter buttons
│   ├── SearchBar.tsx       # Search input with suggestions
│   ├── ShareButtons.tsx    # Social share buttons
│   ├── Pagination.tsx      # Page navigation
│   ├── Providers.tsx       # React Query + Session providers
│   ├── ThemeProvider.tsx   # Dark/light theme context
│   ├── DarkModeToggle.tsx  # Theme toggle button
│   ├── PremiumProvider.tsx # Premium subscription context
│   ├── PremiumFeature.tsx  # Premium feature gate component
│   └── charts/
│       ├── ErrorCharts.tsx     # Error monitoring charts
│       └── DashboardCharts.tsx # Analytics charts
│
├── hooks/                  # Custom React hooks
│   └── useSpeechSynthesis.ts  # Text-to-Speech hook
│
├── lib/                    # Utility functions & business logic
│   ├── db.ts               # SQLite database operations
│   ├── auth.ts             # NextAuth configuration
│   ├── adminAuth.ts        # Admin authentication
│   ├── rss.ts              # RSS feed fetching
│   ├── translate.ts        # Translation API
│   ├── i18n.ts             # Translations & language utils
│   └── errorLogger.ts      # Error logging utility
│
├── data/                   # Data storage
│   └── news.db             # SQLite database file (auto-created)
│
├── docs/                   # Documentation (you're here!)
│
├── public/                 # Static files (images, favicon)
│   └── payments/           # Payment QR codes
│       ├── duitnow-qr.jpeg
│       └── sarawakpay-qr.jpeg
│
├── sentry.client.config.ts # Sentry browser config
├── sentry.server.config.ts # Sentry server config
├── sentry.edge.config.ts   # Sentry edge runtime config
├── .env.local              # Environment variables (not in git)
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── next.config.ts          # Next.js configuration
```

## Folder Purposes

### `app/` - Pages & API

This is Next.js App Router structure. File location = URL path.

| File | URL |
|------|-----|
| `app/page.tsx` | `/` (home) |
| `app/profile/page.tsx` | `/profile` |
| `app/bookmarks/page.tsx` | `/bookmarks` |
| `app/comments/page.tsx` | `/comments` |
| `app/news/[id]/page.tsx` | `/news/123` |
| `app/api/news/route.ts` | `/api/news` |
| `app/api/search/route.ts` | `/api/search` |

**Special files:**
- `layout.tsx` - Wraps children pages (shared header/footer, metadata)
- `page.tsx` - The actual page content
- `route.ts` - API endpoint (in `api/` folder)
- `robots.ts` - Generates `/robots.txt` for SEO
- `sitemap.ts` - Generates `/sitemap.xml` dynamically

### `components/` - UI Building Blocks

Reusable pieces of UI. Each component does ONE thing:

```
Header.tsx              → Site header with logo + buttons
├── LanguageSwitcher    → EN/中文/BM buttons
├── DarkModeToggle      → Light/dark theme toggle
└── SearchBar           → Search with suggestions

NewsList.tsx            → Container for news items
└── NewsItem.tsx        → Single row (rank, title, clicks)
    └── ShareButtons    → Facebook, Twitter, WhatsApp share

NewsDetail.tsx          → News detail page client component

CommentSection.tsx      → Threaded comments
└── Comment replies     → Recursive nesting

charts/
├── ErrorCharts.tsx     → Error monitoring visualizations
└── DashboardCharts.tsx → Analytics (activity, trends, distribution)
```

**Why separate?**
- Easier to test each piece
- Reuse across pages
- Easier to understand (small files)

### `lib/` - Business Logic

Non-UI code. Database queries, data fetching, helpers.

```
db.ts          → getAllNews(), addNews(), incrementClicks(), search(),
                 user profile, bookmarks, RSS feeds, comment moderation...
auth.ts        → NextAuth configuration for user login
adminAuth.ts   → Admin authentication (separate from user auth)
rss.ts         → fetchAllFeeds() with database-driven feed management
translate.ts   → translateTitle() for multi-language
i18n.ts        → translations, getTimeAgo(), getDomain()
errorLogger.ts → logError(), logApiError(), logDbError()...
```

**Why separate from components?**
- Can test without UI
- Can reuse in different components
- Keeps components simple (just rendering)

### `data/` - Database Storage

SQLite database file lives here. Created automatically on first run.

```
data/
└── news.db    ← Your entire database
```

**Database tables:**
- `news` - News articles with translations
- `users` - User accounts
- `comments` - Nested comments with moderation fields
- `comment_likes` - Prevents duplicate likes
- `bookmarks` - User saved articles
- `error_logs` - Error tracking
- `rss_feeds` - Configurable RSS sources
- `subscriptions` - Premium subscription status
- `payment_submissions` - Payment verification queue
- `news_summaries` - Cached AI summaries
- `user_preferences` - Language and theme preferences

**Note:** This folder should be in `.gitignore` for production (each deployment has its own data).

## Component Hierarchy

### Home Page
```
app/layout.tsx (providers, metadata)
└── app/page.tsx (Home)
    ├── Header
    │   ├── LanguageSwitcher
    │   ├── DarkModeToggle
    │   └── SearchBar
    ├── CategoryFilter
    └── NewsList
        └── NewsItem (× many)
            └── ShareButtons
```

### News Detail Page
```
app/news/[id]/page.tsx (server component, SEO metadata)
└── NewsDetail (client component)
    ├── ShareButtons
    └── CommentSection
        └── Comments (recursive)
```

### Admin Dashboard
```
app/admin/dashboard/page.tsx
├── Tab: Dashboard
│   ├── OverviewStatsCards
│   ├── DailyActivityChart
│   ├── ClickTrendChart
│   ├── SourcesChart
│   ├── CategoriesChart
│   └── EngagementChart
├── Tab: Users
├── Tab: News
├── Tab: Comments (with moderation)
├── Tab: Errors
│   ├── ErrorStatsCards
│   ├── ErrorsOverTimeChart
│   ├── ErrorsByTypeChart
│   └── ErrorsByLevelChart
└── Tab: RSS Feeds
```

## Data Flow

```
┌─────────────┐    fetch    ┌─────────────┐    query    ┌─────────────┐
│   Browser   │ ──────────► │  API Route  │ ──────────► │   SQLite    │
│  (React)    │ ◄────────── │  (Next.js)  │ ◄────────── │  (news.db)  │
└─────────────┘    JSON     └─────────────┘    data     └─────────────┘
```

1. React component calls `fetch('/api/news')`
2. API route (`app/api/news/route.ts`) handles request
3. API calls database function (`lib/db.ts`)
4. Database returns data
5. API sends JSON response
6. React updates UI

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `NewsItem.tsx` |
| Functions | camelCase | `getAllNews()` |
| Files (non-component) | camelCase | `db.ts`, `rss.ts` |
| Interfaces | PascalCase | `NewsItem` |
| Constants | UPPER_SNAKE | `RSS_FEEDS` |

## Key Environment Variables

```env
# Database
DATABASE_PATH=./data/news.db

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Admin
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD_HASH=bcrypt-hash
ADMIN_SESSION_SECRET=random-string

# AI Summary (required for premium)
GROQ_API_KEY=your-groq-api-key

# Translation (optional)
GOOGLE_TRANSLATE_API_KEY=your-key

# Sentry (optional)
SENTRY_DSN=your-dsn
```
