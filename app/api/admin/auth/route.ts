import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createAdminSession,
  checkAdminSession,
  clearAdminSession,
  isAdminAuthConfigured
} from '@/lib/adminAuth';
import { rateLimitByIp } from '@/lib/rateLimit';

// POST - Admin login
export async function POST(request: NextRequest) {
  try {
    const limit = rateLimitByIp(request, 'admin-login', 10, 15 * 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many admin login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        { error: 'Admin auth is not configured. Set ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET.' },
        { status: 503 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    const isValid = await verifyAdminPassword(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await createAdminSession();

    return NextResponse.json({
      success: true,
      message: 'Admin login successful'
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET - Check admin session
export async function GET() {
  const isAuthenticated = await checkAdminSession();

  return NextResponse.json({
    authenticated: isAuthenticated
  });
}

// DELETE - Admin logout
export async function DELETE() {
  await clearAdminSession();

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
