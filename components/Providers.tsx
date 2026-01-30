'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { LanguageProvider } from './LanguageProvider';
import { PremiumProvider } from './PremiumProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ThemeProvider>
        <LanguageProvider>
          <PremiumProvider>
            {children}
          </PremiumProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
