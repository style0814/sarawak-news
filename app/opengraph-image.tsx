import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Sarawak News - Voice of the Land of Hornbills';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 40%, #f97316 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            display: 'flex',
            background: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#fbbf24',
            display: 'flex',
          }}
        />

        {/* Hornbill icon */}
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <svg width="80" height="80" viewBox="0 0 64 64" fill="white">
            <path d="M18 8c0-2 2-4 5-4 4 0 7 3 8 6l1 4c0 2-1 3-3 3h-5c-3 0-5-2-6-5v-4z"/>
            <path d="M24 14c2-1 5-1 7 0 3 2 6 5 8 9 2 5 2 9 0 12-1 2-3 3-6 3h-8l-6-2c-3-2-4-5-3-8l2-8c1-3 3-5 6-6z"/>
            <ellipse cx="16" cy="22" rx="10" ry="11"/>
            <circle cx="13" cy="20" r="2.5" fill="rgba(0,0,0,0.3)"/>
            <path d="M12 32c-2 3-3 7-2 12 1 6 4 10 8 12h6c4-1 7-4 9-8 2-5 1-10-1-14-1-3-4-5-7-5-5-1-10 0-13 3z"/>
            <path d="M28 46c2 2 3 5 3 9l1 5h-4l-1-5c0-3-1-5-2-7l3-2z"/>
            <path d="M22 48c1 2 1 5 0 8l-1 4h-4l2-5c1-3 1-5 0-7h3z"/>
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          Sarawak News
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: '16px',
            display: 'flex',
          }}
        >
          Voice of the Land of Hornbills
        </div>

        {/* Features row */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '40px',
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🇬🇧 English
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🇨🇳 中文
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🇲🇾 Bahasa Melayu
          </div>
        </div>

        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '24px',
            fontSize: '16px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 20px',
              borderRadius: '20px',
              color: 'white',
              display: 'flex',
            }}
          >
            Real-time News
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 20px',
              borderRadius: '20px',
              color: 'white',
              display: 'flex',
            }}
          >
            AI Summaries
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 20px',
              borderRadius: '20px',
              color: 'white',
              display: 'flex',
            }}
          >
            Community Discussions
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#fbbf24',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
