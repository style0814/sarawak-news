import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";

const ADSENSE_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarawaknews.my';

export const metadata: Metadata = {
  title: {
    default: "Sarawak News - Real-time News from Sarawak, Malaysia",
    template: "%s | Sarawak News"
  },
  description: "Sarawak's leading news aggregator with AI-powered summaries. Real-time updates from Sarawak, Malaysia in English, Chinese (中文), and Malay (Bahasa Melayu). Covering politics, economy, culture, sports, and more.",
  keywords: ["Sarawak news", "Sarawak", "news", "Malaysia", "Kuching", "Borneo", "Dayak", "Iban", "berita Sarawak", "砂拉越新闻", "Sarawak politics", "Sarawak economy", "Borneo news"],
  authors: [{ name: "Sarawak News Team" }],
  creator: "Sarawak News",
  publisher: "Sarawak News",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en": "/",
      "zh": "/?lang=zh",
      "ms": "/?lang=ms"
    }
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    alternateLocale: ["zh_MY", "ms_MY"],
    url: siteUrl,
    siteName: "Sarawak News",
    title: "Sarawak News - Real-time News from Sarawak, Malaysia",
    description: "Sarawak's leading news aggregator with AI summaries. Real-time updates in English, Chinese, and Malay.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarawak News - Real-time News from Sarawak, Malaysia",
    description: "Sarawak's leading news aggregator with AI summaries. Real-time updates in English, Chinese, and Malay.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "news"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#065f46" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': `${siteUrl}/#website`,
                  url: siteUrl,
                  name: 'Sarawak News',
                  description: 'Real-time news aggregator for Sarawak, Malaysia with AI-powered summaries',
                  inLanguage: ['en', 'zh', 'ms'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${siteUrl}/?search={search_term_string}`
                    },
                    'query-input': 'required name=search_term_string'
                  }
                },
                {
                  '@type': 'Organization',
                  '@id': `${siteUrl}/#organization`,
                  name: 'Sarawak News',
                  url: siteUrl,
                  description: 'Sarawak\'s leading news aggregator covering politics, economy, culture, sports, and community discussions.',
                },
                {
                  '@type': 'CollectionPage',
                  '@id': `${siteUrl}/#webpage`,
                  url: siteUrl,
                  name: 'Sarawak News - Real-time News from Sarawak, Malaysia',
                  isPartOf: { '@id': `${siteUrl}/#website` },
                  about: { '@id': `${siteUrl}/#organization` },
                  description: 'Real-time news aggregator for Sarawak, Malaysia with AI-powered summaries in English, Chinese, and Malay.',
                  inLanguage: ['en', 'zh', 'ms']
                }
              ]
            })
          }}
        />
        {/* Google AdSense Script */}
        {ADSENSE_PUB_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${ADSENSE_PUB_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
