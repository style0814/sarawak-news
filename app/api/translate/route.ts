import { NextResponse } from 'next/server';
import { translateUntranslatedNews } from '@/lib/rss';
import { isCronOrAdminAuthorized } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// POST - translate all untranslated news titles
export async function POST(request: Request) {
  try {
    const authorized = await isCronOrAdminAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const translated = await translateUntranslatedNews();
    return NextResponse.json({
      success: true,
      translated
    });
  } catch (error) {
    console.error('Error translating news:', error);
    return NextResponse.json(
      { error: 'Failed to translate news' },
      { status: 500 }
    );
  }
}
