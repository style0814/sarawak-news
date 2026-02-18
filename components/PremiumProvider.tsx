'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Subscription {
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled';
  started_at?: string;
  expires_at?: string;
}

interface PremiumContextType {
  isPremium: boolean;
  subscription: Subscription | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  subscription: null,
  loading: true,
  refresh: async () => {}
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!session) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/subscription');
      const data = await res.json();
      setSubscription(data.subscription || { plan: 'free', status: 'active' });
    } catch {
      setSubscription({ plan: 'free', status: 'active' });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;
    fetchSubscription();
  }, [status, fetchSubscription]);

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';

  return (
    <PremiumContext.Provider value={{ isPremium, subscription, loading, refresh: fetchSubscription }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
