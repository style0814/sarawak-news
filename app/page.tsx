import { getAllNews, getMetadata, NEWS_CATEGORIES } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export default function Home() {
  const { news, total, totalPages } = getAllNews(1, 20);
  const lastRefresh = getMetadata('last_refresh');

  return (
    <HomeClient
      initialNews={news}
      initialPagination={{
        page: 1,
        limit: 20,
        total,
        totalPages,
        hasMore: totalPages > 1,
      }}
      initialCategories={NEWS_CATEGORIES}
      initialLastRefresh={lastRefresh}
    />
  );
}
