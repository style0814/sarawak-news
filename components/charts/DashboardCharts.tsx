'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

// Colors for charts
const COLORS = {
  primary: '#f97316',
  secondary: '#06b6d4',
  tertiary: '#8b5cf6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

const CATEGORY_COLORS: Record<string, string> = {
  general: '#6b7280',
  politics: '#ef4444',
  economy: '#f97316',
  sports: '#f59e0b',
  crime: '#7c3aed',
  environment: '#22c55e',
  culture: '#ec4899',
  education: '#3b82f6',
  health: '#14b8a6',
  infrastructure: '#f97316',
  tourism: '#06b6d4'
};

const PIE_COLORS = ['#f97316', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

interface DailyStats {
  date: string;
  news_count: number;
  comment_count: number;
  click_count: number;
}

interface SourceStats {
  source_name: string;
  count: number;
}

interface CategoryStats {
  category: string;
  count: number;
}

// Daily activity line chart
export function DailyActivityChart({ data }: { data: DailyStats[] }) {
  const chartData = [...data].map(d => ({
    ...d,
    date: d.date.slice(5) // Show MM-DD only
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="news_count"
            stroke={COLORS.primary}
            fillOpacity={1}
            fill="url(#colorNews)"
            name="News"
          />
          <Area
            type="monotone"
            dataKey="comment_count"
            stroke={COLORS.secondary}
            fillOpacity={1}
            fill="url(#colorComments)"
            name="Comments"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Click trend chart
export function ClickTrendChart({ data }: { data: DailyStats[] }) {
  const chartData = [...data].map(d => ({
    ...d,
    date: d.date.slice(5)
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Line
            type="monotone"
            dataKey="click_count"
            stroke={COLORS.warning}
            strokeWidth={3}
            dot={{ fill: COLORS.warning, r: 5 }}
            name="Clicks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sources pie chart
export function SourcesChart({ data }: { data: SourceStats[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  // Take top 6 sources, group rest as "Other"
  const topSources = data.slice(0, 6);
  const otherCount = data.slice(6).reduce((sum, s) => sum + s.count, 0);
  const chartData: Array<{ source_name: string; count: number; [key: string]: string | number }> = otherCount > 0
    ? [...topSources.map(s => ({ ...s })), { source_name: 'Other', count: otherCount }]
    : topSources.map(s => ({ ...s }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="source_name"
            label={({ name, percent }: { name?: string; percent?: number }) => {
              const displayName = name || '';
              return `${displayName.slice(0, 10)}${displayName.length > 10 ? '...' : ''} ${((percent || 0) * 100).toFixed(0)}%`;
            }}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Categories bar chart
export function CategoriesChart({ data }: { data: CategoryStats[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    fill: CATEGORY_COLORS[d.category] || '#6b7280'
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis dataKey="category" type="category" stroke="#9ca3af" fontSize={12} width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Bar dataKey="count" name="Articles">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Engagement metrics chart
export function EngagementChart({ data }: { data: DailyStats[] }) {
  const chartData = [...data].map(d => ({
    date: d.date.slice(5),
    engagement: d.click_count + (d.comment_count * 5), // Weight comments more
    clicks: d.click_count,
    comments: d.comment_count
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend />
          <Bar dataKey="clicks" stackId="a" fill={COLORS.primary} name="Clicks" />
          <Bar dataKey="comments" stackId="a" fill={COLORS.tertiary} name="Comments" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Overview stats cards
interface OverviewStatsProps {
  totalNews: number;
  totalUsers: number;
  totalComments: number;
  todayNews?: number;
  weeklyGrowth?: number;
}

export function OverviewStatsCards({ totalNews, totalUsers, totalComments, todayNews, weeklyGrowth }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 text-lg">📰</span>
          </div>
          <h3 className="text-sm text-gray-400">Total News</h3>
        </div>
        <p className="text-3xl font-bold text-orange-400">{totalNews.toLocaleString()}</p>
        {todayNews !== undefined && (
          <p className="text-xs text-orange-500 mt-1">+{todayNews} today</p>
        )}
      </div>
      <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-400 text-lg">👥</span>
          </div>
          <h3 className="text-sm text-gray-400">Total Users</h3>
        </div>
        <p className="text-3xl font-bold text-blue-400">{totalUsers.toLocaleString()}</p>
      </div>
      <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <span className="text-purple-400 text-lg">💬</span>
          </div>
          <h3 className="text-sm text-gray-400">Comments</h3>
        </div>
        <p className="text-3xl font-bold text-purple-400">{totalComments.toLocaleString()}</p>
      </div>
      <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-lg">📈</span>
          </div>
          <h3 className="text-sm text-gray-400">Weekly Growth</h3>
        </div>
        <p className="text-3xl font-bold text-amber-400">
          {weeklyGrowth !== undefined ? `${weeklyGrowth > 0 ? '+' : ''}${weeklyGrowth}%` : 'N/A'}
        </p>
      </div>
    </div>
  );
}
