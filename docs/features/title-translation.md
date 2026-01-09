# Title Translation

## Overview

News titles are automatically translated to Chinese (中文) and Malay (BM) using the MyMemory Translation API.

## How It Works

```
┌──────────────────────────────────────────────────────────────┐
│  1. RSS Refresh                                               │
│     │                                                         │
│     ▼                                                         │
│  2. New articles added to database (English title only)       │
│     │                                                         │
│     ▼                                                         │
│  3. Background translation starts                             │
│     │                                                         │
│     ├──► MyMemory API: English → Chinese (title_zh)          │
│     │                                                         │
│     └──► MyMemory API: English → Malay (title_ms)            │
│     │                                                         │
│     ▼                                                         │
│  4. Translations saved to database                            │
│     │                                                         │
│     ▼                                                         │
│  5. UI displays title based on selected language              │
└──────────────────────────────────────────────────────────────┘
```

## Database Storage

**File:** `lib/db.ts`

```sql
CREATE TABLE news (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,         -- Original (English)
  title_zh TEXT,               -- Chinese translation
  title_ms TEXT,               -- Malay translation
  ...
);
```

## Translation API

**File:** `lib/translate.ts`

We use MyMemory Translation API (free, no API key required):

```typescript
export async function translateText(text: string, targetLang: 'zh' | 'ms'): Promise<string> {
  // Language pair format: "en|zh-CN" or "en|ms"
  const langPair = targetLang === 'zh' ? 'en|zh-CN' : 'en|ms';

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.responseData.translatedText;
}
```

## Translation Process

**File:** `lib/rss.ts`

When refreshing RSS feeds, translations happen in background:

```typescript
// In /api/refresh route:
export async function POST() {
  // 1. Fetch new articles
  const result = await fetchAllFeeds();

  // 2. Translate in background (don't wait)
  translateUntranslatedNews().catch(console.error);

  return NextResponse.json({ success: true, ...result });
}
```

The `translateUntranslatedNews` function:

```typescript
export async function translateUntranslatedNews(): Promise<number> {
  const news = getAllNews();
  let translated = 0;

  for (const item of news) {
    // Skip if already translated
    if (item.title_zh && item.title_ms) continue;

    // Translate to both languages
    const translations = await translateNewsTitle(item.title);
    updateNewsTitles(item.id, translations.zh, translations.ms);
    translated++;

    // Rate limiting: 500ms delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return translated;
}
```

## Displaying Translated Titles

**File:** `components/NewsItem.tsx`

```typescript
// Get translated title based on current language
const displayTitle = lang === 'zh' && titleZh ? titleZh :
                     lang === 'ms' && titleMs ? titleMs :
                     title; // Fallback to English
```

## Fallback Strategy

If translation is not available:
1. **No Chinese translation?** → Show English title
2. **No Malay translation?** → Show English title
3. **API fails?** → Return original text

```typescript
export async function translateText(...): Promise<string> {
  try {
    // ... API call
  } catch (error) {
    // Return original text if translation fails
    return text;
  }
}
```

## API Limits

MyMemory has usage limits:
- **Free:** 1000 words/day
- **Rate limiting:** Add delays between requests

To avoid hitting limits:
```typescript
// 500ms delay between translations
await new Promise(resolve => setTimeout(resolve, 500));
```

## Manual Translation Trigger

You can manually trigger translation via API:

```bash
curl -X POST http://localhost:3000/api/translate
```

Response:
```json
{
  "success": true,
  "translated": 5  // Number of titles translated
}
```

## Language Display

| User Language | Priority |
|---------------|----------|
| English | title (original) |
| 中文 | title_zh → title |
| BM | title_ms → title |

The arrow (→) means "fallback to" if preferred translation is null.
