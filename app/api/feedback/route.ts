import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveFeedback } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, summaryRating, voiceRating, wantsPremium, additionalFeedback } = body;

    if (!type) {
      return NextResponse.json({ error: 'Feedback type is required' }, { status: 400 });
    }

    const success = saveFeedback({
      userId: Number(session.user.id),
      type,
      summaryRating,
      voiceRating,
      wantsPremium,
      additionalFeedback
    });

    if (success) {
      return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
