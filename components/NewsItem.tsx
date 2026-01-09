'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Language, translations, getTimeAgo, getDomain } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';
import ShareButtons from './ShareButtons';

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
  createdAt,
  lang,
  onItemClick,
  onDiscussClick
}: NewsItemProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
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

            {/* Discuss button */}
            <button
              onClick={() => onDiscussClick(id)}
              className={`ml-auto px-3 py-1 text-sm font-medium text-emerald-600 rounded-full transition-colors ${isDark ? 'hover:bg-emerald-900/50' : 'hover:bg-emerald-100'}`}
            >
              {t.discuss} →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
