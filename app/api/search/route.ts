import { NextRequest, NextResponse } from 'next/server';
import { searchNews, getSearchSuggestions, SearchFilters } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const suggestions = searchParams.get('suggestions') === 'true';

  // Sanitize input
  const sanitizedQuery = query.trim().slice(0, 100);

  // Return suggestions if requested
  if (suggestions && sanitizedQuery) {
    const suggestionList = getSearchSuggestions(sanitizedQuery, 5);
    return NextResponse.json({ suggestions: suggestionList });
  }

  if (!sanitizedQuery) {
    return NextResponse.json({
      news: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
      filters: { sources: [], categories: [] }
    });
  }

  // Parse filters
  const filters: SearchFilters = {};
  const category = searchParams.get('category');
  const source = searchParams.get('source');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const sortBy = searchParams.get('sortBy') as 'relevance' | 'date' | 'clicks' | null;

  if (category) filters.category = category;
  if (source) filters.source = source;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (sortBy) filters.sortBy = sortBy;

  const result = searchNews(sanitizedQuery, page, limit, filters);

  return NextResponse.json({
    news: result.news,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
      hasMore: page < result.totalPages
    },
    filters: {
      sources: result.sources,
      categories: result.categories
    }
  });
}
