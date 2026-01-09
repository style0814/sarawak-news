'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Language, translations, getTimeAgo } from '@/lib/i18n';

interface Comment {
  id: number;
  news_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  likes: number;
  created_at: string;
  replies?: Comment[];
  author?: { id: number; display_name: string };
  user_liked?: boolean;
}

interface CommentSectionProps {
  newsId: number;
  lang: Language;
}

function CommentItem({
  comment,
  lang,
  depth,
  onReply,
  onLike,
  isLoggedIn
}: {
  comment: Comment;
  lang: Language;
  depth: number;
  onReply: (parentId: number) => void;
  onLike: (commentId: number) => void;
  isLoggedIn: boolean;
}) {
  const t = translations[lang];
  const timeAgo = getTimeAgo(comment.created_at, lang);
  const maxDepth = 4;

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-emerald-100' : ''}`}>
      <div className="py-3">
        {/* Comment Header */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
            {comment.author?.display_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="font-semibold text-gray-800 text-sm sm:text-base">{comment.author?.display_name || 'Anonymous'}</span>
          <span className="text-gray-400 text-xs sm:text-sm">{timeAgo}</span>
        </div>

        {/* Comment Content */}
        <p className="text-gray-700 mb-2 pl-9 sm:pl-10 text-sm sm:text-base break-words">{comment.content}</p>

        {/* Comment Actions */}
        <div className="flex items-center gap-3 sm:gap-4 pl-9 sm:pl-10 text-xs sm:text-sm">
          <button
            onClick={() => isLoggedIn ? onLike(comment.id) : null}
            className={`flex items-center gap-1 transition-colors ${
              isLoggedIn
                ? comment.user_liked
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-emerald-600'
                : 'text-gray-400 cursor-default'
            }`}
            title={isLoggedIn ? '' : t.loginToLike}
          >
            <span>{comment.user_liked ? '👍' : '👍'}</span>
            <span>{comment.likes}</span>
            {comment.user_liked && <span className="text-xs">({t.liked})</span>}
          </button>
          {depth < maxDepth && isLoggedIn && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-gray-500 hover:text-emerald-600 transition-colors"
            >
              {t.reply}
            </button>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              lang={lang}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ newsId, lang }: CommentSectionProps) {
  const { data: session } = useSession();
  const t = translations[lang];
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isLoggedIn = !!session?.user;

  useEffect(() => {
    fetchComments();
  }, [newsId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?newsId=${newsId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news_id: newsId,
          parent_id: replyingTo,
          content: content.trim()
        })
      });

      if (response.ok) {
        setContent('');
        setReplyingTo(null);
        await fetchComments();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    if (!isLoggedIn) return;

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      if (response.ok) {
        await fetchComments();
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReply = (parentId: number) => {
    setReplyingTo(parentId);
    document.getElementById('comment-textarea')?.focus();
  };

  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countAllComments(comments);

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        {t.loading}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
        <span>💬</span>
        {totalComments} {totalComments === 1 ? t.comment : t.comments}
      </h3>

      {/* Comment Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-emerald-600">
              <span>↳ {t.reply}...</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
          {error && (
            <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <textarea
              id="comment-textarea"
              placeholder={t.writeComment}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base"
              required
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="flex-shrink-0 px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
            >
              {submitting ? '...' : t.submit}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 sm:mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500 mb-2">{t.loginToComment}</p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
          >
            {t.login}
          </Link>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <span className="text-3xl sm:text-4xl mb-2 block">💭</span>
          <p className="text-sm sm:text-base">Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              lang={lang}
              depth={0}
              onReply={handleReply}
              onLike={handleLike}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
