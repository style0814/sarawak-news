import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createAdminSession,
  checkAdminSession,
  clearAdminSession
} from '@/lib/adminAuth';

// POST - Admin login
export async function POST(request: NextRequest) {
  try {
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
