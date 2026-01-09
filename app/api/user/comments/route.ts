import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCommentsByUserId } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET user's comments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please login to view your comments' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const userId = parseInt(session.user.id, 10);

    const result = getCommentsByUserId(userId, page, 20);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
