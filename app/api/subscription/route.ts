import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ subscription: null });
    }

    const subscription = getUserSubscription(Number(session.user.id));

    return NextResponse.json({
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at
      } : { plan: 'free', status: 'active' }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
