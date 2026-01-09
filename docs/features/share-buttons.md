# Share Buttons

## Overview

Social sharing buttons allow users to share news articles to various platforms. The component supports multiple social networks and includes copy-to-clipboard functionality.

## Features

- **Multiple Platforms:**
  - Facebook
  - Twitter/X
  - WhatsApp
  - LinkedIn
  - Telegram
  - Email
- **Copy Link** - Copy article URL to clipboard
- **Responsive** - Adapts to mobile and desktop
- **Internationalized** - Labels in user's language
- **Accessible** - Keyboard navigation, ARIA labels

## Component

**File:** `components/ShareButtons.tsx`

```typescript
interface ShareButtonsProps {
  url: string;           // Article URL to share
  title: string;         // Article title
  description?: string;  // Optional description
  compact?: boolean;     // Show icons only (no labels)
}

export default function ShareButtons({
  url,
  title,
  description,
  compact = false
}: ShareButtonsProps) {
  // Implementation...
}
```

## Usage

### In News Item

```tsx
import ShareButtons from '@/components/ShareButtons';

<ShareButtons
  url={`https://sarawak-news.com/news/${news.id}`}
  title={news.title}
  compact={true}
/>
```

### In News Detail Page

```tsx
<ShareButtons
  url={window.location.href}
  title={news.title}
  description={news.content?.substring(0, 200)}
  compact={false}
/>
```

## Share URLs

### Facebook

```typescript
const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
```

### Twitter/X

```typescript
const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
```

### WhatsApp

```typescript
const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`;
```

### LinkedIn

```typescript
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
```

### Telegram

```typescript
const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
```

### Email

```typescript
const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${url}`)}`;
```

## Copy to Clipboard

```typescript
const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
```

## Styling

### Icon Buttons

Each platform has distinctive colors:

```typescript
const platforms = [
  { name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700', icon: FacebookIcon },
  { name: 'Twitter', color: 'bg-sky-500 hover:bg-sky-600', icon: TwitterIcon },
  { name: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600', icon: WhatsAppIcon },
  { name: 'LinkedIn', color: 'bg-blue-700 hover:bg-blue-800', icon: LinkedInIcon },
  { name: 'Telegram', color: 'bg-sky-400 hover:bg-sky-500', icon: TelegramIcon },
  { name: 'Email', color: 'bg-gray-600 hover:bg-gray-700', icon: EmailIcon },
];
```

### Compact Mode

Icons only, suitable for inline display:

```tsx
{compact ? (
  <div className="flex gap-2">
    {platforms.map(p => (
      <button className="p-2 rounded-full" style={{ background: p.color }}>
        <p.icon className="h-4 w-4" />
      </button>
    ))}
  </div>
) : (
  <div className="flex flex-wrap gap-3">
    {platforms.map(p => (
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg">
        <p.icon className="h-5 w-5" />
        <span>{p.name}</span>
      </button>
    ))}
  </div>
)}
```

## Dark Mode Support

```tsx
<button className={`
  ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'}
  ${isDarkMode ? 'text-white' : 'text-gray-800'}
`}>
```

## Accessibility

### ARIA Labels

```tsx
<button
  aria-label={`Share on ${platform.name}`}
  title={`Share on ${platform.name}`}
>
```

### Keyboard Navigation

```tsx
<div role="group" aria-label="Share options">
  {/* Buttons are focusable by default */}
</div>
```

## Translations

```typescript
// lib/i18n.ts
{
  share: 'Share',
  shareOn: 'Share on',
  copyLink: 'Copy Link',
  linkCopied: 'Link Copied!',
  shareVia: 'Share via'
}
```

## Analytics (Optional)

Track share clicks:

```typescript
const handleShare = (platform: string) => {
  // Track the share event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      method: platform,
      content_type: 'article',
      item_id: newsId
    });
  }

  // Open share URL
  window.open(shareUrl, '_blank', 'width=600,height=400');
};
```

## Mobile Considerations

### Native Share API

For mobile devices, use the native share dialog:

```typescript
const handleNativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: description,
        url: url,
      });
    } catch (err) {
      // User cancelled or error
    }
  } else {
    // Fallback to custom share buttons
  }
};
```

### WhatsApp Deep Link

On mobile, WhatsApp opens the app directly:

```typescript
const whatsappUrl = isMobile
  ? `whatsapp://send?text=${encodeURIComponent(`${title} ${url}`)}`
  : `https://web.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`;
```

## Component Structure

```
ShareButtons.tsx
│
├── Platform buttons (Facebook, Twitter, etc.)
│   └── onClick → opens share URL in popup
│
├── Copy Link button
│   └── onClick → copies to clipboard, shows feedback
│
└── Native Share button (mobile)
    └── onClick → triggers navigator.share()
```

## Example Output

### Full Mode

```
┌─────────────────────────────────────────────────────────┐
│  Share this article:                                     │
│                                                          │
│  [📘 Facebook] [🐦 Twitter] [📱 WhatsApp]                │
│  [💼 LinkedIn] [✈️ Telegram] [📧 Email]                  │
│  [🔗 Copy Link]                                          │
└─────────────────────────────────────────────────────────┘
```

### Compact Mode

```
[📘] [🐦] [📱] [💼] [✈️] [📧] [🔗]
```
