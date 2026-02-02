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
          background: 'linear-gradient(135deg, #065f46 0%, #047857 40%, #10b981 100%)',
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

        {/* Hornbill emoji */}
        <div style={{ fontSize: '80px', display: 'flex', marginBottom: '10px' }}>
          🦅
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
