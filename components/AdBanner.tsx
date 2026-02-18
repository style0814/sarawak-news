'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface AdBannerProps {
  slot: string;           // Your AdSense ad slot ID
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
}

// Set your AdSense Publisher ID here
const ADSENSE_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || '';

export default function AdBanner({
  slot,
  format = 'horizontal',
  responsive = true
}: AdBannerProps) {
  const { isDark } = useTheme();
  const hasAttemptedLoadRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE_PUB_ID || !slot || hasAttemptedLoadRef.current) return;

    try {
      // Push ad after component mounts
      ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
      hasAttemptedLoadRef.current = true;
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [slot]);

  if (!ADSENSE_PUB_ID || !slot) {
    return (
      <div className={`w-full py-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div
            className={`h-24 rounded-lg border-2 border-dashed flex items-center justify-center ${
              isDark
                ? 'border-gray-700 bg-gray-800/50 text-gray-500'
                : 'border-gray-200 bg-gray-100 text-gray-400'
            }`}
          >
            <div className="text-center text-sm">
              <p>Ad Space</p>
              <p className="text-xs opacity-75">Configure NEXT_PUBLIC_ADSENSE_PUB_ID in .env</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full py-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          {/* Optional: Small label */}
          <p className={`text-xs mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Advertisement
          </p>

          {/* AdSense Ad Unit */}
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              minHeight: '90px'
            }}
            data-ad-client={`ca-pub-${ADSENSE_PUB_ID}`}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        </div>
      </div>
    </div>
  );
}
