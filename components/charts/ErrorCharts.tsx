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
  Bar
} from 'recharts';

// Colors for charts
const COLORS = {
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  api: '#8b5cf6',
  database: '#ec4899',
  auth: '#14b8a6',
  rss: '#f97316',
  validation: '#6366f1',
  other: '#6b7280'
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

interface DayData {
  date: string;
  count: number;
  errors: number;
  warnings: number;
  info: number;
}

interface ErrorsByLevelProps {
  data: { level: string; count: number }[];
}

interface ErrorsByTypeProps {
  data: { type: string; count: number }[];
}

interface ErrorsByDayProps {
  data: DayData[];
}

// Line chart for errors over time
export function ErrorsOverTimeChart({ data }: ErrorsByDayProps) {
  // Reverse to show oldest first for time series
  const chartData = [...data].reverse().map(d => ({
    ...d,
    date: d.date.slice(5) // Show MM-DD only
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
          <Legend />
          <Line
            type="monotone"
            dataKey="errors"
            stroke={COLORS.error}
            strokeWidth={2}
            dot={{ fill: COLORS.error, r: 4 }}
            name="Errors"
          />
          <Line
            type="monotone"
            dataKey="warnings"
            stroke={COLORS.warning}
            strokeWidth={2}
            dot={{ fill: COLORS.warning, r: 4 }}
            name="Warnings"
          />
          <Line
            type="monotone"
            dataKey="info"
            stroke={COLORS.info}
            strokeWidth={2}
            dot={{ fill: COLORS.info, r: 4 }}
            name="Info"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie chart for errors by type
export function ErrorsByTypeChart({ data }: ErrorsByTypeProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="type"
            label={({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.type as keyof typeof COLORS] || PIE_COLORS[index % PIE_COLORS.length]}
              />
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

// Bar chart for errors by level
export function ErrorsByLevelChart({ data }: ErrorsByLevelProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    fill: COLORS[d.level as keyof typeof COLORS] || '#6b7280'
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="level" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Bar dataKey="count" name="Count">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Stats cards component
interface ErrorStatsCardsProps {
  totalErrors: number;
  unresolvedErrors: number;
  todayErrors: number;
}

export function ErrorStatsCards({ totalErrors, unresolvedErrors, todayErrors }: ErrorStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
        <h3 className="text-sm text-gray-400">Total Errors</h3>
        <p className="text-3xl font-bold text-white">{totalErrors}</p>
      </div>
      <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
        <h3 className="text-sm text-gray-400">Unresolved</h3>
        <p className="text-3xl font-bold text-red-400">{unresolvedErrors}</p>
      </div>
      <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
        <h3 className="text-sm text-gray-400">Today</h3>
        <p className="text-3xl font-bold text-yellow-400">{todayErrors}</p>
      </div>
    </div>
  );
}
