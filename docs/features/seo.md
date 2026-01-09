# SEO Optimization

## Overview

The Sarawak News application implements comprehensive SEO (Search Engine Optimization) features to improve discoverability and social sharing.

## Features

- **Dynamic Metadata** - Per-page titles and descriptions
- **Open Graph Tags** - Rich previews on Facebook, LinkedIn
- **Twitter Cards** - Rich previews on Twitter/X
- **Robots.txt** - Crawler directives
- **Dynamic Sitemap** - Auto-updated XML sitemap
- **Structured Data** - JSON-LD schema markup

## Implementation

### Root Layout Metadata

**File:** `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: {
    default: 'Sarawak News - Real-time News from Sarawak',
    template: '%s | Sarawak News'
  },
  description: 'Stay updated with the latest news from Sarawak...',
  keywords: ['Sarawak', 'news', 'Malaysia', 'Borneo', ...],
  authors: [{ name: 'Sarawak News' }],
  creator: 'Sarawak News',
  publisher: 'Sarawak News',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sarawak-news.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-MY': '/en',
      'zh-MY': '/zh',
      'ms-MY': '/ms',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: 'https://sarawak-news.com',
    siteName: 'Sarawak News',
    title: 'Sarawak News - Real-time News from Sarawak',
    description: '...',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sarawak News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sarawak News',
    description: '...',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};
```

### Dynamic Page Metadata

**File:** `app/news/[id]/page.tsx`

```typescript
import { Metadata } from 'next';
import { getNewsById } from '@/lib/db';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const news = getNewsById(parseInt(id, 10));

  if (!news) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: news.title,
    description: news.content?.substring(0, 160) || `Read about ${news.title}`,
    openGraph: {
      title: news.title,
      description: news.content?.substring(0, 160),
      type: 'article',
      publishedTime: news.created_at,
      authors: [news.source_name],
      images: news.image_url ? [news.image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: news.content?.substring(0, 160),
    },
  };
}
```

## Robots.txt

**File:** `app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
    ],
    sitemap: 'https://sarawak-news.com/sitemap.xml',
  };
}
```

**Generated output:**

```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/

Sitemap: https://sarawak-news.com/sitemap.xml
```

## Dynamic Sitemap

**File:** `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';
import { getAllNewsIds } from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sarawak-news.com';

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    { url: `${baseUrl}/bookmarks`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
  ];

  // Dynamic news pages
  const newsIds = getAllNewsIds();
  const newsPages = newsIds.map(({ id, created_at }) => ({
    url: `${baseUrl}/news/${id}`,
    lastModified: new Date(created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...newsPages];
}
```

**Generated output (sitemap.xml):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sarawak-news.com</loc>
    <lastmod>2024-01-15T10:00:00.000Z</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://sarawak-news.com/news/123</loc>
    <lastmod>2024-01-14T08:30:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- More URLs... -->
</urlset>
```

## Open Graph Preview

When shared on social media, articles display:

```
┌─────────────────────────────────────────┐
│  [Image Preview]                        │
│                                         │
│  Sarawak News                           │
│  Article Title Here                     │
│  Description of the article...          │
└─────────────────────────────────────────┘
```

## Database Functions

### getAllNewsIds()

```typescript
export function getAllNewsIds(): { id: number; created_at: string }[]
```

Returns all news IDs for sitemap generation.

## Page Types

### Home Page (/)

- Title: "Sarawak News - Real-time News from Sarawak"
- Canonical: "https://sarawak-news.com"
- Priority: 1.0
- Change frequency: hourly

### News Article (/news/[id])

- Title: Article title
- Description: First 160 chars of content
- Open Graph type: article
- Published time: Article timestamp
- Author: Source name

### Bookmarks (/bookmarks)

- Title: "My Bookmarks | Sarawak News"
- No index (user-specific content)

### Admin (/admin/*)

- No index, no follow
- Blocked in robots.txt

## Best Practices

### Title Tags

- Keep under 60 characters
- Include primary keyword
- Use template: "%s | Sarawak News"

### Meta Descriptions

- Keep between 150-160 characters
- Include call-to-action
- Unique per page

### Images

- Provide Open Graph image (1200x630px)
- Include alt text
- Optimize file size

### URLs

- Use descriptive slugs
- Avoid query parameters when possible
- Implement canonical URLs

## Testing SEO

### Tools

1. **Google Search Console** - Index status, crawl errors
2. **Facebook Sharing Debugger** - Test Open Graph tags
3. **Twitter Card Validator** - Test Twitter cards
4. **Lighthouse** - SEO audit score

### Manual Testing

```bash
# View robots.txt
curl https://sarawak-news.com/robots.txt

# View sitemap
curl https://sarawak-news.com/sitemap.xml

# Check meta tags
curl -s https://sarawak-news.com | grep -E '<(title|meta)'
```

## Environment Variables

```env
# Set base URL for production
NEXT_PUBLIC_SITE_URL=https://sarawak-news.com

# Google verification
GOOGLE_SITE_VERIFICATION=your-code
```

## Future Improvements

- JSON-LD structured data for articles
- AMP pages for mobile
- Breadcrumb schema
- News sitemap (for Google News)
- hreflang tags for language versions
