import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds, translateUntranslatedNews } from '@/lib/rss';
import { setMetadata } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET environment variable not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Fetch new articles
    const result = await fetchAllFeeds();
    const errorCount = result.errors?.length || 0;
    const refreshStatus = errorCount === 0 ? 'success' : (result.added > 0 ? 'warning' : 'error');

    // Record the refresh timestamp
    const refreshedAt = new Date().toISOString();
    setMetadata('last_cron_refresh', refreshedAt);
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
    console.error('Cron refresh failed:', error);
    return NextResponse.json(
      { error: 'Failed to refresh feeds' },
      { status: 500 }
    );
  }
}
