# Multi-Language Support (i18n)

## Overview

The app supports 3 languages:
- **English (EN)** - Default
- **Chinese (中文)** - Simplified Chinese
- **Malay (BM)** - Bahasa Malaysia

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  LanguageSwitcher                                            │
│  ┌────┐ ┌────┐ ┌────┐                                       │
│  │ EN │ │中文│ │ BM │  ← User clicks                        │
│  └────┘ └────┘ └────┘                                       │
└─────────────────────────────────────────────────────────────┘
           │
           ▼ setLang('zh')
┌─────────────────────────────────────────────────────────────┐
│  State: lang = 'zh'                                          │
│  localStorage: 'sarawak-news-lang' = 'zh'                   │
└─────────────────────────────────────────────────────────────┘
           │
           ▼ translations['zh']
┌─────────────────────────────────────────────────────────────┐
│  UI re-renders with Chinese text                             │
│  "Sarawak News" → "砂拉越新闻"                              │
│  "Refresh" → "刷新"                                         │
└─────────────────────────────────────────────────────────────┘
```

## Translation File

**File:** `lib/i18n.ts`

```typescript
export type Language = 'en' | 'zh' | 'ms';

export const translations = {
  en: {
    title: 'Sarawak News',
    subtitle: 'Real-time news from Sarawak',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    points: 'points',
    point: 'point',
    noNews: 'No news yet. Click Refresh to fetch latest news.',
    hoursAgo: 'hours ago',
    minutesAgo: 'minutes ago',
    justNow: 'just now',
    daysAgo: 'days ago',
    from: 'from',
    loading: 'Loading...'
  },
  zh: {
    title: '砂拉越新闻',
    subtitle: '砂拉越实时新闻',
    refresh: '刷新',
    refreshing: '刷新中...',
    points: '点击',
    point: '点击',
    noNews: '暂无新闻。点击刷新获取最新新闻。',
    hoursAgo: '小时前',
    minutesAgo: '分钟前',
    justNow: '刚刚',
    daysAgo: '天前',
    from: '来自',
    loading: '加载中...'
  },
  ms: {
    title: 'Berita Sarawak',
    subtitle: 'Berita terkini dari Sarawak',
    refresh: 'Muat Semula',
    refreshing: 'Memuat semula...',
    points: 'klik',
    point: 'klik',
    noNews: 'Tiada berita lagi. Klik Muat Semula untuk mendapatkan berita terkini.',
    hoursAgo: 'jam lepas',
    minutesAgo: 'minit lepas',
    justNow: 'baru sahaja',
    daysAgo: 'hari lepas',
    from: 'dari',
    loading: 'Memuatkan...'
  }
};
```

## Using Translations in Components

```typescript
import { Language, translations } from '@/lib/i18n';

interface HeaderProps {
  lang: Language;
}

export default function Header({ lang }: HeaderProps) {
  const t = translations[lang];  // Get translation object

  return (
    <header>
      <h1>{t.title}</h1>              {/* "Sarawak News" or "砂拉越新闻" */}
      <span>{t.subtitle}</span>        {/* "Real-time..." or "实时..." */}
      <button>{t.refresh}</button>     {/* "Refresh" or "刷新" */}
    </header>
  );
}
```

## Language State Management

Language state is managed centrally using React Context for consistent behavior across all pages.

**File:** `components/LanguageProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage or browser
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved && ['en', 'zh', 'ms'].includes(saved)) {
      setLang(saved);
    } else {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) setLang('zh');
      else if (browserLang.startsWith('ms')) setLang('ms');
    }
    setIsInitialized(true);
  }, []);

  // Cross-tab sync via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as Language;
        if (['en', 'zh', 'ms'].includes(newLang)) {
          setLang(newLang);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  if (!isInitialized) return <>{children}</>;

  return (
    <LanguageContext.Provider value={{ lang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

### Using in Components

```typescript
import { useLanguage } from '@/components/LanguageProvider';
import { translations } from '@/lib/i18n';

export default function MyComponent() {
  const { lang, setLanguage } = useLanguage();
  const t = translations[lang];

  return (
    <div>
      <h1>{t.title}</h1>
      <LanguageSwitcher currentLang={lang} onLanguageChange={setLanguage} />
    </div>
  );
}
```

## Language Switcher Component

**File:** `components/LanguageSwitcher.tsx`

```typescript
interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
    { code: 'ms', label: 'BM' }
  ];

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onLanguageChange(code as Language)}
          className={`px-3 py-1 rounded text-sm ${
            currentLang === code
              ? 'bg-orange-500 text-white'   // Active
              : 'text-gray-600 hover:bg-gray-200'  // Inactive
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

## Time Ago Helper

Relative time also needs translation:

```typescript
export function getTimeAgo(dateString: string, lang: Language): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const t = translations[lang];

  if (diffMins < 1) return t.justNow;           // "just now" / "刚刚"
  if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;  // "5 minutes ago"
  if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;  // "2 hours ago"
  return `${diffDays} ${t.daysAgo}`;            // "3 days ago"
}
```

## Browser Language Detection

On first visit, we auto-detect from browser settings:

```typescript
const browserLang = navigator.language.toLowerCase();
// Examples: "en-US", "zh-CN", "zh-TW", "ms-MY"

if (browserLang.startsWith('zh')) {
  setLang('zh');  // Any Chinese variant
} else if (browserLang.startsWith('ms') || browserLang.startsWith('my')) {
  setLang('ms');  // Malay
} else {
  setLang('en');  // Default to English
}
```

## localStorage Persistence

User's choice is saved in browser:

```javascript
// Save
localStorage.setItem('sarawak-news-lang', 'zh');

// Load
localStorage.getItem('sarawak-news-lang');  // "zh"

// Remove
localStorage.removeItem('sarawak-news-lang');
```

The preference persists across browser sessions.

## Adding New Languages

To add a new language (e.g., Tamil):

1. Add to type:
   ```typescript
   export type Language = 'en' | 'zh' | 'ms' | 'ta';
   ```

2. Add translations:
   ```typescript
   ta: {
     title: 'சரவாக் செய்திகள்',
     refresh: 'புதுப்பி',
     // ... all keys
   }
   ```

3. Add to switcher:
   ```typescript
   { code: 'ta', label: 'தமிழ்' }
   ```

4. Add detection:
   ```typescript
   if (browserLang.startsWith('ta')) setLang('ta');
   ```

## Why Not i18next?

We use a simple object-based approach instead of i18next because:

| Our Approach | i18next |
|--------------|---------|
| ~50 lines of code | Full library |
| Simple key-value | Complex features (plurals, namespaces) |
| No build step | Requires configuration |
| Good for small apps | Better for large apps |

For larger projects, consider [next-i18next](https://github.com/i18next/next-i18next).
