import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

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
    default: "Sarawak News - Real-time News from Sarawak",
    template: "%s | Sarawak News"
  },
  description: "Real-time news aggregator for Sarawak, Malaysia. Community discussions, multi-language support in English, Chinese (中文), and Malay (Bahasa Melayu).",
  keywords: ["Sarawak", "news", "Malaysia", "Kuching", "Borneo", "Dayak", "Iban", "berita", "新闻"],
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
    title: "Sarawak News - Real-time News from Sarawak",
    description: "Real-time news aggregator for Sarawak, Malaysia. Community discussions and multi-language support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sarawak News - Voice of the Land of Hornbills"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarawak News - Real-time News from Sarawak",
    description: "Real-time news aggregator for Sarawak, Malaysia. Community discussions and multi-language support.",
    images: ["/og-image.png"]
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
    // Add your verification codes here
    // google: "your-google-verification-code",
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
