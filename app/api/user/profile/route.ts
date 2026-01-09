import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, getUserStats, updateUserProfile, updateUserPassword } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET user profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please login to view your profile' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const user = getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const stats = getUserStats(userId);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT update profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please login to update your profile' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { display_name, email, currentPassword, newPassword } = body;

    // Update password if provided
    if (currentPassword && newPassword) {
      const success = await updateUserPassword(userId, currentPassword, newPassword);
      if (!success) {
        return NextResponse.json(
          { error: 'Invalid current password' },
          { status: 400 }
        );
      }
    }

    // Update profile if provided
    if (display_name || email) {
      const success = updateUserProfile(userId, { display_name, email });
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update profile (email may already exist)' },
          { status: 400 }
        );
      }
    }

    // Fetch updated user
    const user = getUserById(userId);

    return NextResponse.json({
      success: true,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at
      } : null
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
