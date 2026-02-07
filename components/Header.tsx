'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Language, translations } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import HornbillLogo from './HornbillLogo';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  lastUpdated?: Date;
}

export default function Header({ lang, onLanguageChange, lastUpdated }: HeaderProps) {
  const { data: session } = useSession();
  const t = translations[lang];

  return (
    <header className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-600 text-white shadow-lg">
      {/* Decorative Sarawak pattern bar */}
      <div className="h-1.5 sm:h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <HornbillLogo size="md" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-orange-100 text-xs sm:text-sm hidden xs:block">{t.subtitle}</p>
            </div>
          </Link>

          {/* Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            {/* Last Updated */}
            {lastUpdated && (
              <span className="text-orange-100 text-xs hidden lg:inline">
                {t.lastUpdated}: {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher
              currentLang={lang}
              onLanguageChange={onLanguageChange}
            />

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* AI Features Link */}
            <Link
              href="/ai-features"
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-purple-500/80 hover:bg-purple-400 text-white font-medium rounded-full transition-colors shadow-sm flex items-center gap-1"
            >
              <span>🤖</span>
              <span className="hidden sm:inline">AI Beta</span>
            </Link>

            {/* Donate Link */}
            <Link
              href="/donate"
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-full transition-colors shadow-sm flex items-center gap-1"
            >
              <span>☕</span>
              <span className="hidden sm:inline">{t.donate || 'Donate'}</span>
            </Link>

            {/* Auth */}
            {session ? (
              <div className="flex items-center gap-2">
                {/* User menu links */}
                <div className="hidden sm:flex items-center gap-1">
                  <Link
                    href="/bookmarks"
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    title={t.myBookmarks}
                  >
                    <span className="text-sm">⭐</span>
                  </Link>
                  <Link
                    href="/comments"
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    title={t.myComments || 'My Comments'}
                  >
                    <span className="text-sm">💬</span>
                  </Link>
                </div>
                <span className="hidden sm:inline text-sm text-orange-100">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {t.login}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
