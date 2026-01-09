# Next.js 16 (App Router + Turbopack)

## What is Next.js?

Next.js is a **React framework** that adds extra features on top of React:
- Server-side rendering (SSR)
- API routes (backend in same project)
- File-based routing
- Built-in optimization
- Turbopack for fast development builds

## Why We Use It

### 1. Full-Stack in One Project
```
Without Next.js:
├── frontend/          # Separate React app
└── backend/           # Separate Express server

With Next.js:
└── sarawak-news/      # Everything in one place
    ├── app/page.tsx   # Frontend pages
    └── app/api/       # Backend API routes
```

### 2. File-Based Routing
No need to configure routes manually. Just create files:

```
app/
├── page.tsx              → localhost:3000/
├── about/page.tsx        → localhost:3000/about
└── api/
    ├── news/route.ts     → localhost:3000/api/news
    └── refresh/route.ts  → localhost:3000/api/refresh
```

### 3. App Router (Standard in Next.js 13+)
We use the **App Router** (not the older Pages Router):

| Feature | App Router (Current) | Pages Router (Legacy) |
|---------|---------------------|----------------------|
| Folder | `app/` | `pages/` |
| Components | Server by default | Client by default |
| Layouts | Built-in | Manual |
| Data Fetching | async/await | getServerSideProps |

### 4. Server vs Client Components

```tsx
// Server Component (default) - runs on server
export default function Page() {
  return <div>Hello</div>
}

// Client Component - runs in browser
'use client'  // Add this line at top
export default function Button() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**Rule**: Use `'use client'` only when you need:
- useState, useEffect (React hooks)
- onClick, onChange (event handlers)
- Browser APIs (localStorage, window)

## Key Files in Our Project

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout (wraps all pages) |
| `app/page.tsx` | Home page component |
| `app/globals.css` | Global styles |
| `app/api/*/route.ts` | API endpoints |

## Commands

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Run production build
```

## Turbopack

Next.js 16 uses **Turbopack** by default for development:
- Faster hot module replacement (HMR)
- Incremental compilation
- Improved memory usage

```bash
# Turbopack is now the default in Next.js 16
npm run dev  # Automatically uses Turbopack
```

## React 19 Compatibility

This project uses React 19 with Next.js 16:
- Server Components are stable
- New hooks like `use()` available
- Improved hydration and streaming

## Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [App Router Tutorial](https://nextjs.org/learn)
- [Turbopack](https://turbo.build/pack)
