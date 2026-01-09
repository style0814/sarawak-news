import { NextResponse } from 'next/server';
import { deleteOldNews } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Delete news older than 30 days
export async function POST() {
  try {
    const deleted = deleteOldNews(30);
    return NextResponse.json({
      success: true,
      deleted,
      message: `Deleted ${deleted} news items older than 30 days`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
