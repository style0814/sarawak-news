import { NextRequest, NextResponse } from 'next/server';
import { likeComment } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please login to like comments' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id, 10);
    const userId = parseInt(session.user.id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const result = likeComment(commentId, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}
