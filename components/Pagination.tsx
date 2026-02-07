'use client';

import { Language, translations } from '@/lib/i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lang: Language;
}

export default function Pagination({ currentPage, totalPages, onPageChange, lang }: PaginationProps) {
  const t = translations[lang];

  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-100">
      {/* Page Info */}
      <div className="text-sm text-gray-500">
        {t.page} {currentPage} {t.of} {totalPages}
      </div>

      {/* Page Buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← {t.previous}
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-orange-50'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="px-2 text-gray-400">...</span>
            )
          ))}
        </div>

        {/* Mobile Current Page */}
        <div className="sm:hidden px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
          {currentPage}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t.next} →
        </button>
      </div>
    </div>
  );
}
