# Search Feature

## Overview

Advanced search functionality with filters, sorting, and autocomplete suggestions. Users can find news articles by keywords, filter by category/source/date, and sort results.

## Features

- **Full-text search** - Search across title, content, and source
- **Category filter** - Filter by politics, business, sports, etc.
- **Source filter** - Filter by news source
- **Date range** - Filter by publication date
- **Sort options** - Relevance, newest first, most popular
- **Autocomplete** - Real-time search suggestions as you type
- **Responsive** - Works on mobile and desktop

## Components

### SearchBar.tsx

Located at `components/SearchBar.tsx`

```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}
```

**Features:**
- Debounced input (300ms delay)
- Autocomplete dropdown
- Clear button
- Search icon
- Keyboard navigation (arrow keys, enter)

## API Endpoint

### GET /api/search

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |
| `category` | string | Filter by category |
| `source` | string | Filter by source |
| `dateFrom` | string | Start date (YYYY-MM-DD) |
| `dateTo` | string | End date (YYYY-MM-DD) |
| `sortBy` | string | `relevance` \| `date` \| `clicks` |
| `suggestions` | boolean | Return autocomplete suggestions |

**Example Requests:**

```bash
# Basic search
GET /api/search?q=election

# With filters
GET /api/search?q=election&category=politics&source=Borneo%20Post

# Date range
GET /api/search?q=economy&dateFrom=2024-01-01&dateTo=2024-01-31

# Sorted by popularity
GET /api/search?q=tourism&sortBy=clicks

# Autocomplete suggestions
GET /api/search?q=sar&suggestions=true
```

**Response (search):**

```json
{
  "news": [
    {
      "id": 123,
      "title": "Sarawak Election Results",
      "title_zh": "砂拉越选举结果",
      "title_ms": "Keputusan Pilihan Raya Sarawak",
      "source_name": "Borneo Post",
      "source_url": "https://...",
      "category": "politics",
      "clicks": 150,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 45,
  "totalPages": 3,
  "sources": ["Borneo Post", "Dayak Daily", "The Star"],
  "categories": ["politics", "business", "local"]
}
```

**Response (suggestions):**

```json
{
  "suggestions": [
    "sarawak election",
    "sarawak tourism",
    "sarawak economy"
  ]
}
```

## Database Functions

### searchNews()

```typescript
export interface SearchFilters {
  category?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'date' | 'clicks';
}

export function searchNews(
  query: string,
  page: number = 1,
  limit: number = 20,
  filters: SearchFilters = {}
): {
  news: NewsItem[];
  total: number;
  totalPages: number;
  sources: string[];
  categories: string[];
}
```

**How it works:**

1. Build WHERE clause with LIKE patterns
2. Apply category/source filters if provided
3. Apply date range if provided
4. Calculate total for pagination
5. Get distinct sources/categories for filter options
6. Sort by specified order

### getSearchSuggestions()

```typescript
export function getSearchSuggestions(
  query: string,
  limit: number = 5
): string[]
```

Returns unique title fragments matching the query prefix.

## Sort Options

| Value | Description |
|-------|-------------|
| `relevance` | Default, matches LIKE patterns first |
| `date` | Newest articles first |
| `clicks` | Most popular first |

## UI Flow

```
1. User types in search box
   │
2. Debounce (300ms)
   │
3. If suggestions enabled:
   │  └── GET /api/search?q=...&suggestions=true
   │      └── Show autocomplete dropdown
   │
4. User presses Enter or clicks Search
   │
5. GET /api/search?q=...&filters...
   │
6. Display results with:
   ├── Result count
   ├── Filter chips (active filters)
   ├── Sort dropdown
   └── News cards
```

## Filter Panel

The advanced search can include a filter panel:

```typescript
// Filter state
const [filters, setFilters] = useState<SearchFilters>({});

// Available filter options (from API response)
const [availableSources, setAvailableSources] = useState<string[]>([]);
const [availableCategories, setAvailableCategories] = useState<string[]>([]);
```

## Internationalization

Search supports multi-language:

```typescript
// Search across all title translations
WHERE (
  title LIKE ? OR
  title_zh LIKE ? OR
  title_ms LIKE ?
)
```

Results display title in user's selected language.

## Translations

```typescript
// lib/i18n.ts
{
  search: 'Search',
  searchPlaceholder: 'Search news...',
  advancedSearch: 'Advanced Search',
  sortBy: 'Sort by',
  relevance: 'Relevance',
  dateNewest: 'Newest First',
  mostPopular: 'Most Popular',
  dateRange: 'Date Range',
  clearFilters: 'Clear Filters',
  resultsFound: 'results found',
  noResults: 'No results found'
}
```

## Performance

- Debounced input prevents excessive API calls
- Suggestions limited to 5 results
- Paginated results (default 20 per page)
- Indexes on searchable columns

## Usage Example

```tsx
import SearchBar from '@/components/SearchBar';

export default function HomePage() {
  const handleSearch = async (query: string) => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setResults(data.news);
  };

  return (
    <SearchBar
      onSearch={handleSearch}
      placeholder={t.searchPlaceholder}
    />
  );
}
```
