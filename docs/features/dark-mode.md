# Dark Mode / Theme System

## Overview

Toggle between light and dark themes with persistence across sessions and browser tabs.

## How It Works

```
User clicks toggle → ThemeProvider updates state → saves to localStorage
                                                 → saves to DB (if logged in)
                                                 → applies class to <html>
                                                 → syncs to other open tabs
```

## Key Files

| File | Purpose |
|------|---------|
| `components/ThemeProvider.tsx` | React Context provider with theme state |
| `components/DarkModeToggle.tsx` | Toggle button component |
| `app/globals.css` | Dark mode Tailwind classes |

## ThemeProvider

```typescript
// Provides to all children:
const { isDark, toggleTheme } = useTheme();
```

- Reads initial value from `localStorage` key `sarawak-news-theme`
- Falls back to system preference via `prefers-color-scheme: dark`
- On toggle: updates state, localStorage, and `<html>` class
- Cross-tab sync via `window.addEventListener('storage', ...)`
- For authenticated users, also saves to DB via `POST /api/preferences`

## Styling Pattern

Components use conditional classes throughout the app:

```tsx
<div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}>
```

## Storage

- **localStorage**: `sarawak-news-theme` = `'dark'` or `'light'`
- **Database**: `user_preferences` table, `theme` column (for logged-in users)
