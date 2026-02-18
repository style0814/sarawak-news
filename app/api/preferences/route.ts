import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPreferences, setUserLanguage, setUserTheme } from '@/lib/db';

// GET /api/preferences - Get current user's preferences
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const preferences = getUserPreferences(userId);

    // Return empty object if no preferences saved — don't return fake defaults
    // that would override the user's localStorage values
    if (!preferences) {
      return NextResponse.json({});
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
  }
}

// POST /api/preferences - Update current user's preferences
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    // Validate and update language
    if (body.language) {
      if (!['en', 'zh', 'ms'].includes(body.language)) {
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
      }
      setUserLanguage(userId, body.language);
    }

    // Validate and update theme
    if (body.theme) {
      if (!['light', 'dark'].includes(body.theme)) {
        return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
      }
      setUserTheme(userId, body.theme);
    }

    // Return updated preferences
    const preferences = getUserPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences: preferences || { language: 'en', theme: 'light' }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
