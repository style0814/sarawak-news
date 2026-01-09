// Simple translation service using free API
// Uses LibreTranslate or MyMemory API (free, no key required)

export async function translateText(text: string, targetLang: 'zh' | 'ms'): Promise<string> {
  try {
    // Use MyMemory Translation API (free, no API key needed)
    const langPair = targetLang === 'zh' ? 'en|zh-CN' : 'en|ms';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SarawakNews/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Translation API failed');
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    throw new Error('No translation returned');
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

export async function translateNewsTitle(title: string): Promise<{ zh: string; ms: string }> {
  // Translate to both languages in parallel
  const [zh, ms] = await Promise.all([
    translateText(title, 'zh'),
    translateText(title, 'ms')
  ]);

  return { zh, ms };
}
