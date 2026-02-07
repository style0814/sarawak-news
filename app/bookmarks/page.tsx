'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, getTimeAgo } from '@/lib/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';

interface NewsItem {
  id: number;
  title: string;
  title_zh?: string | null;
  title_ms?: string | null;
  source_url: string;
  source_name: string;
  clicks: number;
  created_at: string;
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const [bookmarks, setBookmarks] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchBookmarks();
    }
  }, [status, router]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      const data = await response.json();
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (newsId: number) => {
    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news_id: newsId })
      });
      setBookmarks(bookmarks.filter(b => b.id !== newsId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const getTitle = (item: NewsItem) => {
    if (lang === 'zh' && item.title_zh) return item.title_zh;
    if (lang === 'ms' && item.title_ms) return item.title_ms;
    return item.title;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-orange-50 to-white'}`}>
      <header className="bg-gradient-to-r from-orange-700 to-amber-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t.myBookmarks}</h1>
          <Link href="/" className="text-orange-100 hover:text-white">
            {t.backToNews}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {bookmarks.length === 0 ? (
          <div className={`p-8 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <span className="text-4xl mb-4 block">📚</span>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t.noBookmarks}</p>
            <Link href="/" className="text-orange-600 hover:underline mt-4 inline-block">
              {t.backToNews}
            </Link>
          </div>
        ) : (
          <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {bookmarks.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 flex items-start gap-4 ${
                  index !== bookmarks.length - 1 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}` : ''
                }`}
              >
                <div className="flex-1">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-medium hover:text-orange-600 ${isDark ? 'text-white' : 'text-gray-800'}`}
                  >
                    {getTitle(item)}
                  </a>
                  <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.source_name} • {getTimeAgo(item.created_at, lang)} • {item.clicks} {t.points}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBookmark(item.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remove bookmark"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
