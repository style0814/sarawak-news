'use client';

import Link from 'next/link';
import HornbillLogo from '@/components/HornbillLogo';
import { translations } from '@/lib/i18n';
import { useLanguage } from '@/components/LanguageProvider';

export default function FeaturesPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 text-white">
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HornbillLogo size="md" className="text-white" />
              <span className="text-xl font-bold">Sarawak News</span>
            </Link>
            <Link href="/" className="text-orange-100 hover:text-white text-sm">
              ← Back to News
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.allFeaturesFree || 'All Features Are Free!'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t.donateDescription || 'All features are free! If you find this app useful, consider buying us a coffee.'}
          </p>
        </div>

        {/* Features Card */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl p-8 text-white max-w-lg mx-auto mb-8">
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full mb-4">
              {t.free || 'FREE'}
            </div>
            <h2 className="text-2xl font-bold">{t.allFeatures || 'All Features'}</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold">RM 0</span>
              <span className="text-orange-100">/forever</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              {t.readAllNews || 'Read all news articles'}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              <strong>{t.aiSummary || 'AI News Summary'}</strong>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              <strong>{t.audioReadFree || 'Audio Read (Text-to-Speech)'}</strong>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              {t.commentsBookmarks || 'Comments & Bookmarks'}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              {t.multiLanguage || 'Multi-language support'}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              {t.searchFilters || 'Search with filters'}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-yellow-300">✓</span>
              Dark mode
            </li>
          </ul>

          <Link
            href="/"
            className="w-full block py-3 px-6 rounded-xl bg-white text-orange-600 font-bold hover:bg-orange-50 transition-colors shadow-lg text-center"
          >
            {t.startReading || 'Start Reading'}
          </Link>
        </div>

        {/* Donate Section */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t.enjoyApp || 'Enjoying the app?'}
          </p>
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-orange-600 transition-all shadow-lg"
          >
            <span>☕</span>
            {t.buyUsACoffee || 'Buy us a coffee'}
          </Link>
        </div>
      </main>
    </div>
  );
}
