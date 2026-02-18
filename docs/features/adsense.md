# Google AdSense Integration

## Overview

Ad banner component for displaying Google AdSense ads throughout the site.

## Key Files

| File | Purpose |
|------|---------|
| `components/AdBanner.tsx` | Reusable ad component |
| `app/layout.tsx` | Loads AdSense script globally |

## AdBanner Component

```tsx
<AdBanner
  slot="1234567890"           // Ad unit slot ID
  format="horizontal"         // auto | horizontal | vertical | rectangle
  responsive={true}           // Responsive sizing
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `slot` | string | AdSense ad unit slot ID |
| `format` | string | Ad format: `auto`, `horizontal`, `vertical`, `rectangle` |
| `responsive` | boolean | Enable responsive ad sizing |

## Environment Variables

```env
NEXT_PUBLIC_ADSENSE_PUB_ID=ca-pub-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM=1234567890
```

## Placement

- Bottom of homepage (horizontal banner)
- Can be placed anywhere by importing `AdBanner`

## AdSense Compliance Pages

These pages were created for AdSense approval:

| Page | URL |
|------|-----|
| About | `/about` |
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |

## SSR for AdSense

The homepage uses server-side rendering so Google's crawler sees real news content instead of "Loading...". This addresses the "ads on screens without publisher content" rejection reason.

See `docs/features/seo.md` for details on the SSR implementation.
