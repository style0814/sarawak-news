import { NextRequest, NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/adminAuth';
import { deleteNews, deleteComment } from '@/lib/db';

export async function POST(request: NextRequest) {
  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }

    if (type === 'news') {
      deleteNews(id);
    } else if (type === 'comment') {
      deleteComment(id);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
