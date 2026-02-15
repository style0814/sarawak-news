import { Metadata } from 'next';
import { getNewsById, incrementClicks, getNewsSummary } from '@/lib/db';
import NewsDetail from '@/components/NewsDetail';

interface Props {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const newsId = parseInt(id, 10);
  const news = getNewsById(newsId);

  if (!news) {
    return {
      title: 'News Not Found',
      description: 'The requested news article could not be found.'
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarawaknews.my';
  const newsUrl = `${siteUrl}/news/${news.id}`;
  const summary = getNewsSummary(newsId);
  const description = summary?.summary_en
    ? summary.summary_en.slice(0, 200)
    : `${news.title} - Read more from ${news.source_name}. News from Sarawak, Malaysia.`;

  return {
    title: news.title,
    description,
    keywords: [news.source_name, news.category || 'general', 'Sarawak', 'news', 'Malaysia'],
    alternates: {
      canonical: newsUrl
    },
    openGraph: {
      type: 'article',
      url: newsUrl,
      title: news.title,
      description,
      siteName: 'Sarawak News',
      publishedTime: news.published_at || news.created_at,
      authors: [news.source_name],
      section: news.category || 'general',
      tags: [news.source_name, news.category || 'general', 'Sarawak']
    },
    twitter: {
      card: 'summary',
      title: news.title,
      description,
    }
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const newsId = parseInt(id, 10);

  // Fetch and increment clicks
  const news = incrementClicks(newsId);
  const summary = news ? getNewsSummary(newsId) : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarawaknews.my';

  const jsonLd = news ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    description: summary?.summary_en || `${news.title} - News from ${news.source_name}`,
    ...(summary?.summary_en ? { articleBody: summary.summary_en } : {}),
    url: `${siteUrl}/news/${news.id}`,
    datePublished: news.published_at || news.created_at,
    dateModified: news.created_at,
    author: {
      '@type': 'Organization',
      name: news.source_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sarawak News',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/news/${news.id}`,
    },
    articleSection: news.category || 'general',
    inLanguage: 'en',
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <NewsDetail
        initialNews={news}
        initialSummary={summary ? {
          summary_en: summary.summary_en,
          summary_zh: summary.summary_zh,
          summary_ms: summary.summary_ms,
        } : null}
      />
    </>
  );
}
