# Data Flow

## Overview

This document explains how data moves through the application.

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Components                                        │   │
│  │  ┌────────┐  ┌────────────┐  ┌────────────────────────┐ │   │
│  │  │ Header │  │ NewsList   │  │ State (useState)       │ │   │
│  │  └────────┘  └────────────┘  │ - news[]               │ │   │
│  │                              │ - lang                  │ │   │
│  │                              │ - loading               │ │   │
│  │                              └────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │ fetch()                          │
└──────────────────────────────│──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Next.js)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Routes                                              │   │
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
```

## Flow 1: Loading News on Page Load

```
1. User opens website
   │
2. React component mounts (useEffect)
   │
3. fetch('/api/news')
   │
4. API route calls getAllNews()
   │
5. SQLite returns all news rows
   │
6. API calculates ranking scores
   │
7. Returns sorted JSON array
   │
8. React updates state: setNews(data.news)
   │
9. UI re-renders with news list
```

**Code trace:**

```typescript
// app/page.tsx
useEffect(() => {
  fetchNews();  // Step 2
}, []);

const fetchNews = async () => {
  const response = await fetch('/api/news');  // Step 3
  const data = await response.json();
  setNews(data.news);  // Step 8
};
```

```typescript
// app/api/news/route.ts
export async function GET() {
  const news = getAllNews();  // Step 4
  return NextResponse.json({ news });  // Step 7
}
```

```typescript
// lib/db.ts
export function getAllNews(): NewsItem[] {
  const news = db.prepare('SELECT * FROM news').all();  // Step 5
  return news
    .map(item => ({ ...item, score: calculateScore(...) }))  // Step 6
    .sort((a, b) => b.score - a.score);
}
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
// app/page.tsx
const [news, setNews] = useState<NewsData[]>([]);    // News articles
const [loading, setLoading] = useState(true);         // Loading state
const [refreshing, setRefreshing] = useState(false);  // Refresh button
const [lang, setLang] = useState<Language>('en');     // Current language
```

**State is passed down via props:**
```
page.tsx (state lives here)
├── Header (receives: lang, onLanguageChange, onRefresh)
│   └── LanguageSwitcher (receives: lang, onLanguageChange)
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
