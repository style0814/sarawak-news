'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import NewsList from '@/components/NewsList';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ListenAllPlayer from '@/components/ListenAllPlayer';
import AdBanner from '@/components/AdBanner';
import { translations } from '@/lib/i18n';
import HornbillLogo from '@/components/HornbillLogo';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';

interface NewsData {
  id: number;
  title: string;
  title_zh?: string | null;
  title_ms?: string | null;
  source_url: string;
  source_name: string;
  clicks: number;
  comment_count: number;
  summary_views?: number;
  tts_listens?: number;
  created_at: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface HomeClientProps {
  initialNews: NewsData[];
  initialPagination: PaginationData;
  initialCategories: readonly string[];
  initialLastRefresh: string | null;
}

export default function HomeClient({
  initialNews,
  initialPagination,
  initialCategories,
  initialLastRefresh,
}: HomeClientProps) {
  const router = useRouter();
  const [news, setNews] = useState<NewsData[]>(initialNews);
  const [pagination, setPagination] = useState<PaginationData>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(
    initialNews.length > 0 ? new Date() : undefined
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<readonly string[]>(initialCategories);
  const { isDark } = useTheme();
  const { lang, setLanguage } = useLanguage();
  const t = translations[lang];

  // Calculate remaining seconds until next refresh from server timestamp
  const calcRemainingSeconds = useCallback((lastRefresh: string | null) => {
    if (!lastRefresh) return 10 * 60; // Default 10 min if no refresh recorded
    const elapsed = Math.floor((Date.now() - new Date(lastRefresh).getTime()) / 1000);
    const remaining = 10 * 60 - elapsed;
    return Math.max(0, remaining); // Don't go negative
  }, []);

  // Fetch news with pagination and category
  const fetchNews = useCallback(async (page: number = 1, showLoading = false, category: string = 'all') => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`/api/news?page=${page}&limit=20&category=${category}`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      if (data.news) {
        setNews(data.news);
        setPagination(data.pagination);
        setLastUpdated(new Date());
        if (data.categories) {
          setCategories(data.categories);
        }
      }
    } catch {
      // Silently fail for background fetches, only log on initial load
      if (showLoading) {
        console.error('Error fetching news');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - always fetch fresh server timestamp for countdown
  useEffect(() => {
    const init = async () => {
      if (initialNews.length === 0) {
        // Database was empty at SSR time - fetch RSS feeds first
        setLoading(true);
        const refreshRes = await fetch('/api/refresh', { method: 'POST' }).catch(() => null);
        if (refreshRes) {
          const refreshData = await refreshRes.json().catch(() => ({}));
          if (refreshData.refreshedAt) {
            setNextRefreshIn(10 * 60);
          }
        }
        await fetchNews(1, false, selectedCategory);
        setLoading(false);
      } else {
        // Fetch fresh last_refresh timestamp from server (SSR value may be stale)
        const res = await fetch('/api/news?page=1&limit=1').catch(() => null);
        if (res) {
          const data = await res.json().catch(() => ({}));
          if (data.lastRefresh) {
            setNextRefreshIn(calcRemainingSeconds(data.lastRefresh));
          } else {
            setNextRefreshIn(10 * 60);
          }
        } else {
          // Fallback to SSR value if API fails
          setNextRefreshIn(calcRemainingSeconds(initialLastRefresh));
        }
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for next refresh
  useEffect(() => {
    if (nextRefreshIn === null) return; // Wait until loaded from server
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [nextRefreshIn !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh: Trigger when countdown reaches 0
  useEffect(() => {
    if (nextRefreshIn !== 0) return;
    const doRefresh = async () => {
      setIsRefreshing(true);
      try {
        // First trigger RSS fetch (server throttles for safety), then reload list.
        const refreshRes = await fetch('/api/refresh', { method: 'POST' }).catch(() => null);
        let retryAfter = 60;
        if (refreshRes) {
          const refreshData = await refreshRes.json().catch(() => ({}));
          if (typeof refreshData.retryAfter === 'number') {
            retryAfter = Math.max(30, Math.min(10 * 60, refreshData.retryAfter));
          }
        }

        const res = await fetch(`/api/news?page=${pagination.page}&limit=20&category=${selectedCategory}`).catch(() => null);
        if (res) {
          const data = await res.json().catch(() => ({}));
          if (data.news) {
            setNews(data.news);
            setPagination(data.pagination);
            setLastUpdated(new Date());
          }
          if (data.lastRefresh) {
            const remaining = calcRemainingSeconds(data.lastRefresh);
            setNextRefreshIn(remaining > 0 ? remaining : 60);
            return;
          }
        }
        setNextRefreshIn(retryAfter);
      } catch {
        setNextRefreshIn(60);
      } finally {
        setIsRefreshing(false);
      }
    };
    doRefresh();
  }, [nextRefreshIn, calcRemainingSeconds, pagination.page, selectedCategory]);

  // Re-fetch when category changes (client-side navigation)
  useEffect(() => {
    if (selectedCategory !== 'all') {
      fetchNews(1, true, selectedCategory);
    }
  }, [selectedCategory, fetchNews]);

  // Format countdown
  const formatCountdown = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Page change
  const handlePageChange = (page: number) => {
    fetchNews(page, true, selectedCategory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsSearching(false);
    setSearchQuery('');
  };


  // Click tracking
  const handleItemClick = async (id: number) => {
    // Optimistic update first
    setNews(prevNews =>
      prevNews.map(item =>
        item.id === id ? { ...item, clicks: item.clicks + 1 } : item
      )
    );
    // Fire and forget - don't wait for response
    fetch(`/api/news/${id}/click`, { method: 'POST' }).catch(() => {});
  };

  // Navigate to discussion
  const handleDiscussClick = (id: number) => {
    router.push(`/news/${id}`);
  };

  // Search handlers
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=1&limit=20`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setNews(data.news || []);
      setPagination(data.pagination);
    } catch {
      // Reset to empty state on error
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchNews(1, true);
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-orange-50 to-white'}`}>
      <Header
        lang={lang}
        onLanguageChange={setLanguage}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Auto-Update Status Bar */}
        <div className={`mb-4 p-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className={`relative flex h-3 w-3 ${isRefreshing ? '' : ''}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isRefreshing ? 'bg-yellow-500' : 'bg-orange-500'}`}></span>
              </span>
              <span className={`text-sm font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                {isRefreshing ? 'Updating...' : 'LIVE'}
              </span>
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.lastUpdated}: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Next refresh countdown */}
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>⏱️</span>
            <span>Next update in: <strong className={isDark ? 'text-orange-400' : 'text-orange-600'}>{formatCountdown(nextRefreshIn)}</strong></span>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`mb-4 p-4 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <SearchBar lang={lang} onSearch={handleSearch} onClear={handleClearSearch} />
          {isSearching && searchQuery && (
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t.searchResults}: &quot;{searchQuery}&quot; ({pagination.total} {t.articles})
            </p>
          )}
        </div>

        {/* Category Filter */}
        {!isSearching && (
          <div className={`mb-4 p-4 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              lang={lang}
            />
          </div>
        )}

        <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <NewsList
            news={news}
            lang={lang}
            loading={loading}
            onItemClick={handleItemClick}
            onDiscussClick={handleDiscussClick}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            lang={lang}
          />
        </div>
      </main>

      {/* Ad Banner */}
      <AdBanner
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || ''}
        format="horizontal"
        responsive={true}
      />

      <footer className="max-w-6xl mx-auto px-4 py-6 sm:py-8 text-center">
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <HornbillLogo size="md" className="text-orange-400" />
          <span>Sarawak News Aggregator</span>
          <span className={`hidden sm:inline ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
          <span>Bumi Kenyalang</span>
        </div>
        <div className={`flex items-center justify-center gap-4 mt-4 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          <Link href="/about" className="hover:text-orange-600">About</Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-orange-600">Privacy</Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-orange-600">Terms</Link>
        </div>
      </footer>

      {/* Listen All News Player */}
      <ListenAllPlayer news={news} lang={lang} />
    </div>
  );
}
