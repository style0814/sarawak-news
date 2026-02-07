'use client';

import { useState, useEffect, useRef } from 'react';
import { Language, translations } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';

interface SearchResult {
  id: number;
  title: string;
  title_zh?: string | null;
  title_ms?: string | null;
  source_name: string;
}

interface SearchBarProps {
  lang: Language;
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function SearchBar({ lang, onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();
  const t = translations[lang];
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time search as user types
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        setSuggestions(data.news || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
  };

  const getTitle = (item: SearchResult) => {
    if (lang === 'zh' && item.title_zh) return item.title_zh;
    if (lang === 'ms' && item.title_ms) return item.title_ms;
    return item.title;
  };

  const handleSuggestionClick = (item: SearchResult) => {
    setQuery(getTitle(item));
    onSearch(getTitle(item));
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={t.searchPlaceholder || 'Search news...'}
            className={`w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {loading ? '⏳' : '🔍'}
          </span>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          {t.search || 'Search'}
        </button>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSuggestionClick(item)}
              className={`w-full text-left px-4 py-3 flex flex-col gap-1 border-b last:border-b-0 transition-colors ${
                isDark
                  ? 'border-gray-700 hover:bg-gray-700'
                  : 'border-gray-100 hover:bg-orange-50'
              }`}
            >
              <span className={`text-sm font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {getTitle(item)}
              </span>
              <span className="text-xs text-orange-600">{item.source_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !loading && (
        <div className={`absolute top-full left-0 right-0 mt-1 p-4 rounded-lg shadow-lg text-center text-sm ${
          isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
        }`}>
          {t.noResults || 'No results found'}
        </div>
      )}
    </div>
  );
}
