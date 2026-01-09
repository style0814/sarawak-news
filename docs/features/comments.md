# Comment System

## Overview

Users can discuss news articles through a threaded comment system with nested replies, similar to Reddit or Hacker News.

## Features

- **Nested replies** - Up to 4 levels deep
- **Like comments** - Show appreciation
- **Real-time updates** - Comments appear immediately
- **No login required** - Just enter your name

## Database Schema

**File:** `lib/db.ts`

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL,          -- Which article
  parent_id INTEGER DEFAULT NULL,    -- NULL = root comment, else = reply
  author TEXT NOT NULL,              -- User's name
  content TEXT NOT NULL,             -- Comment text
  likes INTEGER DEFAULT 0,           -- Like count
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);
```

## Nested Comment Structure

```
Comment 1 (parent_id = NULL)
├── Reply 1.1 (parent_id = 1)
│   ├── Reply 1.1.1 (parent_id = 1.1)
│   └── Reply 1.1.2 (parent_id = 1.1)
└── Reply 1.2 (parent_id = 1)

Comment 2 (parent_id = NULL)
└── Reply 2.1 (parent_id = 2)
```

## Building the Tree

The `getCommentsByNewsId` function converts flat rows into nested structure:

```typescript
export function getCommentsByNewsId(newsId: number): Comment[] {
  // 1. Get all comments for this news
  const allComments = db.prepare(
    'SELECT * FROM comments WHERE news_id = ?'
  ).all(newsId);

  // 2. Create a map for quick lookup
  const commentMap = new Map<number, Comment>();
  allComments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // 3. Build the tree
  const rootComments: Comment[] = [];
  allComments.forEach(comment => {
    if (comment.parent_id) {
      // Has parent → add to parent's replies
      const parent = commentMap.get(comment.parent_id);
      parent?.replies.push(comment);
    } else {
      // No parent → root comment
      rootComments.push(comment);
    }
  });

  return rootComments;
}
```

## API Endpoints

### GET /api/comments?newsId=123

Fetch all comments for a news article:

```json
{
  "comments": [
    {
      "id": 1,
      "news_id": 123,
      "parent_id": null,
      "author": "John",
      "content": "Great article!",
      "likes": 5,
      "created_at": "2024-01-15T10:30:00Z",
      "replies": [
        {
          "id": 2,
          "parent_id": 1,
          "author": "Mary",
          "content": "I agree!",
          "replies": []
        }
      ]
    }
  ]
}
```

### POST /api/comments

Add a new comment:

```json
{
  "news_id": 123,
  "parent_id": null,     // null for root, or comment ID for reply
  "author": "John",
  "content": "Great article!"
}
```

### POST /api/comments/[id]/like

Like a comment:
```bash
POST /api/comments/5/like
```

## Component Structure

```
CommentSection.tsx
├── Comment Form (add new comment)
└── CommentItem (recursive)
    ├── Author & Time
    ├── Content
    ├── Like & Reply buttons
    └── Nested CommentItems (replies)
```

## Visual Nesting

Each reply level gets indented with a left border:

```typescript
<div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-emerald-100' : ''}`}>
```

**Depth 0 (root):** No indent
**Depth 1:** 24px margin + left border
**Depth 2:** 48px margin + left border
**Max depth 4:** Prevents infinite nesting

## Reply Flow

1. User clicks "Reply" on a comment
2. `replyingTo` state is set to that comment's ID
3. Form shows "Replying to..." indicator
4. On submit, `parent_id` is set to `replyingTo`
5. Comment appears nested under parent

```typescript
const handleReply = (parentId: number) => {
  setReplyingTo(parentId);
  document.getElementById('comment-textarea')?.focus();
};

// In form submission:
body: JSON.stringify({
  news_id: newsId,
  parent_id: replyingTo,  // Links to parent comment
  author: author,
  content: content
})
```

## Updating Comment Count

When a comment is added, the news article's `comment_count` is updated:

```typescript
// In addComment():
db.prepare(
  'UPDATE news SET comment_count = comment_count + 1 WHERE id = ?'
).run(comment.news_id);
```

This allows showing comment counts on the news list.
