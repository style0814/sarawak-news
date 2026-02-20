## Sarawak News

Sarawak-focused news aggregation platform built with Next.js and SQLite.
Includes user auth, comments, bookmarks, admin dashboard, RSS ingestion, and AI summaries.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Railway Persistence Checklist

If deployed on Railway with SQLite, do these to prevent user data loss on redeploy:

1. Create and attach a persistent volume to this service.
2. Mount it at `/data`.
3. Set `DATABASE_PATH=/data/news.db` in Railway service variables.
4. Redeploy once and verify a test account still exists after another deploy.

Without persistent volume + `DATABASE_PATH`, new users/comments/bookmarks can disappear after restart.

## Background RSS Refresh (No Visitors Needed)

Client auto-refresh only runs when someone has the page open.  
For true background ingestion, schedule this endpoint every 10 minutes:

```bash
GET /api/cron/refresh
Authorization: Bearer <CRON_SECRET>
```

### Option A: GitHub Actions (included)

This repo now includes `.github/workflows/rss-cron-refresh.yml` with a 10-minute schedule.

Set repository secrets:

1. `SITE_URL` (example: `https://your-domain.com`)
2. `CRON_SECRET` (must match your app env var)

### Option B: Railway Cron Service

Create a separate Railway cron service with:

- **Schedule:** `*/10 * * * *`
- **Start command:**

```bash
curl --fail --silent --show-error -H "Authorization: Bearer $CRON_SECRET" "$SITE_URL/api/cron/refresh"
```

Set env vars on that cron service: `SITE_URL`, `CRON_SECRET`.

### Option C: Vercel Cron

Add `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/refresh", "schedule": "*/10 * * * *" }
  ]
}
```

Set `CRON_SECRET` in Vercel environment variables.  
Vercel cron calls include `Authorization: Bearer <CRON_SECRET>` automatically when this env var is set.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
