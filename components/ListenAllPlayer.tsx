'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { Language } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';

interface NewsItem {
  id: number;
  title: string;
  title_zh?: string | null;
  title_ms?: string | null;
  source_name?: string | null;
}

interface ListenAllPlayerProps {
  news: NewsItem[];
  lang: Language;
}

// Local storage key for tracking listened news
const LISTENED_NEWS_KEY = 'sarawak_news_listened';

const NARRATION_COPY = {
  en: {
    greetings: ['Good morning.', 'Good afternoon.', 'Good evening.'],
    intro: (count: number, sourceCount: number) =>
      `Welcome to your Sarawak news briefing. We have ${count} stories from ${sourceCount} trusted sources.`,
    firstLead: 'First headline.',
    transitions: ['Next update.', 'Moving on.', 'Another important story.'],
    sourceLead: (source: string) => `Source: ${source}.`,
    summaryLead: 'Key points.',
    fallbackSummary: 'No AI summary is ready yet, so this headline is a watch item.',
    closing: 'That wraps up this briefing. You can tap any article to read the full report.'
  },
  zh: {
    greetings: ['早上好。', '下午好。', '晚上好。'],
    intro: (count: number, sourceCount: number) =>
      `欢迎收听砂拉越新闻简报。今天有 ${count} 条新闻，来自 ${sourceCount} 个可靠来源。`,
    firstLead: '第一条新闻。',
    transitions: ['下一条。', '继续。', '另一条重要新闻。'],
    sourceLead: (source: string) => `来源：${source}。`,
    summaryLead: '重点如下。',
    fallbackSummary: 'AI 摘要暂未准备好，这条新闻建议稍后重点查看。',
    closing: '本次简报到此结束。你可以点击任一新闻查看完整内容。'
  },
  ms: {
    greetings: ['Selamat pagi.', 'Selamat petang.', 'Selamat malam.'],
    intro: (count: number, sourceCount: number) =>
      `Selamat datang ke ringkasan berita Sarawak. Kita ada ${count} berita daripada ${sourceCount} sumber yang dipercayai.`,
    firstLead: 'Berita pertama.',
    transitions: ['Seterusnya.', 'Kita teruskan.', 'Satu lagi berita penting.'],
    sourceLead: (source: string) => `Sumber: ${source}.`,
    summaryLead: 'Inti utama.',
    fallbackSummary: 'Ringkasan AI belum siap, tetapi tajuk ini patut dipantau.',
    closing: 'Itu sahaja untuk sesi ini. Anda boleh tekan mana-mana berita untuk bacaan penuh.'
  }
} as const;

export default function ListenAllPlayer({ news, lang }: ListenAllPlayerProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listenedNews, setListenedNews] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set();
    const stored = localStorage.getItem(LISTENED_NEWS_KEY);
    if (!stored) return new Set();
    try {
      return new Set(JSON.parse(stored));
    } catch {
      return new Set();
    }
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [playMode, setPlayMode] = useState<'all' | 'unlistened'>('unlistened');
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<NewsItem[]>([]);

  const playlistRef = useRef<NewsItem[]>([]);
  const isPlayingRef = useRef(false);
  const summariesRef = useRef<Map<number, string>>(new Map());
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TTS hook
  const {
    speak,
    stop,
    isPlaying: isSpeaking,
    isSupported: ttsSupported,
    setLanguage: setTTSLang
  } = useSpeechSynthesis({ language: lang });

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const getGreetingByTime = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 0;
    if (hour < 18) return 1;
    return 2;
  }, []);

  const normalizeSummaryForSpeech = useCallback((summary: string) => {
    const plainText = summary
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[#*_`>|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const sentences = plainText.match(/[^.!?。！？]+[.!?。！？]?/g) || [plainText];
    const shortVersion = sentences.slice(0, 3).join(' ').trim();
    if (shortVersion.length <= 520) return shortVersion;
    return `${shortVersion.slice(0, 520).trim()}...`;
  }, []);

  // Get display title based on language
  const getDisplayTitle = useCallback((item: NewsItem) => {
    return lang === 'zh' && item.title_zh ? item.title_zh :
           lang === 'ms' && item.title_ms ? item.title_ms : item.title;
  }, [lang]);

  const buildNarrationScript = useCallback((params: {
    item: NewsItem;
    summary: string | null;
    index: number;
    total: number;
    sourceCount: number;
  }) => {
    const { item, summary, index, total, sourceCount } = params;
    const copy = NARRATION_COPY[lang] || NARRATION_COPY.en;
    const parts: string[] = [];

    if (index === 0) {
      parts.push(copy.greetings[getGreetingByTime()]);
      parts.push(copy.intro(total, sourceCount));
      parts.push(copy.firstLead);
    } else {
      parts.push(copy.transitions[index % copy.transitions.length]);
    }

    parts.push(getDisplayTitle(item));

    if (item.source_name) {
      parts.push(copy.sourceLead(item.source_name));
    }

    if (summary) {
      parts.push(copy.summaryLead);
      parts.push(normalizeSummaryForSpeech(summary));
    } else {
      parts.push(copy.fallbackSummary);
    }

    if (index === total - 1) {
      parts.push(copy.closing);
    }

    return parts.join(' ');
  }, [getDisplayTitle, getGreetingByTime, lang, normalizeSummaryForSpeech]);

  // Sync TTS language and clear summary cache when language changes
  useEffect(() => {
    setTTSLang(lang);
    // Clear cached summaries when language changes (they're language-specific)
    summariesRef.current.clear();
    // Stop playback if language changes mid-play
    if (isPlayingRef.current) {
      clearTransitionTimer();
      stop();
      isPlayingRef.current = false;
      queueMicrotask(() => {
        setIsPlaying(false);
        setCurrentIndex(0);
        setPlaylist([]);
      });
    }
  }, [lang, setTTSLang, stop, clearTransitionTimer]);

  useEffect(() => () => {
    clearTransitionTimer();
  }, [clearTransitionTimer]);

  // Save listened news to localStorage
  const markAsListened = useCallback((newsId: number) => {
    setListenedNews(prev => {
      const updated = new Set(prev);
      updated.add(newsId);
      localStorage.setItem(LISTENED_NEWS_KEY, JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  // Clear listen history
  const clearHistory = useCallback(() => {
    setListenedNews(new Set());
    localStorage.removeItem(LISTENED_NEWS_KEY);
  }, []);

  // Fetch summary for a news item
  const fetchSummary = useCallback(async (newsId: number): Promise<string | null> => {
    // Check cache first
    if (summariesRef.current.has(newsId)) {
      return summariesRef.current.get(newsId) || null;
    }

    if (!session) {
      return null;
    }

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId, language: lang })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          summariesRef.current.set(newsId, data.summary);
          return data.summary;
        }
      }
    } catch {
      console.error('Failed to fetch summary');
    }
    return null;
  }, [session, lang]);

  const prefetchSummary = useCallback((newsId: number) => {
    void fetchSummary(newsId);
  }, [fetchSummary]);

  const playAtIndex = useCallback(async function playFromIndex(index: number) {
    if (!isPlayingRef.current) return;

    const currentPlaylist = playlistRef.current;
    if (index >= currentPlaylist.length) {
      // Finished all items
      clearTransitionTimer();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setPlaylist([]);
      return;
    }

    const currentItem = currentPlaylist[index];
    setIsLoadingSummary(true);
    setError(null);

    // Try to get summary
    const summary = await fetchSummary(currentItem.id);
    setIsLoadingSummary(false);

    const nextItem = currentPlaylist[index + 1];
    if (nextItem) {
      prefetchSummary(nextItem.id);
    }

    const uniqueSources = new Set(
      currentPlaylist.map(item => item.source_name).filter(Boolean)
    );
    const textToSpeak = buildNarrationScript({
      item: currentItem,
      summary,
      index,
      total: currentPlaylist.length,
      sourceCount: Math.max(uniqueSources.size, 1)
    });

    // Mark as listened
    markAsListened(currentItem.id);

    speak(textToSpeak, {
      onEnd: () => {
        if (!isPlayingRef.current) return;
        const nextIndex = index + 1;
        setCurrentIndex(nextIndex);
        clearTransitionTimer();
        transitionTimerRef.current = setTimeout(() => {
          void playFromIndex(nextIndex);
        }, 500);
      }
    });
  }, [buildNarrationScript, clearTransitionTimer, fetchSummary, markAsListened, prefetchSummary, speak]);

  // Start playing
  const handlePlay = useCallback(() => {
    if (!session) {
      setError('Please login to use this feature');
      return;
    }

    // Build playlist based on mode
    let playlist = [...news];
    if (playMode === 'unlistened') {
      playlist = news.filter(item => !listenedNews.has(item.id));
    }

    if (playlist.length === 0) {
      setError(playMode === 'unlistened' ? 'All news items have been listened to! Switch to "All" mode or clear history.' : 'No news to play');
      return;
    }

    clearTransitionTimer();
    playlistRef.current = playlist;
    setPlaylist(playlist);
    isPlayingRef.current = true;
    setCurrentIndex(0);
    setIsPlaying(true);
    setError(null);
    const prefetchTargets = playlist.slice(0, 2);
    prefetchTargets.forEach(item => prefetchSummary(item.id));
    void playAtIndex(0);
  }, [session, news, playMode, listenedNews, playAtIndex, clearTransitionTimer, prefetchSummary]);

  // Stop playing
  const handleStop = useCallback(() => {
    clearTransitionTimer();
    stop();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setPlaylist([]);
    setCurrentIndex(0);
  }, [clearTransitionTimer, stop]);

  // Skip to next
  const handleSkip = useCallback(() => {
    clearTransitionTimer();
    stop();
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    void playAtIndex(nextIndex);
  }, [clearTransitionTimer, currentIndex, playAtIndex, stop]);

  // Skip to previous
  const handlePrevious = useCallback(() => {
    clearTransitionTimer();
    stop();
    const prevIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIndex);
    void playAtIndex(prevIndex);
  }, [clearTransitionTimer, currentIndex, playAtIndex, stop]);

  // Calculate progress
  const progress = playlist.length > 0 ? ((currentIndex) / playlist.length) * 100 : 0;
  const unlistenedCount = news.filter(item => !listenedNews.has(item.id)).length;
  const listenedCount = news.length - unlistenedCount;

  if (!ttsSupported) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}>
      {/* Collapsed button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 ${
            isDark
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          <span className="text-xl">🎧</span>
          <span className="font-medium">Listen All</span>
          {listenedCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-800' : 'bg-purple-700'}`}>
              {listenedCount}/{news.length}
            </span>
          )}
        </button>
      )}

      {/* Expanded player */}
      {isExpanded && (
        <div className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <span>🎧</span>
                Listen All News
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            {isPlaying && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1 opacity-75">
                  <span>Playing {currentIndex + 1} of {playlist.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className={`flex-1 text-center p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="font-bold text-lg text-orange-500">{listenedCount}</div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Listened</div>
              </div>
              <div className={`flex-1 text-center p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="font-bold text-lg text-purple-500">{unlistenedCount}</div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Remaining</div>
              </div>
            </div>

            {/* Play mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setPlayMode('unlistened')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  playMode === 'unlistened'
                    ? 'bg-purple-500 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Unlistened Only
              </button>
              <button
                onClick={() => setPlayMode('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  playMode === 'all'
                    ? 'bg-purple-500 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                All News
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Now playing */}
            {isPlaying && playlist[currentIndex] && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'} mb-1`}>
                  {isLoadingSummary ? 'Loading summary...' : isSpeaking ? 'Now playing:' : 'Up next:'}
                </div>
                <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} line-clamp-2`}>
                  {getDisplayTitle(playlist[currentIndex])}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Previous */}
              <button
                onClick={handlePrevious}
                disabled={!isPlaying || currentIndex === 0}
                className={`p-2 rounded-full transition-all disabled:opacity-30 ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              {/* Play/Stop */}
              {isPlaying ? (
                <button
                  onClick={handleStop}
                  className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-all"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}

              {/* Skip */}
              <button
                onClick={handleSkip}
                disabled={!isPlaying || currentIndex >= playlist.length - 1}
                className={`p-2 rounded-full transition-all disabled:opacity-30 ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Clear history button */}
            {listenedCount > 0 && !isPlaying && (
              <button
                onClick={clearHistory}
                className={`w-full py-2 text-sm rounded-lg transition-all ${
                  isDark
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Clear listen history
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
