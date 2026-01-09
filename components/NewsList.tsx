'use client';

import { Language, translations } from '@/lib/i18n';
import NewsItem from './NewsItem';

interface NewsData {
  id: number;
  title: string;
  title_zh?: string | null;
  title_ms?: string | null;
  source_url: string;
  source_name: string;
  clicks: number;
  comment_count: number;
  created_at: string;
}

interface NewsListProps {
  news: NewsData[];
  lang: Language;
  loading: boolean;
  onItemClick: (id: number) => void;
  onDiscussClick: (id: number) => void;
}

export default function NewsList({ news, lang, loading, onItemClick, onDiscussClick }: NewsListProps) {
  const t = translations[lang];

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center gap-3 text-emerald-600">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-lg font-medium">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">🦅</span>
        </div>
        <p className="text-gray-500 text-lg max-w-md mx-auto">{t.noNews}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {news.map((item, index) => (
        <NewsItem
          key={item.id}
          id={item.id}
          rank={index + 1}
          title={item.title}
          titleZh={item.title_zh}
          titleMs={item.title_ms}
          sourceUrl={item.source_url}
          sourceName={item.source_name}
          clicks={item.clicks}
          commentCount={item.comment_count || 0}
          createdAt={item.created_at}
          lang={lang}
          onItemClick={onItemClick}
          onDiscussClick={onDiscussClick}
        />
      ))}
    </div>
  );
}
