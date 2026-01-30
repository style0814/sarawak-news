'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { translations } from '@/lib/i18n';
import { useLanguage } from '@/components/LanguageProvider';

type PaymentMethod = 'duitnow' | 'sarawakpay';

export default function DonatePage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('duitnow');

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🦅</span>
              <span className="text-xl font-bold">Sarawak News</span>
            </Link>
            <Link href="/" className="text-emerald-100 hover:text-white text-sm">
              ← {t.backToNews || 'Back to News'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">☕</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.supportUs || 'Support Sarawak News'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t.donateDescription || 'All features are free! If you find this app useful, consider buying us a coffee.'}
          </p>
        </div>

        {/* Free Features Reminder */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
            <span>🎉</span>
            {t.allFeaturesFree || 'All Features Are Free!'}
          </h2>
          <ul className="space-y-2 text-emerald-700 dark:text-emerald-400 text-sm">
            <li className="flex items-center gap-2">
              <span>✓</span> {t.readAllNews || 'Read all news articles'}
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> {t.aiSummary || 'AI News Summary'}
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> {t.audioReadFree || 'Audio Read (Text-to-Speech)'}
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> {t.commentsBookmarks || 'Comments & Bookmarks'}
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> {t.multiLanguage || 'Multi-language support'}
            </li>
          </ul>
        </div>

        {/* Payment Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPaymentMethod('duitnow')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              paymentMethod === 'duitnow'
                ? 'bg-pink-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            DuitNow
          </button>
          <button
            onClick={() => setPaymentMethod('sarawakpay')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              paymentMethod === 'sarawakpay'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Sarawak Pay
          </button>
        </div>

        {/* QR Code Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            {paymentMethod === 'duitnow' ? (
              <>
                <div className="inline-block p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl mb-4">
                  <Image
                    src="/payments/duitnow-qr.jpeg"
                    alt="DuitNow QR Code - Public Bank"
                    width={256}
                    height={256}
                    className="rounded-xl"
                    priority
                  />
                </div>
                <p className="text-pink-600 dark:text-pink-400 font-semibold">
                  {t.scanWithDuitNow || 'Scan with any DuitNow-enabled banking app'}
                </p>
              </>
            ) : (
              <>
                <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                  <Image
                    src="/payments/sarawakpay-qr.jpeg"
                    alt="Sarawak Pay QR Code"
                    width={256}
                    height={256}
                    className="rounded-xl"
                    priority
                  />
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-semibold">
                  {t.scanWithSarawakPay || 'Scan with Sarawak Pay app'}
                </p>
              </>
            )}

            <div className="mt-6 text-gray-500 dark:text-gray-400 text-sm">
              <p>{t.anyAmountHelps || 'Any amount helps us keep the service running!'}</p>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-lg mb-2">🙏</p>
          <p>{t.thankYouSupport || 'Thank you for supporting Sarawak News!'}</p>
        </div>
      </main>
    </div>
  );
}
