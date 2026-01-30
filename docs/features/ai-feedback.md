# AI Features Feedback Page

Page for collecting user feedback on experimental AI features (summary and TTS).

## Overview

| Aspect | Details |
|--------|---------|
| Route | `/ai-features` |
| Purpose | Explain beta status, collect feedback |
| Access | Public (feedback requires login) |
| Link | Header "AI Beta" button |

## Page Sections

### 1. Experimental Notice
- Yellow warning banner
- Explains features are in beta
- Lists known limitations:
  - Voice quality varies by device
  - Summaries may miss details

### 2. Current Features (Free)
- AI Summary: Quick summaries powered by AI
- Listen to Summary: Browser TTS (works offline)

### 3. Premium Options (Under Consideration)
- Natural Voice TTS (ElevenLabs-quality)
- Advanced Summaries (GPT-4/Claude level)

### 4. Feedback Form
Survey questions:
1. AI Summary rating (Love it / Needs improvement / Don't need it)
2. Voice quality rating (Good enough / Could be better / Too robotic)
3. Would pay for premium? (Yes / Free is enough)
4. Additional comments (text area)

## Database Schema

```sql
CREATE TABLE user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,           -- 'ai_features'
  summary_rating TEXT,          -- 'love_it', 'needs_improvement', 'not_needed'
  voice_rating TEXT,            -- 'love_it', 'needs_improvement', 'not_needed'
  wants_premium INTEGER,        -- 1 = yes, 0 = no
  additional_feedback TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoint

### POST /api/feedback

**Request:**
```json
{
  "type": "ai_features",
  "summaryRating": "love_it",
  "voiceRating": "needs_improvement",
  "wantsPremium": false,
  "additionalFeedback": "Would love better Chinese voices"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

## Key Functions (lib/db.ts)

```typescript
// Save user feedback
saveFeedback(data: {
  userId: number;
  type: string;
  summaryRating?: string;
  voiceRating?: string;
  wantsPremium?: boolean;
  additionalFeedback?: string;
}): boolean

// Get all feedback (admin)
getAllFeedback(): (UserFeedback & { username: string })[]
```

## Frontend Component

### app/ai-features/page.tsx

Key features:
- Responsive design
- Dark mode support
- Form validation
- Success confirmation
- Login prompt for non-authenticated users

```tsx
// State for form
const [summaryRating, setSummaryRating] = useState<FeedbackOption | null>(null);
const [voiceRating, setVoiceRating] = useState<FeedbackOption | null>(null);
const [wantsPremium, setWantsPremium] = useState<boolean | null>(null);
const [additionalFeedback, setAdditionalFeedback] = useState('');
const [isSubmitted, setIsSubmitted] = useState(false);
```

## Header Integration

Link added to Header.tsx:
```tsx
<Link
  href="/ai-features"
  className="px-2 py-1 bg-purple-500/80 text-white rounded-full"
>
  🤖 AI Beta
</Link>
```

## User Flow

1. User sees "AI Beta" button in header
2. Clicks to view AI features page
3. Reads about experimental status
4. Optionally submits feedback (requires login)
5. Sees thank you confirmation

## Design Elements

- Purple/indigo gradient for premium section
- Amber/yellow for warning notices
- Emerald for current free features
- Button chips for rating options
- Text area for detailed feedback

## Files

| File | Purpose |
|------|---------|
| `app/ai-features/page.tsx` | Main feedback page |
| `app/api/feedback/route.ts` | Feedback submission API |
| `lib/db.ts` | Feedback storage functions |
| `components/Header.tsx` | AI Beta link |

## Analytics Value

Feedback helps determine:
- User satisfaction with current features
- Interest in premium options
- Specific pain points to address
- Priority for future development
