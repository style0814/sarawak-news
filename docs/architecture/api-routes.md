# API Routes

## What are API Routes?

API routes are **backend endpoints** built into Next.js. They handle HTTP requests (GET, POST, etc.) and return JSON responses.

```
Frontend (React)  ──HTTP Request──►  API Route  ──Query──►  Database
                  ◄──JSON Response──            ◄──Data───
```

## All API Endpoints

### News Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/news` | Fetch all news (ranked, with filters) |
| GET | `/api/news/[id]` | Get single news item |
| POST | `/api/news/[id]` | Increment clicks |
| POST | `/api/news/[id]/click` | Record a click (alternative) |
| POST | `/api/refresh` | Fetch new RSS articles |
| POST | `/api/translate` | Translate article titles |
| POST | `/api/cleanup` | Clean up old articles |

### Search Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/search` | Advanced search with filters |

### Comment Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/comments?newsId=X` | Get comments for article |
| POST | `/api/comments` | Add a comment |
| POST | `/api/comments/[id]/like` | Like/unlike a comment |

### User Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/user/profile` | Get user profile & stats |
| PUT | `/api/user/profile` | Update profile or password |
| GET | `/api/user/comments` | Get user's comment history |
| GET | `/api/bookmarks` | Get user's bookmarks |
| POST | `/api/bookmarks` | Add bookmark |
| DELETE | `/api/bookmarks?newsId=X` | Remove bookmark |
| GET | `/api/preferences` | Get user preferences |
| POST | `/api/preferences` | Save user preferences |

### Auth Endpoints (NextAuth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/providers` | List auth providers |
| POST | `/api/auth/register` | Register new user |

### Admin Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin?tab=X` | Get admin dashboard data |
| POST | `/api/admin` | Admin actions |
| GET | `/api/admin/auth` | Check admin session |
| POST | `/api/admin/auth` | Admin login |
| DELETE | `/api/admin/auth` | Admin logout |
| POST | `/api/admin/delete` | Delete news or comments |

---

## Detailed Endpoint Documentation

### GET /api/news

**Purpose:** Fetch all news articles, sorted by ranking score.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category
- `source` - Filter by source

**Response:**
```json
{
  "news": [
    {
      "id": 1,
      "title": "Sarawak announces new policy",
      "title_zh": "砂拉越宣布新政策",
      "title_ms": "Sarawak umum dasar baharu",
      "source_url": "https://...",
      "source_name": "Borneo Post",
      "category": "politics",
      "clicks": 42,
      "comment_count": 5,
      "created_at": "2024-01-15T10:30:00Z",
      "score": 12.5
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 10,
    "total": 200
  }
}
```

### GET /api/search

**Purpose:** Advanced search with filters.

**Query Parameters:**
- `q` - Search query (required)
- `page` - Page number
- `limit` - Results per page
- `category` - Filter by category
- `source` - Filter by source
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)
- `sortBy` - Sort order: `relevance`, `date`, `clicks`
- `suggestions` - Set to `true` for autocomplete suggestions

**Response (search):**
```json
{
  "news": [...],
  "total": 45,
  "totalPages": 3,
  "sources": ["Borneo Post", "Dayak Daily"],
  "categories": ["politics", "business"]
}
```

**Response (suggestions):**
```json
{
  "suggestions": ["sarawak election", "sarawak economy", "sarawak tourism"]
}
```

### GET /api/user/profile

**Purpose:** Get authenticated user's profile and stats.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "display_name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "stats": {
    "commentCount": 15,
    "bookmarkCount": 8,
    "joinDate": "2024-01-01"
  }
}
```

### PUT /api/user/profile

**Purpose:** Update user profile or password.

**Request (update profile):**
```json
{
  "display_name": "New Name",
  "email": "new@example.com"
}
```

**Request (change password):**
```json
{
  "action": "changePassword",
  "currentPassword": "old123",
  "newPassword": "new456"
}
```

### GET /api/user/comments

**Purpose:** Get user's comment history.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "content": "Great article!",
      "news_id": 123,
      "news_title": "Article Title",
      "likes": 5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "totalPages": 2
}
```

### GET/POST/DELETE /api/bookmarks

**GET - List bookmarks:**
```json
{
  "bookmarks": [
    {
      "id": 1,
      "news_id": 123,
      "title": "Article Title",
      "source_name": "Borneo Post",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**POST - Add bookmark:**
```json
{ "newsId": 123 }
```

**DELETE - Remove bookmark:**
```
DELETE /api/bookmarks?newsId=123
```

---

## Admin API Details

### GET /api/admin

Fetch admin dashboard data. Requires admin session cookie.

**Query Parameters:**
- `tab`: `dashboard` | `users` | `news` | `comments` | `errors` | `feeds`
- `page`: Page number (for paginated tabs)
- `search`: Search term (for news)
- `source`: Filter by source (for news)
- `category`: Filter by category (for news)
- `filter`: `all` | `flagged` | `hidden` (for comments)
- `level`: Error level filter
- `type`: Error type filter
- `resolved`: Error resolution status

**Response (tab=dashboard):**
```json
{
  "stats": {
    "totalNews": 150,
    "totalUsers": 25,
    "totalComments": 89
  },
  "dailyStats": [
    {
      "date": "2024-01-15",
      "news_count": 12,
      "comment_count": 5,
      "click_count": 234
    }
  ],
  "topNews": [{ "id": 1, "title": "...", "clicks": 100 }],
  "topSources": [{ "source_name": "Borneo Post", "count": 45 }],
  "categoryStats": [{ "category": "politics", "count": 30 }],
  "untranslatedCount": 5
}
```

**Response (tab=feeds):**
```json
{
  "feeds": [
    {
      "id": 1,
      "name": "Borneo Post",
      "url": "https://...",
      "is_active": 1,
      "is_sarawak_source": 1,
      "last_fetched_at": "2024-01-15T10:00:00Z",
      "error_count": 0,
      "last_error": null
    }
  ]
}
```

**Response (tab=comments with moderation):**
```json
{
  "comments": [
    {
      "id": 1,
      "content": "...",
      "author_name": "John",
      "is_flagged": 0,
      "is_hidden": 0,
      "flag_reason": null,
      "moderation_note": null
    }
  ],
  "moderationStats": {
    "totalComments": 100,
    "flaggedComments": 5,
    "hiddenComments": 2
  }
}
```

### POST /api/admin

Perform admin actions. Requires admin session cookie.

**User Actions:**
```json
// Toggle user admin status
{ "action": "toggleAdmin", "userId": 5, "currentAdminStatus": false }

// Delete a user
{ "action": "deleteUser", "userId": 5 }
```

**News Actions:**
```json
// Bulk delete old news
{ "action": "bulkDeleteOldNews", "days": 30 }
```

**Comment Moderation Actions:**
```json
// Flag comment
{ "action": "flagComment", "commentId": 123, "reason": "Spam" }

// Unflag comment
{ "action": "unflagComment", "commentId": 123 }

// Hide comment (from public view)
{ "action": "hideComment", "commentId": 123, "note": "Inappropriate content" }

// Unhide comment
{ "action": "unhideComment", "commentId": 123 }

// Delete comment
{ "action": "deleteComment", "commentId": 123 }
```

**Error Actions:**
```json
// Resolve error
{ "action": "resolveError", "errorId": 123 }

// Unresolve error
{ "action": "unresolveError", "errorId": 123 }

// Delete error
{ "action": "deleteError", "errorId": 123 }

// Delete old errors
{ "action": "bulkDeleteOldErrors", "days": 30 }

// Clear resolved errors
{ "action": "clearResolvedErrors" }
```

**RSS Feed Actions:**
```json
// Add feed
{
  "action": "addFeed",
  "name": "New Source",
  "url": "https://example.com/feed",
  "is_sarawak_source": true
}

// Toggle feed active status
{ "action": "toggleFeed", "feedId": 1 }

// Delete feed
{ "action": "deleteFeed", "feedId": 1 }
```

---

## Key Concepts

### NextResponse vs Response

```typescript
import { NextResponse } from 'next/server';

// NextResponse (recommended)
return NextResponse.json({ data });
return NextResponse.json({ error }, { status: 500 });

// Standard Response
return Response.json({ data });
```

### Dynamic Routes `[param]`

```
app/api/news/[id]/route.ts

URL: /api/news/42
     params.id = "42"
```

### Error Handling

```typescript
export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Success (default) |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Not allowed |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Something broke |

### Disabling Cache

```typescript
export const dynamic = 'force-dynamic';
```

Without this, Next.js might cache GET responses. For real-time data, disable caching.

## Testing API Routes

```bash
# GET request
curl http://localhost:3000/api/news

# POST request
curl -X POST http://localhost:3000/api/refresh

# GET with query params
curl "http://localhost:3000/api/search?q=election&category=politics"

# POST with JSON body
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"news_id": 123, "content": "Great article!"}'
```

Or in browser console:
```javascript
fetch('/api/news').then(r => r.json()).then(console.log)
fetch('/api/search?q=sarawak&suggestions=true').then(r => r.json()).then(console.log)
```
