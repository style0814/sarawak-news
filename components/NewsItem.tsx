'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Language, translations, getTimeAgo, getDomain } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';
import ShareButtons from './ShareButtons';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface NewsItemProps {
  id: number;
  rank: number;
  title: string;
  titleZh?: string | null;
  titleMs?: string | null;
  sourceUrl: string;
  sourceName: string;
  clicks: number;
  commentCount: number;
  summaryViews: number;
  ttsListens: number;
  createdAt: string;
  lang: Language;
  onItemClick: (id: number) => void;
  onDiscussClick: (id: number) => void;
}

export default function NewsItem({
  id,
  rank,
  title,
  titleZh,
  titleMs,
  sourceUrl,
  sourceName,
  clicks,
  commentCount,
  summaryViews,
  ttsListens,
  createdAt,
  lang,
  onItemClick,
  onDiscussClick
}: NewsItemProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isTitleOnly, setIsTitleOnly] = useState(false);
  const [localSummaryViews, setLocalSummaryViews] = useState(summaryViews);
  const [localTtsListens, setLocalTtsListens] = useState(ttsListens);

  // TTS for summary
  const { speak, stop, isPlaying, isSupported: ttsSupported, setLanguage: setTTSLang } = useSpeechSynthesis({ language: lang });

  // Sync TTS language and clear summary when language changes
  useEffect(() => {
    setTTSLang(lang);
    // Clear summary when language changes (summaries are language-specific)
    if (summary) {
      setSummary(null);
      setShowSummary(false);
      setIsTitleOnly(false);
    }
    if (isPlaying) {
      stop();
    }
  }, [lang, setTTSLang]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = translations[lang];
  const domain = getDomain(sourceUrl);
  const timeAgo = getTimeAgo(createdAt, lang);

  // Get translated title based on language
  const displayTitle = lang === 'zh' && titleZh ? titleZh :
                       lang === 'ms' && titleMs ? titleMs : title;

  const handleClick = () => {
    onItemClick(id);
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBookmark = async () => {
    if (!session) return;
    setBookmarkLoading(true);
    // Optimistic update
    setIsBookmarked(!isBookmarked);
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news_id: id })
      });
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.bookmarked);
      } else {
        // Revert on error
        setIsBookmarked(isBookmarked);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      // Revert on error
      setIsBookmarked(isBookmarked);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Generate AI Summary
  const handleSummarize = async () => {
    if (summary) {
      // Toggle visibility if already have summary
      setShowSummary(!showSummary);
      if (isPlaying) stop();
      return;
    }

    if (!session) {
      alert(t.loginToComment || 'Please login to use this feature');
      return;
    }

    setIsLoadingSummary(true);
    setShowSummary(true);

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId: id, language: lang })
      });

      const data = await response.json();

      if (response.ok && data.summary) {
        setSummary(data.summary);
        setIsTitleOnly(data.summary.length < 100 || data.titleOnly);
        // Track summary view
        setLocalSummaryViews(prev => prev + 1);
        fetch(`/api/news/${id}/summary-view`, { method: 'POST' }).catch(() => {});
      } else {
        setSummary(data.error || 'Failed to generate summary');
        setIsTitleOnly(true);
      }
    } catch {
      setSummary('Failed to generate summary. Please try again.');
      setIsTitleOnly(true);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Read summary aloud
  const handleReadSummary = () => {
    if (isPlaying) {
      stop();
    } else if (summary) {
      speak(summary);
      // Track TTS listen
      setLocalTtsListens(prev => prev + 1);
      fetch(`/api/news/${id}/tts-listen`, { method: 'POST' }).catch(() => {});
    }
  };

  return (
    <article className={`group p-4 transition-all duration-200 border-b last:border-b-0 ${
      isDark
        ? 'hover:bg-gray-700/50 border-gray-700'
        : 'hover:bg-emerald-50/50 border-gray-100'
    }`}>
      <div className="flex gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-shadow">
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="mb-2">
            <button
              onClick={handleClick}
              className={`text-left text-lg font-medium hover:text-emerald-600 transition-colors leading-snug ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
            >
              {displayTitle}
            </button>
          </h3>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {/* Source */}
            <span className={`inline-flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                📰
              </span>
              <span className="font-medium text-emerald-600">{sourceName}</span>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>({domain})</span>
            </span>

            {/* Time */}
            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {timeAgo}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Views */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-emerald-500">👁</span>
              <span className="font-semibold text-emerald-600">{clicks}</span>
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{clicks === 1 ? t.point : t.points}</span>
            </div>

            {/* Comments */}
            <button
              onClick={() => onDiscussClick(id)}
              className={`flex items-center gap-1.5 text-sm hover:text-emerald-600 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <span>💬</span>
              <span className="font-semibold">{commentCount}</span>
              <span>{commentCount === 1 ? t.comment : t.comments}</span>
            </button>

            {/* AI Summary views */}
            {localSummaryViews > 0 && (
              <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <span className="text-purple-500">🤖</span>
                <span className="font-semibold text-purple-500">{localSummaryViews}</span>
              </div>
            )}

            {/* TTS listens */}
            {localTtsListens > 0 && (
              <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <span className="text-blue-500">🔊</span>
                <span className="font-semibold text-blue-500">{localTtsListens}</span>
              </div>
            )}

            {/* Bookmark button */}
            {session && (
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`flex items-center gap-1 text-sm transition-all ${
                  bookmarkLoading ? 'opacity-50' :
                  isBookmarked ? 'text-yellow-500 scale-110' : isDark ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                }`}
                title={isBookmarked ? t.bookmarked : t.bookmark}
              >
                <span className="text-lg">{isBookmarked ? '⭐' : '☆'}</span>
              </button>
            )}

            {/* Share buttons */}
            <ShareButtons url={sourceUrl} title={displayTitle} size="sm" />

            {/* AI Summary button */}
            <button
              onClick={handleSummarize}
              disabled={isLoadingSummary}
              className={`flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full transition-all ${
                showSummary
                  ? 'bg-purple-500 text-white'
                  : isDark
                    ? 'text-purple-400 hover:bg-purple-900/50'
                    : 'text-purple-600 hover:bg-purple-100'
              } ${isLoadingSummary ? 'opacity-50' : ''}`}
            >
              {isLoadingSummary ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>AI...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>{showSummary ? (t.hide || 'Hide') : 'AI'}</span>
                </>
              )}
            </button>

            {/* Discuss button */}
            <button
              onClick={() => onDiscussClick(id)}
              className={`ml-auto px-3 py-1 text-sm font-medium text-emerald-600 rounded-full transition-colors ${isDark ? 'hover:bg-emerald-900/50' : 'hover:bg-emerald-100'}`}
            >
              {t.discuss} →
            </button>
          </div>

          {/* AI Summary Panel - Slide out animation */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showSummary ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    {t.aiGeneratedSummary}
                  </span>
                  {isTitleOnly && summary && !isLoadingSummary && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                      {t.titleOnly || 'Based on title only'}
                    </span>
                  )}
                </div>

                {/* TTS Button */}
                {summary && !isLoadingSummary && ttsSupported && (
                  <button
                    onClick={handleReadSummary}
                    className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-full transition-all ${
                      isPlaying
                        ? 'bg-emerald-500 text-white'
                        : isDark
                          ? 'text-gray-300 hover:bg-gray-600'
                          : 'text-gray-600 hover:bg-purple-100'
                    }`}
                    title={isPlaying ? t.stopAudio : t.listenToArticle}
                  >
                    {isPlaying ? (
                      <>
                        <span className="flex gap-0.5">
                          <span className="w-1 h-3 bg-white rounded animate-pulse"></span>
                          <span className="w-1 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                        </span>
                        <span>{t.stopAudio}</span>
                      </>
                    ) : (
                      <>
                        <span>🔊</span>
                        <span>{t.listenToArticle}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Summary Content */}
              {isLoadingSummary ? (
                <div className="flex items-center gap-2">
                  <div className={`h-2 rounded-full animate-pulse ${isDark ? 'bg-gray-600' : 'bg-purple-200'}`} style={{ width: '80%' }}></div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
