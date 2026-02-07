'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePremium } from './PremiumProvider';
import { useLanguage } from './LanguageProvider';
import { translations } from '@/lib/i18n';

interface PremiumFeatureProps {
  children: ReactNode;
  feature: 'aiSummary' | 'audioRead' | 'newsImages';
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export default function PremiumFeature({
  children,
  feature,
  fallback,
  showUpgradePrompt = true
}: PremiumFeatureProps) {
  const { data: session } = useSession();
  const { isPremium, loading } = usePremium();
  const { lang } = useLanguage();
  const t = translations[lang];

  // While loading, show nothing or a placeholder
  if (loading) {
    return fallback || null;
  }

  // If premium, show the feature
  if (isPremium) {
    return <>{children}</>;
  }

  // If not premium and no upgrade prompt needed, show fallback
  if (!showUpgradePrompt) {
    return fallback || null;
  }

  // Feature names for display
  const featureNames: Record<string, string> = {
    aiSummary: t.aiSummary || 'AI News Summary',
    audioRead: t.audioRead || 'Audio Read (AI Voice)',
    newsImages: t.newsImages || 'News Images'
  };

  // Show upgrade prompt
  return (
    <div className="relative">
      {/* Blurred/disabled content preview */}
      <div className="opacity-50 pointer-events-none blur-sm select-none">
        {fallback || children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white dark:via-gray-900/80 dark:to-gray-900">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t.premiumFeature || 'Premium Feature'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {featureNames[feature]} {t.isPremiumOnly || 'is available for Premium users only.'}
          </p>
          {session ? (
            <Link
              href="/pricing"
              className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-semibold rounded-full hover:from-yellow-500 hover:to-amber-600 transition-all shadow-md"
            >
              {t.upgradeToPremium || 'Upgrade to Premium'}
            </Link>
          ) : (
            <Link
              href="/auth/login?redirect=/pricing"
              className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-amber-600 transition-all shadow-md"
            >
              {t.loginToUpgrade || 'Login to Upgrade'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Premium badge component for showing premium-only indicators
export function PremiumBadge({ className = '' }: { className?: string }) {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-sm ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {t.premium || 'Premium'}
    </span>
  );
}

// Simple premium check hook result display
export function PremiumOnly({ children }: { children: ReactNode }) {
  const { isPremium, loading } = usePremium();

  if (loading) return null;
  if (!isPremium) return null;

  return <>{children}</>;
}

// Show content only for free users
export function FreeOnly({ children }: { children: ReactNode }) {
  const { isPremium, loading } = usePremium();

  if (loading) return null;
  if (isPremium) return null;

  return <>{children}</>;
}
