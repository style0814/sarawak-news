import { NextResponse } from 'next/server';
import { fetchAllFeeds, translateUntranslatedNews } from '@/lib/rss';
import { logRssError, logApiError } from '@/lib/errorLogger';
import { getMetadata, getStats, setMetadata } from '@/lib/db';
import { isCronOrAdminAuthorized } from '@/lib/apiAuth';
import { rateLimitByKey } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
const PUBLIC_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const PUBLIC_REFRESH_THROTTLE_SECONDS = 60;

function getRemainingSeconds(lastRefresh: string | null): number {
  if (!lastRefresh) return 0;
  const lastRefreshMs = new Date(lastRefresh).getTime();
  if (Number.isNaN(lastRefreshMs)) return 0;
  const elapsedMs = Date.now() - lastRefreshMs;
  return Math.max(0, Math.ceil((PUBLIC_REFRESH_INTERVAL_MS - elapsedMs) / 1000));
}

export async function POST(request: Request) {
  try {
    const authorized = await isCronOrAdminAuthorized(request);

    // Public refresh is allowed on a controlled interval so homepage auto-refresh can pull new RSS.
    if (!authorized && getStats().totalNews > 0) {
      const lastRefresh = getMetadata('last_refresh');
      const remainingSeconds = getRemainingSeconds(lastRefresh);
      if (remainingSeconds > 0) {
        return NextResponse.json(
          { error: 'Refresh too soon', retryAfter: remainingSeconds },
          { status: 429 }
        );
      }

      const globalRefreshLimit = rateLimitByKey(
        'public-refresh',
        'global',
        1,
        PUBLIC_REFRESH_THROTTLE_SECONDS
      );
      if (!globalRefreshLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many refresh attempts', retryAfter: globalRefreshLimit.retryAfter },
          { status: 429 }
        );
      }
    }

    // Fetch new articles
    const result = await fetchAllFeeds();
    const errorCount = result.errors?.length || 0;
    const refreshStatus = errorCount === 0 ? 'success' : (result.added > 0 ? 'warning' : 'error');

    // Log any RSS feed errors
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((err: string) => {
        logRssError('RSS Feed', new Error(err));
      });
    }

    // Record the refresh timestamp
    const refreshedAt = new Date().toISOString();
    setMetadata('last_refresh', refreshedAt);
    setMetadata('last_refresh_status', refreshStatus);
    setMetadata('last_refresh_added', String(result.added || 0));
    setMetadata('last_refresh_total', String(result.total || 0));
    setMetadata('last_refresh_error_count', String(errorCount));

    // Translate new articles in background (don't wait)
    translateUntranslatedNews().catch(console.error);

    return NextResponse.json({
      success: true,
      added: result.added,
      total: result.total,
      errors: result.errors,
      refreshedAt
    });
  } catch (error) {
    setMetadata('last_refresh_status', 'error');
    logApiError('/api/refresh', error instanceof Error ? error : new Error('Failed to refresh feeds'));
    return NextResponse.json(
      { error: 'Failed to refresh feeds' },
      { status: 500 }
    );
  }
}
