# Donation Page

Optional donation page for users who want to support the project.

## Overview

| Aspect | Details |
|--------|---------|
| All Features | FREE |
| Donation | Optional, any amount |
| Payment Methods | DuitNow, Sarawak Pay |

## Philosophy

Sarawak News is free for everyone. All features including AI Summary and Text-to-Speech are available without any payment or subscription.

Users who find the app useful can optionally support the project by making a donation.

## Features (All Free)

- Read all news articles
- AI News Summary (Groq)
- Audio Read (Text-to-Speech)
- Comments & Bookmarks
- Multi-language support (EN/ZH/MS)
- Search with filters
- Dark mode
- Social sharing

## Donation Options

### DuitNow
- Works with any Malaysian bank app
- QR code: `public/payments/duitnow-qr.jpeg`

### Sarawak Pay
- SPayGlobal app
- QR code: `public/payments/sarawakpay-qr.jpeg`

## Pages

| Route | Purpose |
|-------|---------|
| `/donate` | Donation page with QR codes |
| `/pricing` | Features overview (all free) |

## Files

| File | Purpose |
|------|---------|
| `app/donate/page.tsx` | Donation page UI |
| `app/pricing/page.tsx` | Features overview page |
| `public/payments/duitnow-qr.jpeg` | DuitNow QR code |
| `public/payments/sarawakpay-qr.jpeg` | Sarawak Pay QR code |
