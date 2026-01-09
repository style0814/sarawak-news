# SQLite with better-sqlite3

## What is SQLite?

SQLite is a **file-based database**. Unlike MySQL or PostgreSQL, it doesn't need a separate server - the entire database is just one file.

```
data/news.db    ← This single file IS your database
```

## Why We Use It

### 1. No Setup Required
```bash
# MySQL/PostgreSQL:
1. Install database server
2. Create database
3. Create user
4. Configure connection
5. Start server

# SQLite:
Just npm install and use!
```

### 2. Perfect for Small-Medium Projects
| Use Case | Best Choice |
|----------|-------------|
| Personal project, < 100k rows | SQLite |
| Multiple servers, high traffic | PostgreSQL/MySQL |
| Our Sarawak News project | SQLite (perfect fit) |

### 3. Easy to Backup
```bash
# Backup entire database:
cp data/news.db data/news-backup.db

# That's it!
```

## better-sqlite3 vs sqlite3

We use `better-sqlite3` instead of `sqlite3`:

| Feature | better-sqlite3 | sqlite3 |
|---------|---------------|---------|
| Speed | 2-3x faster | Slower |
| API | Synchronous (simpler) | Async (callbacks) |
| Syntax | `db.prepare().run()` | `db.run(callback)` |

## How We Use It

### Database Location
```
sarawak-news/
└── data/
    └── news.db    ← Created automatically on first run
```

### Our Schema (lib/db.ts)
```sql
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing ID
  title TEXT NOT NULL,                   -- News headline
  source_url TEXT UNIQUE NOT NULL,       -- Link to article (unique = no duplicates)
  source_name TEXT NOT NULL,             -- e.g. "Borneo Post"
  clicks INTEGER DEFAULT 0,              -- Click counter
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Common Operations

```typescript
// INSERT new article
db.prepare(`
  INSERT INTO news (title, source_url, source_name)
  VALUES (?, ?, ?)
`).run('News Title', 'https://...', 'Borneo Post');

// SELECT all news
const news = db.prepare('SELECT * FROM news').all();

// UPDATE click count
db.prepare('UPDATE news SET clicks = clicks + 1 WHERE id = ?').run(123);
```

### The `?` Placeholders
```typescript
// WRONG - SQL injection risk!
db.prepare(`SELECT * FROM news WHERE id = ${userInput}`);

// CORRECT - Safe with placeholders
db.prepare('SELECT * FROM news WHERE id = ?').get(userInput);
```

## Viewing the Database

You can view `news.db` with these tools:
- [DB Browser for SQLite](https://sqlitebrowser.org/) (Free GUI)
- VS Code extension: "SQLite Viewer"
- Command line: `sqlite3 data/news.db`

## Learn More

- [SQLite Docs](https://www.sqlite.org/docs.html)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
