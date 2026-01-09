# Error Monitoring

## Overview

The admin panel includes a comprehensive error monitoring system that allows administrators to track, analyze, and resolve errors in real-time.

## Features

- **Real-time Monitoring** - Browser notifications for new errors
- **Visual Analytics** - Charts showing error trends and distribution
- **Filtering** - Filter by level, type, and resolution status
- **Bulk Actions** - Delete old or resolved errors
- **Cross-tab Sync** - Notification badge updates across tabs

## Error Types

| Type | Description |
|------|-------------|
| `api` | API endpoint errors |
| `database` | Database operation failures |
| `auth` | Authentication/authorization errors |
| `rss` | RSS feed fetching errors |
| `validation` | Input validation failures |
| `other` | Uncategorized errors |

## Error Levels

| Level | Description |
|-------|-------------|
| `error` | Critical issues requiring attention |
| `warning` | Potential issues to monitor |
| `info` | Informational messages |

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,              -- 'error', 'warning', 'info'
  type TEXT NOT NULL,               -- 'api', 'database', 'auth', 'rss', 'validation'
  message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint TEXT,                    -- e.g., '/api/news'
  user_id INTEGER,                  -- NULL for anonymous
  ip_address TEXT,
  user_agent TEXT,
  request_body TEXT,                -- JSON of request (sanitized)
  resolved INTEGER DEFAULT 0,       -- 0=unresolved, 1=resolved
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## Error Logger Utility

**File:** `lib/errorLogger.ts`

### Core Function

```typescript
import { logError } from '@/lib/errorLogger';

// Full options
logError({
  level: 'error',
  type: 'api',
  message: 'Failed to fetch news',
  error: err,           // Optional Error object
  endpoint: '/api/news',
  userId: 123,
  request: nextRequest  // Optional NextRequest for IP/user-agent
});
```

### Convenience Functions

```typescript
// API errors
logApiError('/api/news', error, request, userId);

// Database errors
logDbError('INSERT news', error);

// Authentication errors
logAuthError('Invalid credentials', userId, request);

// RSS feed errors
logRssError('Borneo Post', error);

// Validation errors
logValidationError('Invalid email format', '/api/auth/register', request);
```

## Admin Dashboard - Errors Tab

### Summary Cards

- **Total Errors** - All logged errors
- **Unresolved** - Errors needing attention
- **Today's Errors** - Errors in last 24 hours

### Charts (Recharts)

1. **Line Chart** - Errors over time (last 7 days)
   - Shows trends by level (error, warning, info)

2. **Pie Chart** - Errors by type
   - Distribution across api, database, auth, rss, validation

3. **Bar Chart** - Errors by level
   - Comparison of error, warning, info counts

### Error Table

| Column | Description |
|--------|-------------|
| Level | Badge colored by severity |
| Type | Error category |
| Message | Error description (truncated) |
| Endpoint | API route if applicable |
| Time | Relative time (e.g., "2 hours ago") |
| Actions | Resolve/Delete buttons |

### Filters

- **Level** - All / Error / Warning / Info
- **Type** - All / API / Database / Auth / RSS / Validation
- **Status** - All / Unresolved / Resolved

### Bulk Actions

- **Delete Old Errors** - Remove errors older than X days
- **Clear Resolved** - Delete all resolved errors

## Browser Notifications

### How It Works

```
1. Admin opens Errors tab
   │
2. Browser asks for notification permission
   │
   ├─ User grants permission
   │   └─ Enable real-time notifications
   │
   └─ User denies
       └─ Badge count only (no popups)

3. Poll server every 30 seconds
   │
4. If new error detected:
   └─ Show native browser notification
       ├─ Title: "New Error Detected"
       └─ Body: Error message
```

### Requirements

- Browser must support Notification API
- User must grant permission
- Admin must be on Errors tab to enable polling

## API Endpoints

### GET /api/admin?tab=errors

Returns error data for dashboard:

```json
{
  "errorStats": {
    "totalErrors": 150,
    "unresolvedErrors": 23,
    "todayErrors": 5,
    "errorsByLevel": [...],
    "errorsByType": [...]
  },
  "errorsByDay": [...],
  "errors": [...],
  "pagination": {...}
}
```

Query parameters:
- `page` - Page number
- `limit` - Items per page
- `level` - Filter by level
- `type` - Filter by type
- `resolved` - Filter by status

### GET /api/admin?tab=error-count

Lightweight endpoint for notification polling:

```json
{
  "unresolvedCount": 23,
  "latestErrorId": 456
}
```

### POST /api/admin (Actions)

```typescript
// Resolve error
{ action: 'resolveError', errorId: 123 }

// Unresolve error
{ action: 'unresolveError', errorId: 123 }

// Delete error
{ action: 'deleteError', errorId: 123 }

// Delete old errors
{ action: 'bulkDeleteOldErrors', days: 30 }

// Clear resolved errors
{ action: 'clearResolvedErrors' }
```

## Integration Points

Error logging is integrated into:

| File | Type | When |
|------|------|------|
| `app/api/news/route.ts` | api | Database query failures |
| `app/api/comments/route.ts` | api | Comment operations fail |
| `app/api/refresh/route.ts` | rss | RSS fetch failures |
| `app/api/auth/[...nextauth]/route.ts` | auth | Login failures |
| `app/api/admin/auth/route.ts` | auth | Admin login failures |

## Sentry Integration (Production)

For production crash tracking, Sentry is configured:

**Files:**
- `sentry.client.config.ts` - Browser errors
- `sentry.server.config.ts` - Server errors
- `sentry.edge.config.ts` - Edge runtime errors

**Environment Variables:**
```env
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=sarawak-news
```

**Note:** Sentry complements the custom error logging by:
- Capturing unhandled exceptions
- Providing stack traces with source maps
- Aggregating errors across users
- Sending alerts for critical issues

## Chart Components

**File:** `components/charts/ErrorCharts.tsx`

```typescript
// Line chart for trends
<ErrorsOverTimeChart data={errorsByDay} />

// Pie chart for type distribution
<ErrorsByTypeChart data={errorStats.errorsByType} />

// Bar chart for level comparison
<ErrorsByLevelChart data={errorStats.errorsByLevel} />

// Summary cards
<ErrorStatsCards stats={errorStats} />
```

## Usage Example

### Logging an API Error

```typescript
// In your API route
import { logApiError } from '@/lib/errorLogger';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    // Log the error
    logApiError('/api/data', error as Error, request);

    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### Viewing Errors in Admin

1. Login to admin panel at `/admin/login`
2. Click on **Errors** tab
3. View charts for overview
4. Filter by level/type as needed
5. Mark resolved or delete as appropriate
6. Enable notifications for real-time alerts
