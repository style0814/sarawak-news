'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'sarawak-news-theme';

function getLocalTheme(): boolean {
  if (typeof window === 'undefined') return false;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return saved === 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasFetchedPrefs = useRef(false);

  // Initialize theme on mount (use local storage first)
  useEffect(() => {
    const initialTheme = getLocalTheme();
    // Initial client-side hydration of persisted theme.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme);
    setIsInitialized(true);
  }, []);

  // Fetch user preferences from database when logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasFetchedPrefs.current) {
      hasFetchedPrefs.current = true;

      fetch('/api/preferences')
        .then(res => res.json())
        .then(data => {
          if (data.theme && ['light', 'dark'].includes(data.theme)) {
            const newIsDark = data.theme === 'dark';
            setIsDark(newIsDark);
            document.documentElement.classList.toggle('dark', newIsDark);
            // Also update localStorage for consistency
            localStorage.setItem(STORAGE_KEY, data.theme);
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
        const newTheme = e.newValue === 'dark';
        setIsDark(newTheme);
        document.documentElement.classList.toggle('dark', newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync theme changes to DOM and localStorage
  useEffect(() => {
    if (!isInitialized) return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark, isInitialized]);

  const toggleTheme = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    // If logged in, also save to database
    if (status === 'authenticated') {
      fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newIsDark ? 'dark' : 'light' })
      }).catch(() => {
        // Silently fail - localStorage is the fallback
      });
    }
  }, [isDark, status]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
