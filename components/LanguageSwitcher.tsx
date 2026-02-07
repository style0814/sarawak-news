'use client';

import { Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ms', label: 'BM', flag: '🇲🇾' }
  ];

  return (
    <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-sm">
      {languages.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => onLanguageChange(code)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
            currentLang === code
              ? 'bg-white text-orange-700 shadow-md'
              : 'text-white hover:bg-white/20'
          }`}
          title={label}
        >
          <span className="text-base">{flag}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
