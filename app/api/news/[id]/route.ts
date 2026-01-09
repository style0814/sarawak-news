import { NextResponse } from 'next/server';
import { getNewsById, incrementClicks } from '@/lib/db';

// GET /api/news/[id] - Get single news item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id, 10);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid news ID' }, { status: 400 });
    }

    const news = getNewsById(newsId);

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST /api/news/[id] - Increment clicks (alternative to /api/news/[id]/click)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id, 10);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid news ID' }, { status: 400 });
    }

    incrementClicks(newsId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing clicks:', error);
    return NextResponse.json({ error: 'Failed to increment clicks' }, { status: 500 });
  }
}
