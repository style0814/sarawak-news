import { NextRequest, NextResponse } from 'next/server';
import { checkAdminSession, getAdminSession } from '@/lib/adminAuth';
import {
  getStats,
  getAllUsersWithAdmin,
  getNewsForAdmin,
  getAllCommentsForAdmin,
  getDailyStats,
  getTopNews,
  getTopSources,
  getCategoryStats,
  setUserAdmin,
  deleteUser,
  bulkDeleteOldNews,
  getErrorLogs,
  getErrorStats,
  getErrorsByDay,
  resolveError,
  unresolveError,
  deleteErrorLog,
  bulkDeleteOldErrors,
  clearResolvedErrors,
  getUnresolvedErrorCount,
  getLatestErrorId,
  getUntranslatedCount,
  getAllRssFeeds,
  addRssFeed,
  updateRssFeed,
  deleteRssFeed,
  toggleRssFeed,
  flagComment,
  unflagComment,
  hideComment,
  unhideComment,
  deleteComment,
  getCommentModerationStats,
  getAllPayments,
  getSubscriptionStats,
  approvePayment,
  rejectPayment,
  ErrorLevel,
  ErrorType,
  addAuditLog,
  getAuditLogs,
  getAuditLogActions,
  getSourcePerformance,
  getCategoryEngagement,
  getTranslationStats,
  getArticleAgeStats,
  getUserEngagementMetrics,
  getSearchAnalytics,
  getFeedHealthStatus,
  banUser,
  unbanUser,
  getMetadata,
  setMetadata
} from '@/lib/db';

// Get admin dashboard data
export async function GET(request: NextRequest) {
  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'dashboard';

  // Dashboard tab - overview stats
  if (tab === 'dashboard') {
    const stats = getStats();
    const dailyStats = getDailyStats(7);
    const topNews = getTopNews(5);
    const topSources = getTopSources();
    const categoryStats = getCategoryStats();
    const untranslatedCount = getUntranslatedCount();
    const feedHealth = getFeedHealthStatus();

    return NextResponse.json({
      stats,
      dailyStats,
      topNews,
      topSources,
      categoryStats,
      untranslatedCount,
      feedHealth
    });
  }

  // Users tab
  if (tab === 'users') {
    const users = getAllUsersWithAdmin();
    return NextResponse.json({ users });
  }

  // News tab
  if (tab === 'news') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || undefined;
    const source = searchParams.get('source') || undefined;
    const category = searchParams.get('category') || undefined;

    const result = getNewsForAdmin(page, 20, search, source, category);
    return NextResponse.json(result);
  }

  // Comments tab
  if (tab === 'comments') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'flagged' | 'hidden';
    const result = getAllCommentsForAdmin(page, 20, filter);
    const moderationStats = getCommentModerationStats();
    return NextResponse.json({ ...result, moderationStats });
  }

  // Errors tab
  if (tab === 'errors') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const level = searchParams.get('level') as ErrorLevel | null;
    const type = searchParams.get('type') as ErrorType | null;
    const resolved = searchParams.get('resolved');

    const filters: {
      level?: ErrorLevel;
      type?: ErrorType;
      resolved?: boolean;
    } = {};

    if (level) filters.level = level;
    if (type) filters.type = type;
    if (resolved !== null) filters.resolved = resolved === 'true';

    const errorStats = getErrorStats();
    const errorsByDay = getErrorsByDay(7);
    const result = getErrorLogs(page, 20, filters);

    return NextResponse.json({
      ...result,
      stats: errorStats,
      errorsByDay
    });
  }

  // Error count for notifications (lightweight endpoint)
  if (tab === 'error-count') {
    const count = getUnresolvedErrorCount();
    const latestId = getLatestErrorId();
    return NextResponse.json({ count, latestId });
  }

  // Feeds tab
  if (tab === 'feeds') {
    const feeds = getAllRssFeeds();
    return NextResponse.json({ feeds });
  }

  // Payments tab
  if (tab === 'payments') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const status = searchParams.get('status') || 'pending';

    const result = getAllPayments(page, 20, status === 'all' ? undefined : status);
    const stats = getSubscriptionStats();

    return NextResponse.json({
      ...result,
      stats
    });
  }

  // Analytics tab
  if (tab === 'analytics') {
    const sourcePerformance = getSourcePerformance();
    const categoryEngagement = getCategoryEngagement();
    const translationStats = getTranslationStats();
    const articleAgeStats = getArticleAgeStats();
    const userEngagement = getUserEngagementMetrics();
    const searchAnalytics = getSearchAnalytics();

    return NextResponse.json({
      sourcePerformance,
      categoryEngagement,
      translationStats,
      articleAgeStats,
      userEngagement,
      searchAnalytics
    });
  }

  // Audit log tab
  if (tab === 'audit') {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const actionFilter = searchParams.get('action') || undefined;
    const result = getAuditLogs(page, 20, actionFilter);
    const actions = getAuditLogActions();
    return NextResponse.json({ ...result, actions });
  }

  // Moderation config tab
  if (tab === 'moderation-config') {
    const bannedWords = getMetadata('banned_words') || '';
    const commentRateLimit = getMetadata('comment_rate_limit') || '10';
    return NextResponse.json({ bannedWords, commentRateLimit });
  }

  return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
}

// Admin actions (POST)
export async function POST(request: NextRequest) {
  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Get admin session for audit logging
    const adminSession = await getAdminSession();
    const adminId = adminSession?.userId || 1;
    const adminUsername = adminSession?.username || 'admin';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // DRY audit log helper
    const auditLog = (targetType?: string, targetId?: string, details?: string) => {
      try {
        addAuditLog({
          adminId,
          adminUsername,
          action,
          targetType,
          targetId,
          details,
          ipAddress
        });
      } catch { /* non-critical */ }
    };

    // Toggle user admin status
    if (action === 'toggleAdmin') {
      const { userId, currentAdminStatus } = body;
      setUserAdmin(userId, !currentAdminStatus);
      auditLog('user', String(userId), `Set admin=${!currentAdminStatus}`);
      return NextResponse.json({ success: true, isAdmin: !currentAdminStatus });
    }

    // Delete user
    if (action === 'deleteUser') {
      const { userId } = body;
      const success = deleteUser(userId);
      auditLog('user', String(userId));
      return NextResponse.json({ success });
    }

    // Ban user
    if (action === 'banUser') {
      const { userId, reason } = body;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      const success = banUser(userId, reason || 'Banned by admin');
      auditLog('user', String(userId), reason || 'Banned by admin');
      return NextResponse.json({ success });
    }

    // Unban user
    if (action === 'unbanUser') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      const success = unbanUser(userId);
      auditLog('user', String(userId));
      return NextResponse.json({ success });
    }

    // Bulk delete old news
    if (action === 'bulkDeleteOldNews') {
      const { days } = body;
      if (!days || days < 1) {
        return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
      }
      const deleted = bulkDeleteOldNews(days);
      auditLog('news', undefined, `Deleted ${deleted} articles older than ${days} days`);
      return NextResponse.json({ success: true, deleted });
    }

    // Resolve error
    if (action === 'resolveError') {
      const { errorId } = body;
      const success = resolveError(errorId);
      auditLog('error', String(errorId));
      return NextResponse.json({ success });
    }

    // Unresolve error
    if (action === 'unresolveError') {
      const { errorId } = body;
      const success = unresolveError(errorId);
      auditLog('error', String(errorId));
      return NextResponse.json({ success });
    }

    // Delete error
    if (action === 'deleteError') {
      const { errorId } = body;
      const success = deleteErrorLog(errorId);
      auditLog('error', String(errorId));
      return NextResponse.json({ success });
    }

    // Bulk delete old errors
    if (action === 'bulkDeleteOldErrors') {
      const { days } = body;
      if (!days || days < 1) {
        return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
      }
      const deleted = bulkDeleteOldErrors(days);
      auditLog('error', undefined, `Deleted ${deleted} errors older than ${days} days`);
      return NextResponse.json({ success: true, deleted });
    }

    // Clear all resolved errors
    if (action === 'clearResolvedErrors') {
      const deleted = clearResolvedErrors();
      auditLog('error', undefined, `Cleared ${deleted} resolved errors`);
      return NextResponse.json({ success: true, deleted });
    }

    // ============ Comment Moderation Actions ============

    // Flag comment
    if (action === 'flagComment') {
      const { commentId, reason } = body;
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
      }
      const success = flagComment(commentId, reason || 'Flagged by admin');
      auditLog('comment', String(commentId), reason || 'Flagged by admin');
      return NextResponse.json({ success });
    }

    // Unflag comment
    if (action === 'unflagComment') {
      const { commentId } = body;
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
      }
      const success = unflagComment(commentId);
      auditLog('comment', String(commentId));
      return NextResponse.json({ success });
    }

    // Hide comment
    if (action === 'hideComment') {
      const { commentId, note } = body;
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
      }
      const success = hideComment(commentId, note);
      auditLog('comment', String(commentId), note);
      return NextResponse.json({ success });
    }

    // Unhide comment
    if (action === 'unhideComment') {
      const { commentId } = body;
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
      }
      const success = unhideComment(commentId);
      auditLog('comment', String(commentId));
      return NextResponse.json({ success });
    }

    // Delete comment
    if (action === 'deleteComment') {
      const { commentId } = body;
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
      }
      deleteComment(commentId);
      auditLog('comment', String(commentId));
      return NextResponse.json({ success: true });
    }

    // ============ RSS Feed Actions ============

    // Add new feed
    if (action === 'addFeed') {
      const { name, url, is_sarawak_source } = body;
      if (!name || !url) {
        return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
      }
      const feed = addRssFeed({ name, url, is_sarawak_source: !!is_sarawak_source });
      if (!feed) {
        return NextResponse.json({ error: 'Feed URL already exists' }, { status: 400 });
      }
      auditLog('feed', String(feed.id), `Added feed: ${name}`);
      return NextResponse.json({ success: true, feed });
    }

    // Update feed
    if (action === 'updateFeed') {
      const { feedId, name, url, is_sarawak_source } = body;
      if (!feedId) {
        return NextResponse.json({ error: 'Feed ID is required' }, { status: 400 });
      }
      const success = updateRssFeed(feedId, { name, url, is_sarawak_source });
      auditLog('feed', String(feedId), `Updated feed`);
      return NextResponse.json({ success });
    }

    // Toggle feed active status
    if (action === 'toggleFeed') {
      const { feedId } = body;
      if (!feedId) {
        return NextResponse.json({ error: 'Feed ID is required' }, { status: 400 });
      }
      const success = toggleRssFeed(feedId);
      auditLog('feed', String(feedId));
      return NextResponse.json({ success });
    }

    // Delete feed
    if (action === 'deleteFeed') {
      const { feedId } = body;
      if (!feedId) {
        return NextResponse.json({ error: 'Feed ID is required' }, { status: 400 });
      }
      const success = deleteRssFeed(feedId);
      auditLog('feed', String(feedId));
      return NextResponse.json({ success });
    }

    // ============ Payment Actions ============

    // Approve payment
    if (action === 'approvePayment') {
      const { paymentId, months } = body;
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }
      const success = approvePayment(paymentId, adminId, months || 1);
      if (!success) {
        return NextResponse.json({ error: 'Failed to approve payment' }, { status: 500 });
      }
      auditLog('payment', String(paymentId), `Approved for ${months || 1} months`);
      return NextResponse.json({ success: true });
    }

    // Reject payment
    if (action === 'rejectPayment') {
      const { paymentId, note } = body;
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }
      const success = rejectPayment(paymentId, adminId, note);
      if (!success) {
        return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 });
      }
      auditLog('payment', String(paymentId), note);
      return NextResponse.json({ success: true });
    }

    // ============ Moderation Config Actions ============

    // Update banned words
    if (action === 'updateBannedWords') {
      const { words } = body;
      setMetadata('banned_words', words || '');
      auditLog('config', 'banned_words', `Updated banned words list`);
      return NextResponse.json({ success: true });
    }

    // Update rate limit
    if (action === 'updateRateLimit') {
      const { limit } = body;
      if (limit === undefined || limit < 1) {
        return NextResponse.json({ error: 'Invalid rate limit' }, { status: 400 });
      }
      setMetadata('comment_rate_limit', String(limit));
      auditLog('config', 'comment_rate_limit', `Set to ${limit}/hour`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
