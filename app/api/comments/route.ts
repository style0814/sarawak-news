import { NextRequest, NextResponse } from 'next/server';
import { addComment, getCommentsByNewsId, getUserById, getNewsById } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logApiError, logAuthError } from '@/lib/errorLogger';

export const dynamic = 'force-dynamic';

// Sanitize input to prevent XSS
function sanitize(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// GET comments for a news item (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json(
        { error: 'newsId is required' },
        { status: 400 }
      );
    }

    // Get current user ID if logged in
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;

    const comments = getCommentsByNewsId(parseInt(newsId, 10), currentUserId);
    return NextResponse.json({ comments });
  } catch (error) {
    logApiError('/api/comments', error instanceof Error ? error : new Error('Failed to fetch comments'), request);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST a new comment (requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      logAuthError('Unauthorized comment attempt', undefined, request);
      return NextResponse.json(
        { error: 'Please login to comment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { news_id, parent_id, content } = body;

    if (!news_id || !content) {
      return NextResponse.json(
        { error: 'news_id and content are required' },
        { status: 400 }
      );
    }

    // Validate content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be 1-2000 characters' },
        { status: 400 }
      );
    }

    // Verify user exists (session may be stale after DB reset)
    const userId = parseInt(session.user.id, 10);
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Your session has expired. Please logout and login again.' },
        { status: 401 }
      );
    }

    // Verify news exists
    const newsItem = getNewsById(parseInt(news_id, 10));
    if (!newsItem) {
      return NextResponse.json(
        { error: 'This news article no longer exists' },
        { status: 404 }
      );
    }

    const comment = addComment({
      news_id: parseInt(news_id, 10),
      user_id: parseInt(session.user.id, 10),
      parent_id: parent_id ? parseInt(parent_id, 10) : null,
      content: sanitize(trimmedContent)
    });

    return NextResponse.json({ comment });
  } catch (error) {
    logApiError('/api/comments', error instanceof Error ? error : new Error('Failed to add comment'), request);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
