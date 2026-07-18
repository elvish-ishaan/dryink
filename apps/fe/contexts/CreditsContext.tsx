'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

interface CreditsContextValue {
  credits: number;
  refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue>({
  credits: 0,
  refreshCredits: async () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);

  const refreshCredits = useCallback(async () => {
    const token = session?.user?.accessToken;
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/payment/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCredits(data.credits);
    } catch {
      // silently fail
    }
  }, [session?.user?.accessToken]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  return (
    <CreditsContext.Provider value={{ credits, refreshCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
