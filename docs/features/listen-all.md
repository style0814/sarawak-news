# Listen All News Feature

FREE feature that allows users to listen to AI summaries of all news articles sequentially, with progress tracking.

## Overview

| Aspect | Details |
|--------|---------|
| Technology | Browser Web Speech API + AI Summary |
| Availability | FREE for all logged-in users |
| Languages | English, Chinese, Malay |
| Progress Tracking | localStorage |
| Location | Floating player (bottom-right) |

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. USER CLICKS "LISTEN ALL" BUTTON                     │
│     - Floating button in bottom-right corner            │
│     - Shows listened/total count badge                  │
├─────────────────────────────────────────────────────────┤
│  2. SELECT PLAY MODE                                    │
│     - "Unlistened Only" - skip already heard items      │
│     - "All News" - play everything                      │
├─────────────────────────────────────────────────────────┤
│  3. BUILD PLAYLIST                                      │
│     - Filter based on play mode                         │
│     - Use current news list from main page              │
├─────────────────────────────────────────────────────────┤
│  4. FOR EACH NEWS ITEM                                  │
│     - Fetch AI summary (or use cached)                  │
│     - Read aloud using browser TTS                      │
│     - Mark as listened                                  │
│     - 1 second pause between items                      │
├─────────────────────────────────────────────────────────┤
│  5. TRACK PROGRESS                                      │
│     - Store listened IDs in localStorage                │
│     - Show progress bar during playback                 │
│     - Allow skip/previous navigation                    │
└─────────────────────────────────────────────────────────┘
```

## Features

### Floating Player
- Compact button when collapsed
- Expanded panel with full controls
- Shows listened/remaining stats
- Progress bar during playback

### Play Modes
- **Unlistened Only**: Skip news you've already heard
- **All News**: Play entire list regardless of history

### Playback Controls
- Play/Stop button
- Skip to next
- Go to previous
- Shows "Now playing" with current title

### Progress Tracking
- Tracks which news items user has listened to
- Persists across sessions (localStorage)
- Option to clear history and start fresh

### Language Support
- Summaries generated in current app language
- TTS voice matches selected language
- Clears cache when language changes

## Component: ListenAllPlayer

### Location
`components/ListenAllPlayer.tsx`

### Props
```typescript
interface ListenAllPlayerProps {
  news: NewsItem[];  // Current news list
  lang: Language;    // Current language
}
```

### State Management
```typescript
// Player state
const [isExpanded, setIsExpanded] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [currentIndex, setCurrentIndex] = useState(0);
const [playMode, setPlayMode] = useState<'all' | 'unlistened'>('unlistened');

// Progress tracking
const [listenedNews, setListenedNews] = useState<Set<number>>(new Set());

// Summary cache (language-specific)
const [summaries, setSummaries] = useState<Map<number, string>>(new Map());
```

## localStorage Schema

```javascript
// Key: 'sarawak_news_listened'
// Value: JSON array of news IDs
[123, 456, 789, ...]
```

## Integration with Main Page

### app/page.tsx
```tsx
import ListenAllPlayer from '@/components/ListenAllPlayer';

// In the component
return (
  <div>
    {/* ... other content ... */}

    {/* Listen All News Player */}
    <ListenAllPlayer news={news} lang={lang} />
  </div>
);
```

## Hydration Safety

Component uses `mounted` state to avoid SSR/client mismatch:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

// Don't render until client-side
if (!mounted || !ttsSupported) {
  return null;
}
```

## Language Switching Behavior

When user changes language:
1. Summary cache is cleared
2. Playback stops if active
3. TTS language updates
4. Next play fetches summaries in new language

```typescript
useEffect(() => {
  setTTSLang(lang);
  setSummaries(new Map()); // Clear cache
  if (isPlayingRef.current) {
    stop();
    setIsPlaying(false);
  }
}, [lang]);
```

## User Experience

### Collapsed State
- Small floating button: "🎧 Listen All"
- Badge showing progress: "5/20"

### Expanded State
- Stats: Listened vs Remaining count
- Mode toggle: Unlistened Only / All News
- Now playing: Current news title
- Controls: Previous, Play/Stop, Skip
- Progress bar: Visual percentage
- Clear history button

## Error Handling

| Scenario | Handling |
|----------|----------|
| Not logged in | Show "Please login" error |
| No unlistened news | Show message to switch mode |
| Summary fetch fails | Fall back to reading title |
| TTS not supported | Don't render component |

## Browser Compatibility

Depends on Web Speech API support:
- Chrome: Full support
- Safari: Full support
- Firefox: Full support
- Edge: Full support
- Mobile browsers: Generally supported

## Files

| File | Purpose |
|------|---------|
| `components/ListenAllPlayer.tsx` | Main player component |
| `hooks/useSpeechSynthesis.ts` | TTS functionality |
| `app/api/summary/route.ts` | Summary generation |
| `app/page.tsx` | Integration point |

## Future Enhancements

Potential improvements:
- Playback speed control
- Voice gender selection in player
- Background playback (service worker)
- Playlist shuffle mode
- Download summaries for offline
