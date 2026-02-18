'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Language } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

const STORAGE_KEY = 'sarawak-news-lang';
const VALID_LANGUAGES: Language[] = ['en', 'zh', 'ms'];

function getLocalLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage first
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (saved && VALID_LANGUAGES.includes(saved)) {
    return saved;
  }

  // Detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ms') || browserLang.startsWith('my')) return 'ms';

  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [lang, setLang] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  const hasFetchedPrefs = useRef(false);

  // Initialize language on mount (use local storage first)
  useEffect(() => {
    // Initial client-side hydration of persisted language.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(getLocalLanguage());
    setIsInitialized(true);
  }, []);

  // Persist language changes locally after initial hydration
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, isInitialized]);

  // Fetch user preferences from database when logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasFetchedPrefs.current) {
      hasFetchedPrefs.current = true;

      fetch('/api/preferences')
        .then(res => res.json())
        .then(data => {
          if (data.language && VALID_LANGUAGES.includes(data.language)) {
            setLang(data.language);
            // Also update localStorage for consistency
            localStorage.setItem(STORAGE_KEY, data.language);
          }
        })
        .catch(() => {
          // If fetch fails, keep using localStorage value
        });
    }

    // Reset when user logs out
    if (status === 'unauthenticated') {
      hasFetchedPrefs.current = false;
    }
  }, [status, session]);

  // Listen for storage changes from other tabs (for guests)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as Language;
        if (VALID_LANGUAGES.includes(newLang)) {
          setLang(newLang);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    if (!VALID_LANGUAGES.includes(newLang)) return;
    setLang(newLang);

    // If logged in, also save to database
    if (status === 'authenticated') {
      fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang })
      }).catch(() => {
        // Silently fail - localStorage is the fallback
      });
    }
  }, [status]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
