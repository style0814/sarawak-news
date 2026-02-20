import Parser from 'rss-parser';
import { addNews, updateNewsTitles, getUntranslatedNews, getActiveRssFeeds, updateRssFeedStatus } from './db';
import { translateNewsTitle } from './translate';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'SarawakNews/1.0'
  }
});

// Keywords to filter Sarawak-related news
const SARAWAK_KEYWORDS = [
  'sarawak',
  'kuching',
  'sibu',
  'miri',
  'bintulu',
  'sri aman',
  'kapit',
  'limbang',
  'mukah',
  'betong',
  'sarikei',
  'serian',
  'dayak',
  'iban',
  'bidayuh',
  'orang ulu',
  'penan',
  'abang johari',
  'gps',
  'gabungan parti sarawak',
  'batang ai',
  'rajang',
  'sarawakian'
];

function isSarawakRelated(title: string, content?: string): boolean {
  const text = `${title} ${content || ''}`.toLowerCase();
  return SARAWAK_KEYWORDS.some(keyword => text.includes(keyword));
}

// Category keywords for auto-detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ['minister', 'government', 'election', 'parliament', 'gps', 'dap', 'pkr', 'bn', 'pn', 'vote', 'politician', 'assembly', 'premier', 'chief minister', 'abang johari', 'policy', 'cabinet'],
  economy: ['economy', 'business', 'trade', 'investment', 'gdp', 'export', 'import', 'market', 'stock', 'ringgit', 'bank', 'finance', 'industry', 'company', 'corporate', 'revenue', 'profit'],
  sports: ['sports', 'football', 'soccer', 'badminton', 'athlete', 'tournament', 'championship', 'medal', 'olympics', 'games', 'league', 'match', 'team', 'player', 'coach'],
  crime: ['crime', 'police', 'arrest', 'court', 'jail', 'prison', 'murder', 'robbery', 'theft', 'drug', 'suspect', 'investigation', 'charge', 'sentence', 'victim'],
  environment: ['environment', 'forest', 'wildlife', 'climate', 'pollution', 'conservation', 'nature', 'river', 'flood', 'drought', 'deforestation', 'palm oil', 'green', 'sustainable'],
  culture: ['culture', 'festival', 'tradition', 'heritage', 'dayak', 'iban', 'bidayuh', 'orang ulu', 'gawai', 'music', 'art', 'dance', 'celebration', 'ceremony', 'ethnic'],
  education: ['education', 'school', 'university', 'student', 'teacher', 'exam', 'scholarship', 'graduate', 'college', 'learning', 'academic'],
  health: ['health', 'hospital', 'doctor', 'patient', 'covid', 'vaccine', 'disease', 'medical', 'clinic', 'medicine', 'treatment', 'outbreak'],
  infrastructure: ['infrastructure', 'road', 'highway', 'bridge', 'airport', 'port', 'construction', 'development', 'project', 'building', 'facility'],
  tourism: ['tourism', 'tourist', 'hotel', 'travel', 'destination', 'visitor', 'attraction', 'heritage', 'beach', 'resort']
};

const DISTRICT_KEYWORDS: Record<string, string[]> = {
  kuching: ['kuching', '古晋'],
  sibu: ['sibu', '诗巫'],
  miri: ['miri', '美里'],
  bintulu: ['bintulu', '民都鲁']
};

function detectCategory(title: string, content?: string): string {
  const text = `${title} ${content || ''}`.toLowerCase();

  let bestCategory = 'general';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function detectDistrict(title: string, content?: string, sourceName?: string): string {
  const text = `${title} ${content || ''} ${sourceName || ''}`.toLowerCase();
  for (const [district, keywords] of Object.entries(DISTRICT_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return district;
    }
  }
  return 'sarawak';
}

export interface FetchResult {
  added: number;
  total: number;
  errors: string[];
}

export async function fetchAllFeeds(): Promise<FetchResult> {
  const result: FetchResult = {
    added: 0,
    total: 0,
    errors: []
  };

  // Get active feeds from database
  const feeds = getActiveRssFeeds();

  for (const feed of feeds) {
    try {
      const feedData = await parser.parseURL(feed.url);

      for (const item of feedData.items || []) {
        if (!item.title || !item.link) continue;

        result.total++;

        // Check if Sarawak-related (use is_sarawak_source from database)
        const isSarawakSource = feed.is_sarawak_source === 1;
        const isRelevant = isSarawakSource || isSarawakRelated(item.title, item.contentSnippet);

        if (isRelevant) {
          const category = detectCategory(item.title, item.contentSnippet);
          const district = detectDistrict(item.title, item.contentSnippet, feed.name);
          const added = addNews({
            title: item.title,
            source_url: item.link,
            source_name: feed.name,
            published_at: item.pubDate || item.isoDate,
            category,
            district
          });

          if (added) {
            result.added++;
          }
        }
      }

      // Update feed status on success
      updateRssFeedStatus(feed.id, true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to fetch ${feed.name}: ${errorMsg}`);
      // Update feed status on error
      updateRssFeedStatus(feed.id, false, errorMsg);
    }
  }

  return result;
}

// Translate untranslated news titles (run in background)
export async function translateUntranslatedNews(): Promise<number> {
  const news = getUntranslatedNews(100);
  let translated = 0;

  for (const item of news) {
    // Skip if already translated
    if (item.title_zh && item.title_ms) continue;

    try {
      const translations = await translateNewsTitle(item.title);
      updateNewsTitles(item.id, translations.zh, translations.ms);
      translated++;

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to translate news ${item.id}:`, error);
    }
  }

  return translated;
}

export function getRssFeeds() {
  return getActiveRssFeeds();
}
