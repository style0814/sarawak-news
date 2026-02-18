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
}

interface ListenAllPlayerProps {
  news: NewsItem[];
  lang: Language;
}

// Local storage key for tracking listened news
const LISTENED_NEWS_KEY = 'sarawak_news_listened';

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

  // TTS hook
  const {
    speak,
    stop,
    isPlaying: isSpeaking,
    isSupported: ttsSupported,
    setLanguage: setTTSLang
  } = useSpeechSynthesis({ language: lang });

  // Sync TTS language and clear summary cache when language changes
  useEffect(() => {
    setTTSLang(lang);
    // Clear cached summaries when language changes (they're language-specific)
    summariesRef.current.clear();
    // Stop playback if language changes mid-play
    if (isPlayingRef.current) {
      stop();
      isPlayingRef.current = false;
      queueMicrotask(() => {
        setIsPlaying(false);
        setCurrentIndex(0);
        setPlaylist([]);
      });
    }
  }, [lang, setTTSLang, stop]);

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

  // Get display title based on language
  const getDisplayTitle = useCallback((item: NewsItem) => {
    return lang === 'zh' && item.title_zh ? item.title_zh :
           lang === 'ms' && item.title_ms ? item.title_ms : item.title;
  }, [lang]);

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

  const playAtIndex = useCallback(async (index: number) => {
    if (!isPlayingRef.current) return;

    const currentPlaylist = playlistRef.current;
    if (index >= currentPlaylist.length) {
      // Finished all items
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

    // Text to speak
    const textToSpeak = summary || getDisplayTitle(currentItem);

    // Mark as listened
    markAsListened(currentItem.id);

    // Speak the text
    speak(textToSpeak);
  }, [fetchSummary, getDisplayTitle, markAsListened, speak]);

  // Monitor when speech ends to play next
  useEffect(() => {
    if (!isSpeaking && isPlaying && !isLoadingSummary) {
      // Speech ended, move to next
      const timeout = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        void playAtIndex(nextIndex);
      }, 1000); // 1 second pause between items
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, isSpeaking, isPlaying, isLoadingSummary, playAtIndex]);

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

    playlistRef.current = playlist;
    setPlaylist(playlist);
    isPlayingRef.current = true;
    setCurrentIndex(0);
    setIsPlaying(true);
    setError(null);
    void playAtIndex(0);
  }, [session, news, playMode, listenedNews, playAtIndex]);

  // Stop playing
  const handleStop = useCallback(() => {
    stop();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setPlaylist([]);
    setCurrentIndex(0);
  }, [stop]);

  // Skip to next
  const handleSkip = useCallback(() => {
    stop();
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    void playAtIndex(nextIndex);
  }, [currentIndex, playAtIndex, stop]);

  // Skip to previous
  const handlePrevious = useCallback(() => {
    stop();
    const prevIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIndex);
    void playAtIndex(prevIndex);
  }, [currentIndex, playAtIndex, stop]);

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
