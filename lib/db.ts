import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

function resolveDbPath(): string {
  const configuredPath = process.env.DATABASE_PATH?.trim();

  if (!configuredPath) {
    return path.join(process.cwd(), 'data', 'news.db');
  }

  if (configuredPath === ':memory:') {
    return configuredPath;
  }

  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return path.join(process.cwd(), configuredPath);
}

const dbPath = resolveDbPath();

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    if (dbPath !== ':memory:') {
      const dbDir = path.dirname(dbPath);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(database: Database.Database) {
  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // News table
  database.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_zh TEXT,
      title_ms TEXT,
      source_url TEXT UNIQUE NOT NULL,
      source_name TEXT NOT NULL,
      published_at TEXT,
      clicks INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      summary_views INTEGER DEFAULT 0,
      tts_listens INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Comments table
  database.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      news_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    )
  `);

  // Comment likes table (prevent spam - one like per user per comment)
  database.exec(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add indexes for performance
  database.exec(`CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_comments_news_id ON comments(news_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id)`);

  // Bookmarks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      news_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, news_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
    )
  `);

  // Add indexes
  database.exec(`CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)`);

  // Error logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      stack_trace TEXT,
      endpoint TEXT,
      user_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      request_body TEXT,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Add indexes for error_logs
  database.exec(`CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(type)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved)`);

  // User preferences table (per-user settings)
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      language TEXT DEFAULT 'en',
      theme TEXT DEFAULT 'light',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add index for user_preferences
  database.exec(`CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id)`);

  // RSS Feeds table (admin-managed)
  database.exec(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_sarawak_source INTEGER DEFAULT 0,
      last_fetched_at TEXT,
      error_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default feeds if table is empty
  const feedCount = (database.prepare('SELECT COUNT(*) as count FROM rss_feeds').get() as { count: number }).count;
  if (feedCount === 0) {
    const defaultFeeds = [
      { name: 'Borneo Post', url: 'https://www.theborneopost.com/feed/', is_sarawak_source: 1 },
      { name: 'Dayak Daily', url: 'https://dayakdaily.com/feed/', is_sarawak_source: 1 },
      { name: 'The Star', url: 'https://www.thestar.com.my/rss/News/Nation/', is_sarawak_source: 0 },
      { name: 'Free Malaysia Today', url: 'https://www.freemalaysiatoday.com/category/nation/feed/', is_sarawak_source: 0 }
    ];
    const insertFeed = database.prepare('INSERT INTO rss_feeds (name, url, is_sarawak_source) VALUES (?, ?, ?)');
    defaultFeeds.forEach(feed => insertFeed.run(feed.name, feed.url, feed.is_sarawak_source));
  }

  // Ensure recommended free feeds exist on upgrades (inactive by default for safer rollout).
  const recommendedFeeds = [
    { name: 'Malay Mail (All)', url: 'https://www.malaymail.com/feed/rss', is_sarawak_source: 0, is_active: 0 },
    { name: 'Malay Mail (Malaysia)', url: 'https://www.malaymail.com/feed/rss/malaysia', is_sarawak_source: 0, is_active: 0 },
    { name: 'Astro Awani (Latest)', url: 'https://rss.astroawani.com/rss/latest/public', is_sarawak_source: 0, is_active: 0 },
    { name: 'Astro Awani (National)', url: 'https://rss.astroawani.com/rss/national/public', is_sarawak_source: 0, is_active: 0 }
  ];
  const insertRecommendedFeed = database.prepare(`
    INSERT OR IGNORE INTO rss_feeds (name, url, is_sarawak_source, is_active)
    VALUES (?, ?, ?, ?)
  `);
  recommendedFeeds.forEach(feed => {
    insertRecommendedFeed.run(feed.name, feed.url, feed.is_sarawak_source, feed.is_active);
  });

  // Migration: Add columns if they don't exist
  try { database.exec(`ALTER TABLE news ADD COLUMN title_zh TEXT`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE news ADD COLUMN title_ms TEXT`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE news ADD COLUMN comment_count INTEGER DEFAULT 0`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'general'`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`); } catch { /* exists */ }
  // Comment moderation fields
  try { database.exec(`ALTER TABLE comments ADD COLUMN is_flagged INTEGER DEFAULT 0`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE comments ADD COLUMN is_hidden INTEGER DEFAULT 0`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE comments ADD COLUMN flag_reason TEXT`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE comments ADD COLUMN flagged_at TEXT`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE comments ADD COLUMN moderation_note TEXT`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE news ADD COLUMN summary_views INTEGER DEFAULT 0`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE news ADD COLUMN tts_listens INTEGER DEFAULT 0`); } catch { /* exists */ }

  // Subscriptions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Payment submissions table (for manual verification)
  database.exec(`
    CREATE TABLE IF NOT EXISTS payment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reference_number TEXT,
      proof_description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Add indexes for subscriptions
  database.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_payment_submissions_user ON payment_submissions(user_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON payment_submissions(status)`);

  // News summary cache (for premium feature)
  database.exec(`
    CREATE TABLE IF NOT EXISTS news_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      news_id INTEGER UNIQUE NOT NULL,
      summary_en TEXT,
      summary_zh TEXT,
      summary_ms TEXT,
      audio_url_male TEXT,
      audio_url_female TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
    )
  `);

  database.exec(`CREATE INDEX IF NOT EXISTS idx_news_summaries_news ON news_summaries(news_id)`);

  // App metadata (key-value store for global settings)
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API rate limiting table (fixed window counters)
  database.exec(`
    CREATE TABLE IF NOT EXISTS api_rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin audit log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_username TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action)`);

  // Search logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      user_id INTEGER,
      results_count INTEGER DEFAULT 0,
      category_filter TEXT,
      source_filter TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query)`);

  // User ban columns
  try { database.exec(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE users ADD COLUMN banned_reason TEXT`); } catch { /* exists */ }
  try { database.exec(`ALTER TABLE users ADD COLUMN banned_at TEXT`); } catch { /* exists */ }
}

// ============ APP METADATA FUNCTIONS ============

export function getMetadata(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM app_metadata WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function setMetadata(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export function consumeRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const currentWindowStart = now - (now % windowSeconds);

  const existing = db.prepare(`
    SELECT window_start, count
    FROM api_rate_limits
    WHERE key = ?
  `).get(key) as { window_start: number; count: number } | undefined;

  if (!existing || existing.window_start !== currentWindowStart) {
    db.prepare(`
      INSERT INTO api_rate_limits (key, window_start, count, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        window_start = excluded.window_start,
        count = excluded.count,
        updated_at = CURRENT_TIMESTAMP
    `).run(key, currentWindowStart);

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfter: windowSeconds
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, currentWindowStart + windowSeconds - now)
    };
  }

  const newCount = existing.count + 1;
  db.prepare(`
    UPDATE api_rate_limits
    SET count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE key = ?
  `).run(newCount, key);

  return {
    allowed: true,
    remaining: Math.max(0, limit - newCount),
    retryAfter: Math.max(1, currentWindowStart + windowSeconds - now)
  };
}

// ============ USER FUNCTIONS ============

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  created_at: string;
}

export async function createUser(user: {
  username: string;
  email: string;
  password: string;
  display_name: string;
}): Promise<User | null> {
  const db = getDb();
  try {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(user.username, user.email, passwordHash, user.display_name);
    return db.prepare('SELECT id, username, email, display_name, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as User;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return null;
    }
    throw error;
  }
}

export async function verifyUser(usernameOrEmail: string, password: string): Promise<User | null> {
  const db = getDb();
  const user = db.prepare(`
    SELECT * FROM users WHERE username = ? OR email = ?
  `).get(usernameOrEmail, usernameOrEmail) as (User & { password_hash: string; is_banned?: number }) | undefined;

  if (!user) return null;
  if (user.is_banned === 1) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  const userWithoutPassword = {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    created_at: user.created_at
  };
  return userWithoutPassword;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  return db.prepare('SELECT id, username, email, display_name, created_at FROM users WHERE id = ?')
    .get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  return db.prepare('SELECT id, username, email, display_name, created_at FROM users WHERE email = ?')
    .get(email) as User | null;
}

export function updateUserProfile(userId: number, updates: { display_name?: string; email?: string }): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.display_name);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (fields.length === 0) return false;

  values.push(userId);
  try {
    const result = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  } catch {
    return false;
  }
}

export async function updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  const db = getDb();
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
  if (!user) return false;

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) return false;

  const newHash = await bcrypt.hash(newPassword, 10);
  const result = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
  return result.changes > 0;
}

export function getUserStats(userId: number): { commentCount: number; bookmarkCount: number; joinDate: string } {
  const db = getDb();
  const commentCount = (db.prepare('SELECT COUNT(*) as count FROM comments WHERE user_id = ?').get(userId) as { count: number }).count;
  const bookmarkCount = (db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?').get(userId) as { count: number }).count;
  const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId) as { created_at: string } | undefined;
  return {
    commentCount,
    bookmarkCount,
    joinDate: user?.created_at || ''
  };
}

// ============ NEWS FUNCTIONS ============

export interface NewsItem {
  id: number;
  title: string;
  title_zh: string | null;
  title_ms: string | null;
  source_url: string;
  source_name: string;
  published_at: string | null;
  clicks: number;
  comment_count: number;
  summary_views: number;
  tts_listens: number;
  created_at: string;
  category: string;
  score?: number;
}

export const NEWS_CATEGORIES = [
  'all',
  'general',
  'politics',
  'economy',
  'sports',
  'crime',
  'environment',
  'culture',
  'education',
  'health',
  'infrastructure',
  'tourism'
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number];

function calculateScore(clicks: number, commentCount: number, createdAt: string): number {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const hoursAgo = (now - created) / (1000 * 60 * 60);

  // Time decay: newer articles get much higher base score
  // Articles less than 1 hour old get 1000 bonus
  // Articles 1-6 hours old get 500 bonus
  // Articles 6-24 hours old get 100 bonus
  // Older articles get minimal time bonus
  let timeBonus = 0;
  if (hoursAgo < 1) timeBonus = 1000;
  else if (hoursAgo < 6) timeBonus = 500;
  else if (hoursAgo < 24) timeBonus = 100;
  else if (hoursAgo < 72) timeBonus = 10;

  // Engagement adds to score but doesn't override time
  const engagement = clicks + (commentCount * 3);

  // Final score: time bonus + engagement, with time decay
  return timeBonus + engagement / Math.pow(hoursAgo + 1, 0.5);
}

export function getAllNews(page: number = 1, limit: number = 20, category?: string): { news: NewsItem[]; total: number; totalPages: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  // Build query based on category filter
  const whereClause = category && category !== 'all' ? 'WHERE category = ?' : '';
  const params = category && category !== 'all' ? [category] : [];

  // Get total count
  const totalResult = db.prepare(`SELECT COUNT(*) as count FROM news ${whereClause}`).get(...params) as { count: number };
  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  // Get paginated news
  const news = db.prepare(`
    SELECT * FROM news ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as NewsItem[];

  // Calculate scores and sort by ranking
  const rankedNews = news
    .map(item => ({
      ...item,
      score: calculateScore(item.clicks, item.comment_count || 0, item.created_at)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return { news: rankedNews, total, totalPages };
}

export function addNews(news: {
  title: string;
  title_zh?: string;
  title_ms?: string;
  source_url: string;
  source_name: string;
  published_at?: string;
  category?: string;
}): NewsItem | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO news (title, title_zh, title_ms, source_url, source_name, published_at, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      news.title,
      news.title_zh || null,
      news.title_ms || null,
      news.source_url,
      news.source_name,
      news.published_at || null,
      news.category || 'general'
    );
    return db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid) as NewsItem;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return null;
    }
    throw error;
  }
}

export function updateNewsTitles(id: number, titleZh: string, titleMs: string): void {
  const db = getDb();
  db.prepare('UPDATE news SET title_zh = ?, title_ms = ? WHERE id = ?').run(titleZh, titleMs, id);
}

export function getUntranslatedNews(limit: number = 100): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news
    WHERE title_zh IS NULL OR title_ms IS NULL
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as NewsItem[];
}

export function getUntranslatedCount(): number {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM news
    WHERE title_zh IS NULL OR title_ms IS NULL
  `).get() as { count: number };
  return result.count;
}

export function incrementClicks(id: number): NewsItem | null {
  const db = getDb();
  db.prepare('UPDATE news SET clicks = clicks + 1 WHERE id = ?').run(id);
  return db.prepare('SELECT * FROM news WHERE id = ?').get(id) as NewsItem | null;
}

export function incrementSummaryViews(id: number): void {
  const db = getDb();
  db.prepare('UPDATE news SET summary_views = summary_views + 1 WHERE id = ?').run(id);
}

export function incrementTtsListens(id: number): void {
  const db = getDb();
  db.prepare('UPDATE news SET tts_listens = tts_listens + 1 WHERE id = ?').run(id);
}

export function getNewsById(id: number): NewsItem | null {
  const db = getDb();
  return db.prepare('SELECT * FROM news WHERE id = ?').get(id) as NewsItem | null;
}

// Delete news older than specified days
export function deleteOldNews(days: number = 30): number {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // First delete related comments and likes
  const oldNewsIds = db.prepare(`
    SELECT id FROM news WHERE created_at < ?
  `).all(cutoffDate.toISOString()) as { id: number }[];

  let deleted = 0;
  for (const { id } of oldNewsIds) {
    db.prepare('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE news_id = ?)').run(id);
    db.prepare('DELETE FROM comments WHERE news_id = ?').run(id);
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
    deleted++;
  }

  return deleted;
}

// ============ COMMENT FUNCTIONS ============

export interface Comment {
  id: number;
  news_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  likes: number;
  created_at: string;
  is_flagged?: number;
  is_hidden?: number;
  flag_reason?: string | null;
  flagged_at?: string | null;
  moderation_note?: string | null;
  replies?: Comment[];
  author?: { id: number; display_name: string };
  user_liked?: boolean;
}

export function addComment(comment: {
  news_id: number;
  user_id: number;
  parent_id?: number | null;
  content: string;
}): Comment {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO comments (news_id, user_id, parent_id, content)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    comment.news_id,
    comment.user_id,
    comment.parent_id || null,
    comment.content
  );

  db.prepare('UPDATE news SET comment_count = comment_count + 1 WHERE id = ?').run(comment.news_id);

  return db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as Comment;
}

export function getCommentsByNewsId(newsId: number, currentUserId?: number): Comment[] {
  const db = getDb();

  // Get all non-hidden comments with user info
  const allComments = db.prepare(`
    SELECT c.*, u.display_name as author_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.news_id = ? AND (c.is_hidden = 0 OR c.is_hidden IS NULL)
    ORDER BY c.created_at ASC
  `).all(newsId) as (Comment & { author_name: string })[];

  // Get user's likes if logged in
  const userLikes = new Set<number>();
  if (currentUserId) {
    const likes = db.prepare(`
      SELECT comment_id FROM comment_likes WHERE user_id = ?
    `).all(currentUserId) as { comment_id: number }[];
    likes.forEach(l => userLikes.add(l.comment_id));
  }

  // Build nested structure
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  allComments.forEach(comment => {
    const formattedComment: Comment = {
      ...comment,
      replies: [],
      author: { id: comment.user_id, display_name: comment.author_name },
      user_liked: userLikes.has(comment.id)
    };
    commentMap.set(comment.id, formattedComment);
  });

  allComments.forEach(comment => {
    const formattedComment = commentMap.get(comment.id)!;
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies!.push(formattedComment);
      }
    } else {
      rootComments.push(formattedComment);
    }
  });

  return rootComments;
}

export interface UserComment {
  id: number;
  content: string;
  likes: number;
  created_at: string;
  news_id: number;
  news_title: string;
}

export function getCommentsByUserId(userId: number, page: number = 1, limit: number = 20): { comments: UserComment[]; total: number; totalPages: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM comments WHERE user_id = ?
  `).get(userId) as { count: number }).count;

  const comments = db.prepare(`
    SELECT c.id, c.content, c.likes, c.created_at, c.news_id, n.title as news_title
    FROM comments c
    JOIN news n ON c.news_id = n.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as UserComment[];

  return {
    comments,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export function likeComment(commentId: number, userId: number): { success: boolean; likes: number; userLiked: boolean } {
  const db = getDb();

  // Check if already liked
  const existingLike = db.prepare(`
    SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?
  `).get(commentId, userId);

  if (existingLike) {
    // Unlike
    db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').run(commentId, userId);
    db.prepare('UPDATE comments SET likes = likes - 1 WHERE id = ?').run(commentId);
    const comment = db.prepare('SELECT likes FROM comments WHERE id = ?').get(commentId) as { likes: number };
    return { success: true, likes: comment.likes, userLiked: false };
  } else {
    // Like
    db.prepare('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)').run(commentId, userId);
    db.prepare('UPDATE comments SET likes = likes + 1 WHERE id = ?').run(commentId);
    const comment = db.prepare('SELECT likes FROM comments WHERE id = ?').get(commentId) as { likes: number };
    return { success: true, likes: comment.likes, userLiked: true };
  }
}

export function clearAllNews(): void {
  const db = getDb();
  db.prepare('DELETE FROM comment_likes').run();
  db.prepare('DELETE FROM comments').run();
  db.prepare('DELETE FROM news').run();
}

// ============ SEARCH FUNCTION ============

export interface SearchFilters {
  category?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'date' | 'clicks';
}

export function searchNews(
  query: string,
  page: number = 1,
  limit: number = 20,
  filters?: SearchFilters
): { news: NewsItem[]; total: number; totalPages: number; sources: string[]; categories: string[] } {
  const db = getDb();
  const offset = (page - 1) * limit;
  const searchTerm = `%${query}%`;

  // Build WHERE clause
  const conditions: string[] = ['(title LIKE ? OR title_zh LIKE ? OR title_ms LIKE ? OR source_name LIKE ?)'];
  const params: (string | number)[] = [searchTerm, searchTerm, searchTerm, searchTerm];

  if (filters?.category && filters.category !== 'all') {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters?.source && filters.source !== 'all') {
    conditions.push('source_name = ?');
    params.push(filters.source);
  }
  if (filters?.dateFrom) {
    conditions.push('created_at >= ?');
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push('created_at <= ?');
    params.push(filters.dateTo);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const totalResult = db.prepare(`SELECT COUNT(*) as count FROM news WHERE ${whereClause}`).get(...params) as { count: number };
  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  // Determine sort order
  let orderBy = 'created_at DESC';
  if (filters?.sortBy === 'clicks') {
    orderBy = 'clicks DESC, created_at DESC';
  }

  // Get paginated results
  const news = db.prepare(`
    SELECT * FROM news WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as NewsItem[];

  // Calculate scores for relevance sorting
  const rankedNews = news.map(item => ({
    ...item,
    score: calculateScore(item.clicks, item.comment_count || 0, item.created_at)
  }));

  // Sort by relevance if requested
  if (filters?.sortBy === 'relevance' || !filters?.sortBy) {
    rankedNews.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // Get available sources and categories for filter dropdowns
  const sources = db.prepare('SELECT DISTINCT source_name FROM news ORDER BY source_name').all() as { source_name: string }[];
  const categories = db.prepare('SELECT DISTINCT category FROM news WHERE category IS NOT NULL ORDER BY category').all() as { category: string }[];

  return {
    news: rankedNews,
    total,
    totalPages,
    sources: sources.map(s => s.source_name),
    categories: categories.map(c => c.category)
  };
}

export function getSearchSuggestions(query: string, limit: number = 5): string[] {
  const db = getDb();
  const searchTerm = `%${query}%`;

  // Get matching titles (distinct keywords)
  const results = db.prepare(`
    SELECT DISTINCT title FROM news
    WHERE title LIKE ?
    ORDER BY clicks DESC
    LIMIT ?
  `).all(searchTerm, limit) as { title: string }[];

  return results.map(r => r.title);
}

// ============ BOOKMARK FUNCTIONS ============

export interface Bookmark {
  id: number;
  user_id: number;
  news_id: number;
  created_at: string;
  news?: NewsItem;
}

export function toggleBookmark(userId: number, newsId: number): { bookmarked: boolean } {
  const db = getDb();

  const existing = db.prepare(`
    SELECT id FROM bookmarks WHERE user_id = ? AND news_id = ?
  `).get(userId, newsId);

  if (existing) {
    db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND news_id = ?').run(userId, newsId);
    return { bookmarked: false };
  } else {
    db.prepare('INSERT INTO bookmarks (user_id, news_id) VALUES (?, ?)').run(userId, newsId);
    return { bookmarked: true };
  }
}

export function getUserBookmarks(userId: number): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT n.* FROM news n
    JOIN bookmarks b ON n.id = b.news_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId) as NewsItem[];
}

export function isBookmarked(userId: number, newsId: number): boolean {
  const db = getDb();
  const result = db.prepare(`
    SELECT id FROM bookmarks WHERE user_id = ? AND news_id = ?
  `).get(userId, newsId);
  return !!result;
}

// ============ ADMIN FUNCTIONS ============

export function isUserAdmin(userId: number): boolean {
  const db = getDb();
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as { is_admin: number } | undefined;
  return user?.is_admin === 1;
}

export function setUserAdmin(userId: number, isAdmin: boolean): void {
  const db = getDb();
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, userId);
}

export function getAllUsers(): User[] {
  const db = getDb();
  return db.prepare('SELECT id, username, email, display_name, created_at FROM users ORDER BY created_at DESC').all() as User[];
}

export function deleteComment(commentId: number): void {
  const db = getDb();
  const comment = db.prepare('SELECT news_id FROM comments WHERE id = ?').get(commentId) as { news_id: number } | undefined;
  if (comment) {
    const subtreeCount = (db.prepare(`
      WITH RECURSIVE subtree(id) AS (
        SELECT id FROM comments WHERE id = ?
        UNION ALL
        SELECT c.id FROM comments c
        JOIN subtree s ON c.parent_id = s.id
      )
      SELECT COUNT(*) as count FROM subtree
    `).get(commentId) as { count: number }).count;

    db.prepare('DELETE FROM comment_likes WHERE comment_id = ?').run(commentId);
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    db.prepare(`
      UPDATE news
      SET comment_count = CASE
        WHEN comment_count > ? THEN comment_count - ?
        ELSE 0
      END
      WHERE id = ?
    `).run(subtreeCount, subtreeCount, comment.news_id);
  }
}

export function deleteNews(newsId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM bookmarks WHERE news_id = ?').run(newsId);
  db.prepare('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE news_id = ?)').run(newsId);
  db.prepare('DELETE FROM comments WHERE news_id = ?').run(newsId);
  db.prepare('DELETE FROM news WHERE id = ?').run(newsId);
}

export function getStats(): { totalNews: number; totalUsers: number; totalComments: number; bannedUsers: number } {
  const db = getDb();
  const news = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number };
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const comments = db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number };
  const banned = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get() as { count: number };
  return {
    totalNews: news.count,
    totalUsers: users.count,
    totalComments: comments.count,
    bannedUsers: banned.count
  };
}

// Delete user and all their data
export function deleteUser(userId: number): boolean {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return false;

  // Delete user's comment likes
  db.prepare('DELETE FROM comment_likes WHERE user_id = ?').run(userId);
  // Update comment counts and delete user's comments
  const userComments = db.prepare('SELECT id, news_id FROM comments WHERE user_id = ?').all(userId) as { id: number; news_id: number }[];
  for (const comment of userComments) {
    db.prepare('DELETE FROM comment_likes WHERE comment_id = ?').run(comment.id);
    db.prepare('UPDATE news SET comment_count = comment_count - 1 WHERE id = ?').run(comment.news_id);
  }
  db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
  // Delete bookmarks
  db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(userId);
  // Delete user
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  return true;
}

// Get all users with admin status and ban fields
export function getAllUsersWithAdmin(): (User & { is_admin: number; is_banned: number; banned_reason: string | null; banned_at: string | null })[] {
  const db = getDb();
  return db.prepare('SELECT id, username, email, display_name, is_admin, is_banned, banned_reason, banned_at, created_at FROM users ORDER BY created_at DESC').all() as (User & { is_admin: number; is_banned: number; banned_reason: string | null; banned_at: string | null })[];
}

// Get all comments for moderation (with user and news info)
export interface CommentWithDetails {
  id: number;
  news_id: number;
  user_id: number;
  content: string;
  likes: number;
  created_at: string;
  author_name: string;
  news_title: string;
  is_flagged: number;
  is_hidden: number;
  flag_reason: string | null;
  flagged_at: string | null;
  moderation_note: string | null;
}

export function getAllCommentsForAdmin(
  page: number = 1,
  limit: number = 20,
  filter?: 'all' | 'flagged' | 'hidden'
): { comments: CommentWithDetails[]; total: number; totalPages: number; flaggedCount: number; hiddenCount: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  // Build WHERE clause based on filter
  let whereClause = '';
  if (filter === 'flagged') {
    whereClause = 'WHERE c.is_flagged = 1';
  } else if (filter === 'hidden') {
    whereClause = 'WHERE c.is_hidden = 1';
  }

  const totalResult = db.prepare(`SELECT COUNT(*) as count FROM comments c ${whereClause}`).get() as { count: number };
  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  const comments = db.prepare(`
    SELECT c.id, c.news_id, c.user_id, c.content, c.likes, c.created_at,
           c.is_flagged, c.is_hidden, c.flag_reason, c.flagged_at, c.moderation_note,
           u.display_name as author_name, n.title as news_title
    FROM comments c
    JOIN users u ON c.user_id = u.id
    JOIN news n ON c.news_id = n.id
    ${whereClause}
    ORDER BY c.is_flagged DESC, c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as CommentWithDetails[];

  // Get counts for badges
  const flaggedCount = (db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_flagged = 1').get() as { count: number }).count;
  const hiddenCount = (db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_hidden = 1').get() as { count: number }).count;

  return { comments, total, totalPages, flaggedCount, hiddenCount };
}

// Get news for admin with search and filters
export function getNewsForAdmin(
  page: number = 1,
  limit: number = 20,
  search?: string,
  source?: string,
  category?: string
): { news: NewsItem[]; total: number; totalPages: number; sources: string[]; categories: string[] } {
  const db = getDb();
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(title LIKE ? OR title_zh LIKE ? OR title_ms LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  if (source && source !== 'all') {
    conditions.push('source_name = ?');
    params.push(source);
  }
  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const totalResult = db.prepare(`SELECT COUNT(*) as count FROM news ${whereClause}`).get(...params) as { count: number };
  const total = totalResult.count;
  const totalPages = Math.ceil(total / limit);

  // Get paginated news
  const news = db.prepare(`
    SELECT * FROM news ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as NewsItem[];

  // Get unique sources and categories for filters
  const sources = db.prepare('SELECT DISTINCT source_name FROM news ORDER BY source_name').all() as { source_name: string }[];
  const categories = db.prepare('SELECT DISTINCT category FROM news WHERE category IS NOT NULL ORDER BY category').all() as { category: string }[];

  return {
    news,
    total,
    totalPages,
    sources: sources.map(s => s.source_name),
    categories: categories.map(c => c.category)
  };
}

// Bulk delete old news
export function bulkDeleteOldNews(days: number): number {
  const db = getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString();

  // Get IDs of old news
  const oldNews = db.prepare('SELECT id FROM news WHERE created_at < ?').all(cutoffStr) as { id: number }[];

  let deleted = 0;
  for (const { id } of oldNews) {
    deleteNews(id);
    deleted++;
  }

  return deleted;
}

// Analytics: Get daily stats for the last N days
export interface DailyStats {
  date: string;
  news_count: number;
  comment_count: number;
  click_count: number;
}

export function getDailyStats(days: number = 7): DailyStats[] {
  const db = getDb();
  const stats: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const newsCount = db.prepare(`
      SELECT COUNT(*) as count FROM news
      WHERE date(created_at) = ?
    `).get(dateStr) as { count: number };

    const commentCount = db.prepare(`
      SELECT COUNT(*) as count FROM comments
      WHERE date(created_at) = ?
    `).get(dateStr) as { count: number };

    const clickCount = db.prepare(`
      SELECT COALESCE(SUM(clicks), 0) as count FROM news
      WHERE date(created_at) = ?
    `).get(dateStr) as { count: number };

    stats.push({
      date: dateStr,
      news_count: newsCount.count,
      comment_count: commentCount.count,
      click_count: clickCount.count
    });
  }

  return stats;
}

// Get top news by clicks
export function getTopNews(limit: number = 10): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news ORDER BY clicks DESC LIMIT ?
  `).all(limit) as NewsItem[];
}

// Get top sources by article count
export function getTopSources(): { source_name: string; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT source_name, COUNT(*) as count
    FROM news
    GROUP BY source_name
    ORDER BY count DESC
  `).all() as { source_name: string; count: number }[];
}

// Get news count by category
export function getCategoryStats(): { category: string; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT COALESCE(category, 'general') as category, COUNT(*) as count
    FROM news
    GROUP BY COALESCE(category, 'general')
    ORDER BY count DESC
  `).all() as { category: string; count: number }[];
}

// ============ ERROR LOG FUNCTIONS ============

export type ErrorLevel = 'error' | 'warning' | 'info';
export type ErrorType = 'api' | 'database' | 'auth' | 'rss' | 'validation' | 'other';

export interface ErrorLog {
  id: number;
  level: ErrorLevel;
  type: ErrorType;
  message: string;
  stack_trace: string | null;
  endpoint: string | null;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  request_body: string | null;
  resolved: number;
  created_at: string;
}

export interface ErrorLogInput {
  level: ErrorLevel;
  type: ErrorType;
  message: string;
  stackTrace?: string;
  endpoint?: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: string;
}

export function addErrorLog(error: ErrorLogInput): ErrorLog {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO error_logs (level, type, message, stack_trace, endpoint, user_id, ip_address, user_agent, request_body)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    error.level,
    error.type,
    error.message,
    error.stackTrace || null,
    error.endpoint || null,
    error.userId || null,
    error.ipAddress || null,
    error.userAgent || null,
    error.requestBody || null
  );
  return db.prepare('SELECT * FROM error_logs WHERE id = ?').get(result.lastInsertRowid) as ErrorLog;
}

export function getErrorLogs(
  page: number = 1,
  limit: number = 20,
  filters?: {
    level?: ErrorLevel;
    type?: ErrorType;
    resolved?: boolean;
    startDate?: string;
    endDate?: string;
  }
): { errors: ErrorLog[]; total: number; totalPages: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (filters?.level) {
    whereClause += ' AND level = ?';
    params.push(filters.level);
  }
  if (filters?.type) {
    whereClause += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters?.resolved !== undefined) {
    whereClause += ' AND resolved = ?';
    params.push(filters.resolved ? 1 : 0);
  }
  if (filters?.startDate) {
    whereClause += ' AND created_at >= ?';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    whereClause += ' AND created_at <= ?';
    params.push(filters.endDate);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM error_logs WHERE ${whereClause}`).get(...params) as { count: number }).count;
  const errors = db.prepare(`
    SELECT * FROM error_logs WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ErrorLog[];

  return {
    errors,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export function getErrorStats(): {
  totalErrors: number;
  unresolvedErrors: number;
  todayErrors: number;
  errorsByLevel: { level: string; count: number }[];
  errorsByType: { type: string; count: number }[];
} {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const totalErrors = (db.prepare('SELECT COUNT(*) as count FROM error_logs').get() as { count: number }).count;
  const unresolvedErrors = (db.prepare('SELECT COUNT(*) as count FROM error_logs WHERE resolved = 0').get() as { count: number }).count;
  const todayErrors = (db.prepare(`SELECT COUNT(*) as count FROM error_logs WHERE date(created_at) = ?`).get(today) as { count: number }).count;

  const errorsByLevel = db.prepare(`
    SELECT level, COUNT(*) as count FROM error_logs GROUP BY level ORDER BY count DESC
  `).all() as { level: string; count: number }[];

  const errorsByType = db.prepare(`
    SELECT type, COUNT(*) as count FROM error_logs GROUP BY type ORDER BY count DESC
  `).all() as { type: string; count: number }[];

  return { totalErrors, unresolvedErrors, todayErrors, errorsByLevel, errorsByType };
}

export function getErrorsByDay(days: number = 7): { date: string; count: number; errors: number; warnings: number; info: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as errors,
      SUM(CASE WHEN level = 'warning' THEN 1 ELSE 0 END) as warnings,
      SUM(CASE WHEN level = 'info' THEN 1 ELSE 0 END) as info
    FROM error_logs
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).all(days) as { date: string; count: number; errors: number; warnings: number; info: number }[];
}

export function resolveError(id: number): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE error_logs SET resolved = 1 WHERE id = ?').run(id);
  return result.changes > 0;
}

export function unresolveError(id: number): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE error_logs SET resolved = 0 WHERE id = ?').run(id);
  return result.changes > 0;
}

export function deleteErrorLog(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM error_logs WHERE id = ?').run(id);
  return result.changes > 0;
}

export function bulkDeleteOldErrors(days: number): number {
  const db = getDb();
  const result = db.prepare(`DELETE FROM error_logs WHERE created_at < datetime('now', '-' || ? || ' days')`).run(days);
  return result.changes;
}

export function clearResolvedErrors(): number {
  const db = getDb();
  const result = db.prepare('DELETE FROM error_logs WHERE resolved = 1').run();
  return result.changes;
}

export function getUnresolvedErrorCount(): number {
  const db = getDb();
  return (db.prepare('SELECT COUNT(*) as count FROM error_logs WHERE resolved = 0').get() as { count: number }).count;
}

export function getLatestErrorId(): number | null {
  const db = getDb();
  const result = db.prepare('SELECT MAX(id) as id FROM error_logs').get() as { id: number | null };
  return result.id;
}

// ============ USER PREFERENCES FUNCTIONS ============

export interface UserPreferences {
  language: 'en' | 'zh' | 'ms';
  theme: 'light' | 'dark';
}

export function getUserPreferences(userId: number): UserPreferences | null {
  const db = getDb();
  const result = db.prepare(`
    SELECT language, theme FROM user_preferences WHERE user_id = ?
  `).get(userId) as { language: string; theme: string } | undefined;

  if (!result) return null;

  return {
    language: result.language as 'en' | 'zh' | 'ms',
    theme: result.theme as 'light' | 'dark'
  };
}

export function setUserPreferences(userId: number, prefs: Partial<UserPreferences>): boolean {
  const db = getDb();

  // Check if preferences exist
  const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(userId);

  if (existing) {
    // Update existing preferences
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (prefs.language) {
      updates.push('language = ?');
      values.push(prefs.language);
    }
    if (prefs.theme) {
      updates.push('theme = ?');
      values.push(prefs.theme);
    }

    if (updates.length === 0) return true;

    updates.push("updated_at = datetime('now')");
    values.push(userId);

    const result = db.prepare(`
      UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?
    `).run(...values);

    return result.changes > 0;
  } else {
    // Insert new preferences
    const result = db.prepare(`
      INSERT INTO user_preferences (user_id, language, theme)
      VALUES (?, ?, ?)
    `).run(userId, prefs.language || 'en', prefs.theme || 'light');

    return result.changes > 0;
  }
}

export function setUserLanguage(userId: number, language: 'en' | 'zh' | 'ms'): boolean {
  return setUserPreferences(userId, { language });
}

export function setUserTheme(userId: number, theme: 'light' | 'dark'): boolean {
  return setUserPreferences(userId, { theme });
}

// ============ RSS FEED FUNCTIONS ============

export interface RssFeed {
  id: number;
  name: string;
  url: string;
  is_active: number;
  is_sarawak_source: number;
  last_fetched_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string;
}

export function getAllRssFeeds(): RssFeed[] {
  const db = getDb();
  return db.prepare('SELECT * FROM rss_feeds ORDER BY name ASC').all() as RssFeed[];
}

export function getActiveRssFeeds(): RssFeed[] {
  const db = getDb();
  return db.prepare('SELECT * FROM rss_feeds WHERE is_active = 1 ORDER BY name ASC').all() as RssFeed[];
}

export function getRssFeedById(id: number): RssFeed | null {
  const db = getDb();
  return db.prepare('SELECT * FROM rss_feeds WHERE id = ?').get(id) as RssFeed | null;
}

export function addRssFeed(feed: { name: string; url: string; is_sarawak_source?: boolean }): RssFeed | null {
  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO rss_feeds (name, url, is_sarawak_source)
      VALUES (?, ?, ?)
    `).run(feed.name, feed.url, feed.is_sarawak_source ? 1 : 0);
    return db.prepare('SELECT * FROM rss_feeds WHERE id = ?').get(result.lastInsertRowid) as RssFeed;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return null;
    }
    throw error;
  }
}

export function updateRssFeed(id: number, updates: { name?: string; url?: string; is_active?: boolean; is_sarawak_source?: boolean }): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  if (updates.is_sarawak_source !== undefined) {
    fields.push('is_sarawak_source = ?');
    values.push(updates.is_sarawak_source ? 1 : 0);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = db.prepare(`UPDATE rss_feeds SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteRssFeed(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM rss_feeds WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateRssFeedStatus(id: number, success: boolean, error?: string): void {
  const db = getDb();
  if (success) {
    db.prepare(`
      UPDATE rss_feeds
      SET last_fetched_at = CURRENT_TIMESTAMP, error_count = 0, last_error = NULL
      WHERE id = ?
    `).run(id);
  } else {
    db.prepare(`
      UPDATE rss_feeds
      SET error_count = error_count + 1, last_error = ?
      WHERE id = ?
    `).run(error || 'Unknown error', id);
  }
}

export function toggleRssFeed(id: number): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE rss_feeds SET is_active = NOT is_active WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============ COMMENT MODERATION FUNCTIONS ============

export function flagComment(commentId: number, reason: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE comments
    SET is_flagged = 1, flag_reason = ?, flagged_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason, commentId);
  return result.changes > 0;
}

export function unflagComment(commentId: number): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE comments
    SET is_flagged = 0, flag_reason = NULL, flagged_at = NULL
    WHERE id = ?
  `).run(commentId);
  return result.changes > 0;
}

export function hideComment(commentId: number, note?: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE comments
    SET is_hidden = 1, moderation_note = COALESCE(?, moderation_note)
    WHERE id = ?
  `).run(note || null, commentId);
  return result.changes > 0;
}

export function unhideComment(commentId: number): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE comments
    SET is_hidden = 0
    WHERE id = ?
  `).run(commentId);
  return result.changes > 0;
}

export function addModerationNote(commentId: number, note: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE comments SET moderation_note = ? WHERE id = ?
  `).run(note, commentId);
  return result.changes > 0;
}

export function getCommentModerationStats(): { totalComments: number; flaggedComments: number; hiddenComments: number } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM comments').get() as { count: number }).count;
  const flagged = (db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_flagged = 1').get() as { count: number }).count;
  const hidden = (db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_hidden = 1').get() as { count: number }).count;
  return { totalComments: total, flaggedComments: flagged, hiddenComments: hidden };
}

// ============ SUBSCRIPTION FUNCTIONS ============

export interface Subscription {
  id: number;
  user_id: number;
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled';
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentSubmission {
  id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  proof_description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

export function getUserSubscription(userId: number): Subscription | null {
  const db = getDb();
  const subscription = db.prepare(`SELECT * FROM subscriptions WHERE user_id = ?`).get(userId) as Subscription | undefined;

  if (!subscription) {
    // Check if user exists before inserting (foreign key constraint)
    const userExists = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
    if (!userExists) {
      // Return default free subscription without persisting
      return { user_id: userId, plan: 'free', status: 'active' } as Subscription;
    }
    db.prepare(`INSERT INTO subscriptions (user_id, plan, status) VALUES (?, 'free', 'active')`).run(userId);
    return db.prepare(`SELECT * FROM subscriptions WHERE user_id = ?`).get(userId) as Subscription;
  }

  if (subscription.plan === 'premium' && subscription.expires_at) {
    const expiresAt = new Date(subscription.expires_at);
    if (expiresAt < new Date()) {
      db.prepare(`UPDATE subscriptions SET plan = 'free', status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(userId);
      return db.prepare(`SELECT * FROM subscriptions WHERE user_id = ?`).get(userId) as Subscription;
    }
  }

  return subscription;
}

export function isPremiumUser(userId: number): boolean {
  const subscription = getUserSubscription(userId);
  return subscription?.plan === 'premium' && subscription?.status === 'active';
}

export function submitPayment(data: {
  userId: number;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  proofDescription?: string;
}): number | null {
  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO payment_submissions (user_id, amount, payment_method, reference_number, proof_description)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.userId, data.amount, data.paymentMethod, data.referenceNumber || null, data.proofDescription || null);
    return result.lastInsertRowid as number;
  } catch {
    return null;
  }
}

export function getUserPayments(userId: number): PaymentSubmission[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM payment_submissions WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as PaymentSubmission[];
}

export function getPendingPayments(): (PaymentSubmission & { username: string; email: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT ps.*, u.username, u.email
    FROM payment_submissions ps
    JOIN users u ON ps.user_id = u.id
    WHERE ps.status = 'pending'
    ORDER BY ps.created_at ASC
  `).all() as (PaymentSubmission & { username: string; email: string })[];
}

export function getAllPayments(page: number = 1, limit: number = 20, status?: string): {
  payments: (PaymentSubmission & { username: string; email: string })[];
  total: number;
  totalPages: number;
} {
  const db = getDb();
  const offset = (page - 1) * limit;
  const whereClause = status && status !== 'all' ? 'WHERE ps.status = ?' : '';
  const params: string[] = status && status !== 'all' ? [status] : [];
  const total = (db.prepare(`SELECT COUNT(*) as count FROM payment_submissions ps ${whereClause}`).get(...params) as { count: number }).count;
  const payments = db.prepare(`
    SELECT ps.*, u.username, u.email
    FROM payment_submissions ps
    JOIN users u ON ps.user_id = u.id
    ${whereClause}
    ORDER BY ps.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as (PaymentSubmission & { username: string; email: string })[];
  return { payments, total, totalPages: Math.ceil(total / limit) };
}

export function approvePayment(paymentId: number, adminId: number, months: number = 1): boolean {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payment_submissions WHERE id = ?').get(paymentId) as PaymentSubmission | undefined;
  if (!payment || payment.status !== 'pending') return false;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const currentSub = getUserSubscription(payment.user_id);
  let newExpiresAt = expiresAt;

  if (currentSub?.plan === 'premium' && currentSub.expires_at) {
    const currentExpiry = new Date(currentSub.expires_at);
    if (currentExpiry > new Date()) {
      newExpiresAt = new Date(currentExpiry);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + months);
    }
  }

  db.prepare(`UPDATE payment_submissions SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(adminId, paymentId);

  db.prepare(`
    INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, updated_at)
    VALUES (?, 'premium', 'active', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      plan = 'premium', status = 'active',
      started_at = COALESCE(subscriptions.started_at, CURRENT_TIMESTAMP),
      expires_at = ?, updated_at = CURRENT_TIMESTAMP
  `).run(payment.user_id, newExpiresAt.toISOString(), newExpiresAt.toISOString());

  return true;
}

export function rejectPayment(paymentId: number, adminId: number, note?: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE payment_submissions SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'pending'
  `).run(note || null, adminId, paymentId);
  return result.changes > 0;
}

export function getSubscriptionStats(): { totalPremium: number; totalFree: number; pendingPayments: number; revenueThisMonth: number } {
  const db = getDb();
  const totalPremium = (db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE plan = 'premium' AND status = 'active'").get() as { count: number }).count;
  const totalFree = (db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE plan = 'free'").get() as { count: number }).count;
  const pendingPayments = (db.prepare("SELECT COUNT(*) as count FROM payment_submissions WHERE status = 'pending'").get() as { count: number }).count;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const revenue = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payment_submissions WHERE status = 'approved' AND reviewed_at >= ?`).get(startOfMonth.toISOString()) as { total: number };
  return { totalPremium, totalFree, pendingPayments, revenueThisMonth: revenue.total };
}

// ============ NEWS SUMMARY FUNCTIONS (Premium Feature) ============

export interface NewsSummary {
  id: number;
  news_id: number;
  summary_en: string | null;
  summary_zh: string | null;
  summary_ms: string | null;
  audio_url_male: string | null;
  audio_url_female: string | null;
  image_url: string | null;
  created_at: string;
}

export function getNewsSummary(newsId: number): NewsSummary | null {
  const db = getDb();
  return db.prepare('SELECT * FROM news_summaries WHERE news_id = ?').get(newsId) as NewsSummary | null;
}

// ============ USER FEEDBACK FUNCTIONS ============

export interface UserFeedback {
  id: number;
  user_id: number;
  type: string;
  summary_rating: string | null;
  voice_rating: string | null;
  wants_premium: number | null;
  additional_feedback: string | null;
  created_at: string;
}

export function saveFeedback(data: {
  userId: number;
  type: string;
  summaryRating?: string;
  voiceRating?: string;
  wantsPremium?: boolean;
  additionalFeedback?: string;
}): boolean {
  const db = getDb();

  // Create feedback table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      summary_rating TEXT,
      voice_rating TEXT,
      wants_premium INTEGER,
      additional_feedback TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    db.prepare(`
      INSERT INTO user_feedback (user_id, type, summary_rating, voice_rating, wants_premium, additional_feedback)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.userId,
      data.type,
      data.summaryRating || null,
      data.voiceRating || null,
      data.wantsPremium !== undefined ? (data.wantsPremium ? 1 : 0) : null,
      data.additionalFeedback || null
    );
    return true;
  } catch {
    return false;
  }
}

export function getAllFeedback(): (UserFeedback & { username: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT f.*, u.username
    FROM user_feedback f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `).all() as (UserFeedback & { username: string })[];
}

// ============ AUDIT LOG FUNCTIONS ============

export interface AuditLogEntry {
  id: number;
  admin_id: number | null;
  admin_username: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export function addAuditLog(entry: {
  adminId?: number;
  adminUsername?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO admin_audit_log (admin_id, admin_username, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.adminId || null,
    entry.adminUsername || null,
    entry.action,
    entry.targetType || null,
    entry.targetId || null,
    entry.details || null,
    entry.ipAddress || null
  );
}

export function getAuditLogs(
  page: number = 1,
  limit: number = 20,
  actionFilter?: string
): { logs: AuditLogEntry[]; total: number; totalPages: number } {
  const db = getDb();
  const offset = (page - 1) * limit;

  const whereClause = actionFilter && actionFilter !== 'all' ? 'WHERE action = ?' : '';
  const params = actionFilter && actionFilter !== 'all' ? [actionFilter] : [];

  const total = (db.prepare(`SELECT COUNT(*) as count FROM admin_audit_log ${whereClause}`).get(...params) as { count: number }).count;
  const logs = db.prepare(`
    SELECT * FROM admin_audit_log ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as AuditLogEntry[];

  return { logs, total, totalPages: Math.ceil(total / limit) };
}

export function getAuditLogActions(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT action FROM admin_audit_log ORDER BY action').all() as { action: string }[];
  return rows.map(r => r.action);
}

// ============ SEARCH LOG FUNCTIONS ============

export function logSearch(data: {
  query: string;
  userId?: number;
  resultsCount: number;
  categoryFilter?: string;
  sourceFilter?: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO search_logs (query, user_id, results_count, category_filter, source_filter)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    data.query,
    data.userId || null,
    data.resultsCount,
    data.categoryFilter || null,
    data.sourceFilter || null
  );
}

export function getSearchAnalytics(): {
  topQueries: { query: string; count: number; avg_results: number }[];
  zeroResultQueries: { query: string; count: number }[];
  volumeOverTime: { date: string; count: number }[];
} {
  const db = getDb();

  const topQueries = db.prepare(`
    SELECT query, COUNT(*) as count, ROUND(AVG(results_count), 1) as avg_results
    FROM search_logs
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY LOWER(query)
    ORDER BY count DESC
    LIMIT 20
  `).all() as { query: string; count: number; avg_results: number }[];

  const zeroResultQueries = db.prepare(`
    SELECT query, COUNT(*) as count
    FROM search_logs
    WHERE results_count = 0 AND created_at >= datetime('now', '-30 days')
    GROUP BY LOWER(query)
    ORDER BY count DESC
    LIMIT 20
  `).all() as { query: string; count: number }[];

  const volumeOverTime = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM search_logs
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all() as { date: string; count: number }[];

  return { topQueries, zeroResultQueries, volumeOverTime };
}

// ============ FEED HEALTH FUNCTIONS ============

export function getFeedHealthStatus(): {
  staleFeeds: { id: number; name: string; last_fetched_at: string | null; hours_since_fetch: number }[];
  errorFeeds: { id: number; name: string; error_count: number; last_error: string | null }[];
  healthy: boolean;
} {
  const db = getDb();

  // Feeds not fetched in >24 hours
  const staleFeeds = db.prepare(`
    SELECT id, name, last_fetched_at,
      ROUND((julianday('now') - julianday(COALESCE(last_fetched_at, created_at))) * 24, 1) as hours_since_fetch
    FROM rss_feeds
    WHERE is_active = 1
    AND (last_fetched_at IS NULL OR last_fetched_at < datetime('now', '-24 hours'))
  `).all() as { id: number; name: string; last_fetched_at: string | null; hours_since_fetch: number }[];

  // Feeds with >= 3 consecutive errors
  const errorFeeds = db.prepare(`
    SELECT id, name, error_count, last_error
    FROM rss_feeds
    WHERE is_active = 1 AND error_count >= 3
  `).all() as { id: number; name: string; error_count: number; last_error: string | null }[];

  return {
    staleFeeds,
    errorFeeds,
    healthy: staleFeeds.length === 0 && errorFeeds.length === 0
  };
}

// ============ CONTENT ANALYTICS FUNCTIONS ============

export function getSourcePerformance(): { source_name: string; article_count: number; total_clicks: number; avg_clicks: number; total_comments: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT source_name,
      COUNT(*) as article_count,
      COALESCE(SUM(clicks), 0) as total_clicks,
      ROUND(COALESCE(AVG(clicks), 0), 1) as avg_clicks,
      COALESCE(SUM(comment_count), 0) as total_comments
    FROM news
    GROUP BY source_name
    ORDER BY avg_clicks DESC
  `).all() as { source_name: string; article_count: number; total_clicks: number; avg_clicks: number; total_comments: number }[];
}

export function getCategoryEngagement(): { category: string; article_count: number; total_clicks: number; total_comments: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT COALESCE(category, 'general') as category,
      COUNT(*) as article_count,
      COALESCE(SUM(clicks), 0) as total_clicks,
      COALESCE(SUM(comment_count), 0) as total_comments
    FROM news
    GROUP BY COALESCE(category, 'general')
    ORDER BY total_clicks DESC
  `).all() as { category: string; article_count: number; total_clicks: number; total_comments: number }[];
}

export function getTranslationStats(): { total: number; translated_zh: number; translated_ms: number; both_translated: number; coverage_pct: number } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number }).count;
  const zh = (db.prepare('SELECT COUNT(*) as count FROM news WHERE title_zh IS NOT NULL').get() as { count: number }).count;
  const ms = (db.prepare('SELECT COUNT(*) as count FROM news WHERE title_ms IS NOT NULL').get() as { count: number }).count;
  const both = (db.prepare('SELECT COUNT(*) as count FROM news WHERE title_zh IS NOT NULL AND title_ms IS NOT NULL').get() as { count: number }).count;

  return {
    total,
    translated_zh: zh,
    translated_ms: ms,
    both_translated: both,
    coverage_pct: total > 0 ? Math.round((both / total) * 100) : 0
  };
}

export function getArticleAgeStats(): { today: number; this_week: number; this_month: number; older: number } {
  const db = getDb();
  const today = (db.prepare("SELECT COUNT(*) as count FROM news WHERE date(created_at) = date('now')").get() as { count: number }).count;
  const thisWeek = (db.prepare("SELECT COUNT(*) as count FROM news WHERE created_at >= datetime('now', '-7 days')").get() as { count: number }).count;
  const thisMonth = (db.prepare("SELECT COUNT(*) as count FROM news WHERE created_at >= datetime('now', '-30 days')").get() as { count: number }).count;
  const total = (db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number }).count;

  return {
    today,
    this_week: thisWeek,
    this_month: thisMonth,
    older: total - thisMonth
  };
}

// ============ USER ANALYTICS FUNCTIONS ============

export function getUserEngagementMetrics(): {
  dau: number;
  wau: number;
  mau: number;
  topUsers: { id: number; username: string; display_name: string; comments: number; likes_given: number }[];
  peakHours: { hour: number; activity_count: number }[];
  userGrowth: { date: string; new_users: number }[];
} {
  const db = getDb();

  // DAU: users with comments or likes today
  const dau = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM (
      SELECT user_id FROM comments WHERE date(created_at) = date('now')
      UNION
      SELECT user_id FROM comment_likes WHERE date(created_at) = date('now')
      UNION
      SELECT user_id FROM bookmarks WHERE date(created_at) = date('now')
    )
  `).get() as { count: number }).count;

  // WAU: active in last 7 days
  const wau = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM (
      SELECT user_id FROM comments WHERE created_at >= datetime('now', '-7 days')
      UNION
      SELECT user_id FROM comment_likes WHERE created_at >= datetime('now', '-7 days')
      UNION
      SELECT user_id FROM bookmarks WHERE created_at >= datetime('now', '-7 days')
    )
  `).get() as { count: number }).count;

  // MAU: active in last 30 days
  const mau = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM (
      SELECT user_id FROM comments WHERE created_at >= datetime('now', '-30 days')
      UNION
      SELECT user_id FROM comment_likes WHERE created_at >= datetime('now', '-30 days')
      UNION
      SELECT user_id FROM bookmarks WHERE created_at >= datetime('now', '-30 days')
    )
  `).get() as { count: number }).count;

  // Top active users (by comment count + likes given)
  const topUsers = db.prepare(`
    SELECT u.id, u.username, u.display_name,
      (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comments,
      (SELECT COUNT(*) FROM comment_likes WHERE user_id = u.id) as likes_given
    FROM users u
    WHERE u.is_banned = 0 OR u.is_banned IS NULL
    ORDER BY comments + likes_given DESC
    LIMIT 10
  `).all() as { id: number; username: string; display_name: string; comments: number; likes_given: number }[];

  // Peak activity hours (from comments in last 30 days)
  const peakHours = db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as activity_count
    FROM comments
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY hour
    ORDER BY hour
  `).all() as { hour: number; activity_count: number }[];

  // User growth over 30 days
  const userGrowth = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as new_users
    FROM users
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all() as { date: string; new_users: number }[];

  return { dau, wau, mau, topUsers, peakHours, userGrowth };
}

// ============ BAN FUNCTIONS ============

export function banUser(userId: number, reason: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE users SET is_banned = 1, banned_reason = ?, banned_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(reason, userId);
  return result.changes > 0;
}

export function unbanUser(userId: number): boolean {
  const db = getDb();
  const result = db.prepare(`
    UPDATE users SET is_banned = 0, banned_reason = NULL, banned_at = NULL WHERE id = ?
  `).run(userId);
  return result.changes > 0;
}

export function isUserBanned(userId: number): boolean {
  const db = getDb();
  const user = db.prepare('SELECT is_banned FROM users WHERE id = ?').get(userId) as { is_banned: number } | undefined;
  return user?.is_banned === 1;
}

export function getBannedUserCount(): number {
  const db = getDb();
  return (db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get() as { count: number }).count;
}

// ============ AUTO-MODERATION FUNCTIONS ============

export function checkCommentRateLimit(userId: number): boolean {
  const db = getDb();
  const limitStr = getMetadata('comment_rate_limit');
  const maxPerHour = limitStr ? parseInt(limitStr) : 10; // default 10/hr

  const count = (db.prepare(`
    SELECT COUNT(*) as count FROM comments
    WHERE user_id = ? AND created_at >= datetime('now', '-1 hour')
  `).get(userId) as { count: number }).count;

  return count >= maxPerHour; // true = rate limited
}

export function checkBannedWords(content: string): { flagged: boolean; matchedWord: string | null } {
  const wordsStr = getMetadata('banned_words');
  if (!wordsStr) return { flagged: false, matchedWord: null };

  const words = wordsStr.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  const lowerContent = content.toLowerCase();

  for (const word of words) {
    if (lowerContent.includes(word)) {
      return { flagged: true, matchedWord: word };
    }
  }
  return { flagged: false, matchedWord: null };
}

export function saveNewsSummary(newsId: number, data: Partial<Omit<NewsSummary, 'id' | 'news_id' | 'created_at'>>): boolean {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO news_summaries (news_id, summary_en, summary_zh, summary_ms, audio_url_male, audio_url_female, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(news_id) DO UPDATE SET
        summary_en = COALESCE(?, news_summaries.summary_en),
        summary_zh = COALESCE(?, news_summaries.summary_zh),
        summary_ms = COALESCE(?, news_summaries.summary_ms),
        audio_url_male = COALESCE(?, news_summaries.audio_url_male),
        audio_url_female = COALESCE(?, news_summaries.audio_url_female),
        image_url = COALESCE(?, news_summaries.image_url)
    `).run(
      newsId,
      data.summary_en || null, data.summary_zh || null, data.summary_ms || null,
      data.audio_url_male || null, data.audio_url_female || null, data.image_url || null,
      data.summary_en || null, data.summary_zh || null, data.summary_ms || null,
      data.audio_url_male || null, data.audio_url_female || null, data.image_url || null
    );
    return true;
  } catch {
    return false;
  }
}
