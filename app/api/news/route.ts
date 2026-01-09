import { NextRequest, NextResponse } from 'next/server';
import { getAllNews, deleteOldNews, NEWS_CATEGORIES } from '@/lib/db';
import { logApiError } from '@/lib/errorLogger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category') || 'all';

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(5, limit)); // Between 5 and 50

    // Validate category
    const validCategory = NEWS_CATEGORIES.includes(category as typeof NEWS_CATEGORIES[number])
      ? category
      : 'all';

    // Auto-cleanup old news (runs on each request, but only deletes if needed)
    deleteOldNews(30);

    const result = getAllNews(validPage, validLimit, validCategory);

    return NextResponse.json({
      news: result.news,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: validPage < result.totalPages
      },
      categories: NEWS_CATEGORIES
    });
  } catch (error) {
    logApiError('/api/news', error instanceof Error ? error : new Error('Unknown error'), request);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
