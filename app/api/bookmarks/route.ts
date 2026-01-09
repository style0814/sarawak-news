import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toggleBookmark, getUserBookmarks, getUserById, getNewsById } from '@/lib/db';

// Get user's bookmarks
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookmarks = getUserBookmarks(Number(session.user.id));
  return NextResponse.json({ bookmarks });
}

// Toggle bookmark
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { news_id } = await request.json();

    if (!news_id) {
      return NextResponse.json({ error: 'News ID required' }, { status: 400 });
    }

    // Verify user exists
    const userId = Number(session.user.id);
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    // Verify news exists
    const news = getNewsById(news_id);
    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    const result = toggleBookmark(userId, news_id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
