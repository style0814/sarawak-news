'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import HornbillLogo from '@/components/HornbillLogo';
import { translations } from '@/lib/i18n';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';

type FeedbackOption = 'love_it' | 'needs_improvement' | 'not_needed';

export default function AIFeaturesPage() {
  const { lang } = useLanguage();
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const t = translations[lang];

  const [summaryRating, setSummaryRating] = useState<FeedbackOption | null>(null);
  const [voiceRating, setVoiceRating] = useState<FeedbackOption | null>(null);
  const [wantsPremium, setWantsPremium] = useState<boolean | null>(null);
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!session) {
      alert(t.loginToComment);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_features',
          summaryRating,
          voiceRating,
          wantsPremium,
          additionalFeedback
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-orange-50 to-white'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 text-white">
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HornbillLogo size="md" />
              <span className="text-xl font-bold">{t.title}</span>
            </Link>
            <Link href="/" className="text-orange-100 hover:text-white text-sm">
              ← {t.backToNews}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.aiFeaturesTitle}
          </h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            {t.experimentalNotice}
          </p>
        </div>

        {/* Experimental Notice */}
        <div className={`rounded-2xl p-6 mb-8 border ${isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
          <h2 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
            <span>⚠️</span>
            {t.experimentalFeatures}
          </h2>
          <ul className={`space-y-2 text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">🔊</span>
              <div>{t.voiceQualityNote}</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📝</span>
              <div>{t.aiNewsSummaryDesc}</div>
            </li>
          </ul>
        </div>

        {/* Current Features */}
        <div className={`rounded-2xl shadow-sm p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span>✨</span>
            {t.currentFeatures} ({t.free})
          </h2>
          <div className="space-y-4">
            <div className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>{t.aiSummary}</h3>
                <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  {t.aiNewsSummaryDesc}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
              <span className="text-2xl">🔊</span>
              <div>
                <h3 className={`font-medium ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>{t.audioReadFree}</h3>
                <p className={`text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  {t.browserTtsDesc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Future Possibilities */}
        <div className={`rounded-2xl p-6 mb-8 ${isDark ? 'bg-indigo-900/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
          <h2 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
            <span>🚀</span>
            {t.futureFeatures}
          </h2>
          <div className="space-y-3">
            <div className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white/50'}`}>
              <span className="text-xl">🎙️</span>
              <div>
                <h3 className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>{t.premiumAiVoice}</h3>
                <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {t.premiumAiVoiceDesc}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white/50'}`}>
              <span className="text-xl">🖼️</span>
              <div>
                <h3 className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>{t.newsImageGen}</h3>
                <p className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {t.newsImageGenDesc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        {isSubmitted ? (
          <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
            <div className="text-5xl mb-4">🙏</div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
              {t.thanksFeedback}
            </h2>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              {t.backToNews}
            </Link>
          </div>
        ) : (
          <div className={`rounded-2xl shadow-sm p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span>📋</span>
              {t.feedbackTitle}
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t.feedbackDesc}
            </p>

            {/* AI Summary Rating */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.howAiSummary}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'love_it', label: `😍 ${t.excellent}`, color: 'orange' },
                  { value: 'needs_improvement', label: `🤔 ${t.needsWork}`, color: 'amber' },
                  { value: 'not_needed', label: '👎', color: 'red' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSummaryRating(option.value as FeedbackOption)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      summaryRating === option.value
                        ? option.color === 'orange' ? 'bg-orange-500 text-white'
                        : option.color === 'amber' ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                        : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Rating */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.howVoice}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'love_it', label: `😍 ${t.good}`, color: 'orange' },
                  { value: 'needs_improvement', label: `🤔 ${t.needsWork}`, color: 'amber' },
                  { value: 'not_needed', label: '👎', color: 'red' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVoiceRating(option.value as FeedbackOption)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      voiceRating === option.value
                        ? option.color === 'orange' ? 'bg-orange-500 text-white'
                        : option.color === 'amber' ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                        : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Interest */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.interestedPremium}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setWantsPremium(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    wantsPremium === true
                      ? 'bg-purple-500 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 {t.yes}
                </button>
                <button
                  onClick={() => setWantsPremium(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    wantsPremium === false
                      ? 'bg-gray-500 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🆓 {t.maybe}
                </button>
              </div>
            </div>

            {/* Additional Comments */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t.additionalFeedback}
              </label>
              <textarea
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                placeholder="..."
                rows={4}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !session}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.submitting}
                </span>
              ) : !session ? (
                t.loginToComment
              ) : (
                t.submitFeedback
              )}
            </button>

            {!session && (
              <p className={`text-center text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Link href="/auth/login" className="text-orange-600 hover:underline">{t.login}</Link>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
