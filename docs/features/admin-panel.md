# Admin Panel

## Overview

The admin panel provides a comprehensive dashboard for managing the Sarawak News application. It uses a **separate authentication system** from regular user login, with its own credentials and session management.

## Access

- **URL:** `/admin`
- **Default credentials:**
  - Username: `superadmin`
  - Password: `Sarawak@Admin2024`

## Features

The admin dashboard has **6 tabs**:

### 1. Dashboard Tab

Overview statistics and analytics:
- **Overview Stats Cards** - Total news, users, comments with visual indicators
- **RSS Refresh** - Manual refresh button with result feedback
- **Translation Retry** - Retry failed translations
- **Analytics Charts** (Recharts):
  - Daily Activity Chart (area chart)
  - Click Trend Chart (line chart)
  - Sources Distribution (pie chart)
  - Categories Distribution (bar chart)
  - Engagement Metrics (stacked bar chart)
- **Daily Statistics Table** - Last 7 days breakdown
- **Top News** - Most clicked articles
- **Top Sources** - Sources with most articles

### 2. Users Tab

Manage registered users:
- View all users with their details
- Toggle admin status for users
- Delete users

### 3. News Tab

Manage news articles:
- Search by title
- Filter by source
- Filter by category
- Paginated list
- Delete individual articles
- Bulk delete old articles (by age in days)

### 4. Comments Tab

**Full moderation system:**

**Moderation Stats Cards:**
- Total Comments
- Flagged Comments (pending review)
- Hidden Comments (removed from public)

**Filter Buttons:**
- All - Show all comments
- Flagged - Show flagged comments only
- Hidden - Show hidden comments only

**Comment Table with Moderation:**
- Status badges (Visible/Flagged/Hidden)
- Author name
- Comment content
- Associated news article
- Like count
- Moderation actions:
  - **Flag/Unflag** - Mark for review
  - **Hide/Show** - Toggle public visibility
  - **Delete** - Permanently remove

### 5. Errors Tab

Monitor and analyze application errors:
- Summary cards (total, unresolved, today's errors)
- Visual charts using Recharts:
  - Errors Over Time (line chart)
  - Errors by Type (pie chart)
  - Errors by Level (bar chart)
- Filter by level (error/warning/info)
- Filter by type (api/database/auth/rss/validation)
- Filter by status (resolved/unresolved)
- Mark errors as resolved
- Delete individual errors
- Bulk delete old errors
- Clear all resolved errors
- Browser notifications for new errors

See [error-monitoring.md](./error-monitoring.md) for detailed documentation.

### 6. RSS Feeds Tab

**Manage RSS sources dynamically:**

**Feed List Table:**
- Status indicator (Active/Warning/Inactive)
- Feed name
- Feed URL
- Type (Sarawak source vs Filtered)
- Last fetched timestamp
- Error count and last error

**Add New Feed Form:**
- Feed name
- Feed URL
- Sarawak source toggle (all articles vs filtered)

**Feed Actions:**
- Enable/Disable feed
- Delete feed

## Architecture

### Separate Admin Auth

Admin authentication is **independent** from user authentication (NextAuth):

```
User Auth (NextAuth)          Admin Auth (Custom)
├── /auth/login               ├── /admin/login
├── Session in DB             ├── Cookie-based session
├── Multiple providers        ├── Username/password only
└── For regular users         └── For administrators
```

**Why separate?**
- Admin access is more critical
- Different security requirements
- No need for OAuth/social login
- Simpler to audit

### File Structure

```
app/admin/
├── page.tsx           # Redirect handler (checks auth)
├── login/
│   └── page.tsx       # Admin login form
└── dashboard/
    └── page.tsx       # Main admin dashboard (all 6 tabs)

lib/
└── adminAuth.ts       # Admin authentication functions

app/api/admin/
├── route.ts           # Dashboard data + all actions
├── auth/
│   └── route.ts       # Login/logout/session check
└── delete/
    └── route.ts       # Delete news/comments

components/charts/
├── ErrorCharts.tsx     # Error monitoring visualizations
└── DashboardCharts.tsx # Analytics charts
```

### Authentication Flow

```
1. User visits /admin
   │
2. page.tsx checks admin session
   │
   ├─ No session → Redirect to /admin/login
   │
   └─ Has session → Redirect to /admin/dashboard

3. Admin enters credentials at /admin/login
   │
4. POST /api/admin/auth
   │
5. Verify username & password
   │
6. Create session cookie (8 hour expiry)
   │
7. Redirect to /admin/dashboard
```

### Session Management

```typescript
// lib/adminAuth.ts

// Create session token
function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}-${SECRET.substring(0, 8)}`;
}

// Session cookie settings
cookieStore.set(ADMIN_SESSION_NAME, token, {
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only in production
  sameSite: 'lax',       // CSRF protection
  maxAge: 60 * 60 * 8,   // 8 hours
  path: '/'
});
```

## Security

### Protected Routes

All admin API routes check the admin session:

```typescript
export async function GET(request: NextRequest) {
  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... handle request
}
```

### Password Storage

Default password uses bcrypt comparison. For production:

```bash
# Generate password hash
node -e "require('bcryptjs').hash('YourSecurePassword', 10).then(console.log)"
```

Set in `.env.local`:
```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD_HASH=$2a$10$...your-bcrypt-hash...
ADMIN_SESSION_SECRET=your-random-secret-string
```

## Production Setup

1. **Change default credentials:**
   ```
   ADMIN_USERNAME=your_secure_admin_name
   ADMIN_PASSWORD_HASH=bcrypt_hash_of_your_password
   ```

2. **Set a strong session secret:**
   ```
   ADMIN_SESSION_SECRET=random-string-at-least-32-chars
   ```

3. **Consider IP restrictions** at the network/proxy level

4. **Enable rate limiting** on login attempts

## Dashboard Data Flow

```
Admin Dashboard (React)
│
├── useEffect on mount
│   └── GET /api/admin/auth → Check session
│
├── Tab: Dashboard
│   └── GET /api/admin?tab=dashboard
│       ├── getStats()
│       ├── getDailyStats(7)
│       ├── getTopNews(5)
│       ├── getTopSources()
│       ├── getCategoryStats()
│       └── getUntranslatedCount()
│
├── Tab: Users
│   └── GET /api/admin?tab=users
│       └── getAllUsersWithAdmin()
│
├── Tab: News
│   └── GET /api/admin?tab=news&page=1&search=...
│       └── getNewsForAdmin(page, limit, search, source, category)
│
├── Tab: Comments
│   └── GET /api/admin?tab=comments&page=1&filter=all|flagged|hidden
│       ├── getAllCommentsForAdmin(page, limit, filter)
│       └── getCommentModerationStats()
│
├── Tab: Errors
│   ├── GET /api/admin?tab=errors&page=1&level=...&type=...
│   │   ├── getErrorStats()
│   │   ├── getErrorsByDay(7)
│   │   └── getErrorLogs(page, limit, filters)
│   │
│   └── GET /api/admin?tab=error-count (for notification polling)
│       ├── getUnresolvedErrorCount()
│       └── getLatestErrorId()
│
└── Tab: RSS Feeds
    └── GET /api/admin?tab=feeds
        └── getAllRssFeeds()
```

## Admin Actions

### User Actions

```typescript
// Toggle admin status
{ action: 'toggleAdmin', userId: 5, currentAdminStatus: false }

// Delete user
{ action: 'deleteUser', userId: 5 }
```

### News Actions

```typescript
// Bulk delete old news
{ action: 'bulkDeleteOldNews', days: 30 }
```

### Comment Moderation Actions

```typescript
// Flag comment for review
{ action: 'flagComment', commentId: 123, reason: 'Spam content' }

// Remove flag
{ action: 'unflagComment', commentId: 123 }

// Hide from public view
{ action: 'hideComment', commentId: 123, note: 'Inappropriate language' }

// Show again
{ action: 'unhideComment', commentId: 123 }

// Permanently delete
{ action: 'deleteComment', commentId: 123 }
```

### Error Actions

```typescript
// Mark as resolved
{ action: 'resolveError', errorId: 123 }

// Mark as unresolved
{ action: 'unresolveError', errorId: 123 }

// Delete single error
{ action: 'deleteError', errorId: 123 }

// Delete old errors
{ action: 'bulkDeleteOldErrors', days: 30 }

// Clear all resolved
{ action: 'clearResolvedErrors' }
```

### RSS Feed Actions

```typescript
// Add new feed
{
  action: 'addFeed',
  name: 'New Source',
  url: 'https://example.com/feed',
  is_sarawak_source: true
}

// Toggle active status
{ action: 'toggleFeed', feedId: 1 }

// Delete feed
{ action: 'deleteFeed', feedId: 1 }
```

## Analytics Charts

The dashboard uses Recharts for data visualization:

### components/charts/DashboardCharts.tsx

```typescript
// Daily activity (news + comments)
<DailyActivityChart data={dailyStats} />

// Click trends over time
<ClickTrendChart data={dailyStats} />

// News by source (pie chart)
<SourcesChart data={topSources} />

// News by category (bar chart)
<CategoriesChart data={categoryStats} />

// Engagement metrics (stacked bar)
<EngagementChart data={dailyStats} />

// Overview stats with gradients
<OverviewStatsCards
  totalNews={stats.totalNews}
  totalUsers={stats.totalUsers}
  totalComments={stats.totalComments}
  todayNews={dailyStats[0]?.news_count}
  weeklyGrowth={calculatedGrowth}
/>
```

### components/charts/ErrorCharts.tsx

```typescript
// Errors over time (line chart with levels)
<ErrorsOverTimeChart data={errorsByDay} />

// Error type distribution (pie chart)
<ErrorsByTypeChart data={errorStats.errorsByType} />

// Error level comparison (bar chart)
<ErrorsByLevelChart data={errorStats.errorsByLevel} />

// Summary cards
<ErrorStatsCards
  totalErrors={errorStats.totalErrors}
  unresolvedErrors={errorStats.unresolvedErrors}
  todayErrors={errorStats.todayErrors}
/>
```

## Translations

All admin UI text is internationalized (EN/ZH/MS):

```typescript
const t = translations[lang];

// Usage
{t.dashboard}
{t.manageUsers}
{t.flagged}
{t.rssFeeds}
{t.dailyActivity}
// etc.
```
