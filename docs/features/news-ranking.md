# News Ranking Algorithm

## Overview

News articles are ranked using a **Hacker News-style algorithm** that balances:
- **Popularity** (clicks) - More clicks = higher rank
- **Freshness** (time) - Newer articles get a boost

## The Formula

```
Score = clicks / (hours_since_posted + 2)^1.8
```

### Breaking It Down

| Part | Meaning |
|------|---------|
| `clicks` | Number of times article was clicked |
| `hours_since_posted` | How old the article is |
| `+ 2` | Prevents division issues when article is new |
| `^1.8` | Gravity - how fast old articles sink |

## Examples

### Example 1: Fresh Article with Some Clicks
```
Article: Posted 1 hour ago, 10 clicks

Score = 10 / (1 + 2)^1.8
      = 10 / 3^1.8
      = 10 / 6.24
      = 1.60
```

### Example 2: Old Article with Many Clicks
```
Article: Posted 24 hours ago, 100 clicks

Score = 100 / (24 + 2)^1.8
      = 100 / 26^1.8
      = 100 / 262.4
      = 0.38
```

### Example 3: Fresh Article with No Clicks
```
Article: Posted 0.5 hours ago, 0 clicks

Score = 0 / (0.5 + 2)^1.8
      = 0 / 4.15
      = 0
```

## Why This Works

### 1. New Articles Get a Chance
The `+ 2` in the denominator means even brand new articles (0 hours) don't get infinite scores:

```
0 hours: (0 + 2)^1.8 = 3.03
1 hour:  (1 + 2)^1.8 = 6.24
```

### 2. Old Articles Must Work Harder
As time passes, articles need more clicks to maintain rank:

| Hours Old | Clicks Needed for Score = 1.0 |
|-----------|-------------------------------|
| 1 hour | 6 clicks |
| 6 hours | 26 clicks |
| 12 hours | 59 clicks |
| 24 hours | 136 clicks |

### 3. The Gravity Factor (1.8)

- `1.0` = Linear decay (too slow)
- `2.0` = Quadratic decay (too fast)
- `1.8` = Sweet spot (Hacker News uses this)

Higher gravity = faster decay for old articles.

## Implementation

**File:** `lib/db.ts`

```typescript
function calculateScore(clicks: number, createdAt: string): number {
  // Calculate hours since creation
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  // Apply HN formula
  return clicks / Math.pow(hoursAgo + 2, 1.8);
}

export function getAllNews(): NewsItem[] {
  const news = db.prepare('SELECT * FROM news').all();

  // Add scores and sort
  return news
    .map(item => ({
      ...item,
      score: calculateScore(item.clicks, item.created_at)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
```

## Comparison: Different Algorithms

### By Newest (No Ranking)
```
Sort by: created_at DESC
```
Problem: Popular articles sink regardless of interest.

### By Most Clicks (No Time Decay)
```
Sort by: clicks DESC
```
Problem: Old viral articles dominate forever.

### Our Approach (HN-style)
```
Sort by: clicks / (hours + 2)^1.8
```
Best of both worlds!

## Tuning the Algorithm

### Want Faster Turnover?
Increase gravity:
```typescript
Math.pow(hoursAgo + 2, 2.0)  // Articles decay faster
```

### Want Slower Turnover?
Decrease gravity:
```typescript
Math.pow(hoursAgo + 2, 1.5)  // Articles stay longer
```

### Want to Boost New Articles More?
Decrease the offset:
```typescript
Math.pow(hoursAgo + 1, 1.8)  // New articles start higher
```

## Real-World Ranking Over Time

Imagine two articles posted now with 10 clicks each:

| Hours Later | Article A (no new clicks) | Article B (gets 5 more clicks) |
|-------------|---------------------------|--------------------------------|
| 0 hours | Score: 1.60 | Score: 1.60 |
| 2 hours | Score: 0.87 | Score: 1.31 (15 clicks) |
| 6 hours | Score: 0.38 | Score: 0.58 (15 clicks) |
| 12 hours | Score: 0.17 | Score: 0.25 (15 clicks) |
| 24 hours | Score: 0.07 | Score: 0.11 (15 clicks) |

Both decay, but Article B decays slower due to more clicks.

## Further Reading

- [Hacker News Ranking Algorithm](https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d)
- [Reddit Hot Algorithm](https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9)
