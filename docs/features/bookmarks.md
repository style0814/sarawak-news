# Bookmarks

## Overview

The bookmarks feature allows authenticated users to save news articles for later reading. Bookmarked articles are accessible from a dedicated page and persist across sessions.

## Features

- **Save Articles** - Bookmark any news article
- **Bookmark Page** - View all saved articles
- **Remove Bookmarks** - Unbookmark saved articles
- **Persistence** - Bookmarks stored in database
- **Authentication Required** - Only logged-in users can bookmark

## Access

- **Bookmarks Page:** `/bookmarks`
- **Requires:** User authentication (NextAuth session)

## Components

### Bookmark Button

Shown on each news item:

```tsx
// In NewsItem.tsx or NewsDetail.tsx
<button
  onClick={handleBookmark}
  className={isBookmarked ? 'text-yellow-500' : 'text-gray-400'}
  aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
>
  <BookmarkIcon filled={isBookmarked} />
</button>
```

### Bookmarks Page

**File:** `app/bookmarks/page.tsx`

Displays list of bookmarked articles:

```typescript
export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    const response = await fetch('/api/bookmarks');
    const data = await response.json();
    setBookmarks(data.bookmarks);
  };

  return (
    <div>
      <h1>My Bookmarks</h1>
      {bookmarks.map(bookmark => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}
```

## API Endpoints

### GET /api/bookmarks

Get all bookmarks for the current user.

**Response:**
```json
{
  "bookmarks": [
    {
      "id": 1,
      "news_id": 123,
      "title": "Article Title",
      "title_zh": "文章标题",
      "title_ms": "Tajuk Artikel",
      "source_name": "Borneo Post",
      "source_url": "https://...",
      "created_at": "2024-01-15T10:30:00Z",
      "bookmarked_at": "2024-01-16T08:00:00Z"
    }
  ]
}
```

### POST /api/bookmarks

Add a bookmark.

**Request:**
```json
{
  "newsId": 123
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Bookmark added"
}
```

**Response (already exists):**
```json
{
  "success": false,
  "message": "Already bookmarked"
}
```

### DELETE /api/bookmarks

Remove a bookmark.

**Query Parameter:** `newsId`

```
DELETE /api/bookmarks?newsId=123
```

**Response:**
```json
{
  "success": true,
  "message": "Bookmark removed"
}
```

## Database Schema

**Table:** `bookmarks`

```sql
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  news_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  UNIQUE(user_id, news_id)
);
```

## Database Functions

### addBookmark()

```typescript
export function addBookmark(userId: number, newsId: number): boolean
```

Adds a bookmark. Returns false if already exists.

### removeBookmark()

```typescript
export function removeBookmark(userId: number, newsId: number): boolean
```

Removes a bookmark. Returns true if removed.

### getBookmarks()

```typescript
export function getBookmarks(userId: number): BookmarkWithNews[]
```

Returns all bookmarks with news details for a user.

### isBookmarked()

```typescript
export function isBookmarked(userId: number, newsId: number): boolean
```

Checks if a specific article is bookmarked.

## UI Flow

### Adding a Bookmark

```
1. User clicks bookmark icon on news item
   │
2. Check authentication
   │  ├── Not logged in → Show login prompt
   │  └── Logged in → Continue
   │
3. POST /api/bookmarks { newsId }
   │
4. Update UI
   │  ├── Icon changes to filled
   │  └── Show toast: "Bookmark added"
```

### Removing a Bookmark

```
1. User clicks filled bookmark icon
   │
2. DELETE /api/bookmarks?newsId=X
   │
3. Update UI
   │  ├── Icon changes to outline
   │  └── Show toast: "Bookmark removed"
```

### Viewing Bookmarks

```
1. User navigates to /bookmarks
   │
2. Check authentication
   │  ├── Not logged in → Redirect to login
   │  └── Logged in → Continue
   │
3. GET /api/bookmarks
   │
4. Display bookmarked articles
   │  └── Each card shows:
   │      ├── Title (in user's language)
   │      ├── Source
   │      ├── Date bookmarked
   │      └── Remove button
```

## Optimistic Updates

For better UX, update the UI before the API responds:

```typescript
const handleBookmark = async (newsId: number) => {
  // Optimistic update
  setIsBookmarked(!isBookmarked);

  try {
    if (isBookmarked) {
      await fetch(`/api/bookmarks?newsId=${newsId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ newsId })
      });
    }
  } catch (error) {
    // Revert on error
    setIsBookmarked(isBookmarked);
    showError('Failed to update bookmark');
  }
};
```

## Bookmark State Management

### Per-News Item Check

When loading news list, check bookmark status:

```typescript
// Option 1: Batch check
const bookmarkStatus = await fetch('/api/bookmarks/check', {
  method: 'POST',
  body: JSON.stringify({ newsIds: news.map(n => n.id) })
});

// Option 2: Include in news response
const news = await fetch('/api/news?includeBookmarkStatus=true');
```

### Context Provider (Optional)

For global bookmark state:

```typescript
const BookmarkContext = createContext<{
  bookmarks: Set<number>;
  addBookmark: (id: number) => Promise<void>;
  removeBookmark: (id: number) => Promise<void>;
  isBookmarked: (id: number) => boolean;
}>(null);
```

## Translations

```typescript
// lib/i18n.ts
{
  bookmarks: 'Bookmarks',
  myBookmarks: 'My Bookmarks',
  addBookmark: 'Add Bookmark',
  removeBookmark: 'Remove Bookmark',
  noBookmarks: 'No bookmarks yet',
  bookmarkAdded: 'Bookmark added',
  bookmarkRemoved: 'Bookmark removed',
  loginToBookmark: 'Login to save bookmarks'
}
```

## Styling

### Bookmark Icon States

```tsx
// Outline (not bookmarked)
<svg className="h-5 w-5 text-gray-400 hover:text-yellow-500" fill="none" stroke="currentColor">
  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
</svg>

// Filled (bookmarked)
<svg className="h-5 w-5 text-yellow-500" fill="currentColor">
  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
</svg>
```

### Bookmark Card

```tsx
<div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
  <h3 className="font-semibold">{bookmark.title}</h3>
  <p className="text-sm text-gray-500">{bookmark.source_name}</p>
  <p className="text-xs text-gray-400">
    Saved {formatDate(bookmark.bookmarked_at)}
  </p>
  <button onClick={() => removeBookmark(bookmark.news_id)}>
    Remove
  </button>
</div>
```

## Empty State

When user has no bookmarks:

```tsx
<div className="text-center py-12">
  <BookmarkIcon className="h-12 w-12 mx-auto text-gray-300" />
  <h3 className="mt-4 text-lg font-medium">{t.noBookmarks}</h3>
  <p className="mt-2 text-gray-500">
    Start saving articles by clicking the bookmark icon.
  </p>
  <Link href="/" className="mt-4 inline-block text-emerald-500">
    Browse News
  </Link>
</div>
```

## Related Features

- `/profile` - Shows bookmark count in user stats
- News Item - Bookmark button on each article
- News Detail - Bookmark button on detail page
