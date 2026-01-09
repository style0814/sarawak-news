'use client';

import { Language, translations } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: {
    all: 'All',
    general: 'General',
    politics: 'Politics',
    economy: 'Economy',
    sports: 'Sports',
    crime: 'Crime',
    environment: 'Environment',
    culture: 'Culture',
    education: 'Education',
    health: 'Health',
    infrastructure: 'Infrastructure',
    tourism: 'Tourism'
  },
  zh: {
    all: '全部',
    general: '综合',
    politics: '政治',
    economy: '经济',
    sports: '体育',
    crime: '犯罪',
    environment: '环境',
    culture: '文化',
    education: '教育',
    health: '健康',
    infrastructure: '基建',
    tourism: '旅游'
  },
  ms: {
    all: 'Semua',
    general: 'Umum',
    politics: 'Politik',
    economy: 'Ekonomi',
    sports: 'Sukan',
    crime: 'Jenayah',
    environment: 'Alam Sekitar',
    culture: 'Budaya',
    education: 'Pendidikan',
    health: 'Kesihatan',
    infrastructure: 'Infrastruktur',
    tourism: 'Pelancongan'
  }
};

const CATEGORY_ICONS: Record<string, string> = {
  all: '📰',
  general: '📄',
  politics: '🏛️',
  economy: '💰',
  sports: '⚽',
  crime: '🚔',
  environment: '🌿',
  culture: '🎭',
  education: '📚',
  health: '🏥',
  infrastructure: '🏗️',
  tourism: '✈️'
};

interface CategoryFilterProps {
  categories: readonly string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  lang: Language;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  lang
}: CategoryFilterProps) {
  const { isDark } = useTheme();
  const labels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedCategory === category
              ? 'bg-emerald-500 text-white shadow-md scale-105'
              : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{CATEGORY_ICONS[category] || '📁'}</span>
          <span>{labels[category] || category}</span>
        </button>
      ))}
    </div>
  );
}
