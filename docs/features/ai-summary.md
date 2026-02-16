# AI Summary Feature

FREE feature that generates AI-powered summaries of news articles using Groq's LLM API.

## Overview

| Aspect | Details |
|--------|---------|
| AI Provider | Groq (Llama 3.3 70B) |
| Availability | FREE for all logged-in users |
| Languages | English, Chinese, Malay |
| Caching | Summaries cached in database per language |
| Location | Main news list (inline) + news detail pages (SSR) |

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. USER CLICKS "AI" BUTTON ON NEWS ITEM               │
│     - Must be logged in                                 │
│     - Available on main news list                       │
├─────────────────────────────────────────────────────────┤
│  2. CHECK CACHE                                         │
│     - Look for existing summary in database             │
│     - Check for current language version                │
│     - If found, return cached version instantly         │
├─────────────────────────────────────────────────────────┤
│  3. FETCH ARTICLE CONTENT                               │
│     - Extract text from source URL                      │
│     - Remove ads, navigation, scripts                   │
│     - Limit to 5000 chars for AI processing             │
├─────────────────────────────────────────────────────────┤
│  4. GENERATE WITH GROQ                                  │
│     - Send article content + title to Groq API          │
│     - Use Llama 3.3 70B model                          │
│     - Generate 2-3 sentence summary                     │
├─────────────────────────────────────────────────────────┤
│  5. CACHE & RETURN                                      │
│     - Save summary to database by language              │
│     - Return to user with slide-out animation           │
│     - Other users get cached version                    │
└─────────────────────────────────────────────────────────┘
```

## Features

### Inline Summary Display
- Summary appears below news item with slide-out animation
- Shows "Based on title only" badge if article couldn't be fetched
- TTS button to listen to summary

### Article Content Extraction
- Fetches actual article content from source URL
- Extracts main article text, removes clutter
- Falls back to title-only summary if fetch fails

### Multi-language Support
- Summaries generated in user's selected language
- Cached separately: summary_en, summary_zh, summary_ms
- Clears local cache when language switches

### Caching System
- First user generates summary, stored in database
- Subsequent users get instant cached version
- Saves API calls and reduces latency

## Configuration

### Environment Variable
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Get your API key from: https://console.groq.com/

### Groq Model Settings
```typescript
const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,      // Lower = more focused
  max_tokens: 250        // Limit response length
});
```

## Database Schema

```sql
-- News summaries cache table
CREATE TABLE news_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL UNIQUE,
  summary_en TEXT,
  summary_zh TEXT,
  summary_ms TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id)
);
```

## Key Functions

### lib/articleExtractor.ts
```typescript
// Fetch and extract article content from URL
extractArticleContent(url: string): Promise<{
  content: string;
  success: boolean;
  error?: string;
}>

// Prepare content for AI summarization
prepareForSummarization(content: string, title: string): string
```

### lib/db.ts
```typescript
// Get cached summary
getNewsSummary(newsId: number): NewsSummary | null

// Save summary (supports partial updates per language)
saveNewsSummary(newsId: number, summaries: Partial<NewsSummary>): void
```

## API Endpoint

### POST /api/summary

**Request:**
```json
{
  "newsId": 123,
  "language": "en"  // "en", "zh", or "ms"
}
```

**Response (Success):**
```json
{
  "summary": "The Sarawak government announced new infrastructure...",
  "cached": false
}
```

**Response (Cached):**
```json
{
  "summary": "The Sarawak government announced new infrastructure...",
  "cached": true
}
```

**Error Responses:**
- `401` - Not logged in
- `404` - News not found
- `429` - Rate limited
- `503` - AI service not configured

## Prompt Engineering

The AI is instructed to:
1. Summarize in 2-3 sentences (max 100 words)
2. Focus on key facts: who, what, when, where, why
3. Use neutral, journalistic tone
4. Not add opinions or speculation
5. Base summary on actual article content when available
6. Respond in the requested language

### System Prompt
```
You are a professional news summarizer. Create concise, informative
summaries of news articles. [Language instruction]

Guidelines:
- Summarize in 2-3 sentences (max 100 words)
- Focus on the key facts: who, what, when, where, why
- Use neutral, journalistic tone
- Do not add opinions or speculation
- Base the summary on the actual article content when available
```

## Frontend Integration

### NewsDetail.tsx (Detail Page — Server-Side Rendered)

AI summaries are displayed on news detail pages (`/news/[id]`) for SEO and content value.
The summary is fetched server-side and passed as a prop, so crawlers see it in raw HTML.

```tsx
// app/news/[id]/page.tsx (Server Component)
const summary = news ? getNewsSummary(newsId) : null;
// Passed to NewsDetail as initialSummary prop
// Also used in: meta description, OG tags, JSON-LD articleBody
```

```tsx
// components/NewsDetail.tsx
// Language-aware summary display between article card and comments
{initialSummary && (() => {
  const summaryText = lang === 'zh' ? initialSummary.summary_zh :
                      lang === 'ms' ? initialSummary.summary_ms :
                      initialSummary.summary_en;
  if (!summaryText) return null;
  return (
    <section>
      <h2>AI Summary</h2>
      <p>{summaryText}</p>
    </section>
  );
})()}
```

### NewsItem.tsx (Main Page)
```tsx
// AI Summary button with slide-out panel
<button onClick={handleSummarize}>
  🤖 AI
</button>

{/* Summary panel with animation */}
<div className={`transition-all ${showSummary ? 'max-h-96' : 'max-h-0'}`}>
  <p>{summary}</p>
  {/* TTS Listen button */}
  <button onClick={handleReadSummary}>
    🔊 Listen
  </button>
</div>
```

## Language Switching

When user changes language:
1. Cached summaries are cleared from component state
2. TTS language is updated
3. User can regenerate summary in new language
4. New summary fetched/generated in selected language

## Error Handling

| Error | Handling |
|-------|----------|
| Rate limit | Show "Try again in a moment" |
| Invalid API key | Show "Contact administrator" |
| Network error | Show "Please try again" |
| Empty response | Show "Failed to generate" |
| Article fetch failed | Generate title-only summary |

## Cost Considerations

Groq offers generous free tier:
- Free API access with rate limits
- No per-token charges on free tier
- Good for development and small-scale use
- Caching reduces API calls significantly

## Files

| File | Purpose |
|------|---------|
| `app/api/summary/route.ts` | Summary generation API |
| `app/news/[id]/page.tsx` | SSR summary in meta + JSON-LD + props |
| `lib/articleExtractor.ts` | Article content extraction |
| `components/NewsItem.tsx` | Inline summary UI (main page) |
| `components/NewsDetail.tsx` | SSR summary display (detail page) |
| `lib/db.ts` | Summary caching functions |
