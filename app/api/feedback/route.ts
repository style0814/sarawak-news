import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveFeedback, isUserBanned } from '@/lib/db';
import { rateLimitByIp, rateLimitByKey } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const ipLimit = rateLimitByIp(request, 'feedback', 20, 60 * 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many feedback submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userLimit = rateLimitByKey('feedback-user', session.user.id, 10, 60 * 60);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { error: 'Feedback limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(userLimit.retryAfter) } }
      );
    }

    // Check if user is banned
    if (isUserBanned(Number(session.user.id))) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 });
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
