# Sarawak News - Documentation

A Sarawak news aggregator with real-time ranking, multi-language support, community discussions, premium features, and comprehensive admin panel.

## Features

### All Features (FREE!)
- **Sarawak-Themed UI** - Orange/amber colors with Rhinoceros Hornbill logo
- **Auto-Refresh** - News updates every 10 minutes automatically
- **Title Translation** - Automatic translation to Chinese and Malay
- **Comment System** - Nested discussions with replies and moderation
- **Click-Based Ranking** - Popular articles rise to the top
- **RSS Integration** - Database-driven feed management
- **User Authentication** - Login/register with NextAuth.js
- **Search** - Advanced search with filters and autocomplete
- **Bookmarks** - Save articles for later reading
- **User Profile** - Edit profile, change password, view stats
- **Social Sharing** - Share to Facebook, Twitter, WhatsApp, etc.
- **SEO Optimized** - Dynamic metadata, sitemap, robots.txt
- **Dark Mode** - Toggle between light and dark themes
- **Cross-Tab Sync** - Language and theme sync across browser tabs
- **Audio TTS** - Listen to news titles (Text-to-Speech)
- **AI News Summary** - AI-generated summaries powered by Groq
- **Listen All News** - Sequential playback of all news summaries
- **AI Feedback Page** - Collect user feedback on AI features

### Admin Features
- **Admin Panel** - 6-tab dashboard with analytics charts
- **Error Monitoring** - Real-time error tracking with charts
- **User Management** - Manage users

## Quick Start

```bash
cd sarawak-news
npm install
npm run dev
```

Open http://localhost:3000

## How to Use

| Action | How |
|--------|-----|
| Fetch news | Click **Refresh** button |
| Read article | Click title (opens in new tab) |
| Discuss | Click **Discuss** or comment count |
| Change language | Click flags EN / ZH / BM |
| Search | Use search bar with filters |
| Bookmark | Click bookmark icon (requires login) |
| Share | Use share buttons on articles |
| Listen | Click play button on article detail |
| Donate | Go to `/donate` to support us |
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
    ├── seo.md                 # SEO optimization
    ├── ai-summary.md          # AI-powered summaries (Groq)
    ├── audio-tts.md           # Text-to-Speech feature
    ├── listen-all.md          # Listen All News player
    ├── ai-feedback.md         # AI features feedback page
    └── donate.md              # Donation page
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
| `app/page.tsx` | Home page Server Component (SSR news from DB) |
| `components/HomeClient.tsx` | Home page Client Component (hydrates SSR data) |
| `app/news/[id]/page.tsx` | News detail + AI summary + comments |
| `app/pricing/page.tsx` | Features page (all free) |
| `app/donate/page.tsx` | Donation page |
| `app/ai-features/page.tsx` | AI feedback page |
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
| `hooks/useSpeechSynthesis.ts` | TTS custom hook |
| `components/CommentSection.tsx` | Comment UI |
| `components/ShareButtons.tsx` | Social sharing |
| `components/SearchBar.tsx` | Search with autocomplete |
| `components/NewsDetail.tsx` | News detail client component |
| `components/ListenAllPlayer.tsx` | Listen All News player |
| `lib/articleExtractor.ts` | Article content extraction |
| `components/PremiumProvider.tsx` | Premium context |
| `components/PremiumFeature.tsx` | Premium gate component |
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
| POST | /api/summary | Generate AI summary |
| POST | /api/feedback | Submit AI feedback |

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

- **Orange/Amber** - Primary (Sarawak identity)
- **Yellow/Red** - Accent (Sarawak flag colors)
- **White/Gray** - Cards and backgrounds

```
Header: orange-700 -> amber-600 gradient
Accent bar: yellow-400 -> red-500 -> yellow-400
Buttons: orange-500 -> amber-600
Dark mode: gray-900 background
```

## Environment Variables

```env
# Required - Auth
AUTH_SECRET=your-secret-key-32-chars
AUTH_URL=http://localhost:3000

# Required - AI Summary
GROQ_API_KEY=your-groq-api-key

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

## Payment Methods

| Method | Details |
|--------|---------|
| DuitNow | Any Malaysian bank app |
| Sarawak Pay | SPayGlobal app |

QR codes located in `public/payments/`:
- `duitnow-qr.jpeg`
- `sarawakpay-qr.jpeg`
