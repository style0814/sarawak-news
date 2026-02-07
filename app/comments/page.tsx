'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, getTimeAgo } from '@/lib/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';

interface UserComment {
  id: number;
  content: string;
  likes: number;
  created_at: string;
  news_id: number;
  news_title: string;
}

export default function CommentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const t = translations[lang];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchComments(page);
    }
  }, [status, router, page]);

  const fetchComments = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/comments?page=${pageNum}`);
      const data = await response.json();
      setComments(data.comments || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading && page === 1)) {
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
          <div>
            <h1 className="text-xl font-bold">{t.myComments || 'My Comments'}</h1>
            <p className="text-sm text-orange-100">{total} {t.totalCommentsMade || 'comments made'}</p>
          </div>
          <Link href="/" className="text-orange-100 hover:text-white">
            {t.backToNews}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {comments.length === 0 && !loading ? (
          <div className={`p-8 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <span className="text-4xl mb-4 block">💬</span>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t.noCommentsYet || 'You haven\'t made any comments yet'}</p>
            <Link href="/" className="text-orange-600 hover:underline mt-4 inline-block">
              {t.backToNews}
            </Link>
          </div>
        ) : (
          <>
            <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className={`p-4 ${
                    index !== comments.length - 1 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}` : ''
                  }`}
                >
                  {/* News title link */}
                  <Link
                    href={`/news/${comment.news_id}`}
                    className={`text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline block mb-2`}
                  >
                    {comment.news_title}
                  </Link>

                  {/* Comment content */}
                  <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {comment.content}
                  </p>

                  {/* Meta info */}
                  <div className={`text-sm mt-2 flex items-center gap-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{getTimeAgo(comment.created_at, lang)}</span>
                    <span className="flex items-center gap-1">
                      <span>❤️</span>
                      <span>{comment.likes} {comment.likes === 1 ? t.like : (t.likes || 'likes')}</span>
                    </span>
                    <Link
                      href={`/news/${comment.news_id}`}
                      className="text-orange-600 hover:underline"
                    >
                      {t.viewDiscussion || 'View discussion'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === 1 || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {t.previous}
                </button>
                <span className={`px-4 py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t.page} {page} {t.of} {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === totalPages || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {t.next}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
