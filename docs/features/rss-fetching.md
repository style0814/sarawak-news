# RSS Feed Fetching

## What is RSS?

RSS (Really Simple Syndication) is a **standardized format** for publishing content. News sites provide RSS feeds so other applications can easily read their latest articles.

```xml
<!-- Example RSS feed structure -->
<rss version="2.0">
  <channel>
    <title>Borneo Post</title>
    <item>
      <title>Sarawak announces new policy</title>
      <link>https://borneopost.com/article/123</link>
      <pubDate>Mon, 15 Jan 2024 10:30:00 GMT</pubDate>
    </item>
    <item>...</item>
  </channel>
</rss>
```

## Our RSS Sources

**File:** `lib/rss.ts`

```typescript
const RSS_FEEDS = [
  {
    url: 'https://www.theborneopost.com/feed/',
    name: 'Borneo Post'
  },
  {
    url: 'https://dayakdaily.com/feed/',
    name: 'Dayak Daily'
  },
  {
    url: 'https://www.thestar.com.my/rss/News/Nation/',
    name: 'The Star'
  },
  {
    url: 'https://www.freemalaysiatoday.com/category/nation/feed/',
    name: 'Free Malaysia Today'
  }
];
```

### Source Categories

| Source | Coverage | Filtering |
|--------|----------|-----------|
| Borneo Post | Sarawak-focused | All articles accepted |
| Dayak Daily | Sarawak-focused | All articles accepted |
| The Star | National | Filtered for Sarawak keywords |
| Free Malaysia Today | National | Filtered for Sarawak keywords |

## Sarawak Keyword Filtering

For national news sources, we filter articles that mention Sarawak-related terms:

```typescript
const SARAWAK_KEYWORDS = [
  'sarawak', 'kuching', 'sibu', 'miri', 'bintulu',
  'sri aman', 'kapit', 'limbang', 'mukah', 'betong',
  'sarikei', 'serian', 'dayak', 'iban', 'bidayuh',
  'orang ulu', 'penan', 'abang johari', 'gps',
  'gabungan parti sarawak', 'batang ai', 'rajang', 'sarawakian'
];

function isSarawakRelated(title: string, content?: string): boolean {
  const text = `${title} ${content || ''}`.toLowerCase();
  return SARAWAK_KEYWORDS.some(keyword => text.includes(keyword));
}
```

## The rss-parser Library

We use [rss-parser](https://www.npmjs.com/package/rss-parser) to parse RSS feeds:

```typescript
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,  // 10 second timeout
  headers: {
    'User-Agent': 'SarawakNews/1.0'  // Identify our app
  }
});

// Fetch and parse a feed
const feed = await parser.parseURL('https://example.com/feed/');

// Access items
for (const item of feed.items) {
  console.log(item.title);      // Article title
  console.log(item.link);       // Article URL
  console.log(item.pubDate);    // Publication date
  console.log(item.contentSnippet);  // Short description
}
```

## Fetch Process

```
1. User clicks "Refresh"
   │
2. POST /api/refresh
   │
3. fetchAllFeeds() is called
   │
4. For each RSS source:
   │  ├── Fetch XML from URL
   │  ├── Parse into JavaScript objects
   │  ├── Filter for Sarawak content (if needed)
   │  └── Insert into database (skip duplicates)
   │
5. Return summary { added: X, total: Y, errors: [...] }
```

## Implementation

```typescript
export async function fetchAllFeeds(): Promise<FetchResult> {
  const result = { added: 0, total: 0, errors: [] };

  for (const feed of RSS_FEEDS) {
    try {
      // 1. Fetch and parse
      const feedData = await parser.parseURL(feed.url);

      for (const item of feedData.items || []) {
        if (!item.title || !item.link) continue;
        result.total++;

        // 2. Check if Sarawak-related
        const isSarawakSource = feed.name === 'Borneo Post' || feed.name === 'Dayak Daily';
        const isRelevant = isSarawakSource || isSarawakRelated(item.title, item.contentSnippet);

        if (isRelevant) {
          // 3. Insert into database
          const added = addNews({
            title: item.title,
            source_url: item.link,
            source_name: feed.name,
            published_at: item.pubDate
          });

          if (added) result.added++;
        }
      }
    } catch (error) {
      // 4. Track errors but continue with other feeds
      result.errors.push(`Failed to fetch ${feed.name}: ${error.message}`);
    }
  }

  return result;
}
```

## Handling Duplicates

SQLite handles duplicates automatically via `UNIQUE` constraint:

```sql
CREATE TABLE news (
  ...
  source_url TEXT UNIQUE NOT NULL,  -- No duplicate URLs
  ...
);
```

In code:
```typescript
export function addNews(news) {
  try {
    // INSERT will fail if source_url already exists
    stmt.run(news.title, news.source_url, ...);
    return { ...newItem };
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return null;  // Duplicate - ignore silently
    }
    throw error;
  }
}
```

## Error Handling

If one feed fails, we continue with others:

```typescript
for (const feed of RSS_FEEDS) {
  try {
    await parser.parseURL(feed.url);
    // ... process
  } catch (error) {
    // Log error but don't stop
    result.errors.push(`Failed: ${feed.name}`);
  }
}
```

This means:
- If Borneo Post is down → Other feeds still work
- User sees partial results + error messages

## Adding New RSS Sources

To add a new news source:

1. Find their RSS feed URL (usually `/feed/` or `/rss/`)
2. Add to `RSS_FEEDS` array:
   ```typescript
   {
     url: 'https://newsite.com/feed/',
     name: 'New Site'
   }
   ```
3. Decide if it needs keyword filtering (add to condition)

## Common RSS Feed Locations

| Pattern | Example |
|---------|---------|
| `/feed/` | `example.com/feed/` |
| `/rss/` | `example.com/rss/` |
| `/feed.xml` | `example.com/feed.xml` |
| `/rss.xml` | `example.com/rss.xml` |

Many sites have `<link rel="alternate" type="application/rss+xml">` in their HTML head.

## Automatic Refresh (Server-Side)

Refresh now supports both:

1. **Client auto-refresh** (when a user has the site open)
2. **Server-side cron refresh** (works even with zero visitors)

### Cron Endpoint

Use:

```bash
GET /api/cron/refresh
Authorization: Bearer <CRON_SECRET>
```

### GitHub Actions Scheduler

Included file: `.github/workflows/rss-cron-refresh.yml`

- Schedule: every 10 minutes (`*/10 * * * *`)
- Calls `/api/cron/refresh` with Bearer auth
- Requires repository secrets:
  - `SITE_URL` (e.g. `https://your-domain.com`)
  - `CRON_SECRET` (same as app env)

### Railway Scheduler Example

Use a dedicated Railway cron service:

```bash
curl --fail --silent --show-error \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$SITE_URL/api/cron/refresh"
```

### Vercel Scheduler Example

Add `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/refresh", "schedule": "*/10 * * * *" }
  ]
}
```

Set `CRON_SECRET` in Vercel env vars so Vercel cron sends `Authorization: Bearer <CRON_SECRET>`.
