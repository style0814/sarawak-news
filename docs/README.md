# Sarawak News - Documentation

A Sarawak news aggregator with real-time ranking, multi-language support, community discussions, and comprehensive admin panel.

## Features

- **Sarawak-Themed UI** - Green/emerald colors inspired by Sarawak rainforests
- **Auto-Refresh** - News updates every 10 minutes automatically
- **Title Translation** - Automatic translation to Chinese and Malay
- **Comment System** - Nested discussions with replies and moderation
- **Click-Based Ranking** - Popular articles rise to the top
- **RSS Integration** - Database-driven feed management
- **User Authentication** - Login/register with NextAuth.js
- **Admin Panel** - 6-tab dashboard with analytics charts
- **Error Monitoring** - Real-time error tracking with charts and notifications
- **Search** - Advanced search with filters and autocomplete
- **Bookmarks** - Save articles for later reading
- **User Profile** - Edit profile, change password, view stats
- **Social Sharing** - Share to Facebook, Twitter, WhatsApp, etc.
- **SEO Optimized** - Dynamic metadata, sitemap, robots.txt
- **Dark Mode** - Toggle between light and dark themes
- **Cross-Tab Sync** - Language and theme sync across browser tabs

## Quick Start

```bash
cd sarawak-news
npm run dev
```

Open http://localhost:3000

## How to Use

| Action | How |
|--------|-----|
| Fetch news | Click **Refresh** button |
| Read article | Click title (opens in new tab) |
| Discuss | Click **Discuss →** or comment count |
| Change language | Click flags EN / 中文 / BM |
| Search | Use search bar with filters |
| Bookmark | Click bookmark icon (requires login) |
| Share | Use share buttons on articles |
| Edit profile | Go to `/profile` |
| Admin panel | Go to `/admin` and login with admin credentials |

## Documentation Structure

```
docs/
├── README.md                    # This file
│
├── tech-stack/                  # Why we use each technology
│   ├── nextjs.md               # Next.js App Router
│   ├── sqlite.md               # SQLite database
│   ├── tailwind.md             # Tailwind CSS
│   └── typescript.md           # TypeScript basics
│
├── architecture/               # How the code is organized
│   ├── project-structure.md   # Folder layout
│   ├── api-routes.md          # API endpoints
│   └── data-flow.md           # How data moves
│
└── features/                   # How each feature works
    ├── news-ranking.md        # Ranking algorithm
    ├── rss-fetching.md        # RSS integration
    ├── multi-language.md      # i18n implementation
    ├── auto-refresh.md        # 10-minute auto-refresh
    ├── title-translation.md   # Title translation API
    ├── comments.md            # Nested comment system
    ├── authentication.md      # User login/register
    ├── admin-panel.md         # Admin dashboard (6 tabs)
    ├── error-monitoring.md    # Error tracking & charts
    ├── search.md              # Advanced search with filters
    ├── user-profile.md        # User profile page
    ├── bookmarks.md           # Article bookmarking
    ├── share-buttons.md       # Social sharing
    └── seo.md                 # SEO optimization
```

## Learning Path

**Recommended reading order:**

1. **tech-stack/** - Understand the tools
   - Start with `nextjs.md` and `typescript.md`

2. **architecture/** - See how code is organized
   - Read `project-structure.md` first

3. **features/** - Learn how features work
   - Pick any feature you're curious about

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main news list page |
| `app/news/[id]/page.tsx` | News detail + comments |
| `app/profile/page.tsx` | User profile page |
| `app/bookmarks/page.tsx` | User's saved articles |
| `app/admin/dashboard/page.tsx` | Admin dashboard |
| `app/admin/login/page.tsx` | Admin login page |
| `app/auth/login/page.tsx` | User login page |
| `app/robots.ts` | SEO robots.txt |
| `app/sitemap.ts` | SEO sitemap |
| `lib/db.ts` | Database operations |
| `lib/auth.ts` | NextAuth configuration |
| `lib/adminAuth.ts` | Admin authentication |
| `lib/rss.ts` | RSS feed fetching |
| `lib/translate.ts` | Translation API |
| `lib/i18n.ts` | Translations & helpers |
| `lib/errorLogger.ts` | Error logging utility |
| `components/CommentSection.tsx` | Comment UI |
| `components/ShareButtons.tsx` | Social sharing |
| `components/SearchBar.tsx` | Search with autocomplete |
| `components/NewsDetail.tsx` | News detail client component |
| `components/LanguageProvider.tsx` | Language state context |
| `components/ThemeProvider.tsx` | Dark mode context |
| `components/charts/ErrorCharts.tsx` | Error visualization |
| `components/charts/DashboardCharts.tsx` | Analytics charts |

## API Endpoints

### Public

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/news | Fetch ranked news |
| GET | /api/news/[id] | Get single news item |
| POST | /api/news/[id]/click | Record click |
| GET | /api/search | Search with filters |
| POST | /api/refresh | Fetch RSS feeds |
| POST | /api/translate | Translate titles |
| GET | /api/comments?newsId=X | Get comments |
| POST | /api/comments | Add comment |
| POST | /api/comments/[id]/like | Like comment |

### User (Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/user/profile | Get profile & stats |
| PUT | /api/user/profile | Update profile |
| GET | /api/user/comments | Get comment history |
| GET | /api/bookmarks | Get bookmarks |
| POST | /api/bookmarks | Add bookmark |
| DELETE | /api/bookmarks | Remove bookmark |

### Auth

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | /api/auth/* | NextAuth endpoints |
| POST | /api/auth/register | Register user |

### Admin

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/admin | Dashboard data |
| POST | /api/admin | Admin actions |
| GET/POST/DELETE | /api/admin/auth | Admin login/logout |
| POST | /api/admin/delete | Delete content |

## Admin Dashboard Tabs

1. **Dashboard** - Overview stats, analytics charts, RSS refresh
2. **Users** - Manage users, toggle admin status
3. **News** - Search, filter, delete articles
4. **Comments** - Moderation (flag, hide, delete)
5. **Errors** - Error tracking, charts, notifications
6. **RSS Feeds** - Add, enable/disable, delete feeds

## Theme Colors

The UI uses a Sarawak-inspired color palette:

- **Emerald/Teal** - Primary (forest green)
- **Yellow/Red** - Accent (Sarawak flag colors)
- **White/Gray** - Cards and backgrounds

```
Header: emerald-700 → teal-600 gradient
Accent bar: yellow-400 → red-500 → yellow-400
Buttons: emerald-500 → teal-600
Dark mode: gray-900 background
```

## Environment Variables

```env
# Required
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Admin
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD_HASH=bcrypt-hash
ADMIN_SESSION_SECRET=random-string

# Optional
DATABASE_PATH=./data/news.db
GOOGLE_TRANSLATE_API_KEY=your-key
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```
