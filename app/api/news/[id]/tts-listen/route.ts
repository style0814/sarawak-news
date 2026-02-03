import { NextRequest, NextResponse } from 'next/server';
import { incrementTtsListens } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id, 10);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid news ID' }, { status: 400 });
    }
    incrementTtsListens(newsId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record' }, { status: 500 });
  }
}
