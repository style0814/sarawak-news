# Data Flow

## Overview

This document explains how data moves through the application.

```
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Next.js)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Server Components (SSR)                                 │   │
│  │  app/page.tsx     → getAllNews() → passes to HomeClient  │   │
│  │  app/news/[id]    → getNewsById() + getNewsSummary()     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  API Routes (client-side interactions)                   │   │
│  │  /api/news      → getAllNews()                          │   │
│  │  /api/refresh   → fetchAllFeeds() → addNews()           │   │
│  │  /api/news/[id]/click → incrementClicks()               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  lib/db.ts (SQLite)                                      │   │
│  │  data/news.db                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │ HTML + props
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Client Components (hydrate with SSR data)               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │   │
│  │  │ HomeClient │  │ NewsList   │  │ State (useState)  │  │   │
│  │  └────────────┘  └────────────┘  │ - news[] (SSR)    │  │   │
│  │                                  │ - lang             │  │   │
│  │                                  │ - loading: false   │  │   │
│  │                                  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    │ fetch() for search, pagination, refresh     │
└────────────────────│────────────────────────────────────────────┘
                     ▼ (API routes used for client-side interactions)
```

## Flow 1: Loading News on Page Load (Server-Side Rendered)

```
1. User/crawler requests homepage
   │
2. Server Component (app/page.tsx) runs on server
   │
3. Calls getAllNews(1, 20) directly from lib/db.ts
   │
4. SQLite returns news rows, ranked by score
   │
5. Server renders HTML with full news content
   │
6. HTML sent to browser (crawlers see real content)
   │
7. HomeClient hydrates with SSR data (no loading spinner)
   │
8. Client-side: auto-refresh countdown starts, interactivity enabled
```

**Code trace:**

```typescript
// app/page.tsx (Server Component — no 'use client')
import { getAllNews, getMetadata, NEWS_CATEGORIES } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export default function Home() {
  const { news, total, totalPages } = getAllNews(1, 20);  // Step 3
  const lastRefresh = getMetadata('last_refresh');
  return (
    <HomeClient
      initialNews={news}               // Step 5: passed as props
      initialPagination={{ page: 1, limit: 20, total, totalPages, hasMore: totalPages > 1 }}
      initialCategories={NEWS_CATEGORIES}
      initialLastRefresh={lastRefresh}
    />
  );
}
```

```typescript
// components/HomeClient.tsx ('use client')
// Hydrates with SSR data — no initial fetch needed
const [news, setNews] = useState(initialNews);       // Pre-populated
const [loading, setLoading] = useState(false);        // No loading spinner
// API routes still used for: search, pagination, category filter, auto-refresh
```

## Flow 2: Clicking Refresh Button

```
1. User clicks "Refresh" button
   │
2. handleRefresh() called
   │
3. fetch('/api/refresh', { method: 'POST' })
   │
4. API calls fetchAllFeeds()
   │
5. RSS parser fetches each feed URL
   │
6. Filter for Sarawak-related articles
   │
7. Insert new articles into SQLite (skip duplicates)
   │
8. Return { added: X, total: Y }
   │
9. Immediately fetch('/api/news') to refresh list
   │
10. UI updates with new articles
```

**Code trace:**

```typescript
// app/page.tsx
const handleRefresh = async () => {
  setRefreshing(true);
  await fetch('/api/refresh', { method: 'POST' });  // Step 3
  await fetchNews();  // Step 9
  setRefreshing(false);
};
```

```typescript
// lib/rss.ts
export async function fetchAllFeeds() {
  for (const feed of RSS_FEEDS) {
    const feedData = await parser.parseURL(feed.url);  // Step 5
    for (const item of feedData.items) {
      if (isSarawakRelated(item.title)) {  // Step 6
        addNews({ title: item.title, ... });  // Step 7
      }
    }
  }
}
```

## Flow 3: Clicking a News Article

```
1. User clicks news title
   │
2. NewsItem.onClick handler fires
   │
3. Calls onItemClick(id) (passed from parent)
   │
4. fetch(`/api/news/${id}/click`, { method: 'POST' })
   │
5. API calls incrementClicks(id)
   │
6. SQLite: UPDATE news SET clicks = clicks + 1
   │
7. Optimistic update: setNews() increases local count
   │
8. Opens article in new tab
```

**Code trace:**

```typescript
// components/NewsItem.tsx
const handleClick = () => {
  onItemClick(id);  // Step 3
  window.open(sourceUrl, '_blank');  // Step 8
};
```

```typescript
// app/page.tsx
const handleItemClick = async (id: number) => {
  await fetch(`/api/news/${id}/click`, { method: 'POST' });  // Step 4
  setNews(prevNews =>
    prevNews.map(item =>
      item.id === id ? { ...item, clicks: item.clicks + 1 } : item
    )
  );  // Step 7 - Optimistic update
};
```

## Flow 4: Changing Language

```
1. User clicks language button (EN/中文/BM)
   │
2. LanguageSwitcher calls onLanguageChange(newLang)
   │
3. Parent component updates state: setLang(newLang)
   │
4. Save to localStorage for persistence
   │
5. All components re-render with new language
   │
6. translations[lang] provides correct strings
```

**Code trace:**

```typescript
// components/LanguageSwitcher.tsx
<button onClick={() => onLanguageChange('zh')}>中文</button>
```

```typescript
// app/page.tsx
const handleLanguageChange = (newLang: Language) => {
  setLang(newLang);  // Step 3
  localStorage.setItem('sarawak-news-lang', newLang);  // Step 4
};
```

```typescript
// lib/i18n.ts
translations['zh'].title  // "砂拉越新闻"
translations['en'].title  // "Sarawak News"
```

## State Management

We use React's built-in `useState` (no Redux/Context needed for this size app):

```typescript
// components/HomeClient.tsx
const [news, setNews] = useState<NewsData[]>(initialNews);  // Pre-populated from SSR
const [loading, setLoading] = useState(false);               // No initial loading
const [lang] = useLanguage();                                // From LanguageProvider context
```

**State is passed down via props:**
```
app/page.tsx (Server Component — fetches data)
└── HomeClient (Client Component — state lives here)
    ├── Header (receives: lang, onLanguageChange)
    │   └── LanguageSwitcher (receives: lang, onLanguageChange)
    ├── CategoryFilter
    └── NewsList (receives: news, lang, onItemClick)
        └── NewsItem (receives: individual news item props)
```

## Optimistic Updates

When clicking an article, we update the UI **before** the API responds:

```typescript
// Immediate: Update local state
setNews(prev => prev.map(item =>
  item.id === id ? { ...item, clicks: item.clicks + 1 } : item
));

// Background: Tell server (don't wait)
fetch(`/api/news/${id}/click`, { method: 'POST' });
```

This makes the UI feel faster. The click count updates instantly.
