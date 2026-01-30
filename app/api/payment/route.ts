import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { submitPayment, getUserPayments } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payments = getUserPayments(Number(session.user.id));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please log in to submit payment' },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    const body = await request.json();
    const { amount, paymentMethod, referenceNumber, proofDescription } = body;

    if (!referenceNumber || !paymentMethod) {
      return NextResponse.json(
        { error: 'Reference number and payment method are required' },
        { status: 400 }
      );
    }

    // Check for pending payments
    const existingPayments = getUserPayments(userId);
    const hasPending = existingPayments.some(p => p.status === 'pending');

    if (hasPending) {
      return NextResponse.json(
        { error: 'You already have a pending payment. Please wait for verification.' },
        { status: 400 }
      );
    }

    const paymentId = submitPayment({
      userId,
      amount: amount || 9.90,
      paymentMethod,
      referenceNumber,
      proofDescription
    });

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Failed to submit payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId,
      message: 'Payment submitted successfully. We will verify within 24 hours.'
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment' },
      { status: 500 }
    );
  }
}
