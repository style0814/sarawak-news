'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translations, getTimeAgo, getDomain } from '@/lib/i18n';
import CommentSection from '@/components/CommentSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ShareButtons from '@/components/ShareButtons';
import { useLanguage } from '@/components/LanguageProvider';

interface NewsItem {
  id: number;
  title: string;
  title_zh: string | null;
  title_ms: string | null;
  source_url: string;
  source_name: string;
  clicks: number;
  comment_count: number;
  created_at: string;
  category?: string;
}

interface NewsDetailProps {
  initialNews: NewsItem | null;
}

export default function NewsDetail({ initialNews }: NewsDetailProps) {
  const router = useRouter();
  const [news] = useState<NewsItem | null>(initialNews);
  const { lang, setLanguage } = useLanguage();

  const t = translations[lang];

  // Update document title when language changes
  useEffect(() => {
    if (news) {
      const displayTitle = lang === 'zh' && news.title_zh ? news.title_zh :
                          lang === 'ms' && news.title_ms ? news.title_ms : news.title;
      document.title = `${displayTitle} | Sarawak News`;
    }
  }, [news, lang]);

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">News not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-emerald-600 hover:underline"
          >
            {t.backToNews}
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = lang === 'zh' && news.title_zh ? news.title_zh :
                       lang === 'ms' && news.title_ms ? news.title_ms : news.title;
  const domain = getDomain(news.source_url);
  const timeAgo = getTimeAgo(news.created_at, lang);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors"
            >
              <span>←</span>
              <span>{t.backToNews}</span>
            </button>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLanguage} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* News Card */}
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{displayTitle}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-1.5">
              <span>📰</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{news.source_name}</span>
              <span className="text-gray-400 dark:text-gray-500">({domain})</span>
            </span>
            <span>{timeAgo}</span>
            <span className="flex items-center gap-1">
              <span>👁</span>
              <span>{news.clicks} {news.clicks === 1 ? t.point : t.points}</span>
            </span>
            {news.category && (
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs">
                {news.category}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={news.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
            >
              {t.readMore}
              <span>→</span>
            </a>

            {/* Share buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t.share}:</span>
              <ShareButtons url={news.source_url} title={displayTitle} size="md" variant="button" />
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <CommentSection newsId={news.id} lang={lang} />
      </main>
    </div>
  );
}
