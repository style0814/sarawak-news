'use client';

import Link from 'next/link';
import HornbillLogo from '@/components/HornbillLogo';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { translations } from '@/lib/i18n';

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const t = translations[lang];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-orange-50 to-white'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 text-white">
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HornbillLogo size="md" className="text-white" />
              <span className="text-xl font-bold">{t.title}</span>
            </Link>
            <Link href="/" className="text-orange-100 hover:text-white text-sm">
              ← {t.backToNews}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className={`text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Privacy Policy
        </h1>

        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
          <section className={`rounded-2xl p-8 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Last updated: February 2024
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              1. Introduction
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Sarawak News (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our news aggregation service.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              2. Information We Collect
            </h2>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We collect information you provide directly to us:
            </p>
            <ul className={`list-disc pl-6 mb-6 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li><strong>Account Information:</strong> Username, email address, and display name when you register.</li>
              <li><strong>User Content:</strong> Comments you post on news articles.</li>
              <li><strong>Preferences:</strong> Language and theme settings.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, and interaction with news articles.</li>
            </ul>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              3. How We Use Your Information
            </h2>
            <ul className={`list-disc pl-6 mb-6 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>To provide and maintain our service</li>
              <li>To personalize your experience (language, theme preferences)</li>
              <li>To enable commenting and community features</li>
              <li>To improve our service based on usage patterns</li>
              <li>To communicate important updates</li>
            </ul>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              4. Data Storage
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Your data is stored securely on our servers. We retain your account information as long as your account is active. Comments and interactions may be retained to maintain the integrity of discussions.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              5. Third-Party Services
            </h2>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We use the following third-party services:
            </p>
            <ul className={`list-disc pl-6 mb-6 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li><strong>News Sources:</strong> We aggregate news from external publishers. When you click a news link, you visit their site and are subject to their privacy policies.</li>
              <li><strong>AI Services:</strong> We use Groq AI for generating news summaries. No personal data is shared with AI services.</li>
              <li><strong>Google AdSense:</strong> We display advertisements through Google AdSense. Google may use cookies to personalize ads.</li>
            </ul>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              6. Cookies
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We use essential cookies for authentication and preferences. Third-party advertising partners may use cookies to display relevant ads. You can control cookie preferences through your browser settings.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              7. Your Rights
            </h2>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              You have the right to:
            </p>
            <ul className={`list-disc pl-6 mb-6 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Access your personal data</li>
              <li>Update your account information</li>
              <li>Delete your account</li>
              <li>Opt out of non-essential data collection</li>
            </ul>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              8. Children&apos;s Privacy
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              9. Changes to This Policy
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              10. Contact Us
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              If you have any questions about this Privacy Policy, please contact us through the feedback form on our <Link href="/ai-features" className="text-orange-600 hover:underline">AI Features</Link> page.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link href="/about" className="hover:text-orange-600">About</Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-orange-600">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
