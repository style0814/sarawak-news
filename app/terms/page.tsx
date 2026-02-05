'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { translations } from '@/lib/i18n';

export default function TermsPage() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const t = translations[lang];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-emerald-50 to-white'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🦅</span>
              <span className="text-xl font-bold">{t.title}</span>
            </Link>
            <Link href="/" className="text-emerald-100 hover:text-white text-sm">
              ← {t.backToNews}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className={`text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Terms of Service
        </h1>

        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
          <section className={`rounded-2xl p-8 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Last updated: February 2024
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              1. Acceptance of Terms
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              By accessing and using Sarawak News, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              2. Description of Service
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Sarawak News is a news aggregation platform that collects and displays news articles from various external sources. We provide summaries, translations, and community discussion features to enhance your news reading experience.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              3. User Accounts
            </h2>
            <ul className={`list-disc pl-6 mb-6 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account.</li>
              <li>You must not share your account credentials with others.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              4. User Content
            </h2>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              When posting comments or other content, you agree to:
            </p>
            <ul className={`list-disc pl-6 mb-6 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Not post content that is illegal, harmful, threatening, abusive, or defamatory.</li>
              <li>Not post spam, advertisements, or promotional material.</li>
              <li>Not impersonate others or misrepresent your identity.</li>
              <li>Respect the intellectual property rights of others.</li>
              <li>Be respectful in discussions and avoid hate speech.</li>
            </ul>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We reserve the right to remove any content that violates these guidelines and to ban users who repeatedly violate our policies.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              5. News Content
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              The news articles displayed on our platform are sourced from third-party publishers. We do not create the original news content. The accuracy and reliability of news articles are the responsibility of their original publishers. When you click on a news article, you will be directed to the original publisher&apos;s website.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              6. AI-Generated Content
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Our AI summary feature generates automated summaries of news articles. These summaries are provided for convenience and may not capture all details of the original article. AI-generated summaries should not be considered a substitute for reading the full article. We do not guarantee the accuracy of AI-generated content.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              7. Intellectual Property
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              The Sarawak News platform, including its design, features, and original content, is owned by us. News articles belong to their respective publishers. You may not copy, modify, or distribute our platform without permission.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              8. Disclaimer of Warranties
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Our service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or secure. We are not responsible for any damages resulting from the use of our service.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              9. Limitation of Liability
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              To the maximum extent permitted by law, Sarawak News shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              10. Changes to Terms
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We may modify these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              11. Governing Law
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              These terms shall be governed by the laws of Malaysia. Any disputes shall be resolved in the courts of Sarawak, Malaysia.
            </p>

            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              12. Contact
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              If you have questions about these Terms of Service, please contact us through our <Link href="/ai-features" className="text-emerald-600 hover:underline">feedback form</Link>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link href="/about" className="hover:text-emerald-600">About</Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
