# Auto-Refresh Feature

## Overview

The news list automatically refreshes every 5 minutes to keep content fresh, similar to how Hacker News works.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Page loads                                                  │
│     │                                                        │
│     ▼                                                        │
│  Fetch news immediately ──────────────────────► Show news   │
│     │                                                        │
│     ▼                                                        │
│  Start 5-minute timer                                        │
│     │                                                        │
│     ├──── 5 min ──── Silently fetch news (no loading UI)   │
│     │                                                        │
│     ├──── 5 min ──── Silently fetch news                    │
│     │                                                        │
│     └──── (repeats...)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Implementation

**File:** `app/page.tsx`

```typescript
// Auto-refresh interval: 5 minutes (like Hacker News)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 300,000 ms

// Auto-refresh every 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    fetchNews(false); // Silent refresh, no loading indicator
  }, AUTO_REFRESH_INTERVAL);

  return () => clearInterval(interval);
}, [fetchNews]);
```

## Key Points

### 1. Silent Refresh
The auto-refresh doesn't show a loading indicator:
```typescript
fetchNews(false); // false = don't show loading state
```

This prevents jarring UI changes while reading.

### 2. Manual Refresh
The "Refresh" button fetches NEW articles from RSS:
```typescript
const handleRefresh = async () => {
  await fetch('/api/refresh', { method: 'POST' }); // Fetch RSS
  await fetchNews(); // Then update list
};
```

### 3. Interval Cleanup
When the component unmounts, we clear the interval:
```typescript
return () => clearInterval(interval);
```

This prevents memory leaks.

## Why 5 Minutes?

| Interval | Pros | Cons |
|----------|------|------|
| 1 min | Very fresh | Too many requests |
| 5 min | Good balance | Industry standard |
| 15 min | Low load | Stale content |

Hacker News uses ~5 minute refresh cycles, which is a good balance.

## Last Updated Display

The header shows when news was last fetched:
```typescript
const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

// After fetching:
setLastUpdated(new Date());
```

Displayed as: `Last updated: 10:30:45 AM`

## Customizing the Interval

To change the refresh rate, edit `AUTO_REFRESH_INTERVAL`:

```typescript
// Every 2 minutes
const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000;

// Every 10 minutes
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000;
```
