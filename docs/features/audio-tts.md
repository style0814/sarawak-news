# Audio Text-to-Speech (TTS)

Free feature that reads news article titles aloud using the browser's built-in Web Speech API. Works on all devices with no API keys needed.

## Overview

| Aspect | Details |
|--------|---------|
| Technology | Browser Web Speech API |
| Availability | FREE for all users |
| Languages | English, Chinese, Malay |
| Voice Options | Male and Female |
| Cost | Completely Free |

## How It Works

The Web Speech API is a browser-native feature that converts text to speech using voices installed on the user's device. No server calls or API keys needed.

```
┌─────────────────────────────────────────────────────────────┐
│  USER DEVICE                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Browser (Chrome, Safari, Firefox, Edge)            │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  Web Speech API                              │   │   │
│  │  │  ├── SpeechSynthesis                        │   │   │
│  │  │  └── SpeechSynthesisUtterance               │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Operating System Voices                            │   │
│  │  ├── macOS: Samantha, Alex, Ting-Ting...           │   │
│  │  ├── Windows: David, Zira, Huihui...               │   │
│  │  ├── iOS: Siri voices                              │   │
│  │  └── Android: Google TTS voices                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Voice Selection
- **Female Voice** - Selected by default
- **Male Voice** - Alternative option
- Automatic voice matching based on language

### Playback Controls
- **Play** - Start reading
- **Pause** - Pause playback
- **Resume** - Continue from pause
- **Stop** - Stop completely

### Language Support
- **English** - en-US, en-GB, en-AU voices
- **Chinese** - zh-CN, zh-TW, zh-HK voices
- **Malay** - ms-MY voices (falls back to Indonesian if unavailable)

## Custom Hook: useSpeechSynthesis

Located in `hooks/useSpeechSynthesis.ts`

### Usage
```tsx
const {
  speak,
  stop,
  pause,
  resume,
  isPlaying,
  isPaused,
  isSupported,
  setGender,
  setLanguage,
  gender,
  error
} = useSpeechSynthesis({ language: 'en', gender: 'female' });
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| language | 'en' \| 'zh' \| 'ms' | 'en' | Speech language |
| gender | 'male' \| 'female' | 'female' | Voice gender preference |
| rate | number | 0.9 | Speech rate (0.1 - 10) |
| pitch | number | auto | Voice pitch |

### Return Values
| Value | Type | Description |
|-------|------|-------------|
| speak | (text: string) => void | Start speaking text |
| stop | () => void | Stop speaking |
| pause | () => void | Pause speaking |
| resume | () => void | Resume speaking |
| isPlaying | boolean | Currently speaking |
| isPaused | boolean | Paused state |
| isSupported | boolean | Browser supports TTS |
| voices | SpeechSynthesisVoice[] | Available voices |
| currentVoice | SpeechSynthesisVoice | Selected voice |
| setGender | (gender) => void | Change voice gender |
| setLanguage | (lang) => void | Change language |
| error | string \| null | Error message |

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | Full | Best voice selection |
| Safari | Full | Good iOS/macOS voices |
| Firefox | Full | Limited voices |
| Edge | Full | Windows voices |
| Mobile Safari | Full | Siri voices |
| Chrome Android | Full | Google TTS |

## Voice Quality Tips

Voice quality depends on your device:
- **macOS**: Has high-quality voices (Samantha, Alex)
- **iOS**: Uses Siri voices (very natural)
- **Windows**: Quality varies, Edge has better voices
- **Android**: Google TTS is decent quality

## Frontend Integration

### NewsDetail.tsx
```tsx
// Browser TTS Hook - FREE for all languages
const {
  speak,
  stop,
  pause,
  resume,
  isPlaying: isPlayingAudio,
  isPaused,
  isSupported: isTTSSupported,
  setGender,
  gender: selectedVoice,
  error: ttsError
} = useSpeechSynthesis({ language: lang, gender: 'female' });

// Play button click handler
<button onClick={() => speak(displayTitle)}>
  Play Audio
</button>
```

## Limitations

1. **Title only** - Currently only reads the news title
2. **Device-dependent** - Voice quality varies by device/OS
3. **No offline generation** - Requires browser support
4. **Limited voice options** - Depends on installed system voices

## Files

| File | Purpose |
|------|---------|
| `hooks/useSpeechSynthesis.ts` | TTS custom hook |
| `components/NewsDetail.tsx` | TTS UI integration |
| `lib/i18n.ts` | TTS translations |
