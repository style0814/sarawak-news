'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations } from '@/lib/i18n';
import { useLanguage } from '@/components/LanguageProvider';
import {
  ErrorsOverTimeChart,
  ErrorsByTypeChart,
  ErrorsByLevelChart,
  ErrorStatsCards
} from '@/components/charts/ErrorCharts';
import {
  DailyActivityChart,
  ClickTrendChart,
  SourcesChart,
  CategoriesChart,
  EngagementChart,
  OverviewStatsCards,
  SearchVolumeChart,
  SourcePerformanceChart,
  CategoryEngagementChart,
  PeakHoursChart,
  UserGrowthChart,
  TranslationCoverageChart
} from '@/components/charts/DashboardCharts';

interface Stats {
  totalNews: number;
  totalUsers: number;
  totalComments: number;
  bannedUsers: number;
}

interface DailyStats {
  date: string;
  news_count: number;
  comment_count: number;
  click_count: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  is_admin: number;
  is_banned: number;
  banned_reason: string | null;
  banned_at: string | null;
  created_at: string;
}

interface NewsItem {
  id: number;
  title: string;
  source_name: string;
  category: string;
  clicks: number;
  comment_count: number;
  created_at: string;
}

interface CommentItem {
  id: number;
  news_id: number;
  content: string;
  author_name: string;
  news_title: string;
  likes: number;
  created_at: string;
  is_flagged: number;
  is_hidden: number;
  flag_reason: string | null;
  flagged_at: string | null;
  moderation_note: string | null;
}

interface ModerationStats {
  totalComments: number;
  flaggedComments: number;
  hiddenComments: number;
}

interface TopSource {
  source_name: string;
  count: number;
}

interface CategoryStats {
  category: string;
  count: number;
}

interface ErrorLog {
  id: number;
  level: 'error' | 'warning' | 'info';
  type: 'api' | 'database' | 'auth' | 'rss' | 'validation' | 'other';
  message: string;
  stack_trace: string | null;
  endpoint: string | null;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  resolved: number;
  created_at: string;
}

interface ErrorStats {
  totalErrors: number;
  unresolvedErrors: number;
  todayErrors: number;
  errorsByLevel: { level: string; count: number }[];
  errorsByType: { type: string; count: number }[];
}

interface ErrorsByDay {
  date: string;
  count: number;
  errors: number;
  warnings: number;
  info: number;
}

interface RssFeed {
  id: number;
  name: string;
  url: string;
  is_active: number;
  is_sarawak_source: number;
  last_fetched_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string;
}

interface RefreshMonitor {
  lastRefresh: string | null;
  status: string;
  added: number;
  total: number;
  errorCount: number;
  secondsUntilPublicEligible: number;
  nextPublicEligibleAt: string | null;
}

type Tab = 'dashboard' | 'analytics' | 'users' | 'news' | 'comments' | 'errors' | 'feeds' | 'payments' | 'audit';

interface PaymentSubmission {
  id: number;
  user_id: number;
  username: string;
  email: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface SubscriptionStats {
  totalPremium: number;
  totalFree: number;
  pendingPayments: number;
  revenueThisMonth: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topNews, setTopNews] = useState<NewsItem[]>([]);
  const [topSources, setTopSources] = useState<TopSource[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsPage, setNewsPage] = useState(1);
  const [newsTotalPages, setNewsTotalPages] = useState(1);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsSource, setNewsSource] = useState('all');
  const [newsCategory, setNewsCategory] = useState('all');
  const [sources, setSources] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [bulkDeleteDays, setBulkDeleteDays] = useState(30);

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentFilter, setCommentFilter] = useState<'all' | 'flagged' | 'hidden'>('all');
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);

  // Errors state
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [errorsPage, setErrorsPage] = useState(1);
  const [errorsTotalPages, setErrorsTotalPages] = useState(1);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [errorsByDay, setErrorsByDay] = useState<ErrorsByDay[]>([]);
  const [errorLevelFilter, setErrorLevelFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [errorResolvedFilter, setErrorResolvedFilter] = useState<string>('all');
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [bulkDeleteErrorDays, setBulkDeleteErrorDays] = useState(30);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const lastErrorIdRef = useRef<number | null>(null);

  // RSS Refresh state
  const [rssRefreshing, setRssRefreshing] = useState(false);
  const [rssResult, setRssResult] = useState<{ added: number; total: number; errors: string[] } | null>(null);
  const [refreshMonitor, setRefreshMonitor] = useState<RefreshMonitor | null>(null);
  const [nextPublicEligibleIn, setNextPublicEligibleIn] = useState<number | null>(null);

  // Translation state
  const [untranslatedCount, setUntranslatedCount] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{ translated: number } | null>(null);

  // Feeds state
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedIsSarawak, setNewFeedIsSarawak] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Payments state
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  // Analytics state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Audit log state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditActions, setAuditActions] = useState<string[]>([]);

  // Feed health state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [feedHealth, setFeedHealth] = useState<any>(null);

  // Moderation config state
  const [bannedWords, setBannedWords] = useState('');
  const [commentRateLimit, setCommentRateLimit] = useState('10');
  const [moderationConfigLoaded, setModerationConfigLoaded] = useState(false);

  const t = translations[lang];

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth');
        const data = await response.json();

        if (!data.authenticated) {
          router.replace('/admin/login');
          return;
        }
        setAuthChecked(true);
      } catch {
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [router]);


  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.replace('/admin/login');
    } catch {
      router.replace('/admin/login');
    }
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin?tab=dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStats(data.stats);
      setDailyStats(data.dailyStats || []);
      setTopNews(data.topNews || []);
      setTopSources(data.topSources || []);
      setCategoryStats(data.categoryStats || []);
      setUntranslatedCount(data.untranslatedCount || 0);
      setFeedHealth(data.feedHealth || null);
      setRefreshMonitor(data.refreshMonitor || null);
    } catch {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch('/api/admin?tab=users');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('Users API response:', data);
      setUsers(data.users || []);
      if (!data.users || data.users.length === 0) {
        setUsersError('No users found in database');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsersError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchNews = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        tab: 'news',
        page: String(page),
        ...(newsSearch && { search: newsSearch }),
        ...(newsSource !== 'all' && { source: newsSource }),
        ...(newsCategory !== 'all' && { category: newsCategory })
      });
      const response = await fetch(`/api/admin?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNews(data.news || []);
      setNewsTotalPages(data.totalPages || 1);
      setSources(data.sources || []);
      setCategories(data.categories || []);
    } catch {
      console.error('Failed to load news');
    }
  }, [newsSearch, newsSource, newsCategory]);

  const fetchComments = useCallback(async (page: number = 1, filter: 'all' | 'flagged' | 'hidden' = 'all') => {
    try {
      const params = new URLSearchParams({
        tab: 'comments',
        page: String(page),
        filter
      });
      const response = await fetch(`/api/admin?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setComments(data.comments || []);
      setCommentsTotalPages(data.totalPages || 1);
      setModerationStats(data.moderationStats || null);
    } catch {
      console.error('Failed to load comments');
    }
  }, []);

  const fetchErrors = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        tab: 'errors',
        page: String(page),
        ...(errorLevelFilter !== 'all' && { level: errorLevelFilter }),
        ...(errorTypeFilter !== 'all' && { type: errorTypeFilter }),
        ...(errorResolvedFilter !== 'all' && { resolved: errorResolvedFilter })
      });
      const response = await fetch(`/api/admin?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setErrors(data.errors || []);
      setErrorsTotalPages(data.totalPages || 1);
      setErrorStats(data.stats || null);
      setErrorsByDay(data.errorsByDay || []);
      setUnresolvedCount(data.stats?.unresolvedErrors || 0);
    } catch {
      console.error('Failed to load errors');
    }
  }, [errorLevelFilter, errorTypeFilter, errorResolvedFilter]);

  const fetchFeeds = useCallback(async () => {
    try {
      const response = await fetch('/api/admin?tab=feeds');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setFeeds(data.feeds || []);
    } catch {
      console.error('Failed to load feeds');
    }
  }, []);

  const fetchPayments = useCallback(async (page: number = 1, status: string = 'pending') => {
    try {
      const params = new URLSearchParams({
        tab: 'payments',
        page: String(page),
        status
      });
      const response = await fetch(`/api/admin?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPayments(data.payments || []);
      setPaymentsTotalPages(data.totalPages || 1);
      setSubscriptionStats(data.stats || null);
      setPendingPaymentsCount(data.stats?.pendingPayments || 0);
    } catch {
      console.error('Failed to load payments');
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin?tab=analytics');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAnalyticsData(data);
    } catch {
      console.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        tab: 'audit',
        page: String(page),
        ...(auditActionFilter !== 'all' && { action: auditActionFilter })
      });
      const response = await fetch(`/api/admin?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAuditLogs(data.logs || []);
      setAuditTotalPages(data.totalPages || 1);
      setAuditActions(data.actions || []);
    } catch {
      console.error('Failed to load audit logs');
    }
  }, [auditActionFilter]);

  const fetchModerationConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin?tab=moderation-config');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setBannedWords(data.bannedWords || '');
      setCommentRateLimit(data.commentRateLimit || '10');
      setModerationConfigLoaded(true);
    } catch {
      console.error('Failed to load moderation config');
    }
  }, []);

  // Fetch error count for notifications
  const fetchErrorCount = useCallback(async () => {
    try {
      const response = await fetch('/api/admin?tab=error-count');
      if (!response.ok) return;
      const data = await response.json();
      setUnresolvedCount(data.count);

      // Check for new errors and notify
      if (notificationsEnabled && lastErrorIdRef.current !== null && data.latestId > lastErrorIdRef.current) {
        new Notification('New Error Detected', {
          body: `${data.count} unresolved errors`,
          icon: '/favicon.ico'
        });
      }
      lastErrorIdRef.current = data.latestId;
    } catch {
      // Silent fail for polling
    }
  }, [notificationsEnabled]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  // Refresh RSS feeds
  const handleRefreshRss = async () => {
    setRssRefreshing(true);
    setRssResult(null);
    try {
      const response = await fetch('/api/refresh', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setRssResult({ added: data.added, total: data.total, errors: data.errors || [] });
        setNextPublicEligibleIn(10 * 60);
        // Refresh dashboard stats to show new news count
        fetchDashboard();
      } else {
        setRssResult({ added: 0, total: 0, errors: [data.error || 'Failed to refresh feeds'] });
        if (typeof data.retryAfter === 'number') {
          setNextPublicEligibleIn(Math.max(0, data.retryAfter));
        }
      }
    } catch {
      setRssResult({ added: 0, total: 0, errors: ['Network error - failed to connect'] });
    } finally {
      setRssRefreshing(false);
    }
  };

  useEffect(() => {
    if (!refreshMonitor) {
      setNextPublicEligibleIn(null);
      return;
    }
    setNextPublicEligibleIn(refreshMonitor.secondsUntilPublicEligible ?? 0);
  }, [refreshMonitor]);

  useEffect(() => {
    if (nextPublicEligibleIn === null) return;
    const interval = setInterval(() => {
      setNextPublicEligibleIn(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPublicEligibleIn !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retry translations
  const handleRetryTranslation = async () => {
    setTranslating(true);
    setTranslationResult(null);
    try {
      const response = await fetch('/api/translate', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setTranslationResult({ translated: data.translated });
        // Refresh dashboard stats to update untranslated count
        fetchDashboard();
      } else {
        setTranslationResult({ translated: 0 });
      }
    } catch {
      setTranslationResult({ translated: 0 });
    } finally {
      setTranslating(false);
    }
  };

  // Feed handlers
  const handleAddFeed = async () => {
    if (!newFeedName.trim() || !newFeedUrl.trim()) {
      setFeedError('Name and URL are required');
      return;
    }
    setFeedError(null);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addFeed',
          name: newFeedName.trim(),
          url: newFeedUrl.trim(),
          is_sarawak_source: newFeedIsSarawak
        })
      });
      const data = await response.json();
      if (response.ok) {
        setNewFeedName('');
        setNewFeedUrl('');
        setNewFeedIsSarawak(false);
        setShowAddFeed(false);
        fetchFeeds();
      } else {
        setFeedError(data.error || 'Failed to add feed');
      }
    } catch {
      setFeedError('Failed to add feed');
    }
  };

  const handleToggleFeed = async (feedId: number) => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleFeed', feedId })
      });
      fetchFeeds();
    } catch {
      alert('Failed to toggle feed');
    }
  };

  const handleDeleteFeed = async (feedId: number) => {
    if (!confirm('Delete this RSS feed?')) return;
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteFeed', feedId })
      });
      fetchFeeds();
    } catch {
      alert('Failed to delete feed');
    }
  };

  useEffect(() => {
    if (authChecked) {
      if (activeTab === 'dashboard') fetchDashboard();
      else if (activeTab === 'users') fetchUsers();
      else if (activeTab === 'news') fetchNews(newsPage);
      else if (activeTab === 'comments') { fetchComments(commentsPage, commentFilter); if (!moderationConfigLoaded) fetchModerationConfig(); }
      else if (activeTab === 'errors') fetchErrors(errorsPage);
      else if (activeTab === 'feeds') fetchFeeds();
      else if (activeTab === 'payments') fetchPayments(paymentsPage, paymentFilter);
      else if (activeTab === 'analytics') fetchAnalytics();
      else if (activeTab === 'audit') fetchAuditLogs(auditPage);
    }
  }, [authChecked, activeTab, fetchDashboard, fetchUsers, fetchNews, fetchComments, fetchErrors, fetchFeeds, fetchPayments, fetchAnalytics, fetchAuditLogs, fetchModerationConfig, newsPage, commentsPage, commentFilter, errorsPage, paymentsPage, paymentFilter, auditPage, moderationConfigLoaded]);

  // Poll for new errors every 30 seconds when on errors tab
  useEffect(() => {
    if (authChecked && activeTab === 'errors') {
      const interval = setInterval(fetchErrorCount, 30000);
      return () => clearInterval(interval);
    }
  }, [authChecked, activeTab, fetchErrorCount]);

  const handleToggleAdmin = async (userId: number, currentAdminStatus: boolean) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleAdmin', userId, currentAdminStatus })
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed');
      }
    } catch {
      alert('Failed');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteUser', userId })
      });
      if (response.ok) {
        fetchUsers();
        fetchDashboard();
      }
    } catch {
      alert('Failed');
    }
  };

  const handleDeleteNews = async (newsId: number) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const response = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'news', id: newsId })
      });
      if (response.ok) {
        fetchNews(newsPage);
        fetchDashboard();
      }
    } catch {
      alert('Failed');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteComment', commentId })
      });
      if (response.ok) {
        fetchComments(commentsPage, commentFilter);
        fetchDashboard();
      }
    } catch {
      alert('Failed');
    }
  };

  const handleFlagComment = async (commentId: number, isFlagged: boolean) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isFlagged ? 'unflagComment' : 'flagComment',
          commentId,
          reason: 'Flagged by admin'
        })
      });
      if (response.ok) {
        fetchComments(commentsPage, commentFilter);
      }
    } catch {
      alert('Failed');
    }
  };

  const handleHideComment = async (commentId: number, isHidden: boolean) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isHidden ? 'unhideComment' : 'hideComment',
          commentId
        })
      });
      if (response.ok) {
        fetchComments(commentsPage, commentFilter);
      }
    } catch {
      alert('Failed');
    }
  };

  const handleCommentFilterChange = (filter: 'all' | 'flagged' | 'hidden') => {
    setCommentFilter(filter);
    setCommentsPage(1);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete all news older than ${bulkDeleteDays} days?`)) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulkDeleteOldNews', days: bulkDeleteDays })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`${data.deleted} items deleted`);
        fetchNews(1);
        setNewsPage(1);
        fetchDashboard();
      }
    } catch {
      alert('Failed');
    }
  };

  const handleNewsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsPage(1);
    fetchNews(1);
  };

  // Error handlers
  const handleResolveError = async (errorId: number, currentResolved: boolean) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentResolved ? 'unresolveError' : 'resolveError',
          errorId
        })
      });
      if (response.ok) {
        fetchErrors(errorsPage);
      }
    } catch {
      alert('Failed');
    }
  };

  const handleDeleteError = async (errorId: number) => {
    if (!confirm('Delete this error log?')) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteError', errorId })
      });
      if (response.ok) {
        fetchErrors(errorsPage);
      }
    } catch {
      alert('Failed');
    }
  };

  const handleBulkDeleteErrors = async () => {
    if (!confirm(`Delete all errors older than ${bulkDeleteErrorDays} days?`)) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulkDeleteOldErrors', days: bulkDeleteErrorDays })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`${data.deleted} errors deleted`);
        fetchErrors(1);
        setErrorsPage(1);
      }
    } catch {
      alert('Failed');
    }
  };

  const handleClearResolvedErrors = async () => {
    if (!confirm('Clear all resolved errors?')) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearResolvedErrors' })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`${data.deleted} resolved errors cleared`);
        fetchErrors(1);
        setErrorsPage(1);
      }
    } catch {
      alert('Failed');
    }
  };

  const handleErrorFilterChange = () => {
    setErrorsPage(1);
    fetchErrors(1);
  };

  // Payment handlers
  const handleApprovePayment = async (paymentId: number) => {
    const months = prompt('How many months to activate? (default: 1)', '1');
    if (!months) return;

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approvePayment', paymentId, months: parseInt(months) })
      });
      if (response.ok) {
        fetchPayments(paymentsPage, paymentFilter);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve payment');
      }
    } catch {
      alert('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (paymentId: number) => {
    const note = prompt('Reason for rejection (optional):');

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejectPayment', paymentId, note })
      });
      if (response.ok) {
        fetchPayments(paymentsPage, paymentFilter);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject payment');
      }
    } catch {
      alert('Failed to reject payment');
    }
  };

  const handlePaymentFilterChange = (filter: 'all' | 'pending' | 'approved' | 'rejected') => {
    setPaymentFilter(filter);
    setPaymentsPage(1);
  };

  const handleBanUser = async (userId: number) => {
    const reason = prompt('Reason for ban (optional):');
    if (reason === null) return; // cancelled
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'banUser', userId, reason: reason || 'Banned by admin' })
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to ban user');
      }
    } catch {
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!confirm('Unban this user?')) return;
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unbanUser', userId })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch {
      alert('Failed to unban user');
    }
  };

  const handleSaveBannedWords = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateBannedWords', words: bannedWords })
      });
      if (response.ok) {
        alert('Banned words updated');
      }
    } catch {
      alert('Failed to save');
    }
  };

  const handleSaveRateLimit = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRateLimit', limit: parseInt(commentRateLimit) })
      });
      if (response.ok) {
        alert('Rate limit updated');
      }
    } catch {
      alert('Failed to save');
    }
  };

  const handleAuditFilterChange = () => {
    setAuditPage(1);
    fetchAuditLogs(1);
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRefreshStatusStyles = (status: string) => {
    if (status === 'success') return 'bg-green-900/40 text-green-300 border-green-700/50';
    if (status === 'warning') return 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50';
    if (status === 'error') return 'bg-red-900/40 text-red-300 border-red-700/50';
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'dashboard', label: t.dashboard },
    { key: 'analytics', label: 'Analytics' },
    { key: 'users', label: t.users },
    { key: 'news', label: t.news },
    { key: 'comments', label: t.comments },
    { key: 'payments', label: t.payments || 'Payments', badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined },
    { key: 'errors', label: 'Errors', badge: unresolvedCount > 0 ? unresolvedCount : undefined },
    { key: 'feeds', label: t.rssFeeds || 'RSS Feeds' },
    { key: 'audit', label: 'Audit Log' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 to-amber-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-orange-100 hover:text-white text-sm">
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-6 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <>
                {/* Overview Stats Cards */}
                <OverviewStatsCards
                  totalNews={stats?.totalNews || 0}
                  totalUsers={stats?.totalUsers || 0}
                  totalComments={stats?.totalComments || 0}
                  todayNews={dailyStats[0]?.news_count}
                  weeklyGrowth={dailyStats.length >= 2 ? Math.round(((dailyStats[0]?.news_count || 0) - (dailyStats[dailyStats.length - 1]?.news_count || 0)) / Math.max(1, dailyStats[dailyStats.length - 1]?.news_count || 1) * 100) : undefined}
                />

                {/* Feed Health Warning */}
                {feedHealth && !feedHealth.healthy && (
                  <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/50">
                    <h3 className="font-bold text-red-400 mb-3">Feed Health Warning</h3>
                    {feedHealth.staleFeeds?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-yellow-400 font-medium">Stale Feeds (no data in 24+ hours):</p>
                        <ul className="text-sm text-gray-400 list-disc list-inside mt-1">
                          {feedHealth.staleFeeds.map((f: { id: number; name: string; hours_since_fetch: number }) => (
                            <li key={f.id}>{f.name} — {f.hours_since_fetch}h since last fetch</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedHealth.errorFeeds?.length > 0 && (
                      <div>
                        <p className="text-sm text-red-400 font-medium">High Error Feeds (3+ consecutive errors):</p>
                        <ul className="text-sm text-gray-400 list-disc list-inside mt-1">
                          {feedHealth.errorFeeds.map((f: { id: number; name: string; error_count: number; last_error: string | null }) => (
                            <li key={f.id}>{f.name} — {f.error_count} errors: {f.last_error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Banned Users Indicator */}
                {stats && stats.bannedUsers > 0 && (
                  <div className="p-3 rounded-xl bg-red-900/20 border border-red-700/30 flex items-center gap-3">
                    <span className="text-red-400 font-bold text-lg">{stats.bannedUsers}</span>
                    <span className="text-sm text-red-300">banned user{stats.bannedUsers !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* RSS Refresh Card */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">{t.refreshRssFeeds || 'Refresh RSS Feeds'}</h2>
                      <p className="text-sm text-gray-400 mt-1">{t.refreshRssDescription || 'Manually fetch new articles from all RSS sources'}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Last Refresh</p>
                          <p className="text-sm text-gray-200 mt-1">
                            {refreshMonitor?.lastRefresh ? new Date(refreshMonitor.lastRefresh).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Next Public Auto-Refresh</p>
                          <p className="text-sm mt-1 text-gray-200">
                            {nextPublicEligibleIn === null ? '--:--' : nextPublicEligibleIn > 0 ? `${formatDuration(nextPublicEligibleIn)} (${refreshMonitor?.nextPublicEligibleAt ? new Date(refreshMonitor.nextPublicEligibleAt).toLocaleTimeString() : 'pending'})` : 'Ready now'}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500">Last Result</p>
                          <p className="text-sm text-gray-200 mt-1">
                            Added {refreshMonitor?.added ?? 0} / Processed {refreshMonitor?.total ?? 0} / Errors {refreshMonitor?.errorCount ?? 0}
                          </p>
                        </div>
                        <div className={`rounded-lg border px-3 py-2 ${getRefreshStatusStyles(refreshMonitor?.status || 'unknown')}`}>
                          <p className="text-[11px] uppercase tracking-wide opacity-80">Status</p>
                          <p className="text-sm mt-1 font-medium uppercase">{refreshMonitor?.status || 'unknown'}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRefreshRss}
                      disabled={rssRefreshing}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                        rssRefreshing
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {rssRefreshing ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{t.refreshing || 'Refreshing...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{t.refreshNow || 'Refresh Now'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Result feedback */}
                  {rssResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      rssResult.errors.length > 0 && rssResult.added === 0
                        ? 'bg-red-900/30 border border-red-700'
                        : rssResult.errors.length > 0
                          ? 'bg-yellow-900/30 border border-yellow-700'
                          : 'bg-green-900/30 border border-green-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {rssResult.errors.length === 0 ? (
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <span className="font-medium">
                          {rssResult.added > 0
                            ? `${t.addedArticles || 'Added'} ${rssResult.added} ${t.newArticles || 'new articles'}`
                            : t.noNewArticles || 'No new articles found'}
                        </span>
                      </div>
                      {rssResult.total > 0 && (
                        <p className="text-sm text-gray-400">
                          {t.totalProcessed || 'Total processed'}: {rssResult.total} {t.articles || 'articles'}
                        </p>
                      )}
                      {rssResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-yellow-400 font-medium mb-1">{t.feedErrors || 'Feed errors'}:</p>
                          <ul className="text-sm text-gray-400 list-disc list-inside">
                            {rssResult.errors.slice(0, 5).map((err, i) => (
                              <li key={i} className="truncate">{err}</li>
                            ))}
                            {rssResult.errors.length > 5 && (
                              <li className="text-gray-500">...and {rssResult.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Translation Retry Card */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">{t.retryTranslation || 'Retry Translation'}</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        {t.retryTranslationDescription || 'Translate untranslated article titles to Chinese and Malay'}
                        {untranslatedCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                            {untranslatedCount} {t.pending || 'pending'}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleRetryTranslation}
                      disabled={translating || untranslatedCount === 0}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                        translating || untranslatedCount === 0
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {translating ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{t.translating || 'Translating...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          <span>{t.translateNow || 'Translate Now'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Translation result feedback */}
                  {translationResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      translationResult.translated > 0
                        ? 'bg-green-900/30 border border-green-700'
                        : 'bg-yellow-900/30 border border-yellow-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        {translationResult.translated > 0 ? (
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className="font-medium">
                          {translationResult.translated > 0
                            ? `${t.translated || 'Translated'} ${translationResult.translated} ${t.articlesTranslated || 'articles'}`
                            : t.noArticlesToTranslate || 'No articles to translate'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Activity Chart */}
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h2 className="text-lg font-bold mb-4">{t.dailyActivity || 'Daily Activity'} (7 {t.days})</h2>
                    <DailyActivityChart data={dailyStats} />
                  </div>

                  {/* Click Trend Chart */}
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h2 className="text-lg font-bold mb-4">{t.clickTrend || 'Click Trend'}</h2>
                    <ClickTrendChart data={dailyStats} />
                  </div>
                </div>

                {/* Sources & Categories Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sources Distribution */}
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h2 className="text-lg font-bold mb-4">{t.sourceDistribution || 'News by Source'}</h2>
                    <SourcesChart data={topSources} />
                  </div>

                  {/* Categories Distribution */}
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h2 className="text-lg font-bold mb-4">{t.categoryDistribution || 'News by Category'}</h2>
                    <CategoriesChart data={categoryStats} />
                  </div>
                </div>

                {/* Engagement Chart */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h2 className="text-lg font-bold mb-4">{t.engagementMetrics || 'Engagement Metrics'}</h2>
                  <EngagementChart data={dailyStats} />
                </div>

                {/* Daily Stats */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h2 className="text-lg font-bold mb-4">{t.dailyStats} (7 {t.days})</h2>
                  {dailyStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-gray-400">{t.date}</th>
                            <th className="text-right py-2 text-gray-400">{t.news}</th>
                            <th className="text-right py-2 text-gray-400">{t.comments}</th>
                            <th className="text-right py-2 text-gray-400">{t.clicks}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyStats.map(day => (
                            <tr key={day.date} className="border-b border-gray-700/50">
                              <td className="py-2">{day.date}</td>
                              <td className="py-2 text-right text-orange-400">{day.news_count}</td>
                              <td className="py-2 text-right text-blue-400">{day.comment_count}</td>
                              <td className="py-2 text-right text-yellow-400">{day.click_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">{t.noData}</p>
                  )}
                </div>

                {/* Top News & Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h2 className="text-lg font-bold mb-4">{t.topNews}</h2>
                    {topNews.length > 0 ? (
                      <ul className="space-y-2">
                        {topNews.map(item => (
                          <li key={item.id} className="text-sm text-gray-300 truncate">
                            <span className="font-medium text-orange-400">{item.clicks}</span> - {item.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">{t.noData}</p>
                    )}
                  </div>
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h2 className="text-lg font-bold mb-4">{t.topSources}</h2>
                    {topSources.length > 0 ? (
                      <ul className="space-y-2">
                        {topSources.map(source => (
                          <li key={source.source_name} className="text-sm text-gray-300">
                            <span className="font-medium">{source.source_name}</span>: {source.count} {t.articlesCount}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">{t.noData}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t.manageUsers}</h2>
              <button onClick={fetchUsers} className="text-xs px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded">
                Refresh
              </button>
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-400">Loading users...</span>
              </div>
            ) : usersError && users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-2">{usersError}</p>
                <button onClick={fetchUsers} className="text-orange-400 hover:text-orange-300 text-sm underline">
                  Try Again
                </button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-400">ID</th>
                    <th className="text-left py-2 text-gray-400">{t.username}</th>
                    <th className="text-left py-2 text-gray-400">{t.email}</th>
                    <th className="text-left py-2 text-gray-400">{t.displayName}</th>
                    <th className="text-left py-2 text-gray-400">{t.status || 'Status'}</th>
                    <th className="text-left py-2 text-gray-400">{t.admin}</th>
                    <th className="text-left py-2 text-gray-400">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-700/50">
                      <td className="py-2">{user.id}</td>
                      <td className="py-2">{user.username}</td>
                      <td className="py-2 text-gray-400">{user.email}</td>
                      <td className="py-2">{user.display_name}</td>
                      <td className="py-2">
                        {user.is_banned ? (
                          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400" title={user.banned_reason || ''}>
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${user.is_admin ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-600 text-gray-300'}`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="py-2 space-x-2">
                        <button onClick={() => handleToggleAdmin(user.id, !!user.is_admin)} className="text-blue-400 hover:text-blue-300 text-xs">
                          {user.is_admin ? t.removeAdmin : t.makeAdmin}
                        </button>
                        {user.is_banned ? (
                          <button onClick={() => handleUnbanUser(user.id)} className="text-green-400 hover:text-green-300 text-xs">
                            Unban
                          </button>
                        ) : (
                          <button onClick={() => handleBanUser(user.id)} className="text-yellow-400 hover:text-yellow-300 text-xs">
                            Ban
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 text-xs">
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
              <form onSubmit={handleNewsSearch} className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs mb-1 text-gray-400">{t.search}</label>
                  <input
                    type="text"
                    value={newsSearch}
                    onChange={(e) => setNewsSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-400">{t.source}</label>
                  <select
                    value={newsSource}
                    onChange={(e) => { setNewsSource(e.target.value); setNewsPage(1); }}
                    className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                  >
                    <option value="all">{t.all}</option>
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-400">{t.category}</label>
                  <select
                    value={newsCategory}
                    onChange={(e) => { setNewsCategory(e.target.value); setNewsPage(1); }}
                    className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                  >
                    <option value="all">{t.all}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                  {t.search}
                </button>
              </form>
            </div>

            {/* Bulk Delete */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-300">{t.deleteOlderThan}</span>
              <input
                type="number"
                value={bulkDeleteDays}
                onChange={(e) => setBulkDeleteDays(Number(e.target.value))}
                min="1"
                className="w-20 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-sm"
              />
              <span className="text-sm text-gray-300">{t.days}</span>
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                {t.bulkDelete}
              </button>
            </div>

            {/* News Table */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">ID</th>
                      <th className="text-left py-2 text-gray-400">Title</th>
                      <th className="text-left py-2 text-gray-400">{t.source}</th>
                      <th className="text-left py-2 text-gray-400">{t.category}</th>
                      <th className="text-left py-2 text-gray-400">{t.clicks}</th>
                      <th className="text-left py-2 text-gray-400">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {news.map(item => (
                      <tr key={item.id} className="border-b border-gray-700/50">
                        <td className="py-2">{item.id}</td>
                        <td className="py-2 max-w-xs truncate">{item.title}</td>
                        <td className="py-2 text-gray-400">{item.source_name}</td>
                        <td className="py-2">{item.category || 'general'}</td>
                        <td className="py-2 text-orange-400">{item.clicks}</td>
                        <td className="py-2">
                          <button onClick={() => handleDeleteNews(item.id)} className="text-red-400 hover:text-red-300 text-xs">
                            {t.delete}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {newsTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setNewsPage(p => Math.max(1, p - 1))}
                    disabled={newsPage === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    {t.previous}
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-400">
                    {t.page} {newsPage} {t.of} {newsTotalPages}
                  </span>
                  <button
                    onClick={() => setNewsPage(p => Math.min(newsTotalPages, p + 1))}
                    disabled={newsPage === newsTotalPages}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    {t.next}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Moderation Stats */}
            {moderationStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
                  <h3 className="text-sm text-gray-400">{t.totalComments}</h3>
                  <p className="text-2xl font-bold text-orange-400">{moderationStats.totalComments}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800 border border-yellow-700/50">
                  <h3 className="text-sm text-gray-400">{t.flagged || 'Flagged'}</h3>
                  <p className="text-2xl font-bold text-yellow-400">{moderationStats.flaggedComments}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800 border border-red-700/50">
                  <h3 className="text-sm text-gray-400">{t.hidden || 'Hidden'}</h3>
                  <p className="text-2xl font-bold text-red-400">{moderationStats.hiddenComments}</p>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-400">{t.filterByStatus || 'Filter by status'}:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCommentFilterChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    commentFilter === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t.all} ({moderationStats?.totalComments || 0})
                </button>
                <button
                  onClick={() => handleCommentFilterChange('flagged')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    commentFilter === 'flagged'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{t.flagged || 'Flagged'}</span>
                  {(moderationStats?.flaggedComments || 0) > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-yellow-500/30 rounded">
                      {moderationStats?.flaggedComments}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleCommentFilterChange('hidden')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    commentFilter === 'hidden'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{t.hidden || 'Hidden'}</span>
                  {(moderationStats?.hiddenComments || 0) > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-red-500/30 rounded">
                      {moderationStats?.hiddenComments}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Auto-Moderation Settings */}
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h3 className="font-bold mb-4">Auto-Moderation Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Banned Words (comma-separated)</label>
                  <textarea
                    value={bannedWords}
                    onChange={(e) => setBannedWords(e.target.value)}
                    placeholder="word1, word2, word3..."
                    rows={3}
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleSaveBannedWords}
                    className="mt-2 px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    Save Words
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Comments containing these words will be auto-flagged</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Comment Rate Limit (per hour)</label>
                  <input
                    type="number"
                    value={commentRateLimit}
                    onChange={(e) => setCommentRateLimit(e.target.value)}
                    min="1"
                    className="w-24 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleSaveRateLimit}
                    className="ml-2 px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                  >
                    Save Limit
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Max comments a user can post per hour</p>
                </div>
              </div>
            </div>

            {/* Comments Table */}
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h2 className="text-lg font-bold mb-4">{t.manageComments}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">ID</th>
                      <th className="text-left py-2 text-gray-400">{t.status || 'Status'}</th>
                      <th className="text-left py-2 text-gray-400">{t.author}</th>
                      <th className="text-left py-2 text-gray-400">{t.content}</th>
                      <th className="text-left py-2 text-gray-400">{t.news}</th>
                      <th className="text-left py-2 text-gray-400">{t.like}</th>
                      <th className="text-left py-2 text-gray-400">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.map(comment => (
                      <tr
                        key={comment.id}
                        className={`border-b border-gray-700/50 ${
                          comment.is_hidden ? 'opacity-50 bg-red-900/10' :
                          comment.is_flagged ? 'bg-yellow-900/10' : ''
                        }`}
                      >
                        <td className="py-3">{comment.id}</td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1">
                            {comment.is_flagged === 1 && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 inline-block w-fit">
                                {t.flagged || 'Flagged'}
                              </span>
                            )}
                            {comment.is_hidden === 1 && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 inline-block w-fit">
                                {t.hidden || 'Hidden'}
                              </span>
                            )}
                            {!comment.is_flagged && !comment.is_hidden && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 inline-block w-fit">
                                {t.visible || 'Visible'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">{comment.author_name}</td>
                        <td className="py-3 max-w-xs">
                          <div className="truncate text-gray-300" title={comment.content}>
                            {comment.content}
                          </div>
                          {comment.flag_reason && (
                            <div className="text-xs text-yellow-400 mt-1">
                              {t.reason || 'Reason'}: {comment.flag_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 max-w-xs truncate text-gray-400">{comment.news_title}</td>
                        <td className="py-3 text-orange-400">{comment.likes}</td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleFlagComment(comment.id, !!comment.is_flagged)}
                              className={`text-xs ${
                                comment.is_flagged
                                  ? 'text-green-400 hover:text-green-300'
                                  : 'text-yellow-400 hover:text-yellow-300'
                              }`}
                            >
                              {comment.is_flagged ? (t.unflag || 'Unflag') : (t.flag || 'Flag')}
                            </button>
                            <button
                              onClick={() => handleHideComment(comment.id, !!comment.is_hidden)}
                              className={`text-xs ${
                                comment.is_hidden
                                  ? 'text-blue-400 hover:text-blue-300'
                                  : 'text-orange-400 hover:text-orange-300'
                              }`}
                            >
                              {comment.is_hidden ? (t.show || 'Show') : (t.hide || 'Hide')}
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              {t.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {commentsTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCommentsPage(p => Math.max(1, p - 1))}
                    disabled={commentsPage === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    {t.previous}
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-400">
                    {t.page} {commentsPage} {t.of} {commentsTotalPages}
                  </span>
                  <button
                    onClick={() => setCommentsPage(p => Math.min(commentsTotalPages, p + 1))}
                    disabled={commentsPage === commentsTotalPages}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    {t.next}
                  </button>
                </div>
              )}

              {comments.length === 0 && (
                <p className="text-center py-4 text-gray-500">{t.noData}</p>
              )}
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="space-y-6">
            {/* Notification Permission */}
            {!notificationsEnabled && 'Notification' in window && (
              <div className="p-4 rounded-xl bg-blue-900/30 border border-blue-700 flex items-center justify-between">
                <span className="text-sm text-blue-300">Enable browser notifications for real-time error alerts</span>
                <button
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {/* Stats Cards */}
            {errorStats && (
              <ErrorStatsCards
                totalErrors={errorStats.totalErrors}
                unresolvedErrors={errorStats.unresolvedErrors}
                todayErrors={errorStats.todayErrors}
              />
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Errors Over Time (7 Days)</h3>
                <ErrorsOverTimeChart data={errorsByDay} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h3 className="text-sm font-bold mb-2">By Type</h3>
                  <ErrorsByTypeChart data={errorStats?.errorsByType || []} />
                </div>
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h3 className="text-sm font-bold mb-2">By Level</h3>
                  <ErrorsByLevelChart data={errorStats?.errorsByLevel || []} />
                </div>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs mb-1 text-gray-400">Level</label>
                <select
                  value={errorLevelFilter}
                  onChange={(e) => { setErrorLevelFilter(e.target.value); handleErrorFilterChange(); }}
                  className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">Type</label>
                <select
                  value={errorTypeFilter}
                  onChange={(e) => { setErrorTypeFilter(e.target.value); handleErrorFilterChange(); }}
                  className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="api">API</option>
                  <option value="database">Database</option>
                  <option value="auth">Auth</option>
                  <option value="rss">RSS</option>
                  <option value="validation">Validation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">Status</label>
                <select
                  value={errorResolvedFilter}
                  onChange={(e) => { setErrorResolvedFilter(e.target.value); handleErrorFilterChange(); }}
                  className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                >
                  <option value="all">All</option>
                  <option value="false">Unresolved</option>
                  <option value="true">Resolved</option>
                </select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="number"
                  value={bulkDeleteErrorDays}
                  onChange={(e) => setBulkDeleteErrorDays(Number(e.target.value))}
                  min="1"
                  className="w-16 px-2 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                />
                <button
                  onClick={handleBulkDeleteErrors}
                  className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete Old
                </button>
                <button
                  onClick={handleClearResolvedErrors}
                  className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                >
                  Clear Resolved
                </button>
              </div>
            </div>

            {/* Error Logs Table */}
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Error Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">ID</th>
                      <th className="text-left py-2 text-gray-400">Level</th>
                      <th className="text-left py-2 text-gray-400">Type</th>
                      <th className="text-left py-2 text-gray-400">Message</th>
                      <th className="text-left py-2 text-gray-400">Endpoint</th>
                      <th className="text-left py-2 text-gray-400">Time</th>
                      <th className="text-left py-2 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map(error => (
                      <tr key={error.id} className={`border-b border-gray-700/50 ${error.resolved ? 'opacity-50' : ''}`}>
                        <td className="py-2">{error.id}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            error.level === 'error' ? 'bg-red-500/20 text-red-400' :
                            error.level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {error.level}
                          </span>
                        </td>
                        <td className="py-2 text-gray-400">{error.type}</td>
                        <td className="py-2 max-w-xs truncate" title={error.message}>{error.message}</td>
                        <td className="py-2 text-gray-500">{error.endpoint || '-'}</td>
                        <td className="py-2 text-gray-500 text-xs">{new Date(error.created_at).toLocaleString()}</td>
                        <td className="py-2 space-x-2">
                          <button
                            onClick={() => handleResolveError(error.id, !!error.resolved)}
                            className={`text-xs ${error.resolved ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                          >
                            {error.resolved ? 'Unresolve' : 'Resolve'}
                          </button>
                          <button
                            onClick={() => handleDeleteError(error.id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {errorsTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setErrorsPage(p => Math.max(1, p - 1))}
                    disabled={errorsPage === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-400">
                    Page {errorsPage} of {errorsTotalPages}
                  </span>
                  <button
                    onClick={() => setErrorsPage(p => Math.min(errorsTotalPages, p + 1))}
                    disabled={errorsPage === errorsTotalPages}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              )}

              {errors.length === 0 && (
                <p className="text-center py-4 text-gray-500">No errors found</p>
              )}
            </div>
          </div>
        )}

        {/* Feeds Tab */}
        {activeTab === 'feeds' && (
          <div className="space-y-6">
            {/* Add Feed Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{t.manageFeeds || 'Manage RSS Feeds'}</h2>
              <button
                onClick={() => setShowAddFeed(!showAddFeed)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
              >
                {showAddFeed ? (t.cancel || 'Cancel') : (t.addFeed || 'Add Feed')}
              </button>
            </div>

            {/* Add Feed Form */}
            {showAddFeed && (
              <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
                <h3 className="font-medium mb-4">{t.addNewFeed || 'Add New Feed'}</h3>
                {feedError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
                    {feedError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs mb-1 text-gray-400">{t.feedName || 'Feed Name'}</label>
                    <input
                      type="text"
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                      placeholder="e.g. Borneo Post"
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-400">{t.feedUrl || 'Feed URL'}</label>
                    <input
                      type="url"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                      placeholder="https://example.com/feed/"
                      className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFeedIsSarawak}
                      onChange={(e) => setNewFeedIsSarawak(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300">{t.sarawakSource || 'Sarawak-dedicated source (all articles accepted)'}</span>
                  </label>
                  <button
                    onClick={handleAddFeed}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                  >
                    {t.addFeed || 'Add Feed'}
                  </button>
                </div>
              </div>
            )}

            {/* Feeds List */}
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">{t.status || 'Status'}</th>
                      <th className="text-left py-2 text-gray-400">{t.feedName || 'Name'}</th>
                      <th className="text-left py-2 text-gray-400">URL</th>
                      <th className="text-left py-2 text-gray-400">{t.type || 'Type'}</th>
                      <th className="text-left py-2 text-gray-400">{t.lastFetched || 'Last Fetched'}</th>
                      <th className="text-left py-2 text-gray-400">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeds.map(feed => (
                      <tr key={feed.id} className={`border-b border-gray-700/50 ${feed.is_active === 0 ? 'opacity-50' : ''}`}>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            feed.is_active === 1
                              ? feed.error_count > 0
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                              : 'bg-gray-600 text-gray-400'
                          }`}>
                            {feed.is_active === 1
                              ? feed.error_count > 0
                                ? `${t.warning || 'Warning'} (${feed.error_count})`
                                : t.active || 'Active'
                              : t.inactive || 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 font-medium">{feed.name}</td>
                        <td className="py-3 text-gray-400 max-w-xs truncate" title={feed.url}>{feed.url}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            feed.is_sarawak_source === 1
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {feed.is_sarawak_source === 1 ? (t.sarawak || 'Sarawak') : (t.filtered || 'Filtered')}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-xs">
                          {feed.last_fetched_at
                            ? new Date(feed.last_fetched_at).toLocaleString()
                            : t.never || 'Never'}
                        </td>
                        <td className="py-3 space-x-2">
                          <button
                            onClick={() => handleToggleFeed(feed.id)}
                            className={`text-xs ${feed.is_active === 1 ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                          >
                            {feed.is_active === 1 ? (t.disable || 'Disable') : (t.enable || 'Enable')}
                          </button>
                          <button
                            onClick={() => handleDeleteFeed(feed.id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            {t.delete}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {feeds.length === 0 && (
                <p className="text-center py-4 text-gray-500">{t.noFeeds || 'No feeds configured'}</p>
              )}

              {/* Feed error info */}
              {feeds.some(f => f.last_error) && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-400 mb-2">{t.recentErrors || 'Recent Errors'}</h4>
                  {feeds.filter(f => f.last_error).map(feed => (
                    <div key={feed.id} className="text-xs text-gray-400 mb-1">
                      <span className="font-medium">{feed.name}:</span> {feed.last_error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Subscription Stats */}
            {subscriptionStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
                  <h3 className="text-sm text-gray-400">{t.premiumUsers || 'Premium Users'}</h3>
                  <p className="text-2xl font-bold text-orange-400">{subscriptionStats.totalPremium}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
                  <h3 className="text-sm text-gray-400">{t.freeUsers || 'Free Users'}</h3>
                  <p className="text-2xl font-bold text-gray-400">{subscriptionStats.totalFree}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800 border border-yellow-700/50">
                  <h3 className="text-sm text-gray-400">{t.pendingPayments || 'Pending Payments'}</h3>
                  <p className="text-2xl font-bold text-yellow-400">{subscriptionStats.pendingPayments}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-800 border border-orange-700/50">
                  <h3 className="text-sm text-gray-400">{t.revenueThisMonth || 'Revenue (This Month)'}</h3>
                  <p className="text-2xl font-bold text-orange-400">RM {subscriptionStats.revenueThisMonth.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-400">{t.filterByStatus || 'Filter by status'}:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePaymentFilterChange('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t.pending || 'Pending'}
                </button>
                <button
                  onClick={() => handlePaymentFilterChange('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'approved'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t.approved || 'Approved'}
                </button>
                <button
                  onClick={() => handlePaymentFilterChange('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t.rejected || 'Rejected'}
                </button>
                <button
                  onClick={() => handlePaymentFilterChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t.all}
                </button>
              </div>
            </div>

            {/* Payments Table */}
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h2 className="text-lg font-bold mb-4">{t.paymentSubmissions || 'Payment Submissions'}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">ID</th>
                      <th className="text-left py-2 text-gray-400">{t.status || 'Status'}</th>
                      <th className="text-left py-2 text-gray-400">{t.user || 'User'}</th>
                      <th className="text-left py-2 text-gray-400">{t.amount || 'Amount'}</th>
                      <th className="text-left py-2 text-gray-400">{t.method || 'Method'}</th>
                      <th className="text-left py-2 text-gray-400">{t.reference || 'Reference'}</th>
                      <th className="text-left py-2 text-gray-400">{t.date || 'Date'}</th>
                      <th className="text-left py-2 text-gray-400">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id} className="border-b border-gray-700/50">
                        <td className="py-3">{payment.id}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{payment.username}</div>
                          <div className="text-xs text-gray-500">{payment.email}</div>
                        </td>
                        <td className="py-3 text-orange-400 font-medium">RM {payment.amount.toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.payment_method === 'duitnow' ? 'bg-pink-500/20 text-pink-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {payment.payment_method === 'duitnow' ? 'DuitNow' : 'Sarawak Pay'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="font-mono text-sm">{payment.reference_number}</div>
                          {payment.description && (
                            <div className="text-xs text-gray-500 mt-1">{payment.description}</div>
                          )}
                        </td>
                        <td className="py-3 text-gray-500 text-xs">
                          {new Date(payment.created_at).toLocaleString()}
                        </td>
                        <td className="py-3">
                          {payment.status === 'pending' ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleApprovePayment(payment.id)}
                                className="text-green-400 hover:text-green-300 text-xs"
                              >
                                {t.approve || 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectPayment(payment.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                {t.reject || 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {payment.reviewed_at && (
                                <div>{new Date(payment.reviewed_at).toLocaleDateString()}</div>
                              )}
                              {payment.admin_note && (
                                <div className="text-yellow-400">{payment.admin_note}</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paymentsTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                    disabled={paymentsPage === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    {t.previous}
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-400">
                    {t.page} {paymentsPage} {t.of} {paymentsTotalPages}
                  </span>
                  <button
                    onClick={() => setPaymentsPage(p => Math.min(paymentsTotalPages, p + 1))}
                    disabled={paymentsPage === paymentsTotalPages}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    {t.next}
                  </button>
                </div>
              )}

              {payments.length === 0 && (
                <p className="text-center py-4 text-gray-500">{t.noPayments || 'No payments found'}</p>
              )}
            </div>
          </div>
        )}
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : analyticsData ? (
              <>
                {/* User Engagement Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                    <h3 className="text-sm text-gray-400">Daily Active Users</h3>
                    <p className="text-3xl font-bold text-blue-400">{analyticsData.userEngagement?.dau || 0}</p>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                    <h3 className="text-sm text-gray-400">Weekly Active Users</h3>
                    <p className="text-3xl font-bold text-purple-400">{analyticsData.userEngagement?.wau || 0}</p>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                    <h3 className="text-sm text-gray-400">Monthly Active Users</h3>
                    <p className="text-3xl font-bold text-orange-400">{analyticsData.userEngagement?.mau || 0}</p>
                  </div>
                </div>

                {/* Search Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Search Volume (30 days)</h3>
                    <SearchVolumeChart data={analyticsData.searchAnalytics?.volumeOverTime || []} />
                  </div>
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Top Search Queries</h3>
                    {analyticsData.searchAnalytics?.topQueries?.length > 0 ? (
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 text-gray-400">Query</th>
                              <th className="text-right py-2 text-gray-400">Count</th>
                              <th className="text-right py-2 text-gray-400">Avg Results</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.searchAnalytics.topQueries.map((q: { query: string; count: number; avg_results: number }, i: number) => (
                              <tr key={i} className="border-b border-gray-700/50">
                                <td className="py-2">{q.query}</td>
                                <td className="py-2 text-right text-orange-400">{q.count}</td>
                                <td className="py-2 text-right text-gray-400">{q.avg_results}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No search data yet</p>
                    )}
                  </div>
                </div>

                {/* Zero-Result Queries */}
                {analyticsData.searchAnalytics?.zeroResultQueries?.length > 0 && (
                  <div className="p-6 rounded-xl bg-gray-800 border border-yellow-700/50">
                    <h3 className="text-lg font-bold mb-4 text-yellow-400">Zero-Result Queries</h3>
                    <div className="flex flex-wrap gap-2">
                      {analyticsData.searchAnalytics.zeroResultQueries.map((q: { query: string; count: number }, i: number) => (
                        <span key={i} className="px-3 py-1 bg-yellow-500/10 border border-yellow-700/30 rounded-full text-sm text-yellow-300">
                          {q.query} ({q.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Performance & Category Engagement */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Source Performance (Avg Clicks)</h3>
                    <SourcePerformanceChart data={analyticsData.sourcePerformance || []} />
                  </div>
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Category Engagement</h3>
                    <CategoryEngagementChart data={analyticsData.categoryEngagement || []} />
                  </div>
                </div>

                {/* Source Performance Table */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4">Source Performance Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 text-gray-400">Source</th>
                          <th className="text-right py-2 text-gray-400">Articles</th>
                          <th className="text-right py-2 text-gray-400">Total Clicks</th>
                          <th className="text-right py-2 text-gray-400">Avg Clicks</th>
                          <th className="text-right py-2 text-gray-400">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analyticsData.sourcePerformance || []).map((s: { source_name: string; article_count: number; total_clicks: number; avg_clicks: number; total_comments: number }, i: number) => (
                          <tr key={i} className="border-b border-gray-700/50">
                            <td className="py-2 font-medium">{s.source_name}</td>
                            <td className="py-2 text-right">{s.article_count}</td>
                            <td className="py-2 text-right text-orange-400">{s.total_clicks}</td>
                            <td className="py-2 text-right text-blue-400">{s.avg_clicks}</td>
                            <td className="py-2 text-right text-purple-400">{s.total_comments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Translation Coverage & Article Age */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Translation Coverage</h3>
                    <TranslationCoverageChart
                      data={{
                        translated: analyticsData.translationStats?.both_translated || 0,
                        untranslated: (analyticsData.translationStats?.total || 0) - (analyticsData.translationStats?.both_translated || 0)
                      }}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Chinese (ZH):</span>{' '}
                        <span className="text-orange-400">{analyticsData.translationStats?.translated_zh || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Malay (MS):</span>{' '}
                        <span className="text-orange-400">{analyticsData.translationStats?.translated_ms || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Both:</span>{' '}
                        <span className="text-green-400">{analyticsData.translationStats?.both_translated || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Coverage:</span>{' '}
                        <span className="text-blue-400">{analyticsData.translationStats?.coverage_pct || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Article Age Distribution</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gray-700/50">
                        <p className="text-2xl font-bold text-green-400">{analyticsData.articleAgeStats?.today || 0}</p>
                        <p className="text-xs text-gray-400">Today</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-700/50">
                        <p className="text-2xl font-bold text-blue-400">{analyticsData.articleAgeStats?.this_week || 0}</p>
                        <p className="text-xs text-gray-400">This Week</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-700/50">
                        <p className="text-2xl font-bold text-orange-400">{analyticsData.articleAgeStats?.this_month || 0}</p>
                        <p className="text-xs text-gray-400">This Month</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-700/50">
                        <p className="text-2xl font-bold text-gray-400">{analyticsData.articleAgeStats?.older || 0}</p>
                        <p className="text-xs text-gray-400">Older</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Peak Hours & User Growth */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Peak Activity Hours</h3>
                    <PeakHoursChart data={analyticsData.userEngagement?.peakHours || []} />
                  </div>
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">User Growth (30 days)</h3>
                    <UserGrowthChart data={analyticsData.userEngagement?.userGrowth || []} />
                  </div>
                </div>

                {/* Top Active Users */}
                {analyticsData.userEngagement?.topUsers?.length > 0 && (
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Top Active Users</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-gray-400">User</th>
                            <th className="text-right py-2 text-gray-400">Comments</th>
                            <th className="text-right py-2 text-gray-400">Likes Given</th>
                            <th className="text-right py-2 text-gray-400">Total Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.userEngagement.topUsers.map((u: { id: number; username: string; display_name: string; comments: number; likes_given: number }) => (
                            <tr key={u.id} className="border-b border-gray-700/50">
                              <td className="py-2">
                                <span className="font-medium">{u.display_name}</span>
                                <span className="text-gray-500 ml-2 text-xs">@{u.username}</span>
                              </td>
                              <td className="py-2 text-right text-purple-400">{u.comments}</td>
                              <td className="py-2 text-right text-blue-400">{u.likes_given}</td>
                              <td className="py-2 text-right text-orange-400 font-medium">{u.comments + u.likes_given}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No analytics data available</p>
            )}
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Action Filter */}
            <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs mb-1 text-gray-400">Filter by Action</label>
                <select
                  value={auditActionFilter}
                  onChange={(e) => { setAuditActionFilter(e.target.value); handleAuditFilterChange(); }}
                  className="px-3 py-2 rounded bg-gray-700 border border-gray-600 text-sm"
                >
                  <option value="all">All Actions</option>
                  {auditActions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
              <h2 className="text-lg font-bold mb-4">Audit Log</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Time</th>
                      <th className="text-left py-2 text-gray-400">Admin</th>
                      <th className="text-left py-2 text-gray-400">Action</th>
                      <th className="text-left py-2 text-gray-400">Target</th>
                      <th className="text-left py-2 text-gray-400">Details</th>
                      <th className="text-left py-2 text-gray-400">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: { id: number; admin_username: string | null; action: string; target_type: string | null; target_id: string | null; details: string | null; ip_address: string | null; created_at: string }) => (
                      <tr key={log.id} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-500 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2 font-medium">{log.admin_username || 'system'}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 text-gray-400">
                          {log.target_type && <span>{log.target_type}</span>}
                          {log.target_id && <span className="ml-1 text-orange-400">#{log.target_id}</span>}
                        </td>
                        <td className="py-2 max-w-xs truncate text-gray-500" title={log.details || ''}>{log.details || '-'}</td>
                        <td className="py-2 text-gray-600 text-xs">{log.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                    disabled={auditPage === 1}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-400">
                    Page {auditPage} of {auditTotalPages}
                  </span>
                  <button
                    onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                    disabled={auditPage === auditTotalPages}
                    className="px-3 py-1 rounded bg-gray-700 text-sm disabled:opacity-50 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              )}

              {auditLogs.length === 0 && (
                <p className="text-center py-4 text-gray-500">No audit log entries yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
