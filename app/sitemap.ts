import { MetadataRoute } from 'next';
import { getAllNews } from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarawaknews.my';

  // Static pages (only publicly accessible, indexable pages)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/ai-features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Get all news for dynamic pages (limit to recent 1000 for performance)
  const { news } = getAllNews(1, 1000);

  const newsPages: MetadataRoute.Sitemap = news.map((item) => ({
    url: `${siteUrl}/news/${item.id}`,
    lastModified: new Date(item.published_at || item.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...newsPages];
}
