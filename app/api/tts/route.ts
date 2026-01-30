import { NextRequest, NextResponse } from 'next/server';

// This API is no longer needed - using browser TTS instead
// Keeping for future if we add cloud TTS later

export async function POST(request: NextRequest) {
  // Return message to use browser TTS
  return NextResponse.json(
    {
      error: 'Using browser TTS',
      useBrowserTTS: true,
      message: 'This app uses your browser\'s built-in text-to-speech for free audio.'
    },
    { status: 200 }
  );
}
