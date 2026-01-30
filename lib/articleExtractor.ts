/**
 * Article Content Extractor
 * Fetches and extracts main article text from news URLs
 */

// Common selectors for article content across news sites
const CONTENT_SELECTORS = [
  'article',
  '[class*="article-content"]',
  '[class*="article-body"]',
  '[class*="post-content"]',
  '[class*="entry-content"]',
  '[class*="story-body"]',
  '[class*="news-content"]',
  '.content-body',
  '.article-text',
  'main',
];

// Elements to remove (ads, navigation, etc.)
const REMOVE_SELECTORS = [
  'script',
  'style',
  'nav',
  'header',
  'footer',
  'aside',
  'iframe',
  'form',
  '[class*="advertisement"]',
  '[class*="sidebar"]',
  '[class*="comment"]',
  '[class*="social"]',
  '[class*="share"]',
  '[class*="related"]',
  '[class*="recommended"]',
  '[id*="comment"]',
  '[id*="sidebar"]',
];

/**
 * Extract text content from HTML string
 */
function extractTextFromHTML(html: string): string {
  // Remove script and style tags with their content
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Try to find article content using common patterns
 */
function findArticleContent(html: string): string {
  // Try to find content between common article markers
  const patterns = [
    // Look for article tags
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // Look for main content divs
    /<div[^>]*class="[^"]*(?:article|content|post|entry|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Look for main tag
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const text = extractTextFromHTML(match[1]);
      if (text.length > 200) { // Minimum content length
        return text;
      }
    }
  }

  // Fallback: extract all paragraph text
  const paragraphs: string[] = [];
  const pPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;

  while ((pMatch = pPattern.exec(html)) !== null) {
    const text = extractTextFromHTML(pMatch[1]);
    if (text.length > 50) { // Skip short paragraphs (likely navigation)
      paragraphs.push(text);
    }
  }

  if (paragraphs.length > 0) {
    return paragraphs.join('\n\n');
  }

  // Last resort: extract all text
  return extractTextFromHTML(html);
}

/**
 * Fetch and extract article content from a URL
 */
export async function extractArticleContent(url: string): Promise<{
  content: string;
  success: boolean;
  error?: string;
}> {
  try {
    // Fetch the page with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SarawakNews/1.0; +https://sarawaknews.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5,zh;q=0.3,ms;q=0.2',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        content: '',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Extract article content
    let content = findArticleContent(html);

    // Limit content length (for AI processing)
    if (content.length > 5000) {
      content = content.substring(0, 5000) + '...';
    }

    // Check if we got meaningful content
    if (content.length < 100) {
      return {
        content: '',
        success: false,
        error: 'Could not extract article content',
      };
    }

    return {
      content,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific errors
    if (errorMessage.includes('abort')) {
      return {
        content: '',
        success: false,
        error: 'Request timeout',
      };
    }

    return {
      content: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Clean and prepare content for AI summarization
 */
export function prepareForSummarization(content: string, title: string): string {
  // Remove duplicate spaces and normalize
  let prepared = content.replace(/\s+/g, ' ').trim();

  // Remove the title if it appears at the start
  if (prepared.toLowerCase().startsWith(title.toLowerCase())) {
    prepared = prepared.substring(title.length).trim();
  }

  // Limit to ~4000 chars for API limits
  if (prepared.length > 4000) {
    prepared = prepared.substring(0, 4000) + '...';
  }

  return prepared;
}
