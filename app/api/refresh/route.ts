import { NextResponse } from 'next/server';
import { fetchAllFeeds, translateUntranslatedNews } from '@/lib/rss';
import { logRssError, logApiError } from '@/lib/errorLogger';
import { getStats, setMetadata } from '@/lib/db';
import { isCronOrAdminAuthorized } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authorized = await isCronOrAdminAuthorized(request);

    // Allow unauthenticated bootstrap only when database is empty.
    if (!authorized && getStats().totalNews > 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch new articles
    const result = await fetchAllFeeds();

    // Log any RSS feed errors
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((err: string) => {
        logRssError('RSS Feed', new Error(err));
      });
    }

    // Record the refresh timestamp
    const refreshedAt = new Date().toISOString();
    setMetadata('last_refresh', refreshedAt);

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
    logApiError('/api/refresh', error instanceof Error ? error : new Error('Failed to refresh feeds'));
    return NextResponse.json(
      { error: 'Failed to refresh feeds' },
      { status: 500 }
    );
  }
}
